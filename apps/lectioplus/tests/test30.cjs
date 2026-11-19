const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {run}=require('./helpers/workbench-vm.cjs');
const root=path.resolve(__dirname,'../extension'),sandbox=fs.readFileSync(root+'/workbench-sandbox.js','utf8'),source=fs.readFileSync(root+'/workbench-worker.js','utf8');
let checks=0;const ok=(value,label)=>{assert.ok(value,label);checks++;};

// Model Chromium's reported opaque-origin module-worker failure: construction
// succeeds, followed by an asynchronous error with no message. Classic startup
// parses and executes the real entry as a script. Runtime work then uses the
// existing VM helper with real bundled WASM/modules. This is NOT browser/CSP QA.
async function sandboxRun(payload){
  const messages=[],workers=[],blobs=new Map(),revoked=[];let listen,hide,workerSource,finish;
  const done=new Promise(resolve=>finish=resolve);
  class LocalURL{
    static createObjectURL(blob){const url='blob:null/fixture';blobs.set(url,blob);return url;}
    static revokeObjectURL(url){revoked.push(url);blobs.delete(url);}
  }
  class Worker{
    constructor(url,options){
      this.options=options;workers.push(this);
      this.boot=Promise.resolve().then(async()=>{
        if(options?.type==='module'){this.onerror({preventDefault(){}});return;}
        try{
          workerSource=await blobs.get(url).text();
          const self={postMessage:data=>this.onmessage({data})};
          new vm.Script(workerSource,{filename:'classic-workbench-worker.js'}).runInNewContext({self});
        }catch(error){this.onerror({message:error.message,preventDefault(){}});}
      });
    }
    postMessage(data){
      this.payload=data;
      this.task=run(data.payload,event=>this.onmessage({data:{...event,id:data.id}})).then(result=>this.onmessage({data:{...result.event,id:data.id}}));
    }
    terminate(){this.terminated=true;}
  }
  const parent={},port={start(){},postMessage:message=>{messages.push(message);if(message.type==='result'||message.type==='error')finish(message);}};
  vm.runInNewContext(sandbox,{parent,Worker,URL:LocalURL,Blob,addEventListener:(type,fn)=>{if(type==='message')listen=fn;if(type==='pagehide')hide=fn;}});
  listen({source:parent,data:{type:'lxp-workbench-sandbox'},ports:[port]});
  port.onmessage({data:{id:7,payload,files:{worker:source}}});
  await workers[0].boot;await workers[0].task;
  const result=await done;hide();
  return {result,messages,workers,workerSource,revoked};
}

(async()=>{
  let r=await sandboxRun({language:'python',code:'print("Hej æøå", end="")'});
  ok(r.result.type==='result'&&r.result.result.text==='Hej æøå','Python runs when opaque-origin module workers fail');
  ok(r.workers.length===1&&r.workers[0].options.type==='classic','one classic worker is used; no failed module retry');
  ok(r.workerSource===source,'worker blob contains the actual entry, with no module wrapper');
  ok(r.messages.some(m=>m.phase==='loading'&&m.stage==='worker-ready'),'actual classic entry sends its ready message before execution');
  ok(r.messages.some(m=>m.phase==='output'&&m.text==='Hej æøå'),'Python output survives sandbox relay');
  ok(r.messages.filter(m=>m.id!==undefined).every(m=>m.id===7),'relay keeps the request identifier');
  ok(r.workers[0].terminated&&r.revoked.length===1,'worker and blob cleaned up on pagehide');

  r=await sandboxRun({language:'javascript',code:'console.log(2+3)'});
  ok(r.result.type==='result'&&r.result.result.text==='5\n','JavaScript works through classic startup');
  r=await sandboxRun({language:'sql',code:'SELECT 2+3 AS svar;'});
  ok(r.result.type==='result'&&r.result.result.tables[0].values[0][0]===5,'SQLite works through classic startup');
  r=await sandboxRun({language:'regex',code:'[0-9]+',stdin:'a12b34'});
  ok(r.result.type==='result'&&r.result.result.matches.map(m=>m.text).join(',')==='12,34','regex works through classic startup');

  const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
  ok(!manifest.content_security_policy.sandbox.includes('allow-same-origin'),'opaque origin is preserved');
  ok(manifest.content_security_policy.sandbox.includes('worker-src blob:;')&&manifest.content_security_policy.sandbox.includes('connect-src blob:;'),'worker/network sources are not broadened');
  ok(!manifest.content_security_policy.extension_pages.includes("'unsafe-eval'"),'ordinary extension pages remain restricted');
  console.log('TOTAL',checks,'Test 30 classic-worker compatibility and real runtime checks (Node VM, not live Chrome/Edge)');
})().catch(error=>{console.error(error);process.exit(1);});
