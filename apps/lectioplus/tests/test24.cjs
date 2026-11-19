const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),ext=root+'/extension/';let checks=0;const ok=(v,label)=>{assert.ok(v,label);checks++;};
const pause=()=>new Promise(r=>setTimeout(r,35));
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/CSS stylesheet/.test(e.message))errors.push(e)});
 const dom=new JSDOM(fs.readFileSync(root+'/preview/index.html','utf8'),{url:'https://example.test/preview/index.html#lxp-tools/code-workshop',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document;
 w.structuredClone=structuredClone;w.matchMedia=q=>({matches:q.includes('dark'),addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>null;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 w.Range.prototype.getBoundingClientRect=()=>({left:0,top:0,right:0,bottom:0,width:0,height:0});w.Range.prototype.getClientRects=()=>[];
 const scripts=[...d.querySelectorAll('script[src]')].map(n=>n.getAttribute('src').replace('../extension/',''));
 for(const f of scripts)w.eval(fs.readFileSync(ext+f,'utf8'));await pause();
 const main=d.querySelector('.lxp-school-tools'),stage=()=>main.querySelector('.lxp-tool-stage'),ctrl=label=>[...stage().querySelectorAll('[aria-label]')].find(n=>n.getAttribute('aria-label')===label);
 const change=(label,value)=>{const n=ctrl(label);assert.ok(n,'control '+label);n.value=value;n.dispatchEvent(new w.Event('change',{bubbles:true}));return n;};
 const click=async label=>{const n=ctrl(label)||[...stage().querySelectorAll('button')].find(n=>n.textContent===label);assert.ok(n,'button '+label);n.click();await pause();};
 const route=async id=>{w.location.hash='#lxp-tools/'+id;await pause()};
 const prefs=()=>w.lectioPlusAppearance.normalize(JSON.parse(w.localStorage.getItem('lectioPlusPreview')||'{}'));
 const X=w.lectioPlusExpanded;
 ok(X.tools.length===74,'74 expanded tools');
 ok(new Set(w.lectioPlusSchoolCatalog.tools.map(t=>t.id)).size===128,'128 unique tools retain all 54 previous tools');
 for(const tool of X.tools){await route(tool.id);ok(stage().querySelector('.lxp-expanded'),'opens '+tool.id);ok(stage().querySelector('input,select,textarea,button'),'controls '+tool.id);if(tool.calculate){await click('Beregn '+tool.title);ok(!stage().querySelector('.lxp-tool-error'),'default calculation '+tool.id);ok(stage().querySelector('.lxp-tool-results'),'result '+tool.id);}}
 await route('code-workshop');ok(stage().querySelector('.CodeMirror'),'CodeMirror editor initializes');
 change('Arbejdsform','lessons');let visited=0;
 for(let level=1;level<=5;level++){change('Sværhedsgrad',String(level));const choices=ctrl('Opgave');ok(choices.options.length===25,'25 exercises in level '+level);for(let number=1;number<=25;number++){change('Opgave',String(number));const lesson=w.lectioPlusCodeLessons.find(l=>l.level===level&&l.number===number);ok(stage().querySelector('.lxp-code-instruction h3').textContent===lesson.title,'exercise '+level+'/'+number);visited++;}}
 ok(visited===125,'all 125 exercises selectable');
 let call;w.lectioPlusWorkbenchClient={execute:async p=>{call=p;return {text:'Hej',checks:p.tests?.map(t=>({passed:true,actual:'ok',expected:'ok'}))||[],trace:[]}}};
 change('Sværhedsgrad','1');await click('Test min løsning');ok(call.language==='python'&&call.tests.length===3,'test passes Python exercise and cases');ok(JSON.parse(prefs().toolbox.workspaces['python-1-1']).passed,'passed progress persists');
 change('Arbejdsform','free');await click('Kør program');ok(!call.tests&&call.language==='python','freestyle runs without exercise grading');await click('Gem kode');ok(JSON.parse(prefs().toolbox.workspaces['code-workshop']).code,'free code persists');
 change('Programmeringssprog','html');await click('Kør program');const frame=stage().querySelector('.lxp-html-preview');ok(frame&&frame.getAttribute('sandbox')===''&&frame.srcdoc.includes("default-src 'none'"),'HTML preview disallows scripts and remote resources');
 await route('atom-builder');change('Protoner','6');ok(stage().textContent.includes('Kulstof'),'atom name follows proton count');
 const normalized=w.lectioPlusAppearance.normalize({customSidebar:[{id:'link-one',label:'Min side',url:'https://example.org',icon:'book'},{id:'link-bad',label:'Bad',url:'javascript:alert(1)'},{id:'link-auth',label:'Bad',url:'https://user:pass@example.org'}]});ok(normalized.customSidebar.length===1,'sidebar rejects unsafe schemes and credential URLs');
 const backup=w.lectioPlusSettingsTransfer.parse(w.lectioPlusSettingsTransfer.serialize(normalized));ok(backup.customSidebar[0].url==='https://example.org/','custom links survive backup');ok(!Object.hasOwn(w.lectioPlusAppearance.normalize({toolbox:{workspaces:JSON.parse('{"__proto__":"bad","constructor":"bad","okay":"value"}')}}).toolbox.workspaces,'constructor'),'workspace keys are guarded');
 // Test custom sidebar editor against real normalization + async save contract.
 let p=w.lectioPlusAppearance.normalize({});const holder=d.createElement('div'),status=d.createElement('p');d.body.append(holder);
 const E=(tag,cl,...children)=>{const n=d.createElement(tag);n.className=cl||'';n.append(...children);return n;},B=(cl,label,fn,...children)=>{const n=E('button',cl,...children);n.setAttribute('aria-label',label);n.onclick=fn;return n;};
 const editor=w.lectioPlusCustomSidebar({ui:{element:E,button:B,icon:()=>E('span','','★')},panel:holder,getPreferences:()=>p,onChange:async changes=>{p=w.lectioPlusAppearance.normalize({...p,...changes});},status});
 const local=label=>[...holder.querySelectorAll('[aria-label]')].find(n=>n.getAttribute('aria-label')===label);
 local('Navn på egen fane').value='<b>Mit link</b>';local('Link til egen fane').value='https://example.org';local('Gem egen fane').click();await pause();ok(p.customSidebar.length===1&&!holder.querySelector('b'),'custom label is plain text');
 local('Navn på egen fane').value='Andet';local('Link til egen fane').value='https://example.net';local('Gem egen fane').click();await pause();local('Flyt egen fane Andet op').click();await pause();ok(p.customSidebar[0].label==='Andet','reorder custom links');local('Redigér Andet').click();local('Navn på egen fane').value='Rettet';local('Gem egen fane').click();await pause();ok(p.customSidebar[0].label==='Rettet'&&p.customSidebar.length===2,'edit link in place');local('Slet egen fane Rettet').click();await pause();ok(p.customSidebar.length===1,'remove custom link');
 if(errors.length)throw errors[0];ok(!errors.length,'all new panels are free of DOM exceptions');
 dom.window.close();console.log('TOTAL',checks,'Test 24 workspace checks');
})().catch(e=>{console.error(e);process.exit(1)});
