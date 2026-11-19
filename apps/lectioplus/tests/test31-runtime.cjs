const assert=require('node:assert/strict'),vm=require('node:vm');
const {run}=require('./helpers/workbench-vm.cjs');
let checks=0;const ok=(v,label)=>{assert.ok(v,label);checks++;};
const tick=()=>new Promise(resolve=>setTimeout(resolve,15));
(async()=>{
  const prompts=[],replies=[],values=['Elev æøå','', '  med mellemrum  '];
  const result=await run({language:'python',interactiveInput:true,stdin:'MÅ IKKE BRUGES',trace:true,code:`import builtins
print('START')
def læs():
    return builtins.input('Svar: ')
svar = []
for i in range(3):
    svar.append(læs())
print(repr(svar))
print('SLUT')`},(event,reply)=>{
    if(event.phase!=='input')return;
    prompts.push(event.requestId);const index=prompts.length-1;
    void tick().then(async()=>{if(index)await replies[index-1]('FORÆLDET');replies.push(reply);await reply(values[index]);await reply('DUBLET');});
  });
  ok(result.event.type==='result',result.event.message);
  ok(prompts.join(',')==='1,2,3','three separate interactive requests inside a function/loop');
  ok(result.event.result.text.includes("['Elev æøå', '', '  med mellemrum  ']"),'Unicode, empty line and significant spaces survive');
  ok(!/FORÆLDET|DUBLET|MÅ IKKE BRUGES/.test(result.event.result.text),'stale/duplicate/pre-filled answers cannot replace a live answer');
  ok(result.event.result.text.split('START').length===2,'program is suspended, not replayed from the beginning');
  ok(result.event.result.trace.length>0,'trace survives JSPI stack switching');
  ok(result.events.filter(e=>e.phase==='output').map(e=>e.text).join('')===result.event.result.text,'stream matches complete output');
  for(const event of result.events.filter(e=>e.phase==='input')){
    const previous=result.events[result.events.indexOf(event)-1];ok(previous.phase==='output'&&previous.text.endsWith('Svar: '),'prompt is flushed before requesting input');
  }
  let attempt=0;
  const retry=await run({language:'python',interactiveInput:true,code:`while True:
    try:
        tal = int(input('Tal: '))
        break
    except ValueError:
        print('Prøv igen')
print(tal * 2)`},(event,reply)=>{if(event.phase==='input')setTimeout(()=>reply(attempt++?'7':'ikke et tal'),10);});
  ok(retry.event.type==='result'&&retry.event.result.text.endsWith('14\n')&&attempt===2,'normal input conversion and retry loop work');
  const fixed=await run({language:'python',interactiveInput:false,stdin:'Elev\n12',code:'print(input(), int(input())+1)'});
  ok(fixed.event.result.text==='Elev 13\n'&&!fixed.events.some(e=>e.phase==='input'),'explicit pre-filled mode is unchanged');
  const grade=await run({language:'python',interactiveInput:true,mode:'stdout',code:'print(int(input())+1)',tests:[{stdin:['4'],expected:'5'}]});
  ok(grade.event.result.checks[0].passed&&!grade.events.some(e=>e.phase==='input'),'exercise tests always use their own inputs');
  const unsupported=await run({language:'python',interactiveInput:true,code:'input("Navn: ")'},()=>{},{setup:context=>vm.runInContext('delete WebAssembly.Suspending;delete WebAssembly.promising;',context)});
  ok(unsupported.event.type==='error'&&unsupported.event.message.includes('Opdatér Chrome/Edge'),'unsupported browser gets clear guidance');
  ok(!unsupported.events.some(e=>e.phase==='input'),'unsupported runtime never leaves a phantom prompt');
  console.log('TOTAL',checks,'Test 31 real Python interactive input checks (JSPI in Node VM, not live Chrome/Edge)');
})().catch(error=>{console.error(error);process.exit(1);});
