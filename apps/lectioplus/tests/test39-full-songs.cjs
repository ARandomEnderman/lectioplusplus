const assert=require('node:assert/strict');
require('../extension/rhythm.js');
const R=globalThis.lectioPlusRhythm;
const rate=4000;
function pulseSong(duration,muted=false){
  const samples=new Float32Array(Math.ceil(rate*duration));
  for(let t=.32;t<duration && !muted;t+=.48){
    if(t>40 && t<49)continue;
    const i=Math.round(t*rate);
    samples.fill(.7,i,i+120);
  }
  return {duration,sampleRate:rate,numberOfChannels:1,getChannelData:()=>samples};
}
let audio;
globalThis.OfflineAudioContext=class{decodeAudioData(){return audio;}};
const file={name:'Mit nummer.wav',size:1234,arrayBuffer:async()=>new ArrayBuffer(1)};
(async()=>{
  for(const duration of [3.7,241.19]){
    audio=pulseSong(duration);
    for(const profile of [R.customTrack,R.popTracks[0]]){
      const r=await R.importRecording(file,profile);
      const t=r.chart;
      assert.equal(t.end,duration);
      assert(Math.abs(t.bpm-125)<=1);
      assert(t.targets.at(-1).time>duration-.85);
      assert(t.targets.every((n,i)=>n.time<duration && (!i||n.time-t.targets[i-1].time>=.22999)));
      assert(t.targets.every(n=>n.time<40.2||n.time>48.8));
      if(profile.custom)assert.equal(t.title,'Mit nummer');
      r.start+=.08;
      const shifted=R.fullChart(profile,r);
      assert(Math.abs(shifted.targets[1].time-t.targets[1].time-.08)<.001);
    }
  }
  const round=R.playingSession(R.popTracks[0]);
  for(const [i,path] of [...round.sliders].slice(0,2)){
    const n=round.track.targets[i];
    R.hit(round,n.x,n.y,n.time);
    assert.equal(round.following,path);
    const startScore=round.score,held=i===3;
    for(let t=n.time;t<path.end+.02;t+=.01)R.follow(round,t,R.sliderPoint(path,t),held);
    assert.equal(round.following,null);
    assert.equal(round.score,startScore+(held?100:0));
    if(!held)assert.equal(round.combo,0);
  }
  for(const held of [true,false]){
    const r=R.playingSession(R.popTracks[0]);
    const spinner=r.track.targets.find(n=>n.spinEnd);
    assert(spinner);
    R.advance(r,spinner.time);
    for(let t=spinner.time;t<spinner.spinEnd;t+=.01){
      const angle=t*Math.PI*4;
      R.follow(r,t,{x:320+70*Math.cos(angle),y:180+70*Math.sin(angle)},held);
    }
    R.advance(r,spinner.spinEnd);
    assert.equal(r.points,held?300:0);
  }
  audio=pulseSong(5,true);
  await assert.rejects(R.importRecording(file),/ingen hørbar lyd/);
  console.log('Full-length named and custom maps, rests, calibration, short songs and slider tracking passed');
})().catch(e=>{console.error(e);process.exit(1);});
