const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {run}=require('./helpers/workbench-vm.cjs');
const root=path.resolve(__dirname,'../extension'),hostSource=fs.readFileSync(root+'/workbench-host.js','utf8'),sandboxHTML=fs.readFileSync(root+'/workbench-sandbox.html','utf8'),sandboxSource=fs.readFileSync(root+'/workbench-sandbox.js','utf8');
let checks=0;const ok=(value,label)=>{assert.ok(value,label);checks++;};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function host({blocked=false,fetcher,live=false}={}){
  const messages=[],timers=new Map(),frames=[],posted=[],workers=[],pending=[];let timerId=0,onConnect,receive,child;
  class Channel{
    constructor(){
      const a={start(){},close(){this.closed=true;}},b={start(){},close(){this.closed=true;}};
      a.postMessage=data=>{posted.push(data);queueMicrotask(()=>!b.closed&&b.onmessage?.({data}));};
      b.postMessage=data=>queueMicrotask(()=>!a.closed&&a.onmessage?.({data}));
      this.port1=a;this.port2=b;child=a;
    }
  }
  class Worker{
    constructor(){workers.push(this);queueMicrotask(()=>this.onmessage?.({data:{type:'worker-ready',protocol:3}}));}
    postMessage(data){
      pending.push(run(data.payload,event=>{if(!this.terminated)this.onmessage?.({data:{...event,id:data.id}});},{files:data.files}).then(result=>{if(!this.terminated)this.onmessage?.({data:{...result.event,id:data.id}});}));
    }
    terminate(){this.terminated=true;}
  }
  const runtime={id:'fixture-extension',onConnect:{addListener:fn=>onConnect=fn}},parent={};
  let sandboxMessage,sandboxHide;
  const context={chrome:{runtime},location:{hash:'#'+'a'.repeat(32)},URL,Map,Number,AbortController,MessageChannel:Channel,
    fetch:fetcher||(async file=>{const bytes=fs.readFileSync(root+'/'+file);return {ok:true,text:async()=>bytes.toString(),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};}),
    setTimeout:(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id),addEventListener(){},
    document:{createElement:()=>({setAttribute(){},remove(){this.removed=true;sandboxHide?.();},contentWindow:{postMessage:(data,origin,ports)=>sandboxMessage?.({source:parent,data,ports})}}),body:{append:frame=>{
      frames.push(frame);
      if(live&&!blocked)vm.runInNewContext(sandboxSource,{parent,Worker,Blob,URL,addEventListener:(type,fn)=>{if(type==='message')sandboxMessage=fn;if(type==='pagehide')sandboxHide=fn;}});
      frame.onload();
    }}}
  };
  vm.runInNewContext(hostSource,context);
  onConnect({name:'lxp-workbench:'+'a'.repeat(32),sender:{id:runtime.id,url:'https://www.lectio.dk/lectio/999/forside.aspx',tab:{id:1},frameId:0},onMessage:{addListener:fn=>receive=fn},onDisconnect:{addListener(){}},postMessage:message=>messages.push(message)});
  const execute=(id=1,language='javascript')=>receive({id,type:'execute',payload:{language,code:language==='python'?'print("Hele vejen")':'console.log("Hele vejen")'}});
  return {messages,timers,frames,posted,pending,workers,execute,get child(){return child;}};
}
function expire(h,ms){const entry=[...h.timers.entries()].find(([,t])=>t.ms===ms);assert.ok(entry,'deadline '+ms);h.timers.delete(entry[0]);entry[1].fn();}
(async()=>{
  // Validate the real checked-in bootstrap and both independent CSP policies.
  const inline=sandboxHTML.match(/<script>([\s\S]*?)<\/script>/)[1],manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
  const hash="'sha256-"+crypto.createHash('sha256').update(inline).digest('base64')+"'";
  ok(inline===sandboxSource,'checked-in inline bootstrap matches editable source');
  ok(!/<script\s+src=/i.test(sandboxHTML),'sandbox does not need an external bootstrap script');
  ok(sandboxHTML.includes(hash)&&manifest.content_security_policy.sandbox.includes(hash),'both policies permit the exact bootstrap hash');
  ok(!manifest.content_security_policy.sandbox.includes('allow-same-origin')&&!manifest.content_security_policy.sandbox.includes('unsafe-inline'),'opaque sandbox preserved; no general inline permission');
  ok(manifest.content_security_policy.sandbox.includes('connect-src blob:')&&manifest.content_security_policy.sandbox.includes('worker-src blob:'),'network and worker restrictions preserved');
  ok(!manifest.content_security_policy.extension_pages.includes("'unsafe-eval'"),'normal extension policy stays strict');
  const ready=[];
  vm.runInNewContext(fs.readFileSync(root+'/workbench-worker.js','utf8'),{self:{postMessage:message=>ready.push(message)}});
  ok(ready.length===1&&ready[0].type==='worker-ready'&&ready[0].protocol===3,'actual worker script announces the expected protocol before receiving a program');

  let h=host({blocked:true});await h.execute();
  ok(h.messages[0].protocol===3,'host announces protocol revision');
  ok(h.posted.length===0,'program is not sent before sandbox readiness');
  expire(h,8000);ok(/LXP29-SANDBOX-READY/.test(h.messages.at(-1).message),'blocked bootstrap identifies unanswered sandbox within eight seconds');
  ok(h.frames[0].removed&&h.timers.size===0,'blocked bootstrap is cleaned up');

  h=host();await h.execute();h.child.onmessage({data:{type:'sandbox-ready',protocol:1}});
  ok(/LXP28-VERSION/.test(h.messages.at(-1).message),'mixed sandbox versions fail immediately');
  h=host();await h.execute();h.child.onmessage({data:{type:'sandbox-ready',protocol:3}});
  ok(h.posted.length===1,'ready sandbox receives one program');
  h.child.onmessage({data:{type:'sandbox-ready',protocol:3}});ok(h.posted.length===1,'duplicate readiness cannot rerun program');
  expire(h,8000);ok(/LXP28-WORKER/.test(h.messages.at(-1).message),'worker boot timeout identifies worker');

  h=host();await h.execute();h.child.onmessage({data:{type:'sandbox-ready',protocol:3}});
  const send=event=>h.child.onmessage({data:{id:1,...event}});
  send({type:'progress',phase:'loading',stage:'worker-ready'});const runtimeTimer=[...h.timers.keys()][0];
  send({type:'progress',phase:'loading',stage:'worker-ready'});send({type:'progress',phase:'loading',stage:'python'});
  ok(h.timers.has(runtimeTimer),'loading notifications cannot extend startup deadline');
  expire(h,30000);ok(/Starter Python.*LXP28-RUNTIME/.test(h.messages.at(-1).message),'runtime timeout includes last completed handshake');
  h=host({fetcher:async()=>({ok:false})});await h.execute();ok(/Mangler fil: workbench-worker.js.*LXP28-FIL/.test(h.messages.at(-1).message),'missing asset names exact file');
  h=host({fetcher:async()=>{throw Error('Read blocked');}});await h.execute();ok(/workbench-worker.js: Read blocked.*LXP28-FIL/.test(h.messages.at(-1).message),'rejected asset fetch keeps filename and original error');
  let signal;h=host({fetcher:async(_,{signal:s})=>{signal=s;return new Promise(()=>{});}});void h.execute();
  expire(h,20000);ok(signal.aborted&&/LXP28-FILER/.test(h.messages.at(-1).message),'stalled asset fetch is cancelled');

  // A failed old fetch must not tear down a newer run after retry.
  let rejectOld,first=true;
  h=host({fetcher:async()=>{if(first){first=false;return new Promise((_,reject)=>rejectOld=reject);}return {ok:true,text:async()=>''};}});
  const old=h.execute();expire(h,20000);await h.execute(2);rejectOld(Error('old fetch'));await old;
  ok(h.timers.size===1&&!h.frames.at(-1).removed,'stale fetch rejection leaves the new attempt alive');
  expire(h,8000);

  for(const language of ['javascript','python']){
    h=host({live:true});await h.execute(1,language);await tick();await Promise.all(h.pending);await tick();
    ok(h.messages.at(-1).type==='result'&&h.messages.at(-1).result.text==='Hele vejen\n',language+' passes actual host, sandbox handshake and worker code in VM');
    ok(h.messages.some(m=>m.phase==='output'&&m.text==='Hele vejen\n'),language+' forwards live output');
    ok(h.frames[0].removed&&h.workers[0].terminated&&h.timers.size===0,language+' tears down after completion');
  }
  const compile=await run({language:'python',code:'print(1)'},()=>{},{setup:context=>vm.runInContext('WebAssembly.compile=async()=>{throw new Error("WASM blokeret i prøven")}',context)});
  ok(compile.event.type==='error'&&/LXP28-RUNTIME.*WASM blokeret/.test(compile.event.message),'blocked WASM gives an immediate startup error');
  const link=await run({language:'python',code:'print(1)'},()=>{},{setup:context=>vm.runInContext('WebAssembly.instantiateStreaming=async()=>{throw new Error("WASM-linkfejl i prøven")}',context)});
  ok(link.event.type==='error'&&/LXP28-RUNTIME.*WASM-linkfejl/.test(link.event.message),'loader cannot swallow WASM instantiation error and hang');
  console.log('TOTAL',checks,'Test 28 bootstrap hash, staged failure and VM transport checks; not live Chrome/Edge');
})().catch(error=>{console.error(error);process.exit(1);});
