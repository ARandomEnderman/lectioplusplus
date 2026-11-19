const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom'),path=require('node:path');
const app=path.resolve(__dirname,'..');let checks=0;const pause=()=>new Promise(r=>setTimeout(r,70));
function ok(x,label){assert.ok(x,label);checks++;console.log('PASS',label)}
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(app+'/preview/index.html','utf8'),{url:'https://example.test/preview.html#schedule',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document;
w.matchMedia=()=>({matches:false,addEventListener(){}});w.structuredClone=structuredClone;w.HTMLCanvasElement.prototype.getContext=()=>null;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
const scripts=['appearance','privacy','icons','hints','lectio-data','workspace','native-layout','tab-branding','settings-transfer','settings-extras','settings','school-math','school-elements','school-chemistry','school-lab-core','school-writing','translation','school-catalog','school-language','school-visuals','school-molecule-builder','school-lab','school-special','school-tools','rhythm','games-core','games','content'];
for(const file of scripts)w.eval(fs.readFileSync(app+'/extension/'+file+'.js','utf8'));
(async()=>{await pause();const D=w.lectioPlusData;
for(const [date,value,monday] of [['2026-11-16','2026-W47','2026-11-16'],['2026-12-31','2026-W53','2026-12-28'],['2027-01-01','2026-W53','2026-12-28'],['2027-01-04','2027-W01','2027-01-04'],['2024-12-30','2025-W01','2024-12-30']]){const r=D.weekAt(date);ok(r.value===value&&r.monday===monday&&D.weekDate(value)===monday,'ISO week '+date);}
for(const bad of ['2021-W53','2026-W00','2026-W54','2026-W01x','not-a-week'])ok(D.weekDate(bad)==='','invalid week rejected: '+bad);
const url=new URL(D.weekHref('https://www.lectio.dk/lectio/999999/SkemaNy.aspx?type=elev&elevid=fake&Week=462026#old','2027-01-04'));
ok(url.searchParams.get('week')==='012027'&&url.searchParams.get('elevid')==='fake'&&url.searchParams.get('type')==='elev'&&!url.searchParams.has('Week')&&!url.hash,'week URL preserves source identity, updates padded week and clears old hash');
ok(!D.weekHref('javascript:alert(1)','2026-11-16')&&!D.weekHref('https://www.lectio.dk/lectio/999999/logout.aspx','2026-11-16'),'week helper refuses non-schedule URLs');
const control=label=>d.querySelector('.lxp-workspace [aria-label="'+label+'"]');
const nowShown=()=>{const n=d.querySelector('.lxp-now-time'),tick=[...d.querySelectorAll('.lxp-week-time')].find(t=>t.textContent==='12:00');return n&&!n.hidden&&n.textContent==='12:00'&&tick&&n.style.top===tick.style.top&&d.querySelector('.lxp-calendar-today .lxp-now-line:not([hidden])')?.style.top===tick.style.top;};
ok(nowShown(),'now line marks the preview clock (12:00) in today\'s column, level with the 12:00 grid line');
ok(control('Forrige uge')&&control('Næste uge')&&control('Denne uge')&&control('Vælg uge'),'schedule always exposes modern week controls even without original arrows');
control('Næste uge').click();await pause();ok(d.querySelector('.lxp-page-subtitle').textContent.includes('Uge 47')&&control('Vælg uge').value==='2026-W47','preview advances a week');ok([...d.querySelectorAll('.lxp-now-line, .lxp-now-time')].every(e=>e.hidden),'now line is hidden in a week without today');
control('Forrige uge').click();await pause();ok(control('Vælg uge').value==='2026-W46','preview returns to previous week');
const picker=control('Vælg uge');picker.value='2026-W53';picker.dispatchEvent(new w.Event('input',{bubbles:true}));control('Vis valgt uge').click();await pause();control('Næste uge').click();await pause();ok(control('Vælg uge').value==='2027-W01','next week crosses the ISO year boundary');
control('Denne uge').click();await pause();ok(control('Vælg uge').value===D.weekAt(d.body.dataset.lxpPreviewDate.slice(0,10)).value,'this-week control uses the preview clock and returns home');
ok(nowShown(),'now line returns with the current week');
const empty=control('Vælg uge');empty.value='';empty.dispatchEvent(new w.Event('input',{bubbles:true}));ok(control('Vis valgt uge').getAttribute('aria-disabled')==='true'&&!control('Vis valgt uge').hasAttribute('href'),'empty week cannot navigate to an unintended page');
ok(errors.length===0,'week changes have no DOM errors');dom.window.close();console.log('TOTAL',checks,'week-navigation checks');
})().catch(e=>{console.error(e);process.exit(1)});
