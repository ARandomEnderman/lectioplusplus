(() => {
  'use strict';
  // Each phrase occupies eight beats. Positions and physics share a beat clock.
  const scores=[
    ['Lysstart',104,'#4ce6d0','ss bs ds sb ss db bs ds','02474251'],
    ['Kobbertrin',110,'#ffc173','bs ss bd sb db bs dd sb','03757320'],
    ['Brobygger',112,'#81b5ff','gs bs sg bd gs db gb ds','04725470'],
    ['Dobbeltpuls',116,'#f28fc2','dd bs gd sb db dg bs dd ds','02577542'],
    ['Fjederfelt',118,'#f7cb57','ps gs bp ds pg bd sp dd','03587530'],
    ['Luftpost',116,'#77e0ff','bs ds F gs sd F bp ds','07452742'],
    ['Månering',120,'#d497fd','os bs go ds op bs og dd','05270375'],
    ['Understrøm',122,'#52e2ba','pg F og db V gs pb os ds','02724752'],
    ['Glasloft',126,'#89b4ff','bg V ds op F bg V pd go','04797542'],
    ['Overgear',132,'#ff927d','dq bd pg os qd gp db qo ds','07357520'],
    ['Laserlinje',134,'#ff83bb','oq V qp dg F op qg V db','02597254'],
    ['Polarlys',138,'#bca2ff','F pg V oq gd F qo V bd F','04729570'],
    ['Tyngdepunkt',142,'#6ee9d8','og qp ds V gq po F qo dp go','07529742'],
    ['Kredsløb',148,'#ffc466','qp F oq V qd pg V go F dq og','03975372'],
    ['Sidste signal',154,'#fd8fa7','dg oq V qp F og dq V qo gp F qd','07297542']
  ];
  const levels=scores.map(([title,bpm,color,score,motif],i)=>{
    const objects=[],notes=[],sections=score.split(' ');
    function put(kind,x,width,height=0){objects.push({kind,x,width,height});}
    function obstacle(letter,at){
      if(letter==='s'||letter==='d'||letter==='q'){
        const count={s:1,d:2,q:3}[letter];
        for(let k=0;k<count;k++)put('spike',at+k*24,24,28);
      }else if(letter==='b')put('block',at,75,34);
      else if(letter==='g')put('gap',at,60);
      else if(letter==='p'){
        put('pad',at,24);put('gap',at+44,95);
        put('spike',at+70,28,43);
      }else if(letter==='o'){
        put('gap',at+12,180);put('orb',at+66,26,58);
      }
    }
    sections.forEach((phrase,n)=>{
      const x=(4+8*n)*100;
      if(phrase==='F'||phrase==='V'){
        put('ship',x,0);put('cube',x+700,0);
        [0,1,2].forEach(k=>{
          const high=(phrase==='F')===(k%2===0);
          put('gate',x+135+196*k,42,high?114:47);
        });
      }else{
        obstacle(phrase[0],x+100);obstacle(phrase[1],x+475);
      }
    });
    const beats=sections.length*8+6, beat=60/bpm;
    const scale=[0,2,3,5,7,9,10,12,14,15];
    for(let k=0;k<beats;k++){
      const root=42+(i%6)+[0,5,3,7][Math.floor(k/8)%4];
      notes.push({time:k*beat,duration:beat*.55,pitch:root,voice:'bass'});
      const pitch=root+12+scale[Number(motif[k%8])];
      notes.push({time:(k+.5)*beat,duration:beat*.32,pitch,voice:'pluck'});
      if(k%4===3)notes.push({time:(k+.75)*beat,duration:beat*.19,pitch:pitch+7,voice:'bell'});
    }
    return {id:i+1,title,bpm,color,objects:objects.sort((a,b)=>a.x-b.x),length:beats*100,notes,end:beats*beat};
  });
  function start(id){
    const level=levels.find(l=>l.id===Number(id))||levels[0];
    return {level,x:0,y:0,vy:0,rotation:0,grounded:true,mode:'cube',used:new Set(),buffer:0};
  }
  function press(s){s.buffer=.15;}
  function step(s,seconds,held){
    // Substeps bound collision error across low frame rates and fast levels.
    let beats=seconds*s.level.bpm/60;
    while(beats>1e-7 && s.status==='playing'){
      const dt=Math.min(beats,1/120);beats-=dt;
      const oldY=s.y,oldX=s.x;
      s.x+=100*dt;
      const nearby=s.level.objects.filter(o=>o.x<s.x+36 && o.x+o.width>s.x-36);
      for(const o of nearby){
        if((o.kind==='ship'||o.kind==='cube') && oldX<o.x && s.x>=o.x){
          s.mode=o.kind;s.y=o.kind==='ship'?110:0;s.grounded=o.kind==='cube';s.vy=0;s.buffer=0;
        }
      }
      if(s.mode==='ship'){
        s.vy=Math.max(-125,Math.min(125,s.vy+(held?218:-190)*dt));s.y+=s.vy*dt;
        s.rotation=-s.vy/390;
        if(s.y<0||s.y>235)s.status='lost';
      }else{
        const orb=nearby.find(o=>o.kind==='orb'&&!s.used.has(o)&&Math.hypot(s.x-o.x-13,s.y+11-o.height)<34);
        if(s.buffer>0 && orb){s.vy=219;s.used.add(orb);s.grounded=false;s.buffer=0;}
        else if(s.grounded && (s.buffer>0||held)){s.vy=196;s.grounded=false;s.buffer=0;}
        s.vy-=260*dt;s.y+=s.vy*dt;
        let floor=nearby.some(o=>o.kind==='gap' && s.x>o.x && s.x<o.x+o.width)?-Infinity:0;
        for(const o of nearby){
          if(o.kind!=='block'||s.x+8<=o.x||s.x-8>=o.x+o.width)continue;
          if(oldY>=o.height-.1)floor=Math.max(floor,o.height);
          else if(s.y<o.height-.1)s.status='lost';
        }
        s.grounded=s.y<=floor && oldY>=floor-.2 && s.vy<=0;
        if(s.grounded){s.y=floor;s.vy=0;s.rotation=Math.round(s.rotation/(Math.PI/2))*Math.PI/2;}
        else s.rotation+=4.2*dt;
        for(const o of nearby){
          if(o.kind==='pad'&&!s.used.has(o)&&Math.abs(s.x-o.x-12)<19&&s.y>=0&&s.y<12){
            s.used.add(o);s.vy=242;s.grounded=false;
          }
          if(o.kind==='spike'){
            const edge=Math.max(0,Math.abs(s.x-o.x-o.width/2)-7);
            if(edge<o.width/2 && s.y+3<o.height*(1-edge/(o.width/2)))s.status='lost';
          }
          if(o.kind==='gap' && oldX<=o.x+o.width && s.x>=o.x+o.width && s.y<-.2)s.status='lost';
        }
        if(s.y< -45)s.status='lost';
      }
      for(const o of nearby){
        if(o.kind==='gate'&&s.x+9>o.x&&s.x-9<o.x+o.width && (s.y<o.height||s.y+18>o.height+91))s.status='lost';
      }
      s.buffer=Math.max(0,s.buffer-dt);
      s.score=Math.min(100,Math.floor(100*s.x/s.level.length));
      if(s.x>=s.level.length && s.status==='playing')s.status='won';
    }
  }
  globalThis.lectioPlusDash={levels,start,press,step};
})();
