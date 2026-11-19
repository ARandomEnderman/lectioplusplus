const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {run}=require('./helpers/workbench-vm.cjs');
let checks=0;const ok=(value,label)=>{assert.ok(value,label);checks++;};
const output=result=>result.events.filter(e=>e.phase==='output').map(e=>e.text).join('');
async function python(code,extra={}){
  const result=await run({language:'python',code,...extra});
  ok(result.requests.length>0&&result.requests.every(url=>url.startsWith('blob:')),'bootstrap uses only bundled blobs, never the network');
  ok(!result.warnings.length,result.warnings.join('\n'));
  ok(result.events.every(e=>e.id===1),'events keep request ID');
  return result;
}
(async()=>{
  let result=await python('print("Hej fra Python")');
  ok(result.event.type==='result'&&result.event.result.text==='Hej fra Python\n','real browser loader reaches Python print');
  ok(output(result)===result.event.result.text,'stream matches final output');
  ok(result.events.findIndex(e=>e.phase==='output')<result.events.findIndex(e=>e.type==='result'),'output delivered before result');

  result=await python('print("æøå 🧪", end="")');
  ok(result.event.result.text==='æøå 🧪','partial UTF-8 line flushed without adding newline');
  result=await python('import sys\nprint("før", flush=True)\nsys.stderr.write("advarsel\\n")\nsys.stderr.flush()\nprint("efter", end="")');
  ok(output(result)==='før\nadvarsel\nefter','stdout/stderr order and partial final line');
  ok(result.events.some(e=>e.stream==='stderr'&&e.text==='advarsel\n'),'stderr remains a separate stream');

  result=await python('navn=input("Navn: ")\nalder=int(input("Alder: "))\nprint(f"Hej {navn}, {alder+1}")',{stdin:'Elev\n16'});
  ok(result.event.result.text==='Navn: Alder: Hej Elev, 17\n','input prompts and two prefilled answers');
  result=await python('print("bevar", end="")\nraise ValueError("min fejl")');
  ok(result.event.type==='error'&&/line 2[\s\S]+ValueError: min fejl/.test(result.event.message),'Python traceback propagated');
  ok(output(result)==='bevar','unflushed output survives an exception');
  result=await python('input()\ninput()',{stdin:'ét svar'});
  ok(result.event.type==='error'&&/EOFError/.test(result.event.message),'missing prefilled input is an explicit error');
  result=await python('x=2+3');ok(result.event.result.text==='','no invented output for assignments');
  result=await python('def solve(a,b):\n    return a+b',{entry:'solve',mode:'function',tests:[{args:[2,3],expected:5},{args:[-1,1],expected:0},{args:[3,4],expected:8}]});
  ok(result.event.result.checks.map(c=>c.passed).join(',')==='true,true,false','exercise grading through browser bootstrap');
  result=await run({language:'javascript',code:'console.log("JavaScript virker");'});
  ok(result.event.result.text==='JavaScript virker\n','JavaScript still runs');
  result=await run({language:'sql',code:'SELECT 2+3 AS svar;'});
  ok(result.event.result.tables[0].values[0][0]===5,'SQLite still runs');

  // Synchronous Worker/structured-clone errors previously escaped the relay.
  const sandbox=fs.readFileSync(path.resolve(__dirname,'../extension/workbench-sandbox.js'),'utf8');
  for(const failure of ['constructor','postMessage','async','messageerror']){
    const messages=[];let receive,instance;
    class Worker{constructor(){if(failure==='constructor')throw Error('Worker blokeret');instance=this;}postMessage(){if(failure==='postMessage')throw Error('Overførsel mislykkedes');}}
    const parent={},context={parent,Worker,Blob,URL:{createObjectURL:()=> 'blob:null/test'},addEventListener:(type,fn)=>{if(type==='message')receive=fn;}};
    vm.runInNewContext(sandbox,context);const port={start(){},postMessage:m=>messages.push(m)};
    receive({source:parent,data:{type:'lxp-workbench-sandbox'},ports:[port]});
    port.onmessage({data:{id:9,files:{worker:'/* test */'}}});
    if(failure==='postMessage')instance.onmessage({data:{type:'worker-ready',protocol:3}});
    if(failure==='async')instance.onerror({message:'Runtime blokeret',preventDefault(){}});
    if(failure==='messageerror')instance.onmessageerror();
    const failures=messages.filter(m=>m.type==='error');
    ok(failures.length===1&&failures[0].id===9,'sandbox forwards '+failure+' failure');
    ok(failures[0].message.startsWith('Kodeværkstedet kunne ikke starte:'),'startup error has an actionable context');
  }
  console.log('TOTAL',checks,'browser-branch bootstrap, output and sandbox error checks (Node VM, not a live browser)');
})().catch(error=>{console.error(error);process.exit(1);});
