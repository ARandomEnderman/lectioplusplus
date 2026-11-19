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
 ctrl('Indstillinger').click();
 for(const [tab,label,key] of [['appearance','Tilpas fanens navn og ikon','tabBranding'],['appearance','Færre animationer','reducedMotion'],['appearance','Skjul mit profilbillede','hideProfilePhoto'],['appearance','Vis mit navn som Anonym','anonymizeName'],['schedule','Vis pauser mellem lektioner','showBreaks'],['schedule','Forskellige farver til fagene','colorLessons'],['schedule','Vis lokale i ugeplanen','showLessonRoom'],['navigation','Vis Strafe Clicker','showClicker'],['pages','Genveje til afsnit på lange sider','sectionShortcuts']]){
  d.querySelector('#lxp-settings-tab-'+tab).click();const input=ctrl(label),wrapper=input.closest('.lxp-toggle'),before=input.checked;
  ok(input.getAttribute('role')==='switch'&&wrapper.querySelector('.lxp-toggle-state').textContent===(before?'Til':'Fra'),label+': initial state is visible and accessible');
  input.closest('label').click();await pause();
  ok(input.checked===!before&&wrapper.dataset.state===(!before?'on':'off')&&wrapper.querySelector('.lxp-toggle-state').textContent===(!before?'Til':'Fra'),label+': clicking the row updates visible state once');
  ok(JSON.parse(w.localStorage.getItem('lectioPlusPreview'))[key]===!before,label+': visible state matches saved preference');
  ok(d.querySelector('.lxp-settings-status').textContent.includes(label+': '+(!before?'Til':'Fra')),label+': change confirmation names new state');
  input.click();await pause();ok(input.checked===before&&wrapper.querySelector('.lxp-toggle-state').textContent===(before?'Til':'Fra'),label+': direct click switches back');
 }
 d.querySelector('#lxp-settings-tab-dashboard').click();
 ok(d.querySelector('.lxp-palette-item[data-widget=tasks]').dataset.visible==='true','shown widget has explicit visible state');
 ctrl('Skjul Næste afleveringer').click();ok(d.querySelector('.lxp-palette-item[data-widget=tasks]').dataset.visible==='false'&&d.querySelector('.lxp-palette-item[data-widget=tasks] small').textContent.includes('Skjult'),'hidden widget has explicit hidden state');
 // The shared switch also reflects programmatic storage updates without emitting changes.
 const plain=d.createElement('input');plain.type='checkbox';let count=0;plain.addEventListener('change',()=>count++);
 const toggle=w.lectioPlusAppearance.toggle(plain);toggle.sync(true);
 ok(plain.checked&&toggle.node.dataset.state==='on'&&count===0,'sync updates visual state without causing a save loop');
 toggle.sync(false);ok(toggle.node.querySelector('.lxp-toggle-state').textContent==='Fra','sync restores off state');
 ok(!errors.length,'switch interactions have no runtime errors');dom.window.close();
 // Popup uses the same switches and handles a failed write by restoring both state and visuals.
 let fail=false,store={enabled:true,showClicker:true};
 const popup=new JSDOM(fs.readFileSync(root+'/extension/popup.html','utf8'),{url:'https://example.test/popup.html',runScripts:'outside-only'});const pw=popup.window;
 pw.matchMedia=()=>({matches:false,addEventListener(){}});pw.chrome={storage:{local:{get:async()=>store,set:async changes=>{if(fail)throw Error('blocked');Object.assign(store,changes)}},onChanged:{addListener(){}}}};
 pw.eval(fs.readFileSync(root+'/extension/appearance.js','utf8'));pw.eval(fs.readFileSync(root+'/extension/popup.js','utf8'));await pause();
 const game=pw.document.querySelector('#show-clicker');game.click();await pause();ok(!game.checked&&game.closest('.lxp-toggle').dataset.state==='off'&&!store.showClicker,'popup switch matches persisted state');
 fail=true;game.click();await pause();ok(!game.checked&&game.closest('.lxp-toggle').dataset.state==='off'&&pw.document.querySelector('#status').textContent.includes('kunne ikke'),'popup save failure restores both control and visible state');
 popup.window.close();console.log('TOTAL',checks,'switch feedback checks');
})().catch(e=>{console.error(e);process.exit(1)});
