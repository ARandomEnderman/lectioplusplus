const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'../extension');let checks=0;const tick=()=>new Promise(r=>setImmediate(r));
function transport({ready=true,protocol='http:',version=3}={}){const timers=new Map(),frames=[],requests=[];let id=0;
 class Channel{constructor(){const a={start(){},close(){this.closed=true;}},b={start(){},close(){this.closed=true;}};a.postMessage=data=>queueMicrotask(()=>!b.closed&&b.onmessage?.({data}));b.postMessage=data=>queueMicrotask(()=>!a.closed&&a.onmessage?.({data}));this.port1=a;this.port2=b;}}
 const document={currentScript:null,documentElement:{append(f){frames.push(f);f.load();}},createElement(){return {setAttribute(){},addEventListener(t,fn){if(t==='load')this.load=fn;},remove(){this.removed=true;},contentWindow:{postMessage(data,origin,ports){const port=ports[0];port.onmessage=({data})=>requests.push({data,port});if(ready)port.postMessage({type:'ready',protocol:version});}}};}};
 const context={document,location:{protocol,href:protocol==='file:'?'file:///demo/SE_TESTEN.html':'http://localhost/preview/index.html'},URL,MessageChannel:Channel,DOMException,AbortController,setTimeout:(fn,ms)=>{timers.set(++id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id),addEventListener(){}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(root+'/workbench-client.js','utf8'),context);return {api:context.lectioPlusWorkbenchClient,timers,frames,requests};}
(async()=>{
 const payload={language:'python',code:'print(2+3)'};let t=transport(),p=t.api.execute(payload);await tick();let r=t.requests[0];r.port.postMessage({id:r.data.id+1,type:'result',result:{text:'wrong'}});r.port.postMessage({id:r.data.id,type:'result',result:{text:'5'}});assert.equal((await p).text,'5');checks++;
 t.api.close();assert.equal(t.frames[0].removed,true);assert.equal(t.timers.size,0);checks+=2;
 for(const ready of [true,false]){t=transport({ready});const controller=new AbortController();p=t.api.execute(payload,null,controller.signal);const failure=assert.rejects(p,{name:'AbortError'});await tick();controller.abort();await failure;assert.equal(t.frames[0].removed,true);assert.equal(t.timers.size,0);checks+=3;}
 t=transport({ready:false});p=t.api.execute(payload);const rejected=assert.rejects(p,/kunne ikke åbnes/);[...t.timers.values()][0].fn();await rejected;checks++;
 t=transport();p=t.api.execute(payload);let failure=assert.rejects(p,/tidsgrænsen/);await tick();r=t.requests[0];r.port.postMessage({id:r.data.id,type:'progress',phase:'working'});await tick();[...t.timers.values()].find(x=>x.ms===15000).fn();await failure;assert.ok(t.frames[0].removed);checks+=2;
 t=transport();p=t.api.execute(payload);failure=assert.rejects(p,{name:'AbortError'});await assert.rejects(t.api.execute(payload),/igangværende/);t.api.close();await failure;checks++;
 t=transport({protocol:'file:'});await assert.rejects(t.api.execute(payload),/installerede udvidelse/);assert.equal(t.frames.length,0);checks+=2;
 t=transport({version:1});await assert.rejects(t.api.execute(payload),/LXP28-VERSION/);assert.ok(t.frames[0].removed);checks+=2;
 t=transport();p=t.api.execute(payload);failure=assert.rejects(p,/Sidste trin: Starter Python.*LXP28-TIMEOUT/);await tick();r=t.requests[0];r.port.postMessage({id:r.data.id,type:'progress',phase:'loading',stage:'python',message:'Starter Python'});await tick();[...t.timers.values()].find(x=>x.ms===60000).fn();await failure;checks++;
 // Validate installed broker's browser-supplied sender checks, without a browser.
 let onConnect;const url='https://www.lectio.dk/lectio/999/forside.aspx',token='a'.repeat(32),runtime={id:'local-test',onConnect:{addListener:f=>onConnect=f}};
 const context={chrome:{runtime},location:{hash:'#'+token},URL,Map,Number,document:{},addEventListener(){},clearTimeout(){}};vm.createContext(context);vm.runInContext(fs.readFileSync(root+'/workbench-host.js','utf8'),context);
 const accepted=sender=>{let count=0;onConnect({name:'lxp-workbench:'+token,sender,onMessage:{addListener(){count++;}},onDisconnect:{addListener(){}},postMessage(){}});return count;};
 for(const sender of [{id:'other',url,frameId:0,tab:{id:1}},{id:'local-test',url:'https://example.org/',frameId:0,tab:{id:1}},{id:'local-test',url,frameId:1,tab:{id:1}},{id:'local-test',url,frameId:0}]){assert.equal(accepted(sender),0);checks++;}
 assert.equal(accepted({id:'local-test',url,frameId:0,tab:{id:1}}),1);checks++;
 const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json'));assert.deepEqual(manifest.sandbox.pages,['workbench-sandbox.html']);assert.ok(!manifest.content_security_policy.sandbox.includes('allow-same-origin'));assert.ok(manifest.content_security_policy.sandbox.includes('connect-src blob:'));assert.ok(!manifest.content_security_policy.extension_pages.includes("'unsafe-eval'"));checks+=4;
 const provenance=JSON.parse(fs.readFileSync(root+'/vendor/workbench/PROVENANCE.json'));const crypto=require('crypto');for(const [f,hash]of Object.entries(provenance.sha256)){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(root+'/vendor/workbench/'+f)).digest('hex'),hash,f);checks++;}
 console.log('TOTAL',checks,'workbench transport, isolation and asset checks');
})().catch(e=>{console.error(e);process.exit(1)});
