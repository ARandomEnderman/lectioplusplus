const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM,VirtualConsole}=require('jsdom');
const ext=process.env.LXP_TEST_EXTENSION||path.resolve(__dirname,'../extension'),read=f=>fs.readFileSync(ext+'/'+f+'.js','utf8'),pause=()=>new Promise(r=>setTimeout(r,20));let checks=0;
const ok=(value,label)=>{assert.ok(value,label);checks++;console.log('PASS',label)};
const shown=n=>n.nodeType===3?n.nodeValue:n.matches?.('[data-lxp-name-mask]')?(n.dataset.lxpNameMask==='first'?'Anonym':''):[...n.childNodes].map(shown).join('');
function dom(html='<body></body>'){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const instance=new JSDOM(html,{url:'https://www.lectio.dk/lectio/999999/forside.aspx',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=instance.window,d=w.document;w.structuredClone=structuredClone;w.matchMedia=()=>({matches:false,addEventListener(){}});w.TextEncoder=TextEncoder;
 const E=(tag,cl='',...children)=>{const n=d.createElement(tag);n.className=cl;n.append(...children);return n},B=(cl,label,fn,...children)=>{const n=E('button',cl,...children);n.type='button';n.setAttribute('aria-label',label);n.addEventListener('click',fn);return n};
 const field=(parent,o)=>{const n=E(o.type==='select'?'select':o.type==='textarea'?'textarea':'input');n.setAttribute('aria-label',o.label);if(o.options)for(const [v,t] of o.options){const opt=E('option','',t);opt.value=v;n.append(opt)}n.value=o.value||'';parent.append(n);return n};
 return {w,d,E,B,field,errors,ctrl:label=>[...d.querySelectorAll('[aria-label]')].find(n=>n.getAttribute('aria-label')===label),close:()=>instance.window.close()};
}
(async()=>{
 const name='Eksempel Testelev';
 const e=dom(`<body><div id="s_m_HeaderContent_MainTitle">Eleven ${name}, 2.g - Forside</div><p id="split"><strong>Eksempel</strong> <em>Testelev</em></p><p id="full">${name}</p><p id="hyphen">${name}-Anden / Før-${name}</p><img src="GetImage.aspx?pictureid=fake"></body>`),{w,d}=e;
 w.eval(read('appearance'));w.lectioPlusAppearance.apply(d.documentElement,w.lectioPlusAppearance.normalize({anonymizeName:true,hideProfilePhoto:true}),false);w.eval(read('privacy'));await pause();
 ok(shown(d.querySelector('#split'))==='Anonym','split name is masked once');
 ok(shown(d.querySelector('#hyphen'))===`${name}-Anden / Før-${name}`,'hyphenated other names are not partially anonymized');
 d.querySelector('#split strong [data-lxp-name-mask]').firstChild.nodeValue='Anden';await pause();
 ok(shown(d.querySelector('#split'))==='Anden Testelev'&&!d.querySelector('#split [data-lxp-name-mask]'),'changing one name fragment restores the entire unrelated name');
 d.querySelector('#split strong').textContent='Eksempel';await pause();ok(shown(d.querySelector('#split'))==='Anonym','restoring the full original name masks it again');
 d.querySelector('#full [data-lxp-name-mask]').firstChild.nodeValue='Eksempel';await pause();ok(shown(d.querySelector('#full'))==='Eksempel'&&!d.querySelector('#full [data-lxp-name-mask]'),'a shortened first-name-only value is no longer masked as a full name');
 d.querySelector('#full').textContent=name;await pause();d.querySelector('#full').append('-Anden');await pause();ok(shown(d.querySelector('#full'))===name+'-Anden','appending a surname outside an existing mask removes the obsolete mask');
 let changes=0;const watch=new w.MutationObserver(records=>changes+=records.length);watch.observe(d,{subtree:true,childList:true,characterData:true,attributes:true});w.lectioPlusPrivacy.flush();w.lectioPlusPrivacy.flush();await pause();
 ok(changes===0,'unchanged privacy refresh does not rewrite masks or photo markers');watch.disconnect();
 ok(!e.errors.length,'updated privacy passes without runtime errors');e.close();

 function notes(count=2){
  const e=dom();e.w.eval(read('appearance'));let prefs=e.w.lectioPlusAppearance.normalize({toolbox:{notes:'Oprindelig tekst',lab:{notebooks:Array.from({length:count},(_,i)=>({id:'note-'+i,title:'Note '+i,subject:'Fiktivt fag',text:'Tekst '+i}))}}}).toolbox;
  e.w.lectioPlusLabCore={tools:[]};e.w.lectioPlusLab={uid:()=> 'new-note'};e.w.eval(read('school-writing'));
  const jobs=[];const save=change=>new Promise((resolve,reject)=>jobs.push(()=>{try{prefs={...prefs,...(typeof change==='function'?change(prefs):change)};resolve(true)}catch(error){reject(error)}}));
  const tool=e.w.lectioPlusSchoolWriting('notes',{...e,prefs:()=>prefs,save});e.d.body.append(tool.node);
  const select=id=>{e.ctrl('Vælg note').value=id;e.ctrl('Vælg note').dispatchEvent(new e.w.Event('change'))};
  return {...e,tool,jobs,select,prefs:()=>prefs,release:async()=>{assert.ok(jobs.length);jobs.shift()();await pause()}};
 }
 const n=notes();n.select('note-0');n.ctrl('Slet valgt note').click();
 ok(n.ctrl('Vælg note').disabled&&n.ctrl('Mine egne noter').disabled&&n.ctrl('Ny note').disabled,'note navigation and editing pause during a pending write');
 n.select('note-1');ok(n.ctrl('Vælg note').value==='note-0','pending deletion cannot switch to another target');await n.release();
 ok(n.prefs().lab.notebooks.length===1&&n.prefs().lab.notebooks[0].id==='note-1','only the originally chosen note is deleted');
 ok(!n.ctrl('Vælg note').disabled&&n.ctrl('Notens titel').disabled,'completed deletion unlocks controls and keeps original-note title fixed');
 n.ctrl('Fortryd slettet note').click();await n.release();ok(n.ctrl('Vælg note').value==='note-0'&&!n.ctrl('Notens titel').disabled,'undo restores the chosen note and editable title');
 n.ctrl('Mine egne noter').value='Min ugemte ændring';n.ctrl('Mine egne noter').dispatchEvent(new n.w.Event('input'));n.ctrl('Gem note').click();n.ctrl('Ny note').click();ok(n.jobs.length===1,'another note action cannot overlap a pending save');
 n.prefs().lab.notebooks.find(x=>x.id==='note-0').text='Ændret fra anden fane';n.tool.refresh();ok(n.ctrl('Mine egne noter').value==='Min ugemte ændring','remote refresh preserves the local draft while saving');await n.release();
 ok(n.prefs().lab.notebooks.find(x=>x.id==='note-0').text==='Ændret fra anden fane'&&n.tool.node.textContent.includes('anden fane'),'queued save checks the latest value before overwriting');
 ok(n.ctrl('Mine egne noter').value==='Min ugemte ændring'&&!n.ctrl('Mine egne noter').disabled,'conflicting save keeps draft and unlocks editing');
 n.ctrl('Kassér ugemte ændringer').click();await pause();ok(n.ctrl('Mine egne noter').value==='Ændret fra anden fane','discard explicitly loads the latest stored version');
 n.ctrl('Slet valgt note').click();n.prefs().lab.notebooks.find(x=>x.id==='note-0').title='Ny ekstern titel';await n.release();ok(n.prefs().lab.notebooks.some(x=>x.id==='note-0'),'queued deletion refuses a note that changed in another tab');
 n.ctrl('Kassér ugemte ændringer').click();await pause();n.ctrl('Mine egne noter').value='Bevar kladde';n.ctrl('Mine egne noter').dispatchEvent(new n.w.Event('input'));n.ctrl('Gem note').click();n.prefs().lab.notebooks=n.prefs().lab.notebooks.filter(x=>x.id!=='note-0');await n.release();
 ok(n.ctrl('Mine egne noter').value==='Bevar kladde'&&n.tool.node.textContent.includes('slettet i en anden fane'),'queued save reports a deleted note without discarding its draft');
 ok(!n.errors.length,'note concurrency checks have no runtime errors');n.close();
 const cap=notes(39);cap.ctrl('Ny note').click();cap.prefs().lab.notebooks.push({id:'other-new',title:'Ekstern note',subject:'',text:''});await cap.release();
 ok(cap.prefs().lab.notebooks.length===40&&!cap.prefs().lab.notebooks.some(x=>x.id==='new-note')&&cap.tool.node.textContent.includes('40 navngivne'),'capacity is checked again when a queued creation actually runs');cap.close();

 const ctx={URL,TextEncoder,AbortController,setTimeout,clearTimeout};vm.createContext(ctx);vm.runInContext(read('translation'),ctx);const T=ctx.lectioPlusTranslation;
 const calls=[];const echo=async url=>{const q=new URL(url).searchParams.get('q');calls.push(q);return{ok:true,json:async()=>({responseStatus:200,responseData:{translatedText:q}})}};
 for(const sample of ['  Første afsnit.\n\nAndet afsnit.  ','En linje\r\n\r\nNy linje\rSidste\n','x'.repeat(1200),'漢字'.repeat(350),'Et ord '.repeat(150)]){
  const result=await T.translate({text:sample,from:'da',to:'en'},echo);ok(result.text===sample,'translation reconstruction preserves exact spacing and boundaries: '+sample.length+' characters');
 }
 ok(calls.every(q=>q.trim()&&new TextEncoder().encode(q).length<=480),'blank lines are kept locally and each transmitted segment fits the byte limit');
 let limitedCalls=0;await assert.rejects(T.translate({text:('Kort linje\n').repeat(25),from:'da',to:'en'},async()=>{limitedCalls++;return echo('https://example.test/?q=fake')}),/mange korte linjer/);ok(limitedCalls===0,'too many separate lines are rejected before any quota is spent');
 let clock=0,timedCalls=0;ctx.Date={now:()=>clock};await assert.rejects(T.translate({text:'x'.repeat(1200),from:'da',to:'en'},async url=>{timedCalls++;clock+=30000;return echo(url)}),/lang tid/);ok(timedCalls===2,'a whole translation has a deadline as well as individual request timeouts');ctx.Date=Date;
 const t=dom();t.w.eval(read('translation'));const tool=t.w.lectioPlusTranslationTool(t);t.d.body.append(tool.node);
 let selected='Kort markering';t.w.getSelection=()=>({toString:()=>selected});t.d.dispatchEvent(new t.w.Event('selectionchange'));t.ctrl('Hent markeret tekst').click();ok(t.ctrl('Tekst til oversættelse').value===selected,'valid selected text loads into the translator');
 selected='x'.repeat(2001);t.d.dispatchEvent(new t.w.Event('selectionchange'));t.ctrl('Tekst til oversættelse').value='Bevar det nye felt';t.ctrl('Hent markeret tekst').click();
 ok(t.ctrl('Tekst til oversættelse').value==='Bevar det nye felt'&&tool.node.textContent.includes('tidligere markering bliver ikke brugt'),'overlong selection never silently reuses an older selection');
 t.ctrl('Tekst til oversættelse').value='🙂🙂';t.ctrl('Tekst til oversættelse').dispatchEvent(new t.w.Event('input'));ok(t.ctrl('Tegntæller').textContent==='2 / 2.000 tegn','character counter counts Unicode characters rather than UTF-16 units');
 t.ctrl('Tekst til oversættelse').value='x'.repeat(2001);t.ctrl('Tekst til oversættelse').dispatchEvent(new t.w.Event('input'));ok(t.ctrl('Tekst til oversættelse').getAttribute('aria-invalid')==='true','over-limit text is marked invalid before submission');
 t.ctrl('Tekst til oversættelse').value='Hej';t.ctrl('Tekst til oversættelse').dispatchEvent(new t.w.Event('input'));t.w.chrome={runtime:{sendMessage:async()=>({ok:true,text:'Hello',provider:'Fixture'})}};t.ctrl('Oversæt teksten').click();await pause();ok(t.ctrl('Oversættelse').value==='Hello','fresh successful translation displays the response');
 let finish;t.w.chrome.runtime.sendMessage=()=>new Promise(resolve=>finish=resolve);t.ctrl('Oversæt teksten').click();ok(t.ctrl('Oversættelse').value==='','retry clears the previous response while a new result is pending');finish({ok:false,error:'Prøvefejl'});await pause();ok(t.ctrl('Oversættelse').value===''&&tool.node.textContent.includes('Prøvefejl'),'failed retry does not leave an old result looking current');
 ok(t.ctrl('Tekst til oversættelse').dir==='auto'&&t.ctrl('Oversættelse').dir==='auto','both translation fields support automatic text direction');
 ok(!t.errors.length,'translation robustness checks have no runtime errors');t.close();
 console.log('TOTAL',checks,'Test 14 robustness checks');
})().catch(error=>{console.error(error);process.exit(1)});
