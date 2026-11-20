const assert=require('node:assert/strict');
require('../extension/dash.js');require('../extension/games-core.js');
const C=globalThis.lectioPlusGamesCore,D=globalThis.lectioPlusDash;
assert.equal(new Set(D.levels.map(l=>l.title)).size,134);
const rated=D.levels.map(level=>D.rating(level));
assert.deepEqual([...new Set(rated.map(r=>r.name))].sort(),D.grades.map(g=>g.name).sort());
assert.equal(D.rating(D.buildCourse('Test',['cube'])),null);
for(const [i,level] of D.levels.entries()){
  const r=rated[i];assert.equal(r.unit,level.platform?'måner':'stjerner');
  assert.deepEqual([2,3,4,6,8,10,10,10,10,10][r.tier]<=r.amount && r.amount<=[2,3,5,7,9,10,10,10,10,10][r.tier],true);
}
const demons=D.levels.filter(l=>l.demon!=null);
assert.equal(new Set(demons.map(l=>l.modes.join('/'))).size,5);
for(const level of demons){
  assert.ok(new Set(level.modes).size>=3);
  assert.ok(level.notes.every(n=>Number.isFinite(n.pitch)&&n.duration>0&&n.time<level.end));
  assert.ok(level.objects.some(o=>o.kind==='saw'));
  const gate=level.objects.find(o=>o.kind==='gate');
  assert.ok(D.gateRelief(gate,gate.x)>0);
  assert.equal(D.gateRelief(gate,gate.x+gate.width/2),0);
  if(level.demon===2||level.demon===4){
    const walls=level.objects.filter(o=>o.kind==='passage');
    assert.ok(walls.length>=4);
    for(const wall of walls){
      const bottom=(wall.height+wall.endLow)/2,top=(wall.upper+wall.endHigh)/2;
      for(const [y,expected] of [[bottom-2,'lost'],[(bottom+top)/2-9,'playing'],[top-14,'lost']]){
        const state=C.create('dash',{level:level.id});
        Object.assign(state,{x:wall.x+wall.width/2,y,mode:'ship',grounded:false});
        C.step(state,.001);assert.equal(state.status,expected,level.title+' flight tunnel');
      }
    }
  }
  if(level.knots)assert.ok(level.knots.at(-1).x-level.knots[0].x<level.length/3);
  for(const saw of level.objects.filter(o=>o.kind==='saw')){
    for(const [offset,expected] of [[0,'lost'],[39,'playing']]){
      const state=C.create('dash',{level:level.id});
      Object.assign(state,{x:saw.x+saw.width/2,y:(saw.inverted?257-saw.height-offset:saw.height+offset)-11,grounded:false,gravity:saw.inverted?1:-1});
      C.step(state,.001);assert.equal(state.status,expected);
    }
  }
}
// The underside of a suspended deck is solid, including on the ceiling route.
for(const inverted of [false,true]){
  const course=D.buildCourse('Hængebro',['cube']);
  course.objects=[{kind:'ledge',x:240,width:40,height:65,thickness:20,inverted}];
  for(const [x,height,vy,expected] of [[255,65.1,-10,'land'],[255,24.9,100,'lost'],[232.2,47,0,'lost'],[255,7,0,'playing']]){
    const state=C.create('dash',{level:course});
    Object.assign(state,{x,y:inverted?235-height:height,vy:inverted?-vy:vy,gravity:inverted?1:-1,grounded:false});
    C.step(state,.01);
    if(expected==='land'){assert.equal(state.status,'playing');assert.equal(state.grounded,true);assert.equal(state.y,inverted?170:65);}
    else assert.equal(state.status,expected);
  }
}
for(const level of demons){
  const islands=level.objects.filter(o=>o.kind==='ledge'),spans=level.objects.filter(o=>o.kind==='spikebed');
  assert.ok(islands.length>=9&&spans.length===2,level.title);
  for(const o of level.objects.filter(o=>o.profile)){
    for(const [dx,depth] of o.profile)assert.ok(Math.abs(D.gateRelief(o,o.x+dx)-depth)<.001);
    const tip=o.profile[2][0];assert.equal(D.gateRelief(o,o.x+tip+4,7),0);
  }
  for(const coin of D.start(level.id).coinSites){
    const bed=spans.find(o=>coin.x>=o.x&&coin.x<=o.x+o.width);
    if(bed)assert.ok(islands.some(o=>coin.x>=o.x&&coin.x<=o.x+o.width&&Math.abs((o.inverted?257-coin.y:coin.y)-o.height-12)<1));
  }
}
// Find a clear with sustained presses. Minimising direction changes avoids a
// superhuman stream of taps while tracking the centre of a nearly flat tunnel.
const waveReplays=new WeakMap();
function planWaveInputs(level,state,hz){
  const dx=level.bpm*100/(60*hz);
  const exit=level.objects.find(o=>o.x>state.x&&D.forms[o.kind]&&o.kind!=='wave').x;
  const count=Math.ceil((exit-state.x)/dx);
  let paths=new Map([[0,{up:0,held:false,cost:0,parent:null}]]);
  for(let frame=1;frame<=count;frame++){
    const next=new Map(),x=state.x+frame*dx,wall=D.tunnel(level,x);
    for(const path of paths.values())for(const held of [false,true]){
      const up=path.up+Number(held),y=state.y+(2*up-frame)*dx;
      if(y<0||y>235)continue;
      const deviation=wall?Math.abs(y+11-wall.y)/(wall.r-8.5):0;
      if(deviation>1)continue;
      const cost=path.cost+(held!==path.held?1:0)+deviation*deviation*.007;
      const key=2*up+Number(held);
      if(!next.has(key)||cost<next.get(key).cost)next.set(key,{up,held,cost,parent:path});
    }
    paths=next;
  }
  let best;
  for(const path of paths.values())if(!best||path.cost<best.cost)best=path;
  if(!best)throw Error('Ingen wave-rute i '+level.title+' ved '+hz+' Hz');
  const inputs=[];while(best.parent){inputs.push(best.held);best=best.parent;}
  const turns=inputs.filter((held,i)=>i>0&&held!==inputs[i-1]).length;
  if(turns>2*(level.knots.length+1))throw Error('For mange retningsskift i '+level.title);
  return inputs;
}
function play(level,hz){
  const s=C.create('dash',{level:level.id||level}),keys=new Set(),jumped=new Set();
  for(let i=0;i<hz*90&&s.status==='playing';i++){
    keys.clear();if(level.platform)keys.add('right');
    if(s.mode==='wave'&&level.demon!=null){
      if(!waveReplays.has(s))waveReplays.set(s,planWaveInputs(level,s,hz));
      if(waveReplays.get(s).pop())keys.add('jump');
    }else if(s.mode==='wave'){
      const target=D.tunnel(level,s.x+level.bpm*100/(60*hz)),gate=level.objects.find(o=>o.kind==='gate'&&o.x+o.width+12>s.x);
      const aim=level.effect==='dual'?126:gate?gate.height+(gate.opening||91)/2:115;
      if(s.y+11<(target?.y??aim))keys.add('jump');
    }else if(s.mode==='ball'||s.mode==='spider'){
      const rail=level.objects.find(o=>o.kind==='railSpike'&&o.x+o.width+12>s.x);
      if(level.demon!=null&&s.mode==='ball'){
        const ahead=level.objects.find(o=>o.kind==='railSpike'&&o.x>s.x&&(o.height?1:-1)===s.gravity);
        if(s.grounded&&ahead&&ahead.x-s.x<117)C.act(s,'jump');
      }else if(s.grounded&&rail&&rail.x-s.x<175&&s.gravity===(rail.height?1:-1))C.act(s,'jump');
    }else if(s.mode==='swing'||s.mode==='ufo'){
      const gate=level.objects.find(o=>o.kind==='gate'&&o.x+o.width+10>s.x);
      const aim=gate?gate.height+(gate.opening||91)/2-12:104;
      if(s.mode==='ufo'){const trough=gate&&level.demon!=null?gate.height+9:aim-13;if(s.y<trough&&s.vy<=35)C.act(s,'jump');}
      else if((s.y+s.vy*.48<aim)!==(s.gravity>0))C.act(s,'jump');
    }else if(s.mode==='ship'){
      const gate=level.objects.find(o=>o.kind==='gate' && o.x+o.width+10>s.x);
      const aim=gate?gate.height+(level.demon!=null?gate.opening/2-9:34):110;
      if(s.y+s.vy*.47<aim)keys.add('jump');
    }else{
      if(s.grounded&&level.demon!=null){
        const y=s.gravity>0?235-s.y:s.y;
        const landing=level.objects.find(o=>o.kind==='ledge'&&o.x+o.width/2>s.x+60&&o.x<s.x+185);
        const platform=level.objects.find(o=>o.kind==='ledge'&&Math.abs(o.height-y)<1&&s.x>=o.x-8&&s.x<=o.x+o.width+8);
        if(landing){
          const drop=196*196-520*(landing.height-y);
          const reach=(196+Math.sqrt(Math.max(0,drop)))*100/260;
          if(landing.x+landing.width/2-s.x<=reach)C.act(s,'jump');
        }else if(platform?.last&&s.x>=platform.x+platform.width*.55)C.act(s,'jump');
      }
      for(const o of level.objects){
        if(jumped.has(o))continue;
        const before=o.x-s.x;
        if(o.kind==='orb' && Math.abs(before+12)<13 && !s.grounded){
          C.act(s,'jump');jumped.add(o);
        }
        if(s.mode==='robot'&&!s.grounded&&s.lift>0)keys.add('jump');
        if(!s.grounded)continue;
        if((o.kind==='spike'||o.kind==='saw'||o.kind==='block'||o.kind==='gap') && before<(s.mode==='robot'?55:42) && before>(s.mode==='robot'?45:32)){
          if(o.kind==='gap'&&level.objects.some(p=>p.kind==='pad'&&p.x===o.x-44))continue;
          C.act(s,'jump');jumped.add(o);if(s.mode==='robot')keys.add('jump');
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
  const idle=C.create('dash',{level:level.id||level});
  for(let i=0;i<5000 && idle.status==='playing';i++)C.step(idle,1/60);
  if(level.platform)assert.equal(idle.x,0);else assert.equal(idle.status,'lost');
}
// The first natural-gravity change must carry a falling cube up to a new floor.
const upsideDown=D.levels.find(level=>level.chapters?.some(part=>part.flip));
const invert=upsideDown.objects.find(o=>o.kind==='invert');
const reversed=C.create('dash',{level:upsideDown.id});
Object.assign(reversed,{x:invert.x-.02,y:40,vy:-30,grounded:false});
C.step(reversed,.001);
assert.equal(reversed.gravity,1);
assert.ok(Math.abs(reversed.y-40)<1);
for(let n=0;n<120 && !reversed.grounded;n++)C.step(reversed,1/60);
assert.equal(reversed.y,235);
assert.equal(reversed.grounded,true);
C.act(reversed,'jump');C.step(reversed,1/60);
assert.ok(reversed.y<235 && !reversed.grounded);
for(const level of D.levels.filter(l=>l.chapters)){
  assert.ok(level.notes.every((note,i,notes)=>i===0||note.time>=notes[i-1].time));
  for(const coin of D.start(level.id).coinSites){
    for(const o of level.objects.filter(o=>coin.x>=o.x-4 && coin.x<=o.x+o.width+4)){
      const height=o.inverted?257-coin.y:coin.y;
      if(o.kind==='block'||o.kind==='spike')assert.ok(height>(o.base||0)+o.height+4,level.title);
      if(o.kind==='gate')assert.ok(height>o.height+4 && height<o.height+o.opening-4,level.title);
    }
  }
}
for(const mode of Object.keys(D.forms)){
  const level=D.buildCourse('Portaltest',[mode]);
  for(const from of Object.keys(D.forms)){
    for(const y of [0,45,112,200,235]){
      for(const vy of [-105,80]){
        const s=C.create('dash',{level});
        Object.assign(s,{mode:from,x:199.98,y,vy,grounded:y===0});
        C.step(s,.001,new Set(['jump']));
        assert.ok(Math.abs(s.y-y)<1,'vertical jump from '+from+' into '+mode);
        if(from!==mode)assert.equal(s.status,'playing');
        assert.equal(s.mode,mode);
        const snapshot=D.checkpoint(s);
        assert.equal(snapshot.entryUntil,s.entryUntil);
      }
    }
  }
}
console.log('134 levels cleared at 30, 60 and 144 Hz. Continuous entry into all eight forms verified.');
