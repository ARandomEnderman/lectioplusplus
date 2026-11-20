const assert=require('node:assert/strict');
require('../extension/quiz-games.js');require('../extension/arcade-collection.js');require('../extension/games-core.js');
const C=globalThis.lectioPlusGamesCore,A=globalThis.lectioPlusArcade;
function rng(seed){return ()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/2**32);}
const make=(id,opts={})=>C.create(id,{rng:rng(7),...opts});
const pick=(s,i)=>C.act(s,'pick',i);
assert.equal(new Set(C.catalog.map(g=>g.id)).size,30);
{
  const s=make('teacher'),names=['Anna','Bo','Camilla','Dan','Ellen'];
  pick(s,names[0]);assert.equal(s.score,0);
  names.forEach((name,i)=>{
    C.act(s,'question',{name,names,more:i<names.length-1});
    const q=s.rounds.at(-1);assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(name));
    pick(s,i%2?q.options.find(n=>n!==name):name);const score=s.score;pick(s,name);assert.equal(s.score,score);C.act(s,'next');
  });
  assert.equal(s.status,'won');assert.equal(s.correct,3);assert.equal(s.mistakes.length,2);
}
function profile(test){
  const s=make('choices');while(s.status==='playing')C.act(s,test(s.topics[s.index][0])?'yes':'no');
  return C.choiceProfile(s);
}
const all=profile(()=>true),none=profile(()=>false),food=profile(i=>'🍕🍍🍣🥞🌶️🍫🍦'.includes(i)),woods=profile(i=>'🏖️❄️🏕️🏃🚲🌅🌲'.includes(i));
assert.equal(new Set([all,none,food,woods].map(r=>r.title)).size,4);assert.match(food.body,/“/);
for(const difficulty of ['easy','normal','hard']){
  const s=make('flap',{difficulty});C.act(s,'jump');
  for(let frame=0;frame<5000&&s.status==='playing';frame++){
    const gate=s.gates.find(g=>g.x+47>=91);
    const target=gate?.mid??165;
    if(s.vy>0&&s.birdY>target+11)C.act(s,'jump');
    C.step(s,1/60);
  }
  assert.equal(s.status,'won',difficulty+' gates passed '+s.passed);assert.equal(s.passed,15);
}
let s=make('flap');C.act(s,'jump');for(let n=0;n<200;n++)C.step(s,.05);assert.equal(s.status,'lost');
s=make('moles');pick(s,s.hole);assert.equal(s.score,3);pick(s,1);assert.equal(s.score,2);
for(let n=0;n<605;n++)C.step(s,.05);assert.equal(s.status,'won');const stopped=s.time;C.step(s,.05);assert.equal(s.time,stopped);
s=make('echo');function show(s){for(let n=0;s.phase==='watch'&&n<220;n++)C.step(s,.05);assert.equal(s.phase,'repeat');}
while(s.status==='playing'){show(s);for(const i of [...s.sequence])pick(s,i);}
assert.equal(s.status,'won');s=make('echo');show(s);pick(s,(s.sequence[0]+1)%4);assert.equal(s.status,'lost');
const neighbors=(pos,w)=>[pos-w,pos+w,pos-1,pos+1].filter(i=>i>=0&&Math.abs(i%w-pos%w)+Math.abs(Math.floor(i/w)-Math.floor(pos/w))===1);
for(let seed=0;seed<80;seed++){
  s=make('slide',{rng:rng(seed)});let inversions=0;
  s.tiles.forEach((v,i)=>{if(v)inversions+=s.tiles.slice(i+1).filter(n=>n&&n<v).length;});
  assert.equal((inversions+4-Math.floor(s.tiles.indexOf(0)/4))%2,1);
}
s.tiles=Array.from({length:16},(_,i)=>(i+1)%16);[s.tiles[14],s.tiles[15]]=[0,15];pick(s,0);assert.equal(s.moves,0);pick(s,15);assert.equal(s.status,'won');
for(let seed=0;seed<36;seed++){
  s=make('sudoku',{rng:rng(seed)});
  function count(cells){
    const i=cells.indexOf(0);if(i<0)return 1;
    const clash=j=>i%4===j%4||(i>>2)===(j>>2)||(i>>3)===(j>>3)&&(i%4>>1)===(j%4>>1);
    let n=0;for(let k=1;k<5;k++)if(!cells.some((v,j)=>v===k&&clash(j))){cells[i]=k;n+=count(cells);cells[i]=0;}return n;
  }
  assert.equal(count([...s.cells]),1);for(let i=0;i<16;i++)if(!s.fixed[i]){pick(s,i);C.act(s,'digit',s.solution[i]);}assert.equal(s.status,'won');
}
s=make('code');s.secret=[1,1,2,3];for(const i of [1,2,1,1])pick(s,i);C.act(s,'check');assert.deepEqual([s.log[0].exact,s.log[0].other],[1,2]);
for(const i of s.secret)pick(s,i);C.act(s,'check');assert.equal(s.status,'won');
s=make('code');s.secret=[5,5,5,5];for(let i=0;i<8;i++){for(let n=0;n<4;n++)pick(s,0);C.act(s,'check');}assert.equal(s.status,'lost');
s=make('word');for(const ch of s.word)pick(s,ch);assert.equal(s.status,'won');s=make('word');for(const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ')if(!s.word.includes(ch))pick(s,ch);assert.equal(s.status,'lost');
function solution(s){
  const crates=s.id==='crates',queue=[{pos:s.pos,boxes:s.boxes||[],moves:[]}],seen=new Set();
  for(let i=0;i<queue.length;i++){
    const {pos,boxes,moves}=queue[i],key=[pos,...boxes].join(',');if(seen.has(key))continue;seen.add(key);
    if(crates?boxes.every(b=>s.map[b]==='.'):pos===s.exit)return moves;
    for(const to of neighbors(pos,s.width)){
      if(!s.map[to]||s.map[to]==='#')continue;
      const next=[...boxes];if(boxes.includes(to)){const dest=2*to-pos;if(s.map[dest]==='#'||boxes.includes(dest))continue;next[next.indexOf(to)]=dest;next.sort((a,b)=>a-b);}
      queue.push({pos:to,boxes:next,moves:[...moves,to]});
    }
  }
  throw Error('Unreachable room '+s.round);
}
for(const id of ['crates','maze']){
  s=make(id);for(let room=0;room<3;room++){
    if(id==='crates'){const original=s.pos;const walk=neighbors(s.pos,s.width).find(i=>s.map[i]===' ');pick(s,walk);C.act(s,'undo');assert.equal(s.pos,original);assert.equal(s.roomMoves,0);}
    for(const to of solution(s))pick(s,to);
  }assert.equal(s.status,'won');assert.equal(s.score,300);
}
s=make('reversi');assert.equal(s.legal.length,4);pick(s,0);assert.equal(s.moves,0);
while(s.status==='playing'){assert.deepEqual(s.legal,A.legal(s.board,s.player));pick(s,s.legal[0]);assert.ok(s.moves<=60);}
const black=s.board.filter(n=>n===1).length,white=s.board.filter(n=>n===2).length;assert.equal(s.winner,black===white?0:black>white?1:2);
console.log('30 games, 11 new rule sets, complete rounds, teacher quiz scoring and preference profiles verified.');

const Q=globalThis.lectioPlusQuizGames;
assert.equal(Q.catalog.length,5);assert.equal(new Set(Q.catalog.map(g=>g.id)).size,5);
const today1=make('dive'),today2=make('dive',{rng:rng(68)});
assert.deepEqual(today1.rows,today2.rows);assert.equal(today1.rows.length,7);assert.equal(new Set(today1.rows).size,7);
C.act(today2,'free');assert.equal(today2.mode,'free');assert.notDeepEqual(today2.rows,today1.rows);
for(let i=0;i<7;i++){
  const pool=today1.rows[i][1],rare=pool.at(-1).split('|').at(-1);
  C.act(today1,'guess',rare.toUpperCase());assert.equal(today1.result.points,100);
  C.act(today1,'guess',rare);assert.equal(today1.log.length,i+1);
  C.step(today1,27);assert.equal(today1.result.points,100);C.act(today1,'next');
}
assert.equal(today1.score,700);assert.equal(today1.status,'won');
C.step(today2,24.99);assert.equal(today2.result,null);C.step(today2,.02);assert.equal(today2.result.points,0);
C.act(today2,'next');C.act(today2,'guess','');assert.equal(today2.result,null);C.act(today2,'guess','nonsens');assert.equal(today2.result.points,0);
s=make('timeline');for(const card of s.rows){const slot=s.line.filter(([year])=>year<card[0]).length;C.act(s,'place',slot);assert.equal(s.result.points,100);assert.deepEqual(s.line.map(e=>e[0]),s.line.map(e=>e[0]).sort((a,b)=>a-b));C.act(s,'next');}assert.equal(s.score,700);assert.equal(s.status,'won');
s=make('higher');s.rows.forEach((row,i)=>{const [a,b]=row.pair;assert.notEqual(a[1],b[1]);const correct=b[1]>a[1]?'higher':'lower',wrong=correct==='higher'?'lower':'higher';C.act(s,i===2?wrong:correct);C.act(s,'next');});assert.equal(s.status,'won');assert.equal(s.score,700);assert.equal(s.longest,5);
s=make('atlas');for(let i=0;i<5;i++){const country=s.rows[i][0].split('|').at(-1);if(i===1)C.act(s,'clue');if(i===2){C.act(s,'guess','x');C.act(s,'guess','x');}if(i===3)C.act(s,'skip');else C.act(s,'guess',country);C.act(s,'next');}assert.equal(s.status,'won');assert.equal(s.score,300);
s=make('families');for(const group of s.groups){const words=group.slice(1);for(const w of words)pick(s,w);C.act(s,'check');}assert.equal(s.status,'won');assert.equal(s.score,400);
s=make('families');const groups=s.groups;const wrongs=[0,1,2,3].map(i=>groups.map(g=>g[i+1]));
for(const [i,wrong] of wrongs.entries()){
  for(const w of [...s.selected])pick(s,w);
  for(const w of wrong)pick(s,w);C.act(s,'check');C.act(s,'check');assert.equal(s.tried.length,i+1);
}assert.equal(s.status,'lost');
console.log('Five quiz games: daily and free decks, seven timed rounds, aliases, scoring, timeline, clues, streaks and connection puzzles verified.');
