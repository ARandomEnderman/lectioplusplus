const assert=require('node:assert/strict');
require('../extension/rhythm.js');
const R=globalThis.lectioPlusRhythm;
const all=[...R.tracks,...R.popTracks];
assert.equal(new Set(all.map(t=>t.id)).size,30);
assert.equal(R.popTracks[0].title,'California Gurls');
assert.equal(R.popTracks.length,10);
assert.equal(new Set(R.popTracks.map(t=>JSON.stringify(t.targets))).size,10);
for(const t of R.popTracks){
  const s=R.session(t);
  for(const [i,n] of t.targets.entries()){
    assert(n.time<t.end && (!i || n.time>t.targets[i-1].time));
    assert(t.notes.some(note=>note.time===n.time));
    R.hit(s,n.x,n.y,n.time);
  }
  assert.equal(s.hits,t.targets.length);
}
const rate=16000,track=R.popTracks[0],samples=new Float32Array(rate*55);
for(let t=.31;t<54;t+=60/track.bpm){
  const i=Math.round(t*rate);samples.fill(.6,i,i+200);
}
const buffer={getChannelData:()=>samples,sampleRate:rate,duration:samples.length/rate};
assert(Math.abs(R.firstBeat(buffer,track.bpm)-.31)<.015);

(async()=>{
  globalThis.OfflineAudioContext=class{decodeAudioData(){return buffer;}};
  const file={arrayBuffer:async()=>new ArrayBuffer(8),name:'test.wav',size:8};
  const recording=await R.importRecording(file,track);
  assert.equal(recording.id,track.id);
  await assert.rejects(R.importRecording({...file,size:70*1024*1024},track),/64 MB/);
  await assert.rejects(R.importRecording(file,{...track,end:100}),/for kort/);
  let args,closed=false;
  globalThis.AudioContext=class{
    currentTime=2;
    createBufferSource(){return {connect(){},start(...a){args=a;}};}
    createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){}};}
    resume(){return Promise.resolve();}
    close(){closed=true;return Promise.resolve();}
  };
  let p=R.playRecording(track,recording,0);
  assert(Math.abs(args[0]-(2+1.5-recording.start))<.00001);
  assert.equal(args[1],0);assert.equal(p.now(),0);p.close();assert(closed);
  p=R.playRecording(track,recording,8);
  assert.equal(args[0],2);assert(Math.abs(args[1]-(8+recording.start-1.5))<.00001);
  assert.equal(p.now(),8);p.close();
  console.log('10 pop charts, beat alignment, import limits and recording pause/resume passed');
})().catch(e=>{console.error(e);process.exit(1);});
