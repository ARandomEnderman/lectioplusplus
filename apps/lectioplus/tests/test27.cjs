const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM,VirtualConsole}=require('jsdom');
const {run}=require('./helpers/workbench-vm.cjs');
const root=path.resolve(__dirname,'..');let checks=0;const ok=(v,label)=>{assert.ok(v,label);checks++;};
const pause=()=>new Promise(r=>setTimeout(r,40));
(async()=>{
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/CSS stylesheet/.test(e.message))errors.push(e);});
  const dom=new JSDOM(fs.readFileSync(root+'/preview/index.html','utf8'),{url:'https://fixture.invalid/preview/index.html#lxp-tools/code-workshop',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window,d=w.document;
  try{
    w.structuredClone=structuredClone;w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>null;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
    w.Range.prototype.getBoundingClientRect=()=>({left:0,top:0,right:0,bottom:0,width:0,height:0});w.Range.prototype.getClientRects=()=>[];
    for(const script of [...d.querySelectorAll('script[src]')])w.eval(fs.readFileSync(path.resolve(root+'/preview',script.getAttribute('src')),'utf8'));await pause();
    const node=d.querySelector('.lxp-code-ide'),cm=node.querySelector('.CodeMirror').CodeMirror,terminal=node.querySelector('.lxp-code-terminal'),status=node.querySelector('.lxp-code-statusbar [role=status]');
    const click=label=>{const button=[...node.querySelectorAll('button')].find(b=>b.textContent===label);assert.ok(button,label);button.click();};
    const tab=label=>[...node.querySelectorAll('[role=tab]')].find(n=>n.textContent===label);
    let calls=0,completion;
    w.lectioPlusWorkbenchClient={execute:(payload,progress)=>{
      calls++;
      return completion=run(payload,progress).then(result=>{if(result.event.type==='error')throw Error(result.event.message);return result.event.result;});
    }};
    cm.setValue('print("Hej fra terminalen")\nprint(2+3)');
    tab('Input').click();click('Terminal');ok(node.querySelector('.lxp-code-panel').hidden,'panel can start hidden');
    click('Kør program');
    ok(!node.querySelector('.lxp-code-panel').hidden&&tab('Terminal').getAttribute('aria-selected')==='true','run opens the terminal');
    ok(terminal.textContent.includes('Starter Python lokalt…'),'startup feedback visible before runtime completes');
    await completion;await pause();
    ok(terminal.querySelector('[data-stream=stdout]').textContent==='Hej fra terminalen\n5\n','actual Python browser-branch output reaches terminal DOM');
    ok(terminal.textContent.includes('Kørsel afsluttet')&&status.textContent==='Kørsel afsluttet.','successful result and status');
    ok(node.dataset.running==='false','controls released after execution');
    ok(terminal.textContent.split('Hej fra terminalen').length===2,'streamed output not duplicated');
    cm.setValue('   ');tab('Input').click();click('Kør program');await pause();
    ok(calls===1&&terminal.textContent.includes('Skriv noget kode først.'),'empty code gives terminal validation without runtime call');
    ok(tab('Terminal').getAttribute('aria-selected')==='true'&&status.dataset.error==='true','validation error visibly selected');

    cm.setValue('x=2+3');w.lectioPlusWorkbenchClient={execute:async()=>({text:''})};click('Kør program');await pause();
    ok(terminal.textContent.includes('Brug print(...) for at vise et resultat.'),'silent program explains print');
    ok(status.dataset.error==='false','valid run clears previous error');
    let rejectRun;
    w.lectioPlusWorkbenchClient={execute:()=>new Promise((_,reject)=>rejectRun=reject)};
    click('Kør program');tab('Input').click();rejectRun(Error('Kodeværkstedet kunne ikke starte: Worker blokeret'));await pause();
    ok(tab('Terminal').getAttribute('aria-selected')==='true','startup failure brings terminal into view');
    ok(terminal.textContent.includes('Worker blokeret')&&status.dataset.error==='true','startup error is visible');
    ok(node.dataset.running==='false','failed startup releases run button');
    const inputMode=node.querySelector('[aria-label="Python-input"]');inputMode.value='prefilled';inputMode.dispatchEvent(new w.Event('change'));
    w.lectioPlusWorkbenchClient={execute:async()=>{throw Error('EOFError: EOF when reading a line');}};click('Kør program');await pause();
    ok(terminal.textContent.includes('Der mangler forudfyldte svar'),'input exhaustion explains prefilled Input tab');
    w.lectioPlusWorkbenchClient={execute:async()=>({text:'Prøv igen\n'})};click('Kør program');await pause();
    ok(terminal.textContent.includes('Prøv igen')&&!terminal.textContent.includes('EOFError'),'new run works after failure and clears old error');
    ok(!errors.length,errors.map(e=>e.message).join('\n'));
  }finally{dom.window.close();}
  console.log('TOTAL',checks,'Test 27 terminal checks (JSDOM plus real Python in Node VM)');
})().catch(error=>{console.error(error);process.exit(1);});
