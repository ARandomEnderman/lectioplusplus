const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{Worker}=require('node:worker_threads'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../extension');let checks=0;const ok=(value,label)=>{assert.ok(value,label);checks++;console.log('PASS',label)};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function transport({ready=true,protocol='https:'}={}){
 const timers=new Map(),frames=[],requests=[];let tid=0;
 class Channel{constructor(){const a={start(){},close(){this.closed=true;}},b={start(){},close(){this.closed=true;}};a.postMessage=data=>queueMicrotask(()=>{if(!b.closed)b.onmessage?.({data});});b.postMessage=data=>queueMicrotask(()=>{if(!a.closed)a.onmessage?.({data});});this.port1=a;this.port2=b;}}
 const document={currentScript:null,documentElement:{append(frame){frames.push(frame);frame.load();}},createElement(){return{setAttribute(){},addEventListener(type,fn){if(type==='load')this.load=fn;},remove(){this.removed=true;},contentWindow:{postMessage(data,origin,ports){const port=ports[0];port.onmessage=({data})=>requests.push({data,port});if(ready)port.postMessage({type:'ready'});}}};}};
 const context={document,location:{protocol,href:protocol==='file:'?'file:///demo/SE_TESTEN.html':'http://localhost/preview/index.html'},URL,MessageChannel:Channel,DOMException,AbortController,setTimeout:(fn,ms)=>{timers.set(++tid,{fn,ms});return tid;},clearTimeout:id=>timers.delete(id),addEventListener(){}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(root+'/punctuation-client.js','utf8'),context);
 return{api:context.lectioPlusLocalPunctuation,timers,frames,requests};
}
(async()=>{
 let t=transport(),progress=[];const p=t.api.analyze('jeg læser',{},x=>progress.push(x));await tick();
 ok(t.frames.length===1&&t.requests.length===1,'content client connects lazily through one private channel');
 const r=t.requests[0];r.port.postMessage({id:r.data.id+1,type:'result',result:{text:'forkert'}});r.port.postMessage({id:r.data.id,type:'progress',phase:'working',done:1,total:1});r.port.postMessage({id:r.data.id,type:'result',result:{text:'Jeg læser.',changes:[]}});
 ok((await p).text==='Jeg læser.'&&progress.some(x=>x.phase==='working'),'client ignores another request and forwards progress plus its own result');t.api.close();ok(t.frames[0].removed&&t.timers.size===0,'closing the client removes the frame and timeouts');
 t=transport({ready:false});const failed=t.api.analyze('tekst'),failure=assert.rejects(failed,/kunne ikke åbnes/);[...t.timers.values()].find(t=>t.ms===15000).fn();await failure;ok(t.frames[0].removed,'frame startup timeout reports an error rather than a silent cancellation');
 t=transport({ready:false});let controller=new AbortController(),aborted=t.api.analyze('tekst',{},null,controller.signal),abortCheck=assert.rejects(aborted,{name:'AbortError'});controller.abort();await abortCheck;ok(t.frames[0].removed,'cancellation while connecting aborts without leaving an iframe');
 t=transport();controller=new AbortController();aborted=t.api.analyze('tekst',{},null,controller.signal);abortCheck=assert.rejects(aborted,{name:'AbortError'});await tick();controller.abort();await abortCheck;ok(t.frames[0].removed,'cancellation during inference closes the worker-owning frame');
 t=transport();const slow=t.api.analyze('tekst'),slowCheck=assert.rejects(slow,/tog for lang tid/);await tick();t.requests[0].port.postMessage({id:t.requests[0].data.id,type:'progress',phase:'working',done:0,total:1});await tick();[...t.timers.values()].find(t=>t.ms===120000).fn();await slowCheck;ok(t.frames[0].removed,'inference timeout has a specific error and releases the frame');
 t=transport({protocol:'file:'});await assert.rejects(t.api.analyze('tekst'),/installerede udvidelse/);ok(!t.frames.length,'double-clicked HTML explains the model limitation without starting a broken worker');

 // Exercise the exact packaged worker and WASM. Only file:// fetch is adapted
 // to Node's fs; this is not a Chrome/Edge rendering or extension-CSP test.
 const entry=pathToFileURL(root+'/punctuation-worker.mjs').href;
 const worker=new Worker(`const {parentPort}=require('node:worker_threads'),fs=require('node:fs');globalThis.self=globalThis;self.postMessage=data=>parentPort.postMessage(data);globalThis.fetch=async url=>{if(!String(url).startsWith('file:'))throw Error('Unexpected network request');return new Response(fs.readFileSync(new URL(url)));};import(${JSON.stringify(entry)}).then(()=>parentPort.on('message',data=>self.onmessage({data})));`,{eval:true});
 let id=0;
 const request=(text,options={})=>new Promise((resolve,reject)=>{
   const current=++id,updates=[];
   const timer=setTimeout(()=>{worker.terminate();reject(Error('Worker timeout'));},30000);
   const receive=data=>{if(data.id!==current)return;if(data.type==='progress'){updates.push(data);return;}clearTimeout(timer);worker.off('message',receive);resolve({...data,updates});};
   worker.on('message',receive);worker.once('error',reject);worker.postMessage({id:current,type:'analyze',text,options});
 });
 try{
   let response=await request('vi talte om hvad. Vi havde lavet');ok(response.type==='result'&&response.result.text==='Vi talte om, hvad vi havde lavet.','packaged worker performs real local inference and repairs an existing bad full stop');
   ok(response.updates.some(x=>x.phase==='loading')&&response.updates.some(x=>x.phase==='working'),'real worker reports loading and inference progress');
   ok(['tokenizer','model','runtime'].every(step=>response.updates.some(x=>x.step===step)),'real model reports all local asset and runtime stages');
   response=await request('jeg ved at du kommer',{capitals:false});ok(response.result.text==='jeg ved, at du kommer.','warm worker reuses its model and respects casing choice');
   const sentence=JSON.parse(fs.readFileSync(__dirname+'/fixtures/punctuation-sentences.json'))[0];
   response=await request(sentence[0]);ok(response.result.text===sentence[1],'actual worker keeps the long prepositional continuation in its original sentence');
   response=await request('jeg tror\nat du kommer');ok(response.result.text==='Jeg tror,\nat du kommer.','actual worker does not turn a soft line wrap into a sentence boundary');
   response=await request(' ');ok(response.result.text===' '&&!response.result.changes.length,'empty prose completes without inventing a sentence');
   response=await request('x'.repeat(12001));ok(response.type==='error'&&!JSON.stringify(response).includes('xxxx'),'worker validates oversized input and does not echo it in an error');
 }finally{await worker.terminate();}
 // Missing assets exercise the real worker's error handling, without altering
 // any installed model file or leaking the supplied text in the error.
 for(const missing of ['tokenizer.json','pnc.int8.onnx']){
   const failedWorker=new Worker(`const {parentPort}=require('node:worker_threads'),fs=require('node:fs');globalThis.self=globalThis;self.postMessage=data=>parentPort.postMessage(data);globalThis.fetch=async url=>{if(!String(url).startsWith('file:'))throw Error('Unexpected network request');if(String(url).endsWith(${JSON.stringify(missing)}))return new Response(null,{status:404});return new Response(fs.readFileSync(new URL(url)));};import(${JSON.stringify(entry)}).then(()=>parentPort.on('message',data=>self.onmessage({data})));`,{eval:true});
   try{
     const reply=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Missing-asset test timeout')),10000);failedWorker.once('error',error=>{clearTimeout(timer);reject(error)});failedWorker.on('message',data=>{if(data.type==='error'||data.type==='result'){clearTimeout(timer);resolve(data)}});failedWorker.postMessage({id:1,type:'analyze',text:'min private tekst'});});
     ok(reply.type==='error'&&reply.message.includes(missing)&&!reply.message.includes('min private tekst'),'real worker identifies missing '+missing+' without echoing text');
   }finally{await failedWorker.terminate();}
 }
 console.log('TOTAL',checks,'local punctuation transport and real worker checks');
})().catch(e=>{console.error(e);process.exit(1)});
