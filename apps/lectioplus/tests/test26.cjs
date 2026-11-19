const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),ext=root+'/extension/';let checks=0;const ok=(v,label)=>{assert.ok(v,label);checks++;};
const pause=()=>new Promise(r=>setTimeout(r,25));
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/CSS stylesheet/.test(e.message))errors.push(e.message);});
 const dom=new JSDOM(fs.readFileSync(root+'/preview/index.html','utf8'),{url:'https://example.test/preview/index.html#lxp-tools/all',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document;
 w.structuredClone=structuredClone;w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>null;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.Range.prototype.getBoundingClientRect=()=>({left:0,top:0,right:0,bottom:0,width:0,height:0});w.Range.prototype.getClientRects=()=>[];
 for(const f of [...d.querySelectorAll('script[src]')].map(n=>n.getAttribute('src').replace('../extension/','')))w.eval(fs.readFileSync(ext+f,'utf8'));await pause();
 const main=d.querySelector('.lxp-school-tools'),stage=()=>main.querySelector('.lxp-tool-stage'),panel=()=>stage().firstElementChild;
 const ctrl=label=>[...main.querySelectorAll('[aria-label]')].find(n=>n.getAttribute('aria-label')===label);
 const change=(label,value,event='change')=>{const n=ctrl(label);assert.ok(n,label);n.value=value;n.dispatchEvent(new w.Event(event,{bubbles:true}));return n;};
 const route=async id=>{w.location.hash='#lxp-tools/'+id;await pause();};
 const click=async label=>{assert.ok(ctrl(label),'button '+label);ctrl(label).click();await pause();};
 ok(main.querySelector('h1').textContent==='Hjælpemidler','correct workspace spelling');ok([...d.querySelectorAll('.lxp-sidebar a')].some(n=>n.textContent.includes('Hjælpemidler')),'correct sidebar spelling');ok(w.lectioPlusAppearance.navigationItems.some(x=>x[1]==='Hjælpemidler'),'correct settings spelling');
 ok(main.dataset.page==='catalog','overview has catalog layout');
 await click('Indstillinger for Hjælpemidler');change('Sprog i Hjælpemidler','en');await pause();ok(main.querySelector('h1').textContent==='Study tools','renamed heading translates');change('Study tools language','mixed');await pause();ok(main.querySelector('h1').textContent==='Hjælpemidler','mixed mode keeps correct Danish heading');change('Sprog i Hjælpemidler','da');await pause();
 // Visit every current route, including specialty editors, without external requests.
 const inventory=[];
 for(const tool of w.lectioPlusSchoolCatalog.tools){
  await route(tool.id);ok(panel()&&panel().dataset.toolId===tool.id,'opens '+tool.id);ok(main.dataset.page==='workspace','workspace layout '+tool.id);
  const controls=[...panel().querySelectorAll('input,select,textarea')].filter(el=>!el.closest('.CodeMirror')&&el.type!=='hidden');
  ok(controls.every(el=>el.getAttribute('aria-label')||el.closest('label')||d.querySelector(`label[for="${el.id}"]`)),'labelled fields '+tool.id);
  if(tool.calculate){await click('Beregn '+tool.title);ok(!panel().querySelector('.lxp-tool-error')&&panel().querySelector('.lxp-tool-results'),'default result '+tool.id);}
  inventory.push({id:tool.id,controls:controls.length,tables:panel().querySelectorAll('table').length});
 }
 ok(inventory.length===126,'all 126 tool routes audited');console.log('PASS all 126 routes, field labels and default calculations');
 // Use a known expanded calculator to check empty and completed result states.
 const expanded=w.lectioPlusExpanded.tools.find(t=>t.calculate);await route(expanded.id);await click('Indlæs eksempel');ok(panel().querySelector('.lxp-tool-results'),'expanded example still calculates');ok(panel().querySelector('.lxp-tool-actions .lxp-primary-button'),'main calculation action is prominent');
 await route('regression');const first=panel().querySelector('.lxp-data-table input');first.value='1,25';first.dispatchEvent(new w.Event('input',{bubbles:true}));
 // Deliberately hostile host styles reproduce the old white cells and controls.
 const host=d.createElement('style');host.textContent='table,thead,tbody,tr,th,td,input,textarea,select,fieldset,legend,label,summary { background-color: white !important; color: black !important; color-scheme: light; }';d.head.append(host);
 const theme=d.createElement('style');theme.textContent=fs.readFileSync(ext+'theme.css','utf8');d.head.append(theme);
 const outside=d.createElement('table');outside.innerHTML='<tbody><tr><td>Native table</td></tr></tbody>';d.body.append(outside);
 ok(w.getComputedStyle(first.closest('td')).backgroundColor==='rgb(255, 255, 255)','host CSS reproduces white table cell');
 const polish=d.createElement('style');polish.textContent=fs.readFileSync(ext+'school-polish.css','utf8');d.head.append(polish);
 const protectedRoutes=['regression','statistics','regression-models','empirical','forces','data-import','code-workshop','ocr','submission-check','periodic','flowchart','molecules','notes','translate','punctuation'];
 let checkedSurfaces=0;
 const setTheme=async mode=>{if(d.documentElement.dataset.lxpMode!==mode){d.querySelector('[data-lxp-theme-toggle]').click();await pause();}assert.equal(d.documentElement.dataset.lxpMode,mode);};
 for(const mode of ['dark','light']){
  await setTheme(mode);
  for(const id of protectedRoutes){await route(id);assert.equal(panel().dataset.toolId,id);const scopes=[panel(),d.querySelector('.lxp-tool-dock')];
   for(const scope of scopes){
    for(const selector of ['th','td','select.lxp-setting-control','input.lxp-setting-control','textarea.lxp-setting-control:not(.lxp-code-source)','label','summary']){
     const el=scope.querySelector(selector);if(!el)continue;const css=w.getComputedStyle(el);ok(css.backgroundColor!=='rgb(255, 255, 255)',mode+' host surface blocked: '+id+' '+selector);ok(css.color!=='rgb(0, 0, 0)',mode+' host ink blocked: '+id+' '+selector);checkedSurfaces++;
    }
    for(const type of ['file','range','checkbox']){const el=scope.querySelector(`input[type=${type}]`);if(el)ok(w.getComputedStyle(el).colorScheme===mode,mode+' native control '+id+' '+type);}
   }
  }
 }
 ok(checkedSurfaces>75,'theme audit covers generated and dynamic controls');ok(w.getComputedStyle(outside.querySelector('td')).backgroundColor==='rgb(255, 255, 255)','tool protection does not recolour unrelated native tables');
 main.querySelector('.lxp-tool-workspace').dataset.width='wide';ok(w.getComputedStyle(main.querySelector('.lxp-tool-workspace')).maxWidth==='none','wide preference survives new workspace styling');
 const search=main.querySelector('.lxp-tool-search');ok(w.getComputedStyle(search).backgroundColor==='var(--lxp-surface)','search is protected from host field colours');
 await route('regression');ok(panel().querySelector('.lxp-data-table input').value==='1,25','mode and route changes preserve values');const invalid=panel().querySelector('.lxp-data-table input');invalid.setAttribute('aria-invalid','true');const invalidRule=[...polish.sheet.cssRules].filter(rule=>rule.selectorText&&rule.style.getPropertyValue('border-color')&&invalid.matches(rule.selectorText)).at(-1);/* JSDOM loses var() border shorthands during computed-style expansion. */ok(invalidRule.style.getPropertyValue('border-color')==='var(--lxp-red)'&&invalidRule.style.getPropertyPriority('border-color')==='important','validation colour survives theme protection');invalid.removeAttribute('aria-invalid');
 await route('code-workshop');change('Programmeringssprog','html');const cm=panel().querySelector('.CodeMirror').CodeMirror;cm.setValue('<h1>Min side</h1><input aria-label="Svar">');await setTheme('dark');await click('Kør program');let frame=panel().querySelector('.lxp-html-preview');
 ok(frame.getAttribute('sandbox')===''&&frame.srcdoc.includes("default-src 'none'"),'preview remains sandboxed without scripts');ok(/color-scheme: dark/.test(frame.srcdoc),'bare HTML gets dark defaults');cm.setValue('<h1>Ugemt ændring</h1>');await setTheme('light');ok(/color-scheme: light/.test(frame.srcdoc)&&frame.srcdoc.includes('Min side'),'theme refresh uses last rendered code');ok(cm.getValue()==='<h1>Ugemt ændring</h1>','theme refresh preserves edited code');
 await route('regression');await setTheme('dark');await route('code-workshop');ok(/color-scheme: dark/.test(frame.srcdoc),'cached HTML follows theme when reopened');
 cm.setValue('<style>body{background:white;color:black}</style><p>Eget design</p>');await click('Kør program');frame=panel().querySelector('.lxp-html-preview');ok(frame.srcdoc.indexOf('data-lxp-preview-theme')<frame.srcdoc.indexOf('body{background:white'),'explicit user CSS follows theme defaults');
 // Native table rules must not repaint the semantic colours in scientific diagrams.
 await route('atom-builder');const proton=panel().querySelector('circle[fill="#ef4444"]');ok(proton&&proton.getAttribute('fill')==='#ef4444','proton colour preserved');
 ok(!errors.length,errors.join('\n'));dom.window.close();console.log('TOTAL',checks,'Test 26 navigation, theme and layout checks');
 console.log('AUDIT',inventory.length,'tool routes;',checkedSurfaces,'themed surface samples in light/dark mode; no logged-in browser verification');
})().catch(e=>{console.error(e);process.exit(1);});
