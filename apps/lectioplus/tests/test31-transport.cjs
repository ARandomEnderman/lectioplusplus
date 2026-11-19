const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../extension');let checks=0;const ok=(v,label)=>{assert.ok(v,label);checks++;},tick=()=>new Promise(resolve=>setImmediate(resolve));
function clock(){let now=0,serial=0;const timers=new Map();return {timers,advance:ms=>now+=ms,Date:{now:()=>now},setTimeout:(fn,ms)=>{timers.set(++serial,{fn,ms});return serial;},clearTimeout:id=>timers.delete(id)};}
function client(){
  const time=clock(),requests=[],frames=[];
  class Channel{constructor(){const a={start(){},close(){this.closed=true;}},b={start(){},close(){this.closed=true;}};a.postMessage=data=>queueMicrotask(()=>!b.closed&&b.onmessage?.({data}));b.postMessage=data=>queueMicrotask(()=>!a.closed&&a.onmessage?.({data}));this.port1=a;this.port2=b;}}
  const document={currentScript:null,documentElement:{append(f){frames.push(f);f.load();}},createElement:()=>({setAttribute(){},addEventListener(type,fn){if(type==='load')this.load=fn;},remove(){this.removed=true;},contentWindow:{postMessage(_data,_origin,ports){const port=ports[0];port.onmessage=({data})=>requests.push({data,port});port.postMessage({type:'ready',protocol:3});}}})};
  const context={...time,document,location:{protocol:'http:',href:'http://localhost/preview/'},URL,MessageChannel:Channel,DOMException,AbortController,addEventListener(){}};
  vm.runInNewContext(fs.readFileSync(root+'/workbench-client.js','utf8'),context);
  return {...time,requests,frames,api:context.lectioPlusWorkbenchClient};
}
function host(){
  const time=clock(),messages=[],posted=[];let connect,receive,disconnect,channel,frame;
  class Channel{constructor(){channel=this.port1={start(){},close(){this.closed=true;},postMessage:data=>posted.push(data)};this.port2={};}}
  const runtime={id:'fixture-extension',onConnect:{addListener:fn=>connect=fn}};
  const context={...time,chrome:{runtime},location:{hash:'#'+'a'.repeat(32)},URL,Map,Number,AbortController,MessageChannel:Channel,addEventListener(){},fetch:async()=>({ok:true,text:async()=>'',arrayBuffer:async()=>new ArrayBuffer(0)}),document:{createElement:()=>frame={setAttribute(){},remove(){this.removed=true;},contentWindow:{postMessage(){}}},body:{append:f=>f.onload()}}};
  vm.runInNewContext(fs.readFileSync(root+'/workbench-host.js','utf8'),context);
  connect({name:'lxp-workbench:'+'a'.repeat(32),sender:{id:runtime.id,url:'https://www.lectio.dk/lectio/999/forside.aspx',tab:{id:1},frameId:0},onMessage:{addListener:fn=>receive=fn},onDisconnect:{addListener:fn=>disconnect=fn},postMessage:m=>messages.push(m)});
  return {...time,messages,posted,receive,disconnect,get channel(){return channel;},get frame(){return frame;}};
}
(async()=>{
  let t=client(),inputs=[],p=t.api.execute({language:'python',interactiveInput:true,code:'input()'},event=>{if(event.phase==='input')inputs.push(event);});
  await tick();let request=t.requests[0];const send=event=>request.port.postMessage({id:request.data.id,type:'progress',...event});
  send({phase:'working'});await tick();t.advance(2000);send({phase:'input',requestId:1});await tick();
  ok(inputs.length===1&&t.timers.size===0,'client stops execution deadline while waiting for a person');
  t.advance(120000);send({phase:'input',requestId:1});await tick();ok(inputs.length===1,'duplicate input cannot open another prompt');
  ok(inputs[0].respond('x'.repeat(4097))===false&&inputs[0].respond('a\nb')===false,'oversized/multiline responses rejected');
  ok(inputs[0].respond('')===true,'empty line is accepted');await tick();
  ok(t.requests.at(-1).data.type==='stdin'&&t.requests.at(-1).data.value==='','response travels over existing private port');
  ok([...t.timers.values()][0].ms===13000,'two-minute input wait does not consume client run budget');
  ok(inputs[0].respond('duplicate')===false,'client can only answer each request once');
  t.advance(3000);send({phase:'working'});send({phase:'input',requestId:2});await tick();
  ok(inputs.length===2&&t.timers.size===0,'second input pauses the same execution');inputs[1].respond('æøå');await tick();
  ok([...t.timers.values()][0].ms===10000,'run budget is cumulative across answers');
  request.port.postMessage({id:request.data.id,type:'result',result:{text:'done'}});await p;
  ok(inputs[1].respond('late')===false&&t.timers.size===0,'finished run rejects late input');t.api.close();
  t=client();let pending;
  const controller=new AbortController();p=t.api.execute({language:'python',interactiveInput:true,code:'input()'},event=>{if(event.phase==='input')pending=event;},controller.signal);
  const stopped=assert.rejects(p,{name:'AbortError'});await tick();request=t.requests[0];request.port.postMessage({id:request.data.id,type:'progress',phase:'working'});request.port.postMessage({id:request.data.id,type:'progress',phase:'input',requestId:1});await tick();controller.abort();await stopped;
  ok(pending.respond('late')===false&&t.frames[0].removed&&t.timers.size===0,'Stop while waiting closes client and rejects old answer');

  const h=host();await h.receive({type:'execute',id:1,payload:{language:'python',interactiveInput:true,code:'input()'}});
  h.channel.onmessage({data:{type:'sandbox-ready',protocol:3}});
  const worker=event=>h.channel.onmessage({data:{id:1,type:'progress',...event}});
  worker({phase:'loading',stage:'worker-ready'});worker({phase:'working'});h.advance(2500);worker({phase:'input',requestId:1});
  ok(h.timers.size===0&&h.messages.at(-1).phase==='input','host pauses its independent deadline');h.advance(120000);
  const posted=h.posted.length;
  for(const message of [{id:2,requestId:1,value:'wrong run'},{id:1,requestId:0,value:'old request'},{id:1,requestId:1,value:'a\nb'},{id:1,requestId:1,value:'x'.repeat(4097)}])await h.receive({type:'stdin',...message});
  ok(h.posted.length===posted&&h.timers.size===0,'host rejects invalid/stale input without resuming');
  await h.receive({type:'stdin',id:1,requestId:1,value:'Svar'});
  ok(h.posted.at(-1).type==='stdin'&&h.posted.at(-1).value==='Svar','host sends answer only to the active sandbox');
  ok([...h.timers.values()][0].ms===7500,'host excludes time spent waiting');
  await h.receive({type:'stdin',id:1,requestId:1,value:'duplicate'});ok(h.posted.length===posted+1,'duplicate response ignored');
  h.advance(1000);worker({phase:'input',requestId:2});await h.receive({type:'stdin',id:1,requestId:2,value:''});
  ok([...h.timers.values()][0].ms===6500,'host does not grant a fresh ten seconds per answer');
  worker({phase:'input',requestId:3});h.disconnect();await h.receive({type:'stdin',id:1,requestId:3,value:'late'});
  ok(h.frame.removed&&h.channel.closed&&h.timers.size===0,'disconnect while waiting destroys sandbox and timer');
  let receiver,process;const sent=[],parent={};
  class Worker{constructor(){process=this;}postMessage(data){sent.push(data);}}
  vm.runInNewContext(fs.readFileSync(root+'/workbench-sandbox.js','utf8'),{parent,Worker,Blob,URL:{createObjectURL:()=> 'blob:null/fixture'},addEventListener:(type,fn)=>{if(type==='message')receiver=fn;}});
  const port={start(){},postMessage(){}};receiver({source:parent,data:{type:'lxp-workbench-sandbox'},ports:[port]});
  port.onmessage({data:{id:8,payload:{},files:{worker:''}}});process.onmessage({data:{type:'worker-ready',protocol:3}});
  port.onmessage({data:{id:9,type:'stdin',requestId:1,value:'other run'}});port.onmessage({data:{id:8,type:'stdin',requestId:1,value:'two\nlines'}});
  ok(sent.length===1,'sandbox ignores wrong run and multiline replies');
  port.onmessage({data:{id:8,type:'stdin',requestId:1,value:'æøå'}});
  ok(sent.length===2&&sent[1].type==='stdin'&&sent[1].value==='æøå','actual sandbox forwards input to its existing worker');
  console.log('TOTAL',checks,'Test 31 input transport, stale reply and paused deadline checks (simulated browser)');
})().catch(error=>{console.error(error);process.exit(1);});
