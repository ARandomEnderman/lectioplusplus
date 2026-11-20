const assert=require('node:assert/strict');
require('../extension/rhythm.js');
const R=globalThis.lectioPlusRhythm;
const custom=R.fullChart(R.customTrack,{
  analysis:{energy:Array(1800).fill(.8),flux:Array(1800).fill(0),step:.02,peak:1,bpm:128},
  buffer:{duration:36},start:0,detectedStart:0,recordId:'file-test',filename:'Egen sang.wav'
});
for(const track of [...R.tracks,...R.popTracks,custom]){
  for(const mode of ['taiko','mania','catch']){
    const s=R.modeSession(track,mode);
    if(mode==='catch'){
      for(const fruit of s.track.targets)R.modeTick(s,fruit.time,{x:fruit.x,sprint:true});
    }else{
      for(const note of s.track.targets)R.modePress(s,note.lane,note.time);
      R.modeTick(s,track.end);
    }
    assert.equal(s.hits,s.track.targets.length,track.id+' '+mode);
    assert.equal(s.points,300*s.hits);
    const idle=R.modeSession(track,mode);
    R.modeTick(idle,track.end+1);assert.equal(idle.index,idle.track.targets.length);
    if(mode!=='catch')assert.equal(idle.score,0);
  }
}
const track=R.tracks[1],session=R.modeSession(track,'mania');
const long=session.track.targets.find(note=>note.end);
R.modePress(session,long.lane,long.time);R.modeRelease(session,long.lane,long.time+.01);
assert.equal(session.hits,0);
const taiko=R.modeSession(track,'taiko'),first=taiko.track.targets[0];
R.modePress(taiko,1-first.lane,first.time);assert.equal(taiko.hits,0);
const roll=taiko.track.targets.find(note=>note.rollEnd);
R.modePress(taiko,roll.lane,roll.time);const previous=taiko.score;
R.modePress(taiko,0,roll.time+.05);assert.equal(taiko.score,previous+10);
const basket=R.modeSession(track,'catch');R.modeTick(basket,.02,{x:610,sprint:true});
assert.ok(basket.basket>320&&basket.basket<335);
console.log('Timing, misses, chords, long notes, rolls and reachable fruit verified across the built-in charts.');
