const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = require('node:path').resolve(__dirname, '..');
const scripts = ['appearance','privacy','icons','hints','lectio-data','workspace','native-layout','tab-branding','settings-transfer','settings-extras','settings','school-math','school-elements','school-chemistry','school-lab-core','school-writing','translation','school-catalog','school-language','school-visuals','school-molecule-builder','school-lab','school-special','school-tools','games-core','games','content'];
const pause = () => new Promise(r => setTimeout(r,90));
let checks = 0;
function ok(condition, message) { assert.ok(condition,message); checks++; console.log('PASS',message); }
function setup({html=fs.readFileSync(root+'/preview/index.html','utf8'), hash='#schedule', narrow=false, url='https://example.test/preview/index.html'}={}) {
 const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/CSS stylesheet/.test(e.message))errors.push(e)});
 const dom=new JSDOM(html,{url:url+hash,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window; w.structuredClone=structuredClone;
 w.matchMedia=q=>({matches:q.includes('760')?narrow:q.includes('dark'),addEventListener(){},removeEventListener(){}});
 w.HTMLCanvasElement.prototype.getContext=()=>null; w.scrollTo=()=>{}; w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 for(const script of scripts)w.eval(fs.readFileSync(root+'/extension/'+script+'.js','utf8'));
 return {dom,w,d:w.document,errors};
}
(async()=>{
 const {dom,w,d,errors}=setup({hash:'#home'});await pause();
 const ctrl=label=>[...d.querySelectorAll('[aria-label]')].find(x=>x.getAttribute('aria-label')===label);
 const save=async()=>{ctrl('Gem layout').click();await pause()};
 const prefs=()=>JSON.parse(w.localStorage.getItem('lectioPlusPreview')||'{}');
 ctrl('Tilpas overblik').click();
 ok(d.querySelector('.lxp-settings').classList.contains('lxp-settings-visual'),'dashboard opens a wide visual workspace');
 ok(d.querySelector('.lxp-builder-library')&&d.querySelector('.lxp-builder-canvas'),'palette and canvas have distinct areas');
 ok(d.querySelectorAll('.lxp-widget-preview').length===5,'each visible widget has a content preview');
 ok(d.querySelector('.lxp-widget-preview .lxp-hero h1').textContent==='Dit overblik','hero preview mirrors dashboard title');
 ok(d.querySelector('.lxp-builder-caption').textContent.includes('Testdata'),'sample preview data is explicitly labelled');
 ok(!d.querySelector('.lxp-widget-preview :is(a[href],iframe,input,button)'),'preview cannot navigate, load game or submit forms');
 let dt;function start(el){let value='';dt={setData(t,v){value=v},getData(){return value}};const e=new w.Event('dragstart',{bubbles:true});Object.defineProperty(e,'dataTransfer',{value:dt});el.dispatchEvent(e)}
 function drag(target,type='drop'){const e=new w.Event(type,{bubbles:true,cancelable:true});Object.defineProperty(e,'dataTransfer',{value:dt});target.dispatchEvent(e);return e;}
 start(d.querySelector('.lxp-palette-item[data-widget="shortcuts"]'));
 let target=d.querySelector('.lxp-widget-slot[data-widget="tasks"]');
 ok(drag(target,'dragover').defaultPrevented&&target.classList.contains('lxp-drop-active'),'drag target gives visible insertion feedback');
 drag(target);
 ok(!d.querySelector('.lxp-dashboard-widget[data-widget="shortcuts"]'),'drag keeps live overview unchanged before Save');
 await save();
 const slots=prefs().dashboard.slots;
 ok(slots.find(x=>x.id==='shortcuts').visible&&slots.findIndex(x=>x.id==='shortcuts')+1===slots.findIndex(x=>x.id==='tasks'),'drag from palette inserts hidden field before chosen card');
 ok(d.querySelector('.lxp-dashboard-widget[data-widget="shortcuts"]'),'saved palette drop updates actual overview');
 ok(!d.querySelector('.lxp-dragging,.lxp-drop-active'),'drop clears temporary drag styling');
 start(d.querySelector('.lxp-palette-item[data-widget="hero"]'));drag(d.querySelector('.lxp-drop-end'));await save();
 ok(prefs().dashboard.slots.at(-1).id==='hero'&&prefs().dashboard.slots.filter(x=>x.id==='hero').length===1,'dragging a placed field moves it without duplication');
 ctrl('Skjul Genveje').click();ctrl('Tilføj Genveje').click();await save();ok(prefs().dashboard.slots.at(-1).id==='shortcuts','palette plus button works without drag');
 const before=JSON.stringify(prefs().dashboard);dt={getData:()=> 'tasks'};drag(d.querySelector('.lxp-drop-end'));ok(JSON.stringify(prefs().dashboard)===before,'untrusted external drop is ignored');
 start(d.querySelector('.lxp-palette-item[data-widget="hero"]'));drag(d.querySelector('.lxp-widget-slot'),'dragover');drag(d.querySelector('.lxp-palette-item[data-widget="hero"]'),'dragend');
 ok(!d.querySelector('.lxp-dragging,.lxp-drop-active'),'cancelled drag clears highlights');
 ctrl('Vis layout på mobil').click();ok(d.querySelector('.lxp-builder-canvas').dataset.device==='mobile'&&ctrl('Vis layout på mobil').getAttribute('aria-pressed')==='true','mobile preview selected accessibly');
 ctrl('Vis layout på computer').click();ok(d.querySelector('.lxp-builder-canvas').dataset.device==='desktop','desktop preview restored');
 ctrl('Overskrift på overblik').value='Min personlige side';ctrl('Overskrift på overblik').dispatchEvent(new w.Event('change'));
 ok(d.querySelector('.lxp-overview .lxp-hero h1').textContent==='Dit overblik','title remains a draft until saved');await save();
 ok(d.querySelector('.lxp-widget-slot[data-widget=hero] .lxp-hero h1').textContent==='Min personlige side'&&d.querySelector('.lxp-hero h1').textContent==='Min personlige side','canvas and live overview reflect title changes');
 d.querySelector('#lxp-settings-tab-schedule').click();ok(!d.querySelector('.lxp-settings').classList.contains('lxp-settings-visual'),'other settings return to normal dialog width');
 ctrl('Luk indstillinger').click();w.location.hash='#schedule/activity';await pause();
 const activity=d.querySelector('[data-lxp-view="schedule/activity"]');
 ok(activity.classList.contains('lxp-native-page')&&activity.querySelector('.ls-tocContainer-outer'),'realistic activity structure receives native styling');
 const original=activity.querySelector('[data-lc-header-variant="lectiofile"] a');let clicks=0;original.addEventListener('click',e=>{e.preventDefault();clicks++});original.click();ok(clicks===1,'material link original click handler retained');
 const note=activity.querySelector('.islandContent textarea');note.value='Bevar min note';
 ctrl('Indstillinger').click();const font=ctrl('Skrifttype');font.value='arial';font.dispatchEvent(new w.Event('change'));
 ok(activity.querySelector('.islandContent textarea')===note&&note.value==='Bevar min note','theme changes preserve activity form state');
 ctrl('Luk indstillinger').click();
 ok(activity.querySelector('.activity-note').disabled,'read-only lesson note remains disabled');
 // Inspect CSS rules without claiming to test the OS-native option window in jsdom.
 const parse=require('rrweb-cssom').parse;
 const theme=parse(fs.readFileSync(root+'/extension/theme.css','utf8'));
 const select=d.createElement('select');select.innerHTML='<option>One</option><option>Two</option><optgroup label="Group"><option disabled>Disabled</option></optgroup>';d.body.append(select);
 for(const mode of ['dark','light']) {
   d.documentElement.dataset.lxpMode=mode;
   const rule=[...theme.cssRules].find(r=>r.selectorText?.includes("data-lxp-mode='"+mode+"'")&&select.matches(r.selectorText)&&r.style?.getPropertyValue('color-scheme')===mode);
   ok(rule?.style.getPropertyPriority('color-scheme')==='important',mode+' scheme overrides inherited native control scheme');
 }
 const surface=[...theme.cssRules].find(r=>r.selectorText&&select.options[1].matches(r.selectorText)&&r.style?.getPropertyValue('background-color')==='var(--lxp-surface)');
 ok(surface?.style.getPropertyPriority('background-color')==='important','option surface explicitly follows theme tokens');
 ok(surface.style.getPropertyValue('color')==='var(--lxp-text)','option text explicitly follows contrast token');
 ok(!errors.length,'visual editor and activity checks have no runtime errors');
 dom.window.close();console.log('TOTAL',checks,'visual editor and dropdown checks');
})().catch(e=>{console.error(e);process.exit(1)});
