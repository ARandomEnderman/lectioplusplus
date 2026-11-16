const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const extension=path.resolve(__dirname,'../extension');let checks=0;
const ok=(value,label)=>{assert.ok(value,label);checks++;console.log('PASS',label)};
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM('<body></body>',{url:'https://www.lectio.dk/lectio/999999/forside.aspx',runScripts:'outside-only',virtualConsole:vc}),w=dom.window,d=w.document;
for(const name of ['school-math','school-special'])w.eval(fs.readFileSync(extension+'/'+name+'.js','utf8'));
const M=w.lectioPlusMath,run=(keys,model=M.classic())=>{for(const key of keys)model.press(key);return model};
for(const [keys,result] of [
 [['9','sqrt'],3],[['9','square'],81],[['4','reciprocal'],.25],[['7','±','abs'],7],
 [['2','^','1','0','='],1024],[['2','+','9','sqrt','='],5],[['9','sqrt','7'],7],
 [['1','2','+','9','9','CE','3','='],15],[['2','+','3','=','C','4','*','Ans','='],20]
]){const calc=run(keys);ok(!calc.state().error&&calc.state().value===result,'calculator result: '+keys.join(' '));}
const pi=run(['2','*','pi','=']);ok(Math.abs(pi.state().value-2*Math.PI)<1e-14,'pi retains full calculation precision');
for(const keys of [['9','±','sqrt'],['0','reciprocal'],['0','^','0','='],['1','0','^','9','9','9','=']])ok(Boolean(run(keys).state().error),'invalid domain is rejected: '+keys.join(' '));
const memory=run(['5','MS','C','2','M+']);ok(memory.state().memory===7&&memory.state().value===2,'M+ changes memory without replacing current input');
run(['M-','C','MR'],memory);ok(memory.state().memory===5&&memory.state().value===5,'M- and MR preserve memory through C');
run(['C','8','/','0','=','MS'],memory);ok(memory.state().memory===5,'an error cannot be saved over valid memory');
run(['MR','='],memory);ok(!memory.state().error&&memory.state().value===1.6,'memory recall can correct an invalid right operand');
memory.press('MC');ok(memory.state().memory===null,'MC clears only memory');
const hist=run(['2','+','3','=','=','=']);ok(hist.state().records.length===3&&hist.state().records.map(x=>x.result).join(',')==='11,8,5','history records repeated equals with actual results');
const snapshot=hist.state();snapshot.records[0].result=999;ok(hist.state().records[0].result===11,'history snapshots cannot mutate calculator state');
hist.press('C');hist.press('2');hist.press('*');hist.use(5);hist.press('=');ok(hist.state().value===10,'a reused result can become the current operand');
for(let i=0;i<30;i++)hist.press('=');ok(hist.state().records.length===20,'history is bounded to the latest 20 results');
const current=hist.state().value;hist.press('clear-history');ok(hist.state().records.length===0&&hist.state().value===current,'clearing history leaves current result intact');
const underflow=M.classic();underflow.use(1e-200);underflow.press('square');ok(Boolean(underflow.state().error),'square reports unrepresentable underflow rather than false zero');

const E=(tag,classes='',...children)=>{const node=d.createElement(tag);node.className=classes;node.append(...children);return node};
const B=(classes,label,action,...children)=>{const node=E('button',classes,...children);node.type='button';node.setAttribute('aria-label',label);node.addEventListener('click',action);return node};
const tool=w.lectioPlusSchoolSpecial('basic',{E,B,error:(node,message)=>{node.textContent=message}});d.body.append(tool.node);
const click=key=>tool.node.querySelector('[data-key="'+key+'"]').click();
const display=()=>tool.node.querySelector('output').textContent;
ok(!tool.node.querySelector('.lxp-calculator-extras').open&&tool.node.querySelectorAll('.lxp-calculator-keys button').length===20,'standard keypad remains compact with extras collapsed');
for(const key of ['9','sqrt','MS'])click(key);ok(display()==='3'&&tool.node.querySelector('.lxp-calculator-memory-state').textContent==='M = 3','extra buttons update display and visible memory state');
click('C');click('MR');ok(display()==='3','memory buttons remain usable after clear');
click('C');for(const key of ['2','+','3','='])click(key);tool.node.querySelector('.lxp-calculator-history-item').click();ok(display()==='5','clicking a history result reuses it');
const copied=[];Object.defineProperty(w.navigator,'clipboard',{configurable:true,value:{writeText:async text=>copied.push(text)}});
(async()=>{
 tool.node.querySelector('[aria-label="Kopiér resultat"]').click();await new Promise(resolve=>setTimeout(resolve,0));
 ok(copied[0]==='5'&&tool.node.querySelector('.lxp-calculator-copy-status').textContent.includes('kopieret'),'copy button copies the displayed number and confirms success');
 w.navigator.clipboard.writeText=async()=>{throw Error('Clipboard unavailable')};tool.node.querySelector('[aria-label="Kopiér resultat"]').click();await new Promise(resolve=>setTimeout(resolve,0));
 ok(tool.node.querySelector('.lxp-calculator-copy-status').textContent.includes('manuelt'),'blocked clipboard has an honest manual-copy fallback');
 click('C');click('0');click('reciprocal');ok(tool.node.querySelector('[aria-label="Kopiér resultat"]').disabled&&tool.node.querySelector('.lxp-tool-output').textContent.includes('Division med nul'),'invalid result is visible and cannot be copied as a number');
 click('C');click('8');tool.node.querySelector('.lxp-classic-calculator').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Delete',bubbles:true,cancelable:true}));ok(display()==='0','Delete clears the current entry');
 const event=new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});tool.node.querySelector('[data-key=sqrt]').dispatchEvent(event);ok(!event.defaultPrevented,'Enter on a focused function keeps native keyboard button activation');
 ok(!errors.length,'extra calculator functions have no DOM errors');dom.window.close();console.log('TOTAL',checks,'extended calculator checks');
})().catch(e=>{console.error(e);process.exit(1)});
