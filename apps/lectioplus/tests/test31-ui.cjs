const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM,VirtualConsole}=require('jsdom');
const {run}=require('./helpers/workbench-vm.cjs');
const root=path.resolve(__dirname,'..');let checks=0;const ok=(v,label)=>{assert.ok(v,label);checks++;};
const pause=()=>new Promise(resolve=>setTimeout(resolve,20));
async function until(fn){for(let i=0;i<750;i++){if(fn())return;await pause();}throw Error('UI condition timed out');}
(async()=>{
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',error=>{if(!/CSS stylesheet/.test(error.message))errors.push(error);});
  const dom=new JSDOM(fs.readFileSync(root+'/preview/index.html','utf8'),{url:'https://fixture.invalid/preview/index.html#lxp-tools/code-workshop',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document;
  try{
    w.structuredClone=structuredClone;w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>null;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
    w.Range.prototype.getBoundingClientRect=()=>({left:0,top:0,right:0,bottom:0,width:0,height:0});w.Range.prototype.getClientRects=()=>[];
    for(const script of [...d.querySelectorAll('script[src]')])w.eval(fs.readFileSync(path.resolve(root+'/preview',script.getAttribute('src')),'utf8'));await pause();
    const node=d.querySelector('.lxp-code-ide'),cm=node.querySelector('.CodeMirror').CodeMirror,terminal=node.querySelector('.lxp-code-terminal'),row=node.querySelector('.lxp-code-terminal-input'),answer=row.querySelector('input'),mode=node.querySelector('[aria-label="Python-input"]');
    const click=label=>{const b=[...node.querySelectorAll('button')].find(n=>n.textContent===label);assert.ok(b,label);b.click();};
    const enter=value=>{answer.value=value;answer.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));};
    const tab=label=>[...node.querySelectorAll('[role=tab]')].find(n=>n.textContent===label);
    let completion,payload;
    w.lectioPlusWorkbenchClient={execute:(p,progress)=>{payload=p;return completion=run(p,(event,reply)=>progress({...event,...(event.phase==='input'?{respond:value=>{void reply(value);return true;}}:{})})).then(r=>{if(r.event.type==='error')throw Error(r.event.message);return r.event.result;});}};
    ok(mode.value==='terminal'&&row.hidden,'interactive mode defaults on; field hidden until Python asks');
    cm.setValue('navn=input("Navn: ")\nalder=int(input("Alder: "))\nprint(f"Hej {navn}: {alder+1}")');click('Kør program');
    await until(()=>!row.hidden);
    ok(payload.interactiveInput===true&&terminal.textContent.endsWith('Navn: '),'real Python prompt reaches the terminal');
    ok(d.activeElement===answer&&tab('Terminal').getAttribute('aria-selected')==='true','input is focused in the selected terminal');
    ok(node.querySelector('[role=status]').textContent.includes('Venter på dit svar'),'waiting state is visible');
    ok(mode.disabled,'input mode cannot change mid-run');
    enter('Elev <b>æøå</b>');ok(row.hidden,'Enter submits and hides the current input');
    await until(()=>!row.hidden);
    ok(terminal.textContent.includes('Navn: Elev <b>æøå</b>\nAlder: '),'answer echoed once, followed by next prompt');
    answer.value='16';click('Send svar');await completion;await pause();
    ok(terminal.textContent.includes('Hej Elev <b>æøå</b>: 17'),'Python receives typed values and converts int normally');
    ok(!terminal.querySelector('b'),'answers/output render as text');
    ok(row.hidden&&node.dataset.running==='false'&&!mode.disabled,'completion hides input and restores controls');
    ok(terminal.textContent.split('Navn:').length===2,'prompt is not duplicated with final output');

    let delivered=0;
    w.lectioPlusWorkbenchClient={execute:(_p,progress,signal)=>new Promise((_resolve,reject)=>{
      progress({phase:'output',text:'Fortsæt? '});progress({phase:'input',respond:()=>{delivered++;return true;}});
      signal.addEventListener('abort',()=>reject(new w.DOMException('Stoppet','AbortError')));
    })};
    click('Kør program');ok(!row.hidden,'another program can wait for input');click('Stop program');await pause();click('Send svar');
    ok(row.hidden&&delivered===0&&terminal.textContent.includes('Programmet er stoppet'),'Stop removes input and blocks stale submission');
    let finish;
    w.lectioPlusWorkbenchClient={execute:(_p,progress)=>new Promise(resolve=>{finish=resolve;progress({phase:'input',respond:value=>{delivered++;ok(value==='','empty Enter is a real empty string');resolve({text:''});return true;}});})};
    click('Kør program');enter('');enter('');await pause();
    ok(delivered===1&&row.hidden,'empty answer submitted only once');
    ok(!terminal.textContent.includes('Ingen udskrift'),'interactive-only program does not get a misleading no-output hint');
    mode.value='prefilled';mode.dispatchEvent(new w.Event('change'));w.lectioPlusWorkbenchClient={execute:async p=>{payload=p;return {text:'test\n'};}};click('Kør program');await pause();
    ok(payload.interactiveInput===false,'pre-filled mode can be selected explicitly');
    ok(!errors.length,errors.map(e=>e.message).join('\n'));
  }finally{dom.window.close();}
  console.log('TOTAL',checks,'Test 31 terminal input controls with real Python (JSDOM/Node VM)');
})().catch(error=>{console.error(error);process.exit(1);});
