import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {loadPyodide} from '../extension/vendor/workbench/pyodide/pyodide.mjs';
import createPyodideModule from '../extension/vendor/workbench/pyodide/pyodide.asm.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../extension'),vendor=root+'/vendor/workbench/pyodide/';
let text='',count=0;
const py=await loadPyodide({indexURL:vendor,createPyodideModule:settings=>createPyodideModule({...settings,wasmBinary:new Uint8Array(fs.readFileSync(vendor+'pyodide.asm.wasm'))}),stdLibURL:vendor+'python_stdlib.zip',lockFileContents:fs.readFileSync(vendor+'pyodide-lock.json','utf8'),jsglobals:{},stdout:s=>text+=s+'\n',stderr:s=>text+=s+'\n'});
const source=fs.readFileSync(root+'/workbench-worker.js','utf8'),wrapper=source.match(/py\.runPythonAsync\(`([\s\S]+?)`\)/)[1];
const lessons=JSON.parse(fs.readFileSync(new URL('./fixtures/python-lesson-references.json',import.meta.url),'utf8'));
async function run(payload,stdin=[]){text='';let n=0;py.setStdin({stdin:()=>n<stdin.length?stdin[n++]:null});py.globals.set('_lxp_payload',JSON.stringify({trace:false,tests:[],entry:'',mode:'function',...payload}));return JSON.parse(await py.runPythonAsync(wrapper));}
for(const lesson of lessons){const result=await run({code:lesson.reference,tests:lesson.tests,entry:lesson.entry,mode:lesson.mode});assert.equal(result.checks.length,3);assert.ok(result.checks.every(x=>x.passed),lesson.title+JSON.stringify(result.checks));count+=3;}
const wrong=await run({code:'def solve(a,b):\n    return a-b',tests:[{args:[2,3],expected:5}],entry:'solve'});assert.equal(wrong.checks[0].passed,false);count++;
await run({code:'navn=input("Navn: ")\nprint("Hej "+navn)'},['Elev']);assert.match(text,/Hej Elev/);count++;
const trace=await run({code:'x=2\nx+=3\nprint(x)',trace:true});assert.ok(trace.trace.some(x=>x.line===3&&x.variables.x==='5'));count++;
await assert.rejects(run({code:'x=1\nprint(mangler)'}),/line 2[\s\S]+NameError/);count++;
await assert.rejects(run({code:'print(input())'},[]),/EOFError/);count++;
// Exercise grading does not accept booleans in place of numbers or missing output.
const types=await run({code:'def solve():\n    return True',tests:[{args:[],expected:1}],entry:'solve'});assert.equal(types.checks[0].passed,false);count++;
// Test 32: ordinary Python input APIs share a fresh stream for every test.
for(const code of ['print(input("Navn: "))','import builtins\nprint(builtins.input("Navn: "))','from builtins import input\nprint(input("Navn: "))','import sys\nprint(sys.stdin.readline(), end="")']){
  const result=await run({code,mode:'program',tests:[{stdin:['  Æble øå  '],expected:'  Æble øå  '},{stdin:[''],expected:''},{stdin:['andet svar'],expected:'andet svar'}]});
  assert.ok(result.checks.every(x=>x.passed),code+JSON.stringify(result));count+=3;
}
for(const code of ['import sys\nprint(sys.stdin.read(),end="")','import sys\nprint(sys.stdin.buffer.read().decode("utf-8"),end="")','import sys\nfor line in sys.stdin:\n print(line,end="")']){
  const result=await run({code,mode:'program',tests:[{stdin:['første','','sidste'],expected:'første\n\nsidste'},{stdin:[],expected:''}]});
  assert.ok(result.checks.every(x=>x.passed),code+JSON.stringify(result));count+=2;
}
const mixed=await run({code:'import sys\na=input("A: ")\nb=sys.stdin.readline().removesuffix("\\n")\nc=input("C: ")\nprint(a,b,c,sep="|")',mode:'program',tests:[{stdin:['1','2','3'],expected:'1|2|3'}]});
assert.ok(mixed.checks[0].passed,JSON.stringify(mixed));count++;
const eof=await run({code:'try:\n input()\nexcept EOFError:\n print("slut")',mode:'program',tests:[{stdin:[],expected:'slut'}]});assert.ok(eof.checks[0].passed);count++;
const exhausted=await run({code:'input()\ninput()',mode:'program',tests:[{stdin:['kun ét svar'],expected:''}]});assert.match(exhausted.checks[0].error,/^EOFError:/);count++;
const restored=await run({code:'from builtins import input\ns=input()\nif s=="fejl": raise ValueError("prøv igen")\nprint(s)',mode:'program',tests:[{stdin:['fejl'],expected:''},{stdin:['rigtigt'],expected:'rigtigt'}]});assert.match(restored.checks[0].error,/^ValueError:/);assert.ok(restored.checks[1].passed);count+=2;
for(const [code,expected,passed] of [['print("  hej  ")','  hej  ',true],['print("hej")','  hej  ',false],['print("hej\\n")','hej',false],['print("hej",end="")','hej',true],['print("a\\n\\nb")','a\n\nb',true]]){
  const result=await run({code,mode:'program',tests:[{stdin:[],expected}]});assert.equal(result.checks[0].passed,passed,code);count++;
}
for(const [expression,expected,passed]of [['1000000001',1000000000,false],['1000000001.0',1000000000,false],['1000000000.5',1000000000,false],['1000000000.0',1000000000,true],['{"tal":[1000000001]}',{tal:[1000000000]},false],['0.1+0.2',0.3,true],['sum([0.2]*10)',2,true],['float("inf")',1,false],['float("nan")',1,false],['False',0,false]]){
  const result=await run({code:'def solve():\n    return '+expression,entry:'solve',tests:[{args:[],expected}]});assert.equal(result.checks[0].passed,passed,expression);count++;
}
// Local SQLite data path uses the exact bundled WASM.
const init=createRequire(import.meta.url)(root+'/vendor/workbench/sql.js/dist/sql-wasm.js');const SQL=await init({wasmBinary:fs.readFileSync(root+'/vendor/workbench/sql.js/dist/sql-wasm.wasm')}),db=new SQL.Database();db.run('CREATE TABLE tal(x INTEGER);INSERT INTO tal VALUES(2),(4),(6);');assert.equal(db.exec('SELECT SUM(x) FROM tal')[0].values[0][0],12);db.close();count++;
console.log('TOTAL',count,'real Python/SQLite runtime checks');
