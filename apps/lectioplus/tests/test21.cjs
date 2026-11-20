const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM,VirtualConsole}=require('jsdom');
const root=require('node:path').resolve(__dirname,'..');
const scripts=['appearance','privacy','icons','hints','lectio-data','workspace','native-layout','tab-branding','settings-transfer','settings-extras','settings','school-math','school-elements','school-chemistry','school-lab-core','school-writing','translation','school-catalog','school-language','school-visuals','school-molecule-builder','school-lab','school-special','school-tools','rhythm','dash','games-core','games','content'];
const pause=()=>new Promise(r=>setTimeout(r,100));let checks=0;
function ok(value,label){assert.ok(value,label);checks++;console.log('PASS',label);}
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/CSS stylesheet/.test(e.message))errors.push(e)});
 const dom=new JSDOM(fs.readFileSync(root+'/preview/index.html','utf8'),{url:'https://example.test/preview/index.html#schedule',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window,d=w.document;w.structuredClone=structuredClone;w.matchMedia=q=>({matches:q.includes('dark'),addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>null;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 for(const script of scripts)w.eval(fs.readFileSync(root+'/extension/'+script+'.js','utf8'));await pause();
 const fixture=d.createElement('section');fixture.innerHTML='<div class="s2skema"><a class="s2skemabrik" href="/lectio/999999/aktivitet.aspx?absid=example" data-tooltip="Mandag 9/11-2026 08:15–09:45&lt;br&gt;Hold: Fiktivt fag&lt;br&gt;Lokale: B204"><span class="s2skemabrik-std-title">SMS og bookmark i medier</span><span class="markers"></span></a></div>';
 const markerHost=fixture.querySelector('.markers'),parse=()=>w.lectioPlusData.scheduleView(fixture).lessons[0];
 ok(!parse().hasContent,'ordinary tooltip and literal words do not imply content');
 for(const glyph of ['sms','bookmark'])for(const family of ['ls-fonticon','material-icons','material-symbols-outlined']){
  markerHost.innerHTML=`<span class="${family}" aria-hidden="true"> ${glyph} </span>`;
  ok(parse().hasContent,`decorative ${family} ${glyph} marks content`);
  ok(parse().title==='SMS og bookmark i medier','lesson title stays readable');
 }
 for(const markup of ['<span>sms</span>','<i class="ls-fonticon">calendar</i>','<i class="ls-fonticon">bookmark_border</i>','<i class="ls-fonticon" hidden>sms</i>','<span hidden><i class="ls-fonticon">bookmark</i></span>','<span style="display:none"><i class="ls-fonticon">sms</i></span>','<i class="ls-fonticon" style="visibility:hidden">bookmark</i>','<template><i class="ls-fonticon">sms</i></template>']){
  markerHost.innerHTML=markup;ok(!parse().hasContent,'inactive or unrelated marker is ignored: '+markup);
 }
 markerHost.innerHTML='<i class="ls-fonticon">sms</i><i class="ls-fonticon">bookmark</i>';
 ok(parse().hasContent&&parse().title==='SMS og bookmark i medier','combined native markers produce a single content flag');
 const source=d.querySelector('[data-lxp-view=schedule]'),lesson=source.querySelector('[data-lxp-lesson]');
 lesson.id='test21-lesson';lesson.innerHTML='<a href="#schedule/activity"><span data-lxp-lesson-title>Fiktiv lektion</span><span class="ls-fonticon" aria-hidden="true">sms</span><span class="ls-fonticon" aria-hidden="true">bookmark</span></a>';
 await pause();const card=()=>d.querySelector('.lxp-event[data-lxp-source-id="test21-lesson"]');
 ok(card().querySelectorAll('.lxp-event-content').length===1,'week card has one content badge');
 ok(card().getAttribute('href')==='#schedule/activity','content badge preserves lesson destination');
 ok(card().getAttribute('aria-label').includes('Tekst eller materiale'),'content is announced in keyboard/screen-reader label');
 ok(card().dataset.lxpHint.includes('Tekst eller materiale'),'lesson hint explains content');
 ok(!/sms|bookmark/.test(card().textContent),'no native glyph names leak into card');
 ok(!d.querySelector('.lxp-schedule-content-legend').hidden,'schedule explains content symbol');
 lesson.dataset.lxpTime='08:15–08:30';lesson.setAttribute('title','Kort aktivitet');await pause();
 ok(card().classList.contains('lxp-event-tiny')&&card().querySelector('.lxp-event-content'),'short lesson retains marker without changing duration');
 d.querySelector('[aria-label="Dagsliste"]').click();
 ok(card().querySelector('.lxp-event-content').textContent==='Indhold','day list has visible content text');
 lesson.querySelectorAll('.ls-fonticon').forEach(n=>n.remove());await pause();
 ok(!card().querySelector('.lxp-event-content')&&!card().getAttribute('aria-label')?.includes('Tekst eller materiale'),'removing native markers updates the rendered card');
 const main=d.querySelector('.lxp-school-tools'),ctrl=label=>[...main.querySelectorAll('[aria-label]')].find(n=>n.getAttribute('aria-label')===label);
 const route=async id=>{w.location.hash='#lxp-tools/'+id;await pause();};
 const search=value=>{const input=main.querySelector('.lxp-tool-search');input.value=value;input.dispatchEvent(new w.Event('input',{bubbles:true}));};
 const ids=()=>[...main.querySelectorAll('.lxp-tool-card')].map(n=>n.dataset.tool);
 const change=(label,value)=>{const n=ctrl(label);n.value=value;n.dispatchEvent(new w.Event('change',{bubbles:true}));};
 await route('all');
 ok(ids().length===6&&!main.querySelector('.lxp-tool-subject-section').hidden,'landing page is a compact starting point');
 ok(main.querySelectorAll('[data-subject]').length===5,'all five subjects are reachable');
 main.querySelector('[data-subject=chemistry]').click();
 ok(ids().length===w.lectioPlusSchoolCatalog.tools.filter(t=>t.category==='chemistry').length,'subject shows every chemistry tool');
 ok(d.activeElement===main.querySelector('.lxp-tool-results-header h2'),'category shortcut moves focus to its results');
 search('procent');ok(ids().length===0&&ctrl('Søg i alle fag'),'empty category search offers a useful recovery');
 ctrl('Søg i alle fag').click();ok(ids().includes('percent'),'broaden search retains query and finds the tool');
 ctrl('Ryd værktøjssøgning').click();ok(ids().length===54&&d.activeElement===main.querySelector('.lxp-tool-search'),'clear restores all tools and focuses search');
 ctrl('Kategori: Overblik').click();search('oversaet');ok(ids().includes('translate'),'search accepts a plain keyboard spelling of oversæt');
 search('dansk komma');ok(ids().includes('punctuation'),'search matches multiple task keywords');
 search('');ctrl('Kategori: Favoritter').click();ok(!ids().length&&main.querySelector('.lxp-tool-empty').textContent.includes('stjernen'),'empty favorites explain how to add one');
 await route('calculator');const field=ctrl('Regneudtryk');field.value='3*7';field.dispatchEvent(new w.Event('input',{bubbles:true}));ctrl('Beregn Lommeregner').click();
 ok(main.querySelector('.lxp-tool-results dd').textContent==='21','existing calculation remains correct');
 const explanation=main.querySelector('.lxp-tool-explanation');ok(explanation?.tagName==='DETAILS'&&!explanation.open,'working is available on demand');
 explanation.open=true;ok(explanation.textContent.length>25,'expanded working retains explanation');
 ok(main.querySelector('.lxp-tool-stage').nextElementSibling===main.querySelector('.lxp-tool-personal'),'save controls follow the active tool');
 ok(main.querySelector('.lxp-tool-guide').textContent.includes('Tilpas eksempelværdierne'),'calculator gets a clear starting instruction');
 ctrl('Markér værktøj som favorit').click();await pause();await route('all');ctrl('Kategori: Overblik').click();
 ok(ids()[0]==='calculator'&&ids().length===6&&new Set(ids()).size===6,'favorites lead the six unique shortcuts');
 await route('calculator');ok(ctrl('Regneudtryk').value==='3*7','switching views preserves unsaved calculation inputs');
 await route('notes');ok(main.querySelector('.lxp-tool-personal').hidden,'notes hide irrelevant calculation save controls');
 ok(main.querySelector('.lxp-tool-guide').textContent.includes('husk at gemme'),'notes explain saving');
 ctrl('Indstillinger for Hjælpemidler').click();change('Sprog i Hjælpemidler','en');await pause();
 ok(main.querySelector('.lxp-tool-guide').textContent.includes('remember to save'),'new tool instructions follow English preference');
 await route('all');ctrl('Category: Overview').click();
 ok(main.querySelector('.lxp-tool-subject-section h2').textContent==='Choose a subject','new category landing follows language');
 ok(ctrl('Show tools for Chemistry'),'subject shortcut has translated accessible name');
 change('Study tools language','da');await pause();
 for(const tool of w.lectioPlusSchoolCatalog.tools){
  ok(typeof tool.guide==='string'&&tool.guide.length>30,'guide provided for '+tool.id);
  ok(w.lectioPlusSchoolLanguage.translate(tool.guide,'en')!==tool.guide,'English guide provided for '+tool.id);
 }
 ok(!errors.length,'new views and updates produce no DOM errors');
 dom.window.close();console.log('TOTAL',checks,'Test 21 checks');
})().catch(e=>{console.error(e);process.exit(1)});
