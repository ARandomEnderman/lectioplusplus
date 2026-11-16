const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),pause=()=>new Promise(r=>setTimeout(r,50));let checks=0;
const ok=(v,label)=>{assert.ok(v,label);checks++;console.log('PASS',label)};
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(root+'/preview/index.html','utf8'),{url:'https://example.test/preview/index.html#lxp-tools/punctuation',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document;
 w.structuredClone=structuredClone;w.matchMedia=q=>({matches:q.includes('dark'),addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>null;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 const manifest=JSON.parse(fs.readFileSync(root+'/extension/manifest.json','utf8'));for(const name of ['appearance.js','privacy.js',...manifest.content_scripts.at(-1).js])w.eval(fs.readFileSync(root+'/extension/'+name,'utf8'));await pause();
 const main=d.querySelector('.lxp-school-tools'),ctrl=label=>[...main.querySelectorAll('[aria-label]')].find(x=>x.getAttribute('aria-label')===label),change=(label,value,event='change')=>{const el=ctrl(label);assert.ok(el,label);el.value=value;el.dispatchEvent(new w.Event(event,{bubbles:true}));return el},click=async label=>{ctrl(label).click();await pause();};
 let requests=[];
 w.lectioPlusLocalPunctuation={analyze:(text,options,progress,signal)=>new Promise((resolve,reject)=>requests.push({text,options,progress,signal,resolve,reject}))};
 const result={text:'Jeg læser, men jeg er træt.',changes:[{start:0,end:1,replacement:'J',why:'Bogstav.',kind:'capital'},{start:9,end:10,replacement:', ',why:'Komma.',kind:'model-punctuation',confidence:.7},{start:25,end:25,replacement:'.',why:'Punktum.',kind:'model-punctuation',confidence:.9}],uncertain:1};
 const input='jeg læser men jeg er træt';assert.equal(input.length,25);
 ok(ctrl('Metode').value==='model','trained model is the default method');
 ok(ctrl('Nye startkommaer').closest('label').hidden,'model does not pretend to implement a no-start-comma preference');
 ok(!ctrl('Eksisterende tegn').closest('label').hidden,'existing punctuation policy is visible for the model');
 change('Tekst til tegnsætning',input,'input');await click('Ret komma og punktum');
 ok(requests.length===1&&requests[0].text===input,'button sends exactly the current text to the local engine');
 ok(ctrl('Ret komma og punktum').disabled&&ctrl('Kopiér rettet tekst').disabled&&!ctrl('Stop tegnsætning').disabled,'busy state prevents duplicate work and copying an unfinished result');
 for(const[step,label]of [['tokenizer','Indlæser orddeling'],['model','Indlæser den lokale modelfil'],['runtime','Starter den lokale beregningsmotor']]){requests[0].progress({phase:'loading',step});ok(main.textContent.includes(label),'UI identifies loading stage: '+step);}
 await new Promise(r=>setTimeout(r,1100));ok(/· [1-9]\d* s\./.test(main.textContent),'elapsed time advances while the model is loading');
 requests[0].progress({phase:'working',done:1,total:2});ok(main.textContent.includes('50 %'),'model progress is visible');requests[0].resolve(result);await pause();
 ok(ctrl('Forhåndsvisning – kan redigeres').value===result.text,'automatic mode inserts all model edits without checkbox work');
 ok(ctrl('Tekst til tegnsætning').value===input,'model output keeps the original available');
 ok(main.querySelectorAll('[data-uncertain="true"]').length===1,'low-confidence edit is explicitly marked for extra review');
 let copied;w.navigator.clipboard={writeText:async value=>{copied=value;}};await click('Kopiér rettet tekst');ok(copied===result.text,'copy uses the corrected preview');
 await click('Brug den viste tekst');await click('Fortryd indsættelse');ok(ctrl('Tekst til tegnsætning').value===input,'apply and undo recover the exact original');
 change('Tekst til tegnsætning',input,'input');await click('Ret komma og punktum');const old=requests.at(-1);change('Tekst til tegnsætning','en helt anden tekst','input');ok(old.signal.aborted,'editing source aborts an in-flight analysis');old.resolve(result);await pause();ok(!ctrl('Forhåndsvisning – kan redigeres').value&&ctrl('Kopiér rettet tekst').disabled,'late model result cannot overwrite new input');
 await click('Ret komma og punktum');const stopped=requests.at(-1);await click('Stop tegnsætning');stopped.resolve(result);await pause();ok(stopped.signal.aborted&&!ctrl('Forhåndsvisning – kan redigeres').value,'stop preserves the input without accepting a delayed result');
 await click('Ret komma og punktum');requests.at(-1).reject(Error('Modellen kunne ikke indlæses.'));await pause();ok(main.textContent.includes('Modellen kunne ikke indlæses.')&&!ctrl('Forhåndsvisning – kan redigeres').value,'failed model does not silently fall back to the old heuristics');
 await new Promise(r=>setTimeout(r,1100));ok(main.textContent.includes('Modellen kunne ikke indlæses.')&&!ctrl('Ret komma og punktum').disabled&&ctrl('Stop tegnsætning').disabled,'error remains visible after the progress timer stops and retry is enabled');
 change('Eksisterende tegn','keep');change('Store begyndelsesbogstaver','no');change('Tekst til tegnsætning',input,'input');await click('Find forslag');const manual=requests.at(-1);ok(manual.options.existing==='keep'&&manual.options.capitals===false,'model options reach the inference request');manual.resolve(result);await pause();ok(ctrl('Forhåndsvisning – kan redigeres').value===input&&![...main.querySelectorAll('.lxp-punctuation-suggestion input')].some(x=>x.checked),'manual review starts without selected changes');
 change('Forhåndsvisning – kan redigeres','Mit eget resultat.','input');await click('Kopiér rettet tekst');ok(copied==='Mit eget resultat.','manual corrections remain copyable');
 change('Metode','rules');ok(!ctrl('Nye startkommaer').closest('label').hidden&&ctrl('Eksisterende tegn').closest('label').hidden,'explicit legacy mode exposes only its supported options');
 change('Store begyndelsesbogstaver','yes');change('Tekst til tegnsætning',input,'input');await click('Ret komma og punktum');ok(ctrl('Forhåndsvisning – kan redigeres').value===result.text,'legacy method remains available only when explicitly selected');
 ok(!errors.length,'model UI has no DOM errors');w.close();

 // Frame-side origin checks, private channel, worker lifecycle and busy requests.
 const handlers={},ports=[],workers=[],parent={},timers=new Map();let tid=0;
 class FakeWorker{constructor(url,options){this.url=url;this.options=options;workers.push(this);}postMessage(data){this.request=data;}terminate(){this.terminated=true;}}
 const frame={parent,location:{origin:'http://localhost:8080'},addEventListener:(type,fn)=>handlers[type]=fn,Worker:FakeWorker,setTimeout:fn=>{timers.set(++tid,fn);return tid;},clearTimeout:id=>timers.delete(id)};
 vm.createContext(frame);vm.runInContext(fs.readFileSync(root+'/extension/punctuation-frame.js','utf8'),frame);
 const port={sent:[],postMessage(data){this.sent.push(data)},start(){this.started=true}};
 const connect=origin=>handlers.message({source:parent,origin,data:{type:'lxp-punctuation-connect'},ports:[port]});
 connect('https://untrusted.example');ok(!port.started,'frame rejects a parent from an unrelated origin');connect('http://localhost:8080');ok(port.started&&port.sent[0].type==='ready','localhost preview accepts its same-origin parent on a private channel');
 port.onmessage({data:{type:'analyze',id:1,text:'hej'}});ok(workers.length===1&&workers[0].options.type==='module','model worker starts lazily on first request');
 port.onmessage({data:{type:'analyze',id:2,text:'ny tekst'}});ok(workers.length===1&&workers[0].request.id===1,'frame rejects overlapping requests');
 workers[0].onmessage({data:{id:999,type:'result'}});ok(port.sent.length===1,'frame ignores results from a different request');
 workers[0].onmessage({data:{id:1,type:'result',result}});ok(port.sent.at(-1).result===result,'frame returns only the active result');
 [...timers.values()].at(-1)();ok(workers[0].terminated,'idle worker and model memory are released');
 port.onmessage({data:{type:'analyze',id:3,text:'hej igen'}});port.onmessage({data:{type:'cancel'}});ok(workers[1].terminated,'cancel terminates the active worker');
 port.onmessage({data:{type:'analyze',id:4,text:'x'.repeat(12001)}});ok(workers.length===2,'frame enforces the text size limit before starting work');
 console.log('TOTAL',checks,'punctuation UI and worker bridge checks');
})().catch(e=>{console.error(e);process.exit(1)});
