const assert = require('node:assert/strict');
require('../extension/rhythm.js');
require('../extension/games-core.js');
const R = globalThis.lectioPlusRhythm;
assert.equal(new Set(R.tracks.map(t=>t.id)).size,20);
assert.equal(new Set(R.tracks.map(t=>JSON.stringify(t.targets))).size,20);
for (const track of R.tracks) {
  const play = R.session(track);
  const melody = track.notes.filter(n=>n.voice!=='bass');
  for (const [i,n] of track.targets.entries()) {
    assert(melody.some(note=>note.time===n.time));
    assert(n.x>=28 && n.x<=612 && n.y>=28 && n.y<=332);
    assert(!i || n.time-track.targets[i-1].time>.22);
    R.hit(play,n.x,n.y,n.time);
  }
  assert.equal(play.points,300*track.targets.length);
  assert.equal(play.longest,track.targets.length);
  const miss = R.session(track), first=track.targets[0];
  R.hit(miss,first.x,first.y,first.time-.18);
  R.hit(miss,first.x+40,first.y,first.time);
  assert.equal(miss.index,0);
  R.hit(miss,first.x,first.y,first.time+.13);
  assert.equal(miss.points,50);
  R.advance(miss,track.end);
  assert.equal(miss.index,track.targets.length);
  assert.equal(miss.combo,0);
}
const C=globalThis.lectioPlusGamesCore;
const lights=C.create('lights');
assert(lights.board.flat().some(Boolean));
lights.board=Array.from({length:5},()=>Array(5).fill(0));
for(const [x,y] of [[0,0],[1,0],[0,1]])lights.board[y][x]=1;
C.act(lights,'cell',[0,0]);
assert.equal(lights.status,'won');
assert.equal(lights.moves,1);
console.log('20 synchronized scores, perfect runs, misses, bounds and Lights Out win passed');
