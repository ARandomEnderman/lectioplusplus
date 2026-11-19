const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../extension'),source=fs.readFileSync(root+'/workbench-host.js','utf8');
const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
let checks=0;const ok=(value,label)=>{assert.ok(value,label);checks++;};

// Packaging/access contract: both embedded documents are available to Lectio.
// This validates the manifest, not Chromium's runtime navigation enforcement.
for(const resource of ['workbench-host.html','workbench-sandbox.html']){
  const rules=manifest.web_accessible_resources.filter(rule=>rule.resources.includes(resource));
  ok(rules.length===1,resource+' has exactly one explicit access rule');
  ok(JSON.stringify([...rules[0].matches].sort())===JSON.stringify(['https://lectio.dk/*','https://www.lectio.dk/*']),resource+' is exposed only to the two Lectio origins');
  ok(!rules[0].extension_ids,'no other extensions are given access');
  ok(fs.existsSync(root+'/'+resource),resource+' is present in the installable package');
}
ok(manifest.web_accessible_resources.every(rule=>rule.resources.every(resource=>!resource.includes('*')&&!/\.js$|\.mjs$|vendor\//.test(resource))),'worker, bootstrap and vendor scripts remain private');
ok(manifest.sandbox.pages.includes('workbench-sandbox.html')&&!manifest.content_security_policy.sandbox.includes('allow-same-origin'),'manifest sandbox isolation is retained');

function host({missing=false}={}){
  const messages=[],frames=[],timers=new Map(),requests=[],channels=[];let connect,receive,serial=0;
  class Channel{
    constructor(){this.port1={start(){},close(){this.closed=true;},postMessage(){}};this.port2={};channels.push(this);}
  }
  const runtime={id:'fixture-extension',getURL:file=>'chrome-extension://fixture-extension/'+file,onConnect:{addListener:fn=>connect=fn}};
  vm.runInNewContext(source,{
    chrome:{runtime},location:{hash:'#'+'a'.repeat(32)},URL,Map,Number,AbortController,MessageChannel:Channel,
    fetch:async(file,{signal})=>{requests.push({file,signal});return {ok:!(missing&&file==='workbench-sandbox.html'),text:async()=>fs.readFileSync(root+'/'+file,'utf8')};},
    setTimeout:(fn,ms)=>{timers.set(++serial,{fn,ms});return serial;},clearTimeout:id=>timers.delete(id),addEventListener(){},
    document:{createElement:()=>({attributes:{},setAttribute(name,value){this.attributes[name]=value;},remove(){this.removed=true;},contentWindow:{postMessage(){}}}),body:{append:frame=>frames.push(frame)}}
  });
  connect({name:'lxp-workbench:'+'a'.repeat(32),sender:{id:runtime.id,url:'https://www.lectio.dk/lectio/999/forside.aspx',tab:{id:1},frameId:0},onMessage:{addListener:fn=>receive=fn},onDisconnect:{addListener(){}},postMessage:message=>messages.push(message)});
  const execute=id=>receive({id,type:'execute',payload:{language:'javascript',code:'console.log(2+3)'}});
  const expire=()=>{const [id,timer]=[...timers][0];timers.delete(id);timer.fn();};
  return {messages,frames,timers,requests,channels,execute,expire};
}

(async()=>{
  let h=host({missing:true});await h.execute(1);
  ok(/workbench-sandbox\.html.*LXP28-FIL/.test(h.messages.at(-1).message)&&h.frames.length===0,'missing HTML reports its filename before navigation');
  h=host();await h.execute(1);
  ok(h.requests.some(r=>r.file==='workbench-sandbox.html'),'HTML is checked before the frame is opened');
  ok(h.frames[0].src==='chrome-extension://fixture-extension/workbench-sandbox.html','installed host uses the exact extension URL');
  ok(h.frames[0].attributes.sandbox==='allow-scripts','iframe still has an opaque origin');
  h.expire();
  ok(/LXP29-SANDBOX-LOAD/.test(h.messages.at(-1).message),'missing load event identifies navigation stage');
  ok(h.frames[0].removed&&h.timers.size===0,'navigation timeout removes frame and deadline');
  await h.execute(2);h.frames[0].onload();
  ok(h.channels.length===0,'late load event from timed-out frame cannot start a channel');
  h.frames[1].onload();const deadline=[...h.timers.keys()][0];h.frames[1].onload();
  ok(h.channels.length===1&&h.timers.has(deadline),'duplicate load event cannot reset deadline or transfer a second channel');
  h.expire();
  ok(/LXP29-SANDBOX-READY/.test(h.messages.at(-1).message),'loaded error document or silent bootstrap identifies missing reply');
  ok(h.frames[1].removed&&h.channels[0].port1.closed,'unanswered channel is closed on timeout');
  h=host();await h.execute(1);h.frames[0].onerror();
  ok(/manifest\.json.*LXP29-SANDBOX-LOAD/.test(h.messages.at(-1).message),'navigation error explains manifest reload');
  h=host();await h.execute(1);h.frames[0].onload();
  h.channels[0].port1.onmessage({data:{type:'sandbox-ready',protocol:3}});
  ok(h.messages.at(-1).stage==='worker','actual ready response advances beyond sandbox');
  h.expire();ok(/LXP28-WORKER/.test(h.messages.at(-1).message),'worker still has its own startup deadline');
  console.log('TOTAL',checks,'Test 29 manifest and sandbox navigation checks; not live Chrome/Edge');
})().catch(error=>{console.error(error);process.exit(1);});
