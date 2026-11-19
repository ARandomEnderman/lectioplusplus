// Node VM harness for the actual worker and bundled runtime's browser branch.
// This is not a browser: CSP, extension installation and visual layout are not
// simulated. In particular, do not replace this with the Node Pyodide loader:
// that would miss URLs fetched only by the browser bootstrap.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../../extension');
const source=fs.readFileSync(root+'/workbench-worker.js','utf8');
const files={};
for(const [key,file,binary]of [['py','pyodide.mjs'],['asm','pyodide.asm.mjs'],['wasm','pyodide.asm.wasm',true],['stdlib','python_stdlib.zip',true],['lock','pyodide-lock.json']])files[key]=fs.readFileSync(root+'/vendor/workbench/pyodide/'+file,binary?undefined:'utf8');
files.sql=fs.readFileSync(root+'/vendor/workbench/sql.js/dist/sql-wasm.js','utf8');
files.sqlWasm=fs.readFileSync(root+'/vendor/workbench/sql.js/dist/sql-wasm.wasm');

async function run(payload,onProgress=()=>{},options={}){
  const blobs=new Map(),events=[],requests=[],warnings=[],timers=new Set();let next=0,deadline;
  class LocalURL extends URL{
    static createObjectURL(blob){const url='blob:null/local-'+(++next);blobs.set(url,blob);return url;}
    static revokeObjectURL(url){blobs.delete(url);}
  }
  let resolve,reject;const completed=new Promise((yes,no)=>{resolve=yes;reject=no;});
  const globals={URL:LocalURL,Blob,Response,Request,Headers,TextEncoder,TextDecoder,performance,crypto:require('node:crypto').webcrypto,
    console:{log(){},warn:(...args)=>warnings.push(args.join(' ')),error:(...args)=>warnings.push(args.join(' '))},
    setTimeout:(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);return id;},clearTimeout:id=>{timers.delete(id);clearTimeout(id);},
    location:new URL('https://fixture.invalid/sandbox'),
    fetch:async input=>{const url=String(input);requests.push(url);if(!blobs.has(url))throw Error('Unexpected network request: '+url);return new Response(blobs.get(url));},
    postMessage:event=>{if(event.type==='worker-ready')return;events.push(event);if(event.type==='progress')onProgress(event,value=>context.self.onmessage({data:{id:event.id,type:'stdin',requestId:event.requestId,value}}));else if(event.type==='result'||event.type==='error')resolve(event);}
  };
  const context=vm.createContext(globals);
  vm.runInContext('class WorkerGlobalScope {}; globalThis.WorkerGlobalScope=WorkerGlobalScope; Object.setPrototypeOf(globalThis,WorkerGlobalScope.prototype); globalThis.self=globalThis;',context);
  async function moduleFor(url){
    const blob=blobs.get(url);if(!blob)throw Error('Unknown import '+url);
    const module=new vm.SourceTextModule(await blob.text(),{context,identifier:url,initializeImportMeta:meta=>meta.url=url,importModuleDynamically:moduleFor});
    await module.link(moduleFor);await module.evaluate();return module;
  }
  if(options.setup)options.setup(context);
  new vm.Script(source,{filename:'workbench-worker.js',importModuleDynamically:moduleFor}).runInContext(context);
  try{
    deadline=setTimeout(()=>reject(Error('Worker bootstrap exceeded 15 seconds. '+warnings.join('; '))),15000);
    Promise.resolve(context.self.onmessage({data:{id:1,payload,files:options.files||files}})).catch(reject);
    const result=await completed;
    return {event:JSON.parse(JSON.stringify(result)),events:JSON.parse(JSON.stringify(events)),requests,warnings};
  }finally{clearTimeout(deadline);for(const timer of timers)clearTimeout(timer);}
}
module.exports={run};
