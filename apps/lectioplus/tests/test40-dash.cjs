const assert=require('node:assert/strict');
require('../extension/dash.js');require('../extension/games-core.js');
const C=globalThis.lectioPlusGamesCore,D=globalThis.lectioPlusDash;
assert.equal(new Set(D.levels.map(l=>l.title)).size,15);
function play(level,hz){
  const s=C.create('dash',{level:level.id}),keys=new Set(),jumped=new Set();
  for(let i=0;i<hz*90&&s.status==='playing';i++){
    keys.clear();
    if(s.mode==='ship'){
      const gate=level.objects.find(o=>o.kind==='gate' && o.x+o.width+10>s.x);
      const aim=gate?gate.height+34:110;
      if(s.y+s.vy*.47<aim)keys.add('jump');
    }else{
      for(const o of level.objects){
        if(jumped.has(o))continue;
        const before=o.x-s.x;
        if(o.kind==='orb' && Math.abs(before+12)<13 && !s.grounded){
          C.act(s,'jump');jumped.add(o);
        }
        if(!s.grounded)continue;
        if((o.kind==='spike'||o.kind==='block'||o.kind==='gap') && before<42 && before>32){
          if(o.kind==='gap'&&level.objects.some(p=>p.kind==='pad'&&p.x===o.x-44))continue;
          C.act(s,'jump');jumped.add(o);
        }
      }
    }
    C.step(s,1/hz,keys);
  }
  assert.equal(s.status,'won',level.title+' at '+s.x.toFixed(1)+' y='+s.y+' '+s.mode+' '+hz+' Hz');
  assert.equal(s.score,100);
}
for(const level of D.levels){
  for(const hz of [30,60,144])play(level,hz);
  const idle=C.create('dash',{level:level.id});
  for(let i=0;i<5000 && idle.status==='playing';i++)C.step(idle,1/60);
  assert.equal(idle.status,'lost');
}
console.log('All 15 courses completed through gameplay inputs at 30, 60 and 144 Hz. All punish missed inputs.');
