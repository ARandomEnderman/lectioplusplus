const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{webcrypto}=require('node:crypto');
const root=path.resolve(__dirname,'../extension');let checks=0;
const ok=(value,label)=>{assert.ok(value,label);checks++;console.log('PASS',label)};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const event=()=>{const listeners=new Set();return{addListener:fn=>listeners.add(fn),emit:(...args)=>{for(const fn of listeners)fn(...args)}}};
function ports(name,sender){
 const a={name,onMessage:event(),onDisconnect:event()},b={name,sender,onMessage:event(),onDisconnect:event()};
 for(const[p,peer]of [[a,b],[b,a]]){
   p.postMessage=data=>{if(p.closed)throw Error('disconnected');const copy=JSON.parse(JSON.stringify(data));queueMicrotask(()=>{if(!peer.closed)peer.onMessage.emit(copy)})};
   p.disconnect=()=>{if(p.closed)return;p.closed=peer.closed=true;queueMicrotask(()=>{p.onDisconnect.emit();peer.onDisconnect.emit()})};
 }
 return[a,b];
}
function environment({blocked=false,connectThrows=false,workerThrows=false}={}){
 const frames=[],workers=[],timers=new Map();let tid=0;
 const timing={setTimeout:(fn,ms)=>{timers.set(++tid,{fn,ms});return tid},clearTimeout:id=>timers.delete(id)};
 const sender={id:'fictional',url:'https://www.lectio.dk/lectio/fake',tab:{id:1},frameId:0};
 const runtime={id:'fictional',getURL:file=>'chrome-extension://fictional/'+file,connect({name}){
   if(connectThrows)throw Error('Extension context invalidated');
   const pair=ports(name,sender);runtime.lastPair=pair;
   queueMicrotask(()=>frames.at(-1).connect.emit(pair[1]));return pair[0];
 }};
 class FakeWorker{
   constructor(url,options){if(workerThrows)throw Error('blocked worker');this.url=url;this.options=options;workers.push(this)}
   postMessage(data){this.request=JSON.parse(JSON.stringify(data))}
   reply(data){this.onmessage({data})}
   terminate(){this.terminated=true}
 }
 const document={currentScript:null,createElement(){
   const handlers={};return{handlers,setAttribute(){},addEventListener:(type,fn)=>handlers[type]=fn,remove(){this.removed=true},contentWindow:{postMessage(){throw Error('Installed extension must not use window.postMessage')}}};
 },documentElement:{append(frame){
   frames.push(frame);frame.connect=event();
   if(blocked)return;
   const context={URL,Worker:FakeWorker,location:{hash:new URL(frame.src).hash},chrome:{runtime:{id:'fictional',onConnect:frame.connect}},...timing,addEventListener(){}};
   vm.createContext(context);vm.runInContext(fs.readFileSync(root+'/punctuation-frame.js','utf8'),context);
   frame.handlers.load();
 }}};
 const context={document,location:{protocol:'https:',href:sender.url},chrome:{runtime},crypto:webcrypto,Uint8Array,URL,DOMException,AbortController,...timing,addEventListener(){}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(root+'/punctuation-client.js','utf8'),context);
 const fire=ms=>{const item=[...timers].find(([,v])=>v.ms===ms);assert.ok(item,'timer '+ms);timers.delete(item[0]);item[1].fn()};
 return{api:context.lectioPlusLocalPunctuation,frames,workers,runtime,timers,fire,sender};
}
(async()=>{
 let e=environment(),updates=[];
 let p=e.api.analyze('jeg læser',{},x=>updates.push(x));await tick();
 ok(e.workers.length===1&&e.workers[0].request.text==='jeg læser','installed client and actual frame connect without window.postMessage or MessageChannel');
 ok(/^#\w{32}$/.test(new URL(e.frames[0].src).hash),'each frame receives a unique connection identifier');
 ok(updates.map(x=>x.phase).join(',')==='connecting,worker','startup reports connecting and worker stages before inference');
 const worker=e.workers[0],id=worker.request.id;
 worker.reply({id:id+1,type:'result',result:{text:'wrong'}});await tick();ok(!updates.some(x=>x.text==='wrong'),'unrelated worker response is ignored');
 worker.reply({id,type:'progress',phase:'loading',step:'runtime'});await tick();ok(updates.at(-1).step==='runtime','runtime loading stage crosses the native port');
 worker.reply({id,type:'result',result:{text:'Jeg læser.',changes:[]}});ok((await p).text==='Jeg læser.','native round trip returns the actual frame result');
 e.api.close();await tick();ok(e.frames[0].removed&&worker.terminated&&!e.timers.size,'closing releases native ports, worker, frame and timers');

 e=environment({blocked:true});p=e.api.analyze('tekst');let failed=assert.rejects(p,/15 sekunder/);e.fire(15000);await failed;
 ok(e.frames[0].removed&&!e.timers.size,'blocked frame produces a startup error and cleans up');
 e=environment({connectThrows:true});await assert.rejects(e.api.analyze('tekst'),/afbrudt/);ok(e.frames[0].removed,'invalidated extension context fails immediately');
 e=environment({workerThrows:true});await assert.rejects(e.api.analyze('tekst'),/starte/);e.api.close();ok(!e.workers.length,'worker construction failure reaches the client');

 e=environment();p=e.api.analyze('tekst');await tick();failed=assert.rejects(p,/under opstart/);e.fire(15000);await failed;await tick();
 ok(e.workers[0].terminated&&e.frames[0].removed,'silent worker startup times out and terminates');
 e=environment();p=e.api.analyze('tekst');await tick();e.workers[0].reply({id:1,type:'progress',phase:'loading',step:'model'});await tick();
 const loadingTimer=[...e.timers.keys()][0];e.workers[0].reply({id:1,type:'progress',phase:'loading',step:'runtime'});await tick();
 ok(e.timers.has(loadingTimer),'repeated loading progress cannot prolong the startup deadline');
 failed=assert.rejects(p,/60 sekunder/);e.fire(60000);await failed;await tick();ok(e.workers[0].terminated&&!e.timers.size,'hung model loading rejects visibly and releases resources');
 p=e.api.analyze('prøv igen');await tick();e.workers[1].reply({id:2,type:'result',result:{text:'Prøv igen.',changes:[]}});ok((await p).text==='Prøv igen.','a new request can succeed after a startup timeout');e.api.close();await tick();

 e=environment();p=e.api.analyze('tekst');await tick();e.runtime.lastPair[1].disconnect();await assert.rejects(p,/afbrudt/);ok(e.frames[0].removed,'unexpected runtime disconnection reaches the client');
 e=environment();const controller=new AbortController();p=e.api.analyze('tekst',{},null,controller.signal);await tick();controller.abort();await assert.rejects(p,{name:'AbortError'});await tick();ok(e.workers[0].terminated,'Stop terminates a model that is still loading');
 e=environment({blocked:true});p=e.api.analyze('første');await assert.rejects(e.api.analyze('anden'),/Vent/);e.api.close();await assert.rejects(p,{name:'AbortError'});ok(e.frames.length===1,'concurrent callers cannot steal a connection that is starting');

 // Sender checks use browser-supplied metadata, not origins asserted in a
 // window message. Broadcast runtime connections reach several extension pages.
 e=environment({blocked:true});p=e.api.analyze('tekst');
 const f=e.frames[0],listener=event();
 const context={URL,location:{hash:new URL(f.src).hash},chrome:{runtime:{id:'fictional',onConnect:listener}},addEventListener(){},setTimeout,clearTimeout,Worker:class{constructor(){throw Error('Unexpected worker')}}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(root+'/punctuation-frame.js','utf8'),context);
 const validName='lxp-punctuation:'+new URL(f.src).hash.slice(1);
 for(const[name,sender,label]of [
   ['lxp-punctuation:'+'0'.repeat(32),e.sender,'a different frame token'],
   [validName,{...e.sender,id:'other'},'another extension'],
   [validName,{...e.sender,url:'https://untrusted.example/'},'an unrelated site'],
   [validName,{...e.sender,tab:undefined},'a caller without a browser tab'],
   [validName,{...e.sender,frameId:1},'a nested content frame']
 ]){
   const[a,b]=ports(name,sender);let accepted=false;a.onMessage.addListener(()=>accepted=true);listener.emit(b);await tick();ok(!accepted,'native frame rejects '+label);a.disconnect();
 }
 e.api.close();await assert.rejects(p,{name:'AbortError'});
 console.log('TOTAL',checks,'native punctuation startup and failure checks (simulated browser API)');
})().catch(error=>{console.error(error);process.exit(1)});
