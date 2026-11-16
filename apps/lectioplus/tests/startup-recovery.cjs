const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const extension=process.env.LXP_TEST_EXTENSION||path.resolve(__dirname,'../extension');
const manifest=JSON.parse(fs.readFileSync(extension+'/manifest.json','utf8'));
const pause=()=>new Promise(resolve=>setTimeout(resolve,50));
let checks=0;
const ok=(value,message)=>{assert.ok(value,message);checks++;console.log('PASS',message)};
// Fictitious contents, with Lectio's public container/form hierarchy. No saved account HTML.
const fixture=`<!doctype html><html lang="da"><head><title>Lectio Forside</title></head><body class="masterbody"><div id="masterContent" class="ls-master-container1"><form id="aspnetForm" class="ls-master-container2"><nav><a href="/lectio/999999/forside.aspx">Forside</a><a href="/lectio/999999/SkemaNy.aspx?elevid=fake">Skema</a></nav><div id="m_outerContentFrameDiv"><section data-front-panel><h2>Dagens skema</h2><ul><li><time>08:15–09:45</time><a href="/lectio/999999/aktivitet.aspx?absid=fake">Fiktivt fag</a></li></ul></section><input name="native-input" value="bevar mig"></div></form></div></body></html>`;
async function environment({preferences={},delay=false,renderFailure=false}={}){
 const errors=[],listeners=[],vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));
 const dom=new JSDOM(fixture,{url:'https://www.lectio.dk/lectio/999999/forside.aspx',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window,d=w.document;w.structuredClone=structuredClone;w.matchMedia=()=>({matches:false,addEventListener(){}});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLCanvasElement.prototype.getContext=()=>null;
 let resolvePreferences;
 w.chrome={runtime:{getURL:name=>'chrome-extension://fixture/'+name},storage:{local:{get:()=>delay?new Promise(resolve=>resolvePreferences=resolve):Promise.resolve(preferences),set:async()=>{}},onChanged:{addListener:fn=>listeners.push(fn)}}};
 w.fetch=async()=>{throw new Error('Fixture has no network')};
 const load=name=>w.eval(fs.readFileSync(extension+'/'+name,'utf8'));
 // Exercise the actual manifest load order, including document_start and native theme.
 for(const entry of manifest.content_scripts){
  if(entry.js.includes('school-picker.js'))continue;
  for(const name of entry.js){
   if(name==='content.js'&&renderFailure){const factory=w.lectioPlusWorkspace;w.lectioPlusWorkspace=options=>{const workspace=factory(options),update=workspace.update;let first=true;workspace.update=(...args)=>{if(first){first=false;throw Error('One-time fixture render error')}return update(...args)};return workspace};}
   load(name);
  }
 }
 await pause();
 return {w,d,errors,listeners,dom,resolve:values=>resolvePreferences(values),async close(){await pause();w.dispatchEvent(new w.Event('pagehide'));dom.window.close()}};
}
const clearPresentation=d=>{d.body.className='masterbody host-ready';for(const attribute of [...d.documentElement.attributes])if(attribute.name.startsWith('data-lxp-'))d.documentElement.removeAttribute(attribute.name)};
const modern=d=>d.body.classList.contains('lxp-enabled')&&d.body.classList.contains('lxp-native-hidden')&&!d.getElementById('lxp-root').hidden&&!d.getElementById('lxp-overview').hidden;
(async()=>{
 const e=await environment();ok(modern(e.d)&&e.d.documentElement.dataset.lxpDesign==='strafe','fresh real-route startup reaches the themed overview');
 clearPresentation(e.d);await pause();
 ok(modern(e.d),'cleared body classes recover without leaving Lectio behind the sidebar');
 ok(e.d.documentElement.dataset.lxpMode==='dark'&&e.d.documentElement.dataset.lxpDesign==='strafe','cleared HTML attributes regain the selected theme');
 ok(e.d.documentElement.hasAttribute('data-lxp-native-theme'),'native controls regain theme protection as well');
 ok(e.d.body.classList.contains('host-ready')&&e.d.body.classList.contains('masterbody'),'recovery preserves the host page classes');
 ok(e.d.querySelector('[name=native-input]').value==='bevar mig'&&e.d.querySelectorAll('#aspnetForm').length===1,'recovery preserves original form and entered values');
 ok(e.d.querySelectorAll('#lxp-root').length===1,'recovery does not create duplicate navigation');
 e.d.querySelector('[data-lxp-original]').click();await pause();clearPresentation(e.d);await pause();
 ok(e.d.body.classList.contains('lxp-enabled')&&!e.d.body.classList.contains('lxp-native-hidden')&&e.d.getElementById('lxp-overview').hidden,'intentional original-tools mode survives presentation recovery');
 for(const listener of e.listeners)listener({theme:{newValue:'light'},design:{newValue:'ocean'}},'local');await pause();clearPresentation(e.d);await pause();
 ok(e.d.documentElement.dataset.lxpMode==='light'&&e.d.documentElement.dataset.lxpDesign==='ocean','recovery uses current saved theme rather than defaults');
 for(const listener of e.listeners)listener({enabled:{newValue:false}},'local');await pause();e.d.body.className='masterbody';await pause();
 ok(!e.d.body.classList.contains('lxp-enabled')&&!e.d.documentElement.hasAttribute('data-lxp-mode')&&e.d.getElementById('lxp-root').hidden,'disabled extension remains disabled after host updates');
 for(const listener of e.listeners)listener({enabled:{newValue:true}},'local');await pause();
 ok(e.d.body.classList.contains('lxp-enabled')&&e.d.documentElement.dataset.lxpDesign==='ocean','re-enabling restores current preferences');
 let mutations=0;const observer=new e.w.MutationObserver(records=>mutations+=records.length);observer.observe(e.d.documentElement,{attributes:true});
 const A=e.w.lectioPlusAppearance;A.apply(e.d.documentElement,A.normalize({theme:'light',design:'ocean'}),false,true);await pause();mutations=0;A.apply(e.d.documentElement,A.normalize({theme:'light',design:'ocean'}),false,true);await pause();
 ok(mutations===0,'applying unchanged appearance does not cause a mutation loop');observer.disconnect();ok(!e.errors.length,'startup and presentation repairs have no runtime errors');await e.close();
 const slow=await environment({delay:true});ok(slow.d.getElementById('lxp-root').hidden,'pending initial preferences do not expose an incomplete shell');slow.resolve({theme:'light',design:'forest'});await pause();ok(modern(slow.d)&&slow.d.documentElement.dataset.lxpDesign==='forest','late preferences finish the actual startup sequence');await slow.close();
 const failure=await environment({renderFailure:true});failure.d.getElementById('masterContent').append(failure.d.createElement('span'));await pause();await pause();
 ok(modern(failure.d)&&failure.d.documentElement.dataset.lxpMode==='dark','successful retry restores both theme and layout after a render failure');ok(!failure.errors.length,'recoverable render failure does not escape startup');await failure.close();
 console.log('TOTAL',checks,'fresh startup and presentation recovery checks');
})().catch(error=>{console.error(error);process.exit(1)});
