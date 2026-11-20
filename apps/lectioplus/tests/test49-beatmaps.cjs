const assert = require('node:assert/strict');
require('../extension/rhythm.js');
const R = globalThis.lectioPlusRhythm;

let buffer;
globalThis.OfflineAudioContext = class { async decodeAudioData() { return buffer; } };
const file = {name:'Rytmeprøve.wav', size:100, arrayBuffer:async () => new ArrayBuffer(1)};
const sampleRate = 8000;
function recording(times, duration) {
  const right = new Float32Array(duration * sampleRate);
  for (const [i,time] of times.entries()) {
    const start = Math.round(time * sampleRate);
    for (let j=0;j<240 && start+j<right.length;j++) {
      right[start+j] = Math.sin(j*.8)*Math.exp(-j/60)*(i%2?.32:.85);
    }
  }
  const left = new Float32Array(right.length);
  return {duration, sampleRate, numberOfChannels:2, getChannelData:i=>i?right:left};
}
function timesBetween(start,end,interval) {
  const times=[];
  for (let t=start;t<end-.03;t+=interval) times.push(t);
  return times;
}
(async()=>{
  for (const bpm of [92,180,208,249,250,251,300,357,420,600,900,1200,1500]) {
    const pulses=timesBetween(.32,17.8,60/bpm);
    buffer=recording(pulses,18);
    const {chart}=await R.importRecording(file);
    assert(Math.abs(chart.bpm-bpm)<4,'detected '+chart.bpm+' at '+bpm+' BPM');
    assert.equal(chart.targets.length,pulses.length,'strong and weak attacks retained at '+bpm);
    if(bpm>=300){
      const dense=R.newChart(chart,'dense',271);
      assert(dense.targets.length>=pulses.length*.76,'dense map keeps the quick pulse at '+bpm);
      assert(dense.targets.some((note,i)=>i && note.time-dense.targets[i-1].time<1.1*60/bpm),'consecutive fast beats are playable');
    }
  }
  const drums=[...timesBetween(.4,8,.50),...timesBetween(10,18,.15)];
  buffer=recording(drums,18);
  const {chart}=await R.importRecording(file);
  const cases=[R.newChart(chart,'normal',271),R.newChart(chart,'normal',985)];
  for (const map of cases) {
    assert(map.targets.every(n=>drums.some(t=>Math.abs(t-n.time)<.016)),'every note lands on an audible attack');
    assert(map.targets.filter(n=>n.time>=10).length>1.8*map.targets.filter(n=>n.time<8).length,'double-time section gains notes without speeding up the audio');
    assert.equal(map.end,18);
  }
  assert.notDeepEqual(cases[0].targets.map(n=>n.time),cases[1].targets.map(n=>n.time));
  assert.notDeepEqual(cases[0].targets.map(n=>n.x),cases[1].targets.map(n=>n.x));
  assert.deepEqual(cases[0],R.newChart(chart,'normal',271),'same seed can reconstruct the round');
  assert(R.newChart(chart,'dense',271).targets.length>R.newChart(chart,'sparse',271).targets.length);
  for(const song of [...R.tracks,...R.popTracks,chart]){
    const a=R.newChart(song,'dense',219), b=R.newChart(song,'dense',432);
    assert.notDeepEqual(a.targets.map(n=>n.time),b.targets.map(n=>n.time),song.title);
    assert(a.targets.every((n,i)=>n.x>=28&&n.x<=612&&n.y>=28&&n.y<=332&&(!i||n.time>a.targets[i-1].time)));
    for(const mode of ['mania','taiko','catch']){
      const round=R.modeSession(a,mode);
      for(const n of round.track.targets){
        if(mode==='catch')R.modeTick(round,n.time,{x:n.x,sprint:true});
        else R.modePress(round,n.lane,n.time);
      }
      R.modeTick(round,a.end);
      assert.equal(round.hits,round.track.targets.length,song.title+' '+mode);
    }
  }
  const media={pause(){}, play(){return Promise.resolve();}, currentTime:0};
  const player=R.mediaPlayback(media,chart,3,1.37);
  assert.equal(media.playbackRate,1.37);assert.equal(player.now(),3);
  let clock,source;
  globalThis.AudioContext=class {
    constructor(){clock=this;this.currentTime=10;}
    createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){}};}
    createBufferSource(){return source={playbackRate:{},connect(){},start(...args){this.args=args;}};}
    resume(){return Promise.resolve();}
  };
  const fallback=R.playRecording(chart,{buffer,file},3,1.5);
  assert.equal(source.playbackRate.value,1.5);assert.equal(source.args[1],3);
  clock.currentTime+=2;assert.equal(fallback.now(),6);
  const synth=R.playback(R.tracks[0],3,.75);
  clock.currentTime+=2;assert.equal(synth.now(),4.5);
  console.log('Beatmaps verified: 92–1500 BPM, right-channel accents, tempo changes, rests, per-round variants, four modes and playback clocks.');
})().catch(e=>{console.error(e);process.exitCode=1;});
