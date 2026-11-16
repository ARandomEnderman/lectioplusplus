const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),pause=()=>new Promise(r=>setTimeout(r,45));let checks=0;
const ok=(v,label)=>{assert.ok(v,label);checks++;console.log('PASS',label)};
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const dom=new JSDOM(fs.readFileSync(root+'/preview/index.html','utf8'),{url:'https://example.test/preview/index.html#lxp-tools/all',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document;
 w.structuredClone=structuredClone;w.matchMedia=q=>({matches:q.includes('dark'),addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>null;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 const manifest=JSON.parse(fs.readFileSync(root+'/extension/manifest.json','utf8'));for(const name of ['appearance.js','privacy.js',...manifest.content_scripts.at(-1).js])w.eval(fs.readFileSync(root+'/extension/'+name,'utf8'));await pause();
 const P=w.lectioPlusPunctuationEngine,correct=(text,opts)=>P.analyze(text,opts).text;
 const cases=[
 ['jeg læser men jeg er træt','Jeg læser, men jeg er træt.'],
 ['jeg er træt men jeg skal lave lektier bagefter vil jeg slappe af','Jeg er træt, men jeg skal lave lektier. Bagefter vil jeg slappe af.'],
 ['jeg står tidligt op jeg spiser morgenmad bagefter tager jeg i skole','Jeg står tidligt op. Jeg spiser morgenmad. Bagefter tager jeg i skole.'],
 ['jeg tror at du kommer fordi jeg har inviteret dig','Jeg tror, at du kommer, fordi jeg har inviteret dig.'],
 ['når jeg kommer hjem laver jeg mad','Når jeg kommer hjem, laver jeg mad.'],
 ['hvis det regner så bliver vi hjemme','Hvis det regner, så bliver vi hjemme.'],
 ['bogen som jeg læser er god','Bogen, som jeg læser, er god.'],
 ['jeg spiser og drikker','Jeg spiser og drikker.'],
 ['jeg synes du er flink','Jeg synes, du er flink.'],
 ['jeg ved at du kommer','Jeg ved, at du kommer.'],
 ['jeg gik hjem da det begyndte at regne senere så jeg en film','Jeg gik hjem, da det begyndte at regne. Senere så jeg en film.'],
 ['jeg kan godt lide at gå ture og bagefter laver jeg mad','Jeg kan godt lide at gå ture, og bagefter laver jeg mad.'],
 ['har du lavet lektier','Har du lavet lektier?'],
 ['hvorfor er du træt','Hvorfor er du træt?'],
 ['jeg læser\njeg skriver','Jeg læser.\nJeg skriver.'],
 ['Jeg læser, men jeg er træt.','Jeg læser, men jeg er træt.'],
 ['Vi mødes kl. 9.45. Jeg tager 1,5 liter med.','Vi mødes kl. 9.45. Jeg tager 1,5 liter med.'],
 ['Jeg bruger bl.a. matematik og kemi.','Jeg bruger bl.a. matematik og kemi.'],
 ['jeg åbner opgave.docx og jeg læser den','Jeg åbner opgave.docx, og jeg læser den.'],
 ['Jeg læser på https://example.test/a?x=2,5','Jeg læser på https://example.test/a?x=2,5'],
 ['Jeg bruger `x=1.5; y=2`','Jeg bruger `x=1.5; y=2`'],
 ['Han siger "jeg er glad men jeg er træt"','Han siger "jeg er glad men jeg er træt"'],
 ['Prisen er 1,5 kr.','Prisen er 1,5 kr.'],
 ['Det er pH 7.','Det er pH 7.'],
 ['I dag har jeg fri.','I dag har jeg fri.'],
 ['Jeg læser ,men jeg er træt .','Jeg læser, men jeg er træt.'],
 ['',''],['   ','   ']
 ];
 for(const [input,expected] of cases){const result=correct(input);assert.equal(result,expected,input);ok(correct(result)===result,'punctuation and repeat correction: '+input.slice(0,55));const changes=P.analyze(input).changes;ok(changes.every((c,i)=>!i||changes[i-1].end<=c.start),'non-overlapping punctuation edits');}
 assert.equal(correct('jeg tror at du kommer fordi jeg har inviteret dig',{startComma:false}),'Jeg tror at du kommer fordi jeg har inviteret dig.');checks++;
 assert.equal(correct('når jeg kommer hjem laver jeg mad',{startComma:false}),'Når jeg kommer hjem, laver jeg mad.');checks++;
 assert.equal(correct('bogen som jeg læser er god',{startComma:false}),'Bogen som jeg læser, er god.');checks++;
 assert.equal(correct('jeg læser men jeg er træt',{capitals:false}),'jeg læser, men jeg er træt.');checks++;
 assert.throws(()=>correct('a'.repeat(12001)));checks++;
 const B=w.lectioPlusMoleculeBuilder;
 const expected=[[962,'H2O'],[783,'H2'],[977,'O2'],[947,'N2'],[222,'H3N'],[297,'CH4'],[280,'CO2'],[313,'ClH'],[6324,'C2H6'],[6325,'C2H4'],[6326,'C2H2'],[887,'CH4O'],[702,'C2H6O'],[8254,'C2H6O'],[784,'H2O2']];
 const cp=g=>JSON.parse(JSON.stringify(g));
 for(let n=0;n<expected.length;n++){
  const g=cp(B.catalog[n]),[cid,formula]=expected[n],r=B.analyze(g);ok(r.record.cid===cid&&r.formula===formula,'PubChem graph recognized: CID '+cid);
  const count=g.atoms.length,reverse={atoms:g.atoms.slice().reverse().map(a=>[a[0],600-a[1],360-a[2],80]),bonds:g.bonds.slice().reverse().map(([a,b,o])=>[count-1-b,count-1-a,o])};
  ok(B.analyze(reverse).record.cid===cid,'atom ordering, orientation and placement do not change identity: '+cid);
  const broken=cp(g);broken.bonds.pop();ok(!B.analyze(broken).record,'missing bond does not receive a molecule name: '+cid);
 }
 ok(!B.sameStructure(B.catalog[12],B.catalog[13]),'ethanol and dimethyl ether are distinct despite same formula');
 const atom=(s,x=300)=>[s,x,180,0],oxygen={atoms:[atom('O')],bonds:[]},water=B.fillHydrogens(oxygen);ok(B.analyze(water).record.cid===962,'oxygen with two explicit hydrogens is water');
 ok(B.analyze(B.fillHydrogens({atoms:[atom('C')],bonds:[]})).record.cid===297,'fill carbon valence produces methane');
 ok(B.analyze({atoms:[atom('O'),atom('O',400)],bonds:[[0,1,1]]}).status==='incomplete','single O–O is not falsely called O2');
 const propane=B.fillHydrogens({atoms:[atom('C',200),atom('C'),atom('C',400)],bonds:[[0,1,1],[1,2,1]]});ok(B.analyze(propane).status==='unknown','valid structure outside catalog stays unknown');
 ok(B.analyze({atoms:[],bonds:[]}).status==='empty','empty builder has no name');
 ok(B.analyze({atoms:[atom('H'),atom('H',400)],bonds:[]}).status==='disconnected','unconnected atoms are not identified by formula');
 for(const bad of [null,{atoms:[['X',300,180,0]],bonds:[]},{atoms:[['H',NaN,0,0]],bonds:[]},{atoms:Array(25).fill(atom('H')),bonds:[]},{atoms:[atom('H')],bonds:[[0,0,1]]},{atoms:[atom('H'),atom('H')],bonds:[[0,1,2]]},{atoms:[atom('O'),atom('O')],bonds:[[0,1,1],[1,0,1]]},{atoms:[atom('H')],bonds:[[0,2,1]]},{atoms:[atom('C')],bonds:[[0,0,4]]}]){assert.throws(()=>B.validate(bad));checks++;}
 ok(B.analyze(B.removeAtom(water,2)).status==='incomplete','deleting atom removes incident bonds');
 ok(B.analyze(B.bond(water,0,1,0)).status==='disconnected','removing bond updates connectivity');
 const main=d.querySelector('.lxp-school-tools'),stage=()=>main.querySelector('.lxp-tool-stage'),ctrl=label=>[...main.querySelectorAll('[aria-label]')].find(x=>x.getAttribute('aria-label')===label),route=async id=>{w.location.hash='#lxp-tools/'+id;await pause()},change=(label,value,event='input')=>{const el=ctrl(label);assert.ok(el,label);el.value=value;el.dispatchEvent(new w.Event(event,{bubbles:true}));return el},click=async label=>{const el=ctrl(label);assert.ok(el,label);el.click();await pause()};
 await route('punctuation');change('Metode','rules','change');const original='jeg er træt men jeg skal lave lektier bagefter vil jeg slappe af';change('Tekst til tegnsætning',original);await click('Ret komma og punktum');ok(ctrl('Forhåndsvisning – kan redigeres').value===cases[1][1],'primary button inserts all corrections without selecting suggestions');ok(ctrl('Tekst til tegnsætning').value===original,'automatic output leaves original available for comparison');ok([...stage().querySelectorAll('.lxp-punctuation-suggestion input')].every(i=>i.checked),'automatic changes are selected and individually reviewable');
 let copied='';w.navigator.clipboard={writeText:async s=>{copied=s}};await click('Kopiér rettet tekst');ok(copied===cases[1][1],'copy gets corrected text');await click('Brug den viste tekst');await click('Fortryd indsættelse');ok(ctrl('Tekst til tegnsætning').value===original,'automatic correction can be applied and undone');change('Nye startkommaer','without','change');ok(ctrl('Kopiér rettet tekst').disabled&&!ctrl('Forhåndsvisning – kan redigeres').value,'changed options invalidate stale correction');change('Tekst til tegnsætning','jeg tror at du kommer');await click('Ret komma og punktum');ok(ctrl('Forhåndsvisning – kan redigeres').value==='Jeg tror at du kommer.','UI respects optional start commas');change('Forhåndsvisning – kan redigeres','Min egen rettelse.');await click('Kopiér rettet tekst');ok(copied==='Min egen rettelse.','manual edits remain copyable');
 await route('molecules');ok(stage().querySelectorAll('.lxp-molecule circle').length===3,'original water reference model remains default');change('Visning','builder','change');ok(!stage().querySelector('.lxp-molecule-workshop').hidden,'build mode opens editor');await click('Tilføj O');await click('Tilføj manglende H');ok(stage().querySelector('.lxp-tool-output h3').textContent==='Vand'&&stage().querySelectorAll('[data-atom]').length===3,'palette plus explicit H completion recognizes water');
 const before=ctrl('Gemt molekylestruktur').value;change('Valgt atom','0','change');change('Dybde for valgt atom','80','change');ok(JSON.parse(ctrl('Gemt molekylestruktur').value).atoms[0][3]===80&&stage().querySelector('.lxp-tool-output h3').textContent==='Vand','depth changes 3D sketch without changing name');await click('Fortryd ændring');ok(ctrl('Gemt molekylestruktur').value===before,'undo restores geometry');
 change('Eksempel','702','change');await click('Indlæs eksempel');ok(stage().querySelector('.lxp-tool-output h3').textContent==='Ethanol','load ethanol example');change('Eksempel','8254','change');await click('Indlæs eksempel');ok(stage().querySelector('.lxp-tool-output h3').textContent==='Dimethylether','same formula different bonds displays other name');
 change('Navn på opsætning','Mit molekyle');await click('Gem denne opsætning');const prefs=()=>w.lectioPlusAppearance.normalize(JSON.parse(w.localStorage.getItem('lectioPlusPreview')||'{}')),preset=prefs().toolbox.lab.presets.find(x=>x.title==='Mit molekyle'||x.name==='Mit molekyle')||prefs().toolbox.lab.presets.at(-1);await click('Ryd byggefelt');change('Gemte opsætninger for værktøjet',preset.id,'change');await click('Indlæs valgt opsætning');ok(stage().querySelector('.lxp-tool-output h3').textContent==='Dimethylether','saved setup restores atoms and bonds');
 await click('Gem resultat på ark');ok(prefs().toolbox.lab.sheets.length===1,'recognized molecular sketch can be saved to worksheet');await click('Ryd byggefelt');await click('Tilføj O');await click('Tilføj H');change('Valgt atom','0','change');change('Forbind med','1','change');await click('Forbind valgte atomer');ok(JSON.parse(ctrl('Gemt molekylestruktur').value).bonds.length===1,'keyboard-friendly controls connect two atoms');await click('Tilføj H');change('Handling','bond','change');const key=i=>stage().querySelector('[data-atom="'+i+'"]').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));key(0);key(2);ok(stage().querySelector('.lxp-tool-output h3').textContent==='Vand','keyboard atom activation supports connect mode');
 change('Valgt atom','0','change');change('Forbind med','1','change');change('Binding','2','change');await click('Forbind valgte atomer');ok(stage().querySelector('.lxp-tool-notice').textContent.includes('For mange bindinger')&&JSON.parse(ctrl('Gemt molekylestruktur').value).bonds.every(b=>b[2]===1),'invalid bond is rejected without destroying valid graph');
 await click('Ryd byggefelt');const canvas=stage().querySelector('.lxp-molecule-stage');canvas.getBoundingClientRect=()=>({left:0,top:0,right:600,bottom:360,width:600,height:360});const workshop=stage().querySelector('.lxp-molecule-workshop'),event=(target,type,x,y)=>target.dispatchEvent(new w.MouseEvent(type,{bubbles:true,button:0,clientX:x,clientY:y}));event(ctrl('Tilføj O'),'pointerdown',0,0);event(workshop,'pointermove',300,180);ok(!stage().querySelector('.lxp-atom-drag-ghost').hidden,'dragged atom remains visible under pointer');event(workshop,'pointerup',300,180);await pause();ok(JSON.parse(ctrl('Gemt molekylestruktur').value).atoms[0][0]==='O','pointer drag adds atom at drop location');event(ctrl('Tilføj H'),'pointerdown',0,0);event(workshop,'pointermove',360,180);event(workshop,'pointerup',360,180);await pause();ok(JSON.parse(ctrl('Gemt molekylestruktur').value).bonds.length===1,'nearby drop creates a valid single bond');
 change('Handling','move','change');event(stage().querySelector('[data-atom="0"]'),'pointerdown',300,180);event(workshop,'pointermove',200,200);event(workshop,'pointerup',200,200);ok(JSON.parse(ctrl('Gemt molekylestruktur').value).atoms[0][1]===200,'pointer drag moves existing atom');event(stage().querySelector('[data-atom="0"]'),'pointerdown',200,200);event(workshop,'pointermove',100,100);event(workshop,'pointercancel',100,100);ok(JSON.parse(ctrl('Gemt molekylestruktur').value).atoms[0][1]===200,'cancelled drag restores prior geometry');
 const valid=ctrl('Gemt molekylestruktur').value;change('Gemt molekylestruktur','{"atoms":[["<script>",1,2,3]],"bonds":[]}','change');ok(!stage().querySelector('script')&&stage().querySelectorAll('[data-atom]').length===2,'invalid stored structure cannot inject markup or replace graph');
 await new Promise(r=>setTimeout(r,150));ok(!errors.length,'test15 tools produce no DOM errors: '+errors.join('; '));w.close();console.log('TOTAL',checks,'Test15 punctuation and molecule checks');
})().catch(e=>{console.error(e);process.exit(1)});
