const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM,VirtualConsole}=require('jsdom');
const app=require('node:path').resolve(__dirname,'..'),read=name=>fs.readFileSync(app+'/extension/'+name+'.js','utf8');
let checks=0;const ok=(x,s)=>{assert.ok(x,s);checks++;console.log('PASS',s)},pause=(ms=30)=>new Promise(r=>setTimeout(r,ms));
async function env(path='/lectio/999999/SkemaNy.aspx',html='<body><div id="original">Original</div></body>',prefs={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/CSS stylesheet/.test(e.message))errors.push(e.message)});
 const dom=new JSDOM(html,{url:'https://www.lectio.dk'+path,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document;
 await pause(0);let state='loading',reads=0;Object.defineProperty(d,'readyState',{get:()=>state,configurable:true});
 w.structuredClone=structuredClone;w.matchMedia=()=>({matches:false,addEventListener(){}});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLCanvasElement.prototype.getContext=()=>null;
 w.chrome={storage:{local:{get:()=>{reads++;return typeof prefs==='function'?prefs():Promise.resolve(prefs)},set:async()=>{}},onChanged:{addListener(){}}}};
 let now=0,id=0;const timers=new Map(),frames=new Map();w.setTimeout=(fn,delay)=>{const key=++id;timers.set(key,{fn,at:now+delay});return key};w.clearTimeout=key=>timers.delete(key);
 w.requestAnimationFrame=fn=>{const key=++id;frames.set(key,fn);return key};w.cancelAnimationFrame=key=>frames.delete(key);
 function tick(ms){const end=now+ms;for(;;){const next=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].fn()}now=end;}
 function paint(){const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now))}
 const load=name=>w.eval(read(name));load('appearance');
 return {dom,w,d,load,tick,paint,errors,frames,timers,reads:()=>reads,ready(){state='interactive';d.dispatchEvent(new w.Event('DOMContentLoaded'))}};
}
(async()=>{
 const early=await env();const htmlRoot=early.d.documentElement;htmlRoot.remove();early.load('boot');early.d.append(htmlRoot);await pause(0);ok(early.d.documentElement.classList.contains('lxp-starting')&&early.w.lectioPlusBoot,'boot also guards a document whose html element is created after injection');early.w.lectioPlusBoot.finish();early.dom.window.close();
 const slow=await env();slow.load('boot');await pause(0);
 ok(slow.d.documentElement.classList.contains('lxp-starting'),'first paint is guarded');slow.tick(1500);
 ok(slow.d.documentElement.classList.contains('lxp-starting'),'slow document stays guarded beyond old 1.4-second timeout');
 slow.ready();slow.d.body.classList.add('lxp-enabled');slow.w.lectioPlusBoot.finish();
 ok(!slow.d.documentElement.classList.contains('lxp-starting')&&slow.d.documentElement.dataset.lxpMode==='dark','ready shell reveals without clearing theme');
 ok(!slow.timers.size,'successful boot clears watchdogs');slow.dom.window.close();
 const failure=await env();failure.load('boot');await pause(0);failure.ready();failure.tick(4000);
 ok(!failure.d.documentElement.classList.contains('lxp-starting')&&!failure.d.documentElement.hasAttribute('data-lxp-mode'),'broken initialization fails open after DOM is ready');failure.dom.window.close();
 const stuck=await env();stuck.load('boot');stuck.tick(15000);ok(!stuck.d.documentElement.classList.contains('lxp-starting'),'stalled document has an absolute fail-open deadline');stuck.dom.window.close();
 const disabled=await env(undefined,undefined,{enabled:false});disabled.load('boot');await pause(0);ok(!disabled.d.documentElement.classList.contains('lxp-starting'),'disabled extension reveals original immediately');disabled.dom.window.close();
 for(const path of ['/lectio/999999/login.aspx','/lectio/999999/logout.aspx','/lectio/999999/eksamen.aspx','/introduktion.htm']){const e=await env(path);e.load('boot');ok(!e.w.lectioPlusBoot&&!e.d.documentElement.classList.contains('lxp-starting'),'excluded path untouched: '+path.split('/').pop());e.dom.window.close();}
 const native=await env(undefined,'<body><div id="white" style="background:rgb(255,255,255);color:rgb(0,0,0)">Native</div></body>');native.load('boot');native.load('native-theme');await native.w.lectioPlusNativeTheme.ready;
 ok(native.d.getElementById('white').hasAttribute('data-lxp-native-surface'),'initial native colors are corrected before animation frames');
 const menu=native.d.createElement('div');menu.style.cssText='background:rgb(255,255,255);color:rgb(0,0,0)';menu.textContent='Late menu';native.d.body.append(menu);await pause(0);
 ok(menu.hasAttribute('data-lxp-native-surface')&&menu.hasAttribute('data-lxp-native-ink'),'new native menu is themed in its mutation batch before paint');
 ok(!native.frames.size,'native color scan cancels queued duplicate frame');native.dom.window.close();
 const parent=await env();parent.load('boot');await pause(0);const frame=parent.d.createElement('iframe');parent.d.body.append(frame);const f=frame.contentWindow;f.matchMedia=parent.w.matchMedia;f.chrome=parent.w.chrome;f.requestAnimationFrame=parent.w.requestAnimationFrame;f.cancelAnimationFrame=parent.w.cancelAnimationFrame;f.setTimeout=parent.w.setTimeout;f.clearTimeout=parent.w.clearTimeout;f.eval(read('appearance'));f.eval(read('boot'));
 ok(f.document.documentElement.classList.contains('lxp-starting'),'same-origin blank editor frame gets an early guard');f.eval(read('native-theme'));await f.lectioPlusNativeTheme.ready;
 ok(!f.document.documentElement.classList.contains('lxp-starting')&&f.document.documentElement.dataset.lxpMode==='dark','editor frame reveals only after native theme is applied');parent.dom.window.close();
 const school=await env('/','<body><div class="site-container"><div id="schoolsdiv"><a href="/lectio/999999/default.aspx">Fiktivt Gymnasium</a></div></div></body>');school.load('boot');school.load('school-picker');await pause(0);
 ok(!school.d.documentElement.classList.contains('lxp-starting')&&school.d.body.classList.contains('lxp-school-enabled')&&school.d.querySelector('.site-container').hidden,'school selection reveals completed custom picker');ok(school.reads()===1,'school picker shares boot preferences without a second asynchronous read');school.dom.window.close();
 const schoolFail=await env('/','<body><div class="site-container"><div id="schoolsdiv"></div></div></body>');schoolFail.w.fetch=async()=>{throw Error('offline')};schoolFail.load('boot');schoolFail.load('school-picker');await pause(0);ok(!schoolFail.d.documentElement.classList.contains('lxp-starting')&&!schoolFail.d.querySelector('.site-container').hidden,'failed school list fetch restores usable original');schoolFail.dom.window.close();
 // Real content renderer, with delayed DOM replacement and a controlled paint boundary.
 const preview=fs.readFileSync(app+'/preview/index.html','utf8');
 const e=await env('/lectio/999999/SkemaNy.aspx#schedule',preview);e.w.location.hash='#schedule';
 const scripts=['icons','hints','lectio-data','workspace','native-layout','tab-branding','settings-transfer','settings-extras','settings','school-math','school-elements','school-chemistry','school-lab-core','school-writing','translation','school-catalog','school-language','school-visuals','school-molecule-builder','school-lab','school-special','school-tools','games-core','games','content'];scripts.forEach(e.load);await pause(0);
 const workspace=e.d.querySelector('.lxp-workspace'),source=e.d.querySelector('[data-lxp-view=schedule]'),schedule=source.querySelector('[data-lxp-schedule]'),host=schedule.parentNode,next=schedule.nextSibling;
 const board=e.d.querySelector('.lxp-week-board');ok(board&&e.d.body.classList.contains('lxp-native-hidden'),'schedule fixture starts in modern view');schedule.remove();await pause(0);e.paint();
 ok(e.d.querySelector('.lxp-week-board')===board&&e.d.body.classList.contains('lxp-native-hidden')&&workspace.getAttribute('aria-busy')==='true','temporary source removal keeps complete modern schedule instead of exposing original');e.tick(120);host.insertBefore(schedule,next);await pause(0);e.paint();
 ok(e.d.body.classList.contains('lxp-native-hidden')&&!workspace.hasAttribute('aria-busy'),'replacement source clears busy state without a native flash');
 schedule.remove();await pause(0);e.paint();e.tick(751);
 ok(!workspace.hasAttribute('aria-busy')&&!e.d.body.classList.contains('lxp-native-hidden')&&source.classList.contains('lxp-native-page'),'permanently unsupported content falls back to styled native form');
 ok(!e.errors.length,'transitions complete without runtime errors');e.dom.window.close();

 const late=await env('/lectio/999999/SkemaNy.aspx#schedule',preview);const lateSource=late.d.getElementById('masterContent');lateSource.remove();scripts.forEach(late.load);await pause(0);ok(!late.d.getElementById('lxp-root'),'late source does not build against a missing root');late.d.body.append(lateSource);await pause(0);ok(late.d.querySelector('.lxp-week-board')&&late.d.body.classList.contains('lxp-native-hidden'),'source appearing after injection starts the modern renderer');
 const replacement=lateSource.cloneNode(true);lateSource.replaceWith(replacement);await pause(0);late.paint();ok(late.d.querySelectorAll('#lxp-root').length===1&&late.d.querySelector('.lxp-week-board')&&late.d.body.classList.contains('lxp-native-hidden'),'replacing masterContent reconnects the renderer without duplicate UI');
 const savedShell=late.d.getElementById('lxp-root');savedShell.remove();await pause(0);late.paint();ok(late.d.getElementById('lxp-root')===savedShell,'removed shell is reattached with its existing state');late.dom.window.close();
 let resolvePrefs;const blocked=await env('/lectio/999999/SkemaNy.aspx#schedule',preview,()=>new Promise(resolve=>resolvePrefs=resolve));blocked.load('boot');scripts.forEach(blocked.load);await pause(0);blocked.tick(1500);await pause(0);ok(blocked.d.querySelector('.lxp-week-board')&&!blocked.d.documentElement.classList.contains('lxp-starting'),'hung preferences read no longer blocks page initialization');resolvePrefs({enabled:false});await pause(0);ok(!blocked.d.body.classList.contains('lxp-enabled')&&blocked.d.getElementById('lxp-root').hidden,'late disabled preference still overrides temporary defaults');blocked.dom.window.close();
 const replacedBody=await env(undefined,'<body><p>old</p></body>');replacedBody.load('boot');replacedBody.load('native-theme');await replacedBody.w.lectioPlusNativeTheme.ready;const newBody=replacedBody.d.createElement('body');newBody.innerHTML='<div id="new-body-content" style="background:white;color:black">new</div>';replacedBody.d.body.replaceWith(newBody);await pause(0);ok(replacedBody.d.getElementById('new-body-content').hasAttribute('data-lxp-native-surface'),'native theme follows a replacement body');replacedBody.dom.window.close();
 const manifest=JSON.parse(fs.readFileSync(app+'/extension/manifest.json','utf8'));
 ok(manifest.content_scripts.some(x=>x.run_at==='document_start'&&x.js.includes('boot.js')&&x.matches.includes('https://www.lectio.dk/*')&&x.css.includes('school-picker.css')),'manifest guards both school picker and school pages at document start');
 const css=require('rrweb-cssom').parse(fs.readFileSync(app+'/extension/theme.css','utf8'));
 const screen=[...css.cssRules].find(x=>x.media?.mediaText==='screen');ok([...screen.cssRules].some(x=>x.selectorText==='html.lxp-starting body'&&x.style.opacity==='0'&&x.style.getPropertyPriority('opacity')==='important'),'boot opacity blocks descendants that explicitly set visibility visible');
 console.log('TOTAL',checks,'startup and transition checks');
})().catch(e=>{console.error(e);process.exit(1)});
