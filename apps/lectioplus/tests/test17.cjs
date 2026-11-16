const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),pause=()=>new Promise(r=>setTimeout(r,60));let checks=0;
const ok=(v,label)=>{assert.ok(v,label);checks++;console.log('PASS',label)};
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const dom=new JSDOM(fs.readFileSync(root+'/preview/index.html','utf8'),{url:'https://example.test/preview/index.html#lxp-tools/molecules',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document;
 w.structuredClone=structuredClone;w.matchMedia=q=>({matches:q.includes('dark'),addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>null;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 const manifest=JSON.parse(fs.readFileSync(root+'/extension/manifest.json','utf8'));for(const name of ['appearance.js','privacy.js',...manifest.content_scripts.at(-1).js])w.eval(fs.readFileSync(root+'/extension/'+name,'utf8'));await pause();
 const P=w.lectioPlusPunctuationEngine,fixtures=JSON.parse(fs.readFileSync(__dirname+'/fixtures/punctuation-regressions.json','utf8'));
 for(const [input,expected] of fixtures){const r=P.analyze(input);assert.equal(r.text,expected,input);ok(P.analyze(r.text).text===r.text,'punctuation regression and second pass: '+input.slice(0,65));ok(r.changes.every((x,i)=>!i||r.changes[i-1].end<=x.start),'edits do not overlap');}
 for(const [input,expected] of [
 ['jeg ved ikke hvad der sker når hun kommer hjem','Jeg ved ikke hvad der sker når hun kommer hjem.'],
 ['før vi gik hjem pakkede vi vores tasker','Før vi gik hjem, pakkede vi vores tasker.'],
 ['bogen du gav mig er god','Bogen du gav mig, er god.'],
 ['jeg ser at hun kommer og at han går','Jeg ser at hun kommer, og at han går.'],
 ['jeg står op og min ven laver morgenmad','Jeg står op, og min ven laver morgenmad.']
 ]){assert.equal(P.analyze(input,{startComma:false}).text,expected);checks++;}
 const main=d.querySelector('.lxp-school-tools'),stage=()=>main.querySelector('.lxp-tool-stage'),ctrl=label=>[...main.querySelectorAll('[aria-label]')].find(x=>x.getAttribute('aria-label')===label),change=(label,value,event='change')=>{const el=ctrl(label);assert.ok(el,label);el.value=value;el.dispatchEvent(new w.Event(event,{bubbles:true}));return el},click=async label=>{const el=ctrl(label);assert.ok(el,label);el.click();await pause()};
 change('Visning','builder');const identity=stage().querySelector('.lxp-molecule-identity'),name=()=>identity.querySelector('.lxp-molecule-name').textContent;
 ok(identity.getAttribute('role')==='status'&&identity.getAttribute('aria-live')==='polite','name panel is announced accessibly');
 ok(identity.compareDocumentPosition(stage().querySelector('.lxp-molecule-stage'))&w.Node.DOCUMENT_POSITION_FOLLOWING,'name is directly above the build canvas');
 ok(name()==='Intet molekyle endnu','empty canvas does not show an old molecule name');
 await click('Tilføj O');ok(identity.dataset.state==='incomplete'&&identity.textContent.includes('Tilføj manglende H'),'unfinished molecule explains how to obtain a name');await click('Tilføj manglende H');ok(name()==='Vand'&&identity.textContent.includes('Formel: H2O'),'building water automatically shows its name beside the canvas');
 let mutations=0;const observer=new w.MutationObserver(r=>mutations+=r.length);observer.observe(identity,{subtree:true,childList:true,characterData:true});change('Vandret rotation','80','input');await pause();observer.disconnect();ok(mutations===0,'rotation does not repeat live name announcements');
 for(const reference of w.lectioPlusMoleculeBuilder.references){change('Eksempel',String(reference.cid));await click('Indlæs eksempel');ok(name()===reference.name&&identity.dataset.state==='known','inline name matches recognized molecule: '+reference.cid);}
 await click('Ryd byggefelt');ok(name()==='Intet molekyle endnu'&&!identity.textContent.includes('Hydrogenperoxid'),'clear removes the previous name immediately');await click('Fortryd ændring');ok(name()==='Hydrogenperoxid','undo restores the correct molecular name');
 change('Valgt atom','0');await click('Slet valgt atom');ok(identity.dataset.state!=='known'&&name()!=='Hydrogenperoxid','deleting atoms removes an invalidated name');
 const B=w.lectioPlusMoleculeBuilder,unknown=B.fillHydrogens({atoms:[['C',200,180,0],['C',300,180,0],['C',400,180,0]],bonds:[[0,1,1],[1,2,1]]});change('Gemt molekylestruktur',JSON.stringify(unknown));ok(identity.dataset.state==='unknown'&&name()==='Navnet findes ikke i kataloget','unknown graph never receives an invented name');
 w.location.hash='#lxp-tools/punctuation';await pause();change('Metode','rules');change('Tekst til tegnsætning',fixtures[1][0],'input');await click('Ret komma og punktum');ok(ctrl('Forhåndsvisning – kan redigeres').value===fixtures[1][1],'primary UI corrects the long subordinate-clause regression');ok(!ctrl('Forhåndsvisning – kan redigeres').value.includes('hvad. De'),'UI no longer splits a clause after hvad');
 await new Promise(r=>setTimeout(r,150));ok(!errors.length,'name panel and punctuation have no DOM errors: '+errors.join('; '));w.close();console.log('TOTAL',checks,'Test17 molecule name and punctuation regressions');
})().catch(e=>{console.error(e);process.exit(1)});
