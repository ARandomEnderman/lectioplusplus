// Exercise all 125 lessons through the shipped worker and bundled CPython.
// This VM uses the runtime's browser bootstrap; it does not test browser CSP.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {run}=require('./helpers/workbench-vm.cjs');
const lessons=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/python-lesson-references.json'),'utf8'));
const published={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../extension/school-code-lessons.js'),'utf8'),published);
const visible=JSON.parse(JSON.stringify(published.lectioPlusCodeLessons));
assert.equal(lessons.length,125);
assert.deepEqual(visible,lessons.map(({reference,...lesson})=>lesson),'audit fixtures must match every exercise actually shown to the pupil');
const literal=data=>JSON.stringify(JSON.stringify(data));
function equal(actual,expected){
  if(typeof actual==='number'&&typeof expected==='number')return Number.isInteger(expected)?actual===expected:Math.abs(actual-expected)<=Math.max(1e-8,1e-8*Math.max(Math.abs(actual),Math.abs(expected)));
  if(Array.isArray(expected))return Array.isArray(actual)&&actual.length===expected.length&&actual.every((value,i)=>equal(value,expected[i]));
  if(expected&&typeof expected==='object')return actual&&typeof actual==='object'&&Object.keys(actual).length===Object.keys(expected).length&&Object.keys(expected).every(key=>Object.hasOwn(actual,key)&&equal(actual[key],expected[key]));
  return actual===expected;
}
let graded=0,executed=0,inputRequests=0;
(async()=>{
  for(let level=1;level<=5;level++){
    const group=lessons.filter(lesson=>lesson.level===level);assert.equal(group.length,25);
    // Every assessment gets its own worker/runtime just like Test min løsning.
    for(const lesson of group){
      const result=await run({language:'python',code:lesson.reference,tests:lesson.tests,entry:lesson.entry,mode:lesson.mode,interactiveInput:false,stdin:'SKAL IKKE BRUGES'});
      assert.equal(result.event.type,'result',lesson.title+': '+result.event.message);
      assert.equal(result.event.result.checks.length,lesson.tests.length);
      assert.ok(result.event.result.checks.every(check=>check.passed),lesson.title+': '+JSON.stringify(result.event.result.checks));
      assert.ok(!result.events.some(event=>event.phase==='input'),'grading must not ask the pupil to answer test inputs');
      assert.ok(result.requests.every(url=>url.startsWith('blob:')),'all task modules must work offline');
      graded+=lesson.tests.length;
    }
    // Ordinary Kør program path: no grading branch or input replacement by
    // the harness. Only program exercises request actual interactive replies.
    // Batch one level to avoid 375 additional CPython bootstraps, with a fresh
    // namespace and fresh arguments for every reference execution.
    const program=group[0].mode==='program';
    const code=program?`import json
for lesson in json.loads(${literal(group)}):
    for case in lesson['tests']:
        exec(compile(lesson['reference'], '<elevkode>', 'exec'), {'__name__': '__main__'})
`:`import json
results = []
for lesson in json.loads(${literal(group)}):
    for case in lesson['tests']:
        scope = {'__name__': '__main__'}
        exec(compile(lesson['reference'], '<elevkode>', 'exec'), scope)
        results.append(scope[lesson['entry']](*case['args']))
print(json.dumps(results, ensure_ascii=False))
`;
    assert.ok(code.length<=100000,'batch must respect the editor limit');
    const answers=group.flatMap(lesson=>lesson.tests.flatMap(test=>test.stdin||[]));let used=0;
    const result=await run({language:'python',code,interactiveInput:true,stdin:'SKAL IKKE BRUGES'},(event,reply)=>{
      if(event.phase!=='input')return;
      assert.ok(used<answers.length,'unexpected input request in level '+level);
      const answer=answers[used++];setTimeout(()=>reply(answer),0);
    });
    assert.equal(result.event.type,'result','Kør program, level '+level+': '+result.event.message);
    assert.equal(used,answers.length,'all exercise inputs must be requested');inputRequests+=used;
    if(program){
      const expected=group.flatMap(lesson=>lesson.tests.map(test=>test.expected+'\n')).join('');
      assert.equal(result.event.result.text,expected,'normal print output, including empty lines and spaces');
    }else{
      const actual=JSON.parse(result.event.result.text),expected=group.flatMap(lesson=>lesson.tests.map(test=>test.expected));
      assert.equal(actual.length,expected.length);
      expected.forEach((value,i)=>assert.ok(equal(actual[i],value),group[Math.floor(i/3)].title+' normal run: '+JSON.stringify(actual[i])));
    }
    assert.ok(result.requests.every(url=>url.startsWith('blob:')),'normal execution also stays offline');
    executed+=group.reduce((n,lesson)=>n+lesson.tests.length,0);
    console.log('Niveau',level+':',25,'opgaver bestået ved både kørsel og bedømmelse');
  }
  assert.equal(graded,375);assert.equal(executed,375);
  console.log('TOTAL',graded+executed,'Test 32 exercise executions; 125 lessons,',inputRequests,'interactive answers (real Python/Node VM, not live Chrome/Edge)');
})().catch(error=>{console.error(error);process.exit(1);});
