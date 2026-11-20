(() => {
  'use strict';
  // The beat marks describe takeoffs, not the front edge of a hazard.
  // Phrases can share a technique without sharing timing, height or mode order.
  const phrases={
    first:[[2,'single'],[6,'single'],[10,'step'],[13,'double']],
    steps:[[2,'stair'],[8,'step'],[11,'stair']],
    bounce:[[2,'pad'],[6,'single'],[9,'pad'],[13,'double']],
    bridge:[[2,'pit'],[5,'stair'],[11,'pit'],[13.5,'step']],
    rings:[[2,'ring'],[6,'step'],[9,'ring'],[13,'double']],
    battlements:[[2,'terrace'],[9,'double'],[12,'stair']],
    offbeat:[[2,'double'],[4.5,'pit'],[7,'single'],[9,'triple'],[12.5,'step']],
    leaps:[[2,'ring'],[6,'pad'],[10,'ring'],[14,'single']],
    cascade:[[2,'stair'],[7,'triple'],[10,'pad'],[13,'pit']],
    chain:[[2,'chain'],[7,'double'],[9.5,'ring'],[13,'triple']],
    summit:[[2,'terrace'],[8,'ring'],[11.5,'triple'],[14,'single']],
    reverse:[[3,'single'],[6,'step'],[9,'double'],[12,'stair']],
    reverseHard:[[3,'pit'],[5.5,'triple'],[8.5,'ring'],[12,'stair']],
    channel:[50,74,99,87,60],harbor:[65,98,77,51,86],vault:[65,111,70,109,83],
    orbit:[78,96,57,74,112],zigzag:[56,112,64,119,83]
  };
  const campaigns=[
    ['Lysstart',104,'#57deed','first steps channel battlements harbor','02474251'],
    ['Kobbertrin',110,'#ffbd69','first bounce harbor bridge bounce','03757320'],
    ['Brobygger',112,'#8ee089','bridge rings channel steps leaps','04725470'],
    ['Dobbeltpuls',116,'#f091bd','first reverse harbor offbeat battlements','02577542'],
    ['Fjederfelt',118,'#ffce58','bounce steps orbit cascade leaps','03587530'],
    ['Luftpost',116,'#77d6ff','steps harbor bridge vault summit','07452742'],
    ['Månering',120,'#d29bff','rings battlements orbit leaps chain','05270375'],
    ['Understrøm',122,'#54ddad','bridge reverse channel reverseHard cascade','02724752'],
    ['Glasloft',126,'#94bcff','steps reverse vault summit reverseHard','04797542'],
    ['Overgear',132,'#ff9479','offbeat bounce zigzag chain cascade','07357520'],
    ['Laserlinje',134,'#ef87bf','rings zigzag reverseHard vault summit','02597254'],
    ['Polarlys',138,'#baacff','harbor cascade orbit reverseHard zigzag chain','04729570'],
    ['Tyngdepunkt',142,'#73e9d3','leaps reverseHard vault offbeat reverse summit','07529742'],
    ['Kredsløb',148,'#ffc466','battlements orbit chain zigzag offbeat summit','03975372'],
    ['Sidste signal',154,'#ff99ad','cascade reverseHard zigzag chain vault summit','07297542']
  ];
  // Authored grades consider introduced mechanics, compound jumps and flight openings.
  const campaignStars=[2,2,3,4,4,5,5,6,6,7,7,8,8,9,9];
  const grades=[
    {name:'Easy',color:'#76dcff'},{name:'Normal',color:'#88e57f'},
    {name:'Hard',color:'#ffdc67'},{name:'Harder',color:'#ffa761'},{name:'Insane',color:'#fb89c2'},
    {name:'Easy Demon',color:'#be91ff'},{name:'Medium Demon',color:'#ff93c0'},
    {name:'Hard Demon',color:'#ff9177'},{name:'Insane Demon',color:'#ed80ec'},
    {name:'Extreme Demon',color:'#ff646a'}
  ];
  function rating(level){
    if(!level.stars)return null;
    // Both 4 and 5 are Hard, 6 and 7 Harder, 8 and 9 Insane.
    const tier=level.demon!=null?5+level.demon:level.stars===2?0:level.stars===3?1:Math.floor(level.stars/2);
    return {...grades[tier],tier,amount:level.stars,unit:level.platform?'måner':'stjerner',symbol:level.platform?'☾':'★'};
  }
  function groundFeature(add,spikes,x,obstacle){
    if(['single','double','triple'].includes(obstacle))spikes(x,{single:1,double:2,triple:3}[obstacle]);
    if(obstacle==='step')add('block',x,89,32);
    if(obstacle==='pit')add('gap',x,83);
    if(obstacle==='stair'){
      add('block',x,151,30);add('block',x+151,151,59);add('block',x+302,84,86);
    }
    if(obstacle==='terrace'){
      add('block',x,153,30);add('block',x+153,326,59);spikes(x+321,2,59);
    }
    if(obstacle==='pad'){
      add('pad',x,24);add('gap',x+44,100);spikes(x+66,2);
    }
    if(obstacle==='ring'||obstacle==='chain'){
      add('gap',x+12,obstacle==='chain'?316:181);add('orb',x+66,26,58);
      if(obstacle==='chain')add('orb',x+189,26,123);
    }
    if(obstacle==='saw')add('saw',x,36,18);
  }
  const levels=campaigns.map(([title,bpm,color,score,motif],index)=>{
    const objects=[],notes=[],chapters=[],beat=60/bpm,sections=score.split(' ');
    const scale=[0,2,3,5,7,9,10,12,14,15];
    let surface='cube',inverted=false;
    function add(kind,x,width=0,height=0,extra={}){
      objects.push({kind,x,width,height,inverted,...extra});
    }
    function spikes(x,count,base=0){
      for(let k=0;k<count;k++)add('spike',x+24*k,24,27,{base});
    }
    sections.forEach((key,n)=>{
      const start=(2+n*16)*100,pattern=phrases[key];
      const flying=typeof pattern[0]==='number';
      const flip=key==='reverse'||key==='reverseHard',mode=flying?'ship':'cube';
      if(inverted && !flip){inverted=false;add('upright',start);}
      if(mode!==surface){add(mode,start);surface=mode;}
      if(flip&&!inverted){add('invert',start);inverted=true;}
      chapters.push({x:start,mode,flip,key});
      if(flying){
        const opening=144-Math.min(index*3,39);
        pattern.forEach((height,i)=>{
          const x=start+[220,525,790,1060,1320][i],width=[128,104,144,112,112][i];
          add('gate',x,width,height,{opening});
        });
        return;
      }
      for(const [onset,obstacle] of pattern){
        const x=start+onset*100+38;
        groundFeature(add,spikes,x,obstacle);
        // Give the intended takeoff its own audible accent, including offbeats.
        notes.push({time:(start/100+onset)*beat,duration:beat*.22,pitch:70+[0,3,7,10][n%4],voice:'bell'});
      }
    });
    const beats=sections.length*16+4;
    for(let k=0;k<beats;k++){
      const n=Math.max(0,Math.min(sections.length-1,Math.floor((k-2)/16)));
      const flying=chapters[n].mode==='ship',root=40+index%6+[0,5,3,7][Math.floor(k/8)%4];
      notes.push({time:k*beat,duration:beat*(k%4===0?.7:.37),pitch:root,voice:'bass'});
      if(k%4!==3 || flying)notes.push({time:(k+.5)*beat,duration:beat*(flying?.7:.29),pitch:root+12+scale[Number(motif[(k+n)%8])],voice:flying?'keys':'pluck'});
      if(n===sections.length-1 && k%4===3)notes.push({time:(k+.75)*beat,duration:beat*.18,pitch:root+24,voice:'bell'});
    }
    return {id:index+1,stars:campaignStars[index],title,bpm,color,chapters,objects:objects.sort((a,b)=>a.x-b.x),length:beats*100,
      notes:notes.sort((a,b)=>a.time-b.time),end:beats*beat};
  });
  // Four musical phrases per world. Heights 0–8 describe the centre of the tunnel.
  const worlds=[
    ['Neonhavnen','#43f6dc','#14335b',['2464','4432','3355','4564'],'02474251'],
    ['Krystalgrotten','#a794ff','#332454',['2626','4552','5356','3432'],'03587530'],
    ['Solstationen','#ffd263','#512849',['5432','2466','4335','6524'],'04725470'],
    ['Koralrevet','#ff92ad','#392c58',['2526','6663','4324','2563'],'05270375'],
    ['Isringen','#8cdeff','#153858',['2467','7653','2254','6246'],'07452742'],
    ['Kobberværket','#ffaa68','#42304e',['7272','2464','5532','6643'],'03757320'],
    ['Ionstormen','#a6ff76','#23394b',['2277','7522','3437','2743'],'02597254'],
    ['Månebasen','#f5adff','#31274e',['7632','3727','2446','6632'],'07297542'],
    ['Plasmakernen','#ff7294','#452239',['2726','6327','7227','4262'],'03975372'],
    ['Begivenhedshorisonten','#77c7ff','#1c2154',['7173','2771','6362','2717'],'07529742']
  ];
  const routes=['Indflyvning','Ekko','Sideskift','Kaskade','Modstrøm','Spiralen','Gennem nåleøjet','Natflyvning','Overtoner','Finale'];
  function waveMusic(bpm,beats,motif,world,stage){
    const notes=[],beat=60/bpm,scale=[0,2,3,5,7,9,10,12,14,15];
    for(let k=0;k<beats;k++){
      const root=38+world%6+[0,5,3,7][Math.floor(k/8)%4];
      notes.push({time:k*beat,duration:beat*.52,pitch:root,voice:'bass'});
      const pitch=root+12+scale[Number(motif[(k+stage)%8])];
      notes.push({time:(k+.5)*beat,duration:beat*.37,pitch,voice:world%2?'keys':'pluck'});
      if(k%4===stage%4)notes.push({time:(k+.75)*beat,duration:beat*.2,pitch:pitch+7,voice:'bell'});
    }
    return notes;
  }
  worlds.forEach(([world,color,sky,patterns,motif],w)=>{
    routes.forEach((name,n)=>{
      const wave=w*10+n+1,bpm=102+5*w+2*n;
      const expert=w>=7;
      // An open mouth lets a wave enter along the player's existing trajectory.
      const knots=[{x:200,y:117,r:134},{x:400,y:115,r:72}];
      // One phrase is four beats. Repeated corners land on the same subdivisions,
      // then the next phrase answers them at a different height.
      const phrasing=[
        [1,1,1,1],[1.5,.5,1.5,.5],[.75,1.25,.75,1.25],[1.5,1,.75,.75],[.5,1.5,1.5,.5],
        [.75,.75,1,1.5],[.5,1,.5,2],[2,.5,1,.5],[1.25,.75,1.25,.75],[.75,.5,1.25,1.5]
      ][n];
      const bars=10+n%3+w%3;
      for(let bar=0;bar<bars;bar++){
        const phrase=patterns[(Math.floor(bar/2)+n+Math.floor(bar/4))%patterns.length];
        for(let corner=0;corner<4;corner++){
          const last=knots.at(-1),dx=phrasing[corner]*100;
          const digit=Number(phrase[bar%2?3-corner:corner]);
          const shift=bar%4===1?18:bar%4===3?-15:0;
          const goal=(expert?16:38)+digit*(expert?24:17)+shift;
          const y=Math.max(32,Math.min(221,last.y+Math.max(-dx*.77,Math.min(dx*.77,goal-last.y))));
          const width=61-w*2.2-n*.85-(expert?6:0);
          // Open the end of a phrase; introduce the next pinch before its apex.
          const radius=width+(bar%4===3&&corner>1?14:0)-(expert&&bar%4===2&&corner===1?6:0);
          knots.push({x:last.x+dx,y,r:radius});
        }
      }
      const length=knots.at(-1).x+240,beats=length/100;
      // The tightest half-opening, less the wave hitbox, divided by travel speed.
      const marginMs=(Math.min(...knots.map(point=>point.r))-7)*600/bpm;
      const stars=2+[295,245,205,175,145,115,80].filter(limit=>marginMs<limit).length;
      levels.push({id:16+wave-1,stars,wave,world,stage:n+1,worldIndex:w,title:name+' · '+world,bpm,color,sky,
        knots,length,end:beats*60/bpm,objects:[{kind:'wave',x:200,width:0},{kind:'cube',x:length-200,width:0}],
        get notes(){return waveMusic(bpm,Math.floor(beats),motif,w,n);}});
    });
  });
  const forms={
    cube:['Terning','Hold for at hoppe ved landing.'],
    ship:['Skib','Hold for at stige. Slip for at falde.'],
    ball:['Kugle','Tryk på gulvet eller loftet for at vende tyngdekraften.'],
    ufo:['UFO','Hvert tryk giver et kort hop i luften.'],
    wave:['Wave','Hold for at stige diagonalt. Slip for at dykke.'],
    robot:['Robot','Hold hoppet længere for at komme højere.'],
    spider:['Edderkop','Tryk for at skifte hurtigt mellem gulv og loft.'],
    swing:['Swing','Hvert tryk vender tyngdekraften, også i luften.']
  };
  const tour=[
    ['Magnetbanen','ball ball spider ball'],['Kometjagt','ufo ship ufo wave'],
    ['Springværket','robot cube robot robot'],['Nattespind','spider ball spider spider'],
    ['Pendulstation','swing ship swing ufo'],['Omløbsbane','wave ufo ball swing robot'],
    ['Prismespring','cube robot spider wave ship ball'],['Portalfinalen','cube ball ufo ship robot spider swing wave']
  ];
  function buildCourse(title,sequence,id=0){
    const modes=sequence.filter(mode=>Object.hasOwn(forms,mode)).slice(0,16);
    if(!modes.length)modes.push('cube');
    const objects=[],bpm=id?108+(id-116)*5:116;
    const put=(kind,x,width=0,height=0)=>objects.push({kind,x,width,height});
    const authored=id>=116&&id<=123,span=authored?1200:800;
    modes.forEach((mode,i)=>{
      const x=200+i*span;
      put(mode,x);
      if(authored){
        const variant=(id+i)%3;
        if(mode==='cube'||mode==='robot'){
          put('spike',x+248,28,29);
          put('block',x+485,152,28);put('block',x+637,105,52);
          if(variant===1)put('gap',x+900,67);
          else{put('spike',x+939,26,29);if(id>=121)put('spike',x+965,26,29);}
        }else if(mode==='ball'||mode==='spider'){
          const positions=[[255,485,735,980],[275,536,743,1010],[242,500,795,987]][variant];
          positions.forEach((dx,k)=>put('railSpike',x+dx,48+variant*7,k%2));
        }else{
          const heights=[[64,98,61,108],[58,84,116,74],[87,58,95,72]][variant];
          heights.forEach((height,k)=>objects.push({kind:'gate',x:x+[235,471,758,1004][k],width:52+variant*7,height,opening:Math.max(76,117-(id-116)*5)}));
        }
      }else if(mode==='robot'||mode==='cube'){
        put('spike',x+270,30,30);put('block',x+550,54,38);
      }else if(mode==='ball'||mode==='spider'){
        put('railSpike',x+260,52,0);put('railSpike',x+555,62,1);
      }else{
        put('gate',x+245,36,66);put('gate',x+560,42,36);
      }
    });
    const length=400+span*modes.length,worldIndex=id? (id-116)%worlds.length:0;
    const [,color,sky,,motif]=worlds[worldIndex];
    return {id,title,modes,bpm,color,sky,worldIndex,objects,length,get end(){return this.length/100*60/bpm;},
      get notes(){return waveMusic(bpm,Math.ceil(this.end*bpm/60),motif,worldIndex,2);}};
  }
  tour.forEach(([name,sequence],i)=>{
    const level=buildCourse(name,sequence.split(' '),116+i);
    level.stars=[3,4,4,5,6,7,8,9][i];levels.push(level);
  });
  const platforms=[
    ['Tagryggen',[['block',280,158,29],['block',438,150,60],['gap',607,86],['spike',890,32,33],['block',1120,205,38],['gap',1470,86]]],
    ['Under byen',[['spike',225,25,29],['gap',455,88],['block',680,155,29],['block',835,175,62],['spike',1105,25,30],['spike',1130,25,30],['gap',1355,94],['block',1560,133,49]]],
    ['Tårnpasset',[['gap',255,81],['block',475,150,30],['block',625,150,60],['block',775,152,90],['gap',948,90],['spike',1220,30,33],['spike',1250,30,33],['block',1500,155,35],['block',1655,134,69],['gap',1811,91]]]
  ];
  platforms.forEach(([title,course],i)=>{
    const level=buildCourse(title,['cube'],124+i);level.platform=true;level.stars=[2,3,5][i];
    level.objects=course.map(([kind,x,width,height=0])=>({kind,x,width,height}));
    level.length=course.at(-1)[1]+course.at(-1)[2]+250;levels.push(level);
  });
  const modifiers={mini:'Mini',dual:'Dobbelt',fast:'Overgear',normal:'Normal'};
  [['Spejlkredsløb','dual'],['Mikrochip','mini'],['Overhalingsbanen','fast']].forEach(([title,effect],i)=>{
    const level=buildCourse(title,['wave','wave','wave'],127+i);
    level.effect=effect;level.stars=[7,6,8][i];
    level.objects=[{x:200,kind:'wave',width:0},{x:370,kind:effect,width:0}];
    const positions=[[590,827,1050,1310,1500,1760,1950,2200],[590,875,1090,1290,1540,1740,1960,2160],[590,800,1055,1290,1585,1780,1990,2200]][i];
    const heights=[[81,88,78,90,80,85,90,79],[56,84,110,84,58,92,117,90],[72,112,55,100,76,109,69,91]][i];
    positions.forEach((x,k)=>level.objects.push({x,kind:'gate',width:36+(k%3)*9,height:heights[k],opening:effect==='mini'?64:91}));
    level.objects.push({x:2400,kind:'normal',width:0},{x:2450,kind:'cube',width:0});
    if(effect==='fast')Object.defineProperty(level,'end',{get:()=>((370+200)+(2400-370)/1.45)/100*60/level.bpm});
    levels.push(level);
  });
  // Section lengths and obstacle onsets are in beats. Each chart has its own
  // control sequence, terrain, rhythm and return to the opening motif.
  // Each island is a landing height, deck width and run-up after touchdown.
  // Heights are local to gravity, so the same solids also work on the ceiling.
  const crossings={
    furnace:[[32,80,24],[68,62,13],[44,68,21],[82,59,15],[49,66,14]],
    glass:[[47,60,12],[90,49,10],[65,49,16],[111,51,9],[73,54,13],[40,48,11]],
    battlement:[[42,49,8],[85,44,6],[57,46,12],[103,40,5],[74,45,9],[116,40,7],[75,44,8]],
    belfry:[[54,44,7],[98,40,9],[70,37,5],[123,36,4],[92,38,9],[52,37,5],[104,36,4]],
    iris:[[52,39,5],[98,36,5],[67,36,4],[118,32,5],[87,34,5],[131,32,3],[83,34,7],[42,32,4]],
    fuse:[[38,48,9],[84,46,8],[50,45,11],[99,42,8],[61,44,5]],
    spindle:[[44,35,5],[97,31,3],[65,33,5],[117,32,4],[86,31,2],[133,30,4],[90,32,4]]
  };
  function addCrossing(put,launch,name,tier,accent){
    let from=0,takeoff=launch;
    for(const [i,[top,width,runup]] of crossings[name].entries()){
      // Distance to the descending intersection of the normal cube jump arc.
      const flight=(196+Math.sqrt(196*196-520*(top-from)))*100/260;
      const center=Math.round(takeoff+flight),left=Math.round(center-width/2);
      if(i%2===0){
        const radius=15+tier;
        put('saw',takeoff+58-radius,2*radius,from+34,{suspended:true});
      }
      put('ledge',left,width,top,{thickness:20,last:i===crossings[name].length-1});
      if(i%2===tier%2||tier>=3){
        const clearance=[86,77,70,62,55][tier],w=[46,44,42,40,36][tier];
        put('fang',center-w/2,w,top+clearance);
      }
      accent(takeoff,i);
      from=top;takeoff=center+runup;
    }
    put('spikebed',launch+28,Math.round(takeoff-launch+86),18);
  }
  const demonCharts=[
    ['Glødesporet',138,'#ffc25c','#422030','03753720',[
      ['cube',16,[[.3,'islands','furnace'],[10.5,'saw'],[12.8,'triple']]],
      ['ship',17,[[2.7,42,126,150],[5.6,82,110,126],[8.3,111,106,96],[11,66,107,150],[14,38,112,106]]],
      ['ball',15,[[2.5,0,78],[5.6,1,108],[8.8,0,80],[12.2,1,103]]],
      ['cube',21,[[2.1,'ring'],[5.4,'islands','furnace'],[16,'pad'],[18.1,'triple']]]
    ]],
    ['Prismebrud',144,'#77faef','#17334c','04729572',[
      ['cube',14,[[.3,'islands','glass'],[11.4,'ring']]],
      ['ufo',17,[[2.6,62,111,96],[5.3,109,96,83],[7.7,69,107,125],[10.8,107,98,94],[14,59,99,105]]],
      ['wave',14,[[0,120,146],[1.55,124,47],[2.3,199,31],[3.65,64,27],[4.59,158,28],[5.35,82,25],[6.41,188,27],[7.74,55,26],[8.67,148,24],[9.46,69,25],[10.68,191,26],[11.74,85,24],[12.37,148,29],[13.7,148,65]]],
      ['ball',12,[[2.4,0,72],[5,1,65],[7.3,0,82],[9.7,1,82]]],
      ['cube',17,[[2,'chain'],[6.5,'islands','fuse']]]
    ]],
    ['Skærsilden',146,'#ff825b','#421a2c','07257230',[
      ['robot',17,[[2.3,'stair'],[8.2,'double'],[10.5,'saw'],[12.8,'stair']]],
      ['ship',20,[[2.8,58,99,116],[5.2,104,90,106],[8,64,90,96],[10.6,109,83,114],[13.5,75,82,135],[16.3,40,92,162]]],
      ['reverse',18,[[3,'islands','battlement'],[15.6,'ring']]],
      ['spider',13,[[1.9,0,100],[3.45,1,96],[5.05,0,98],[6.6,1,95],[8.2,0,106],[9.86,1,92],[11.4,0,95]]],
      ['cube',19,[[2.3,'islands','fuse'],[11.8,'chain'],[17.1,'saw']]]
    ]],
    ['Natskælvet',144,'#c1a8ff','#262041','03587532',[
      ['ball',15,[[2.7,0,90],[5.2,1,86],[8,0,135],[10.5,1,66],[12.6,0,109]]],
      ['swing',17,[[3,97,105,67],[5.2,57,86,80],[7.9,114,85,104],[10.6,62,79,90],[13.8,99,80,133]]],
      ['reverse',19,[[2.8,'islands','belfry'],[15.4,'ring']]],
      ['wave',16,[[0,120,146],[1.55,120,47],[2.29,194,24],[3.66,57,21],[4.65,156,22],[5.36,85,19],[5.94,143,21],[6.98,39,18],[8.58,199,22],[9.48,109,19],[10.2,181,19],[11.5,51,20],[12.46,147,18],[13.1,83,20],[14.09,182,19],[14.79,112,21],[15.7,112,65]]],
      ['ufo',15,[[2.6,71,93,86],[5.2,115,84,77],[7.8,72,85,147],[11.1,100,84,116]]],
      ['cube',14,[[2.6,'islands','fuse'],[11.9,'saw']]]
    ]],
    ['Nåleøjet',154,'#ff83c7','#30213c','07527952',[
      ['cube',18,[[.2,'islands','iris'],[14.9,'ring']]],
      ['wave',19,[[0,120,146],[1.55,119,47],[2.25,189,19.2],[3.49,65,18.4],[4.47,163,18.4],[5.12,98,18.4],[5.68,154,18.0],[6.61,61,18.4],[7.43,143,18.0],[7.95,91,18.4],[8.99,195,18.0],[10.41,53,18.8],[11.43,155,18.0],[11.95,103,18.0],[12.61,169,18.4],[13.51,79,18.0],[14.05,133,18.4],[14.76,62,18.0],[15.98,184,18.4],[16.86,96,18.0],[17.56,166,18.0],[18.39,83,18.4],[18.7,83,65]]],
      ['ship',16,[[2.5,103,81,75],[4.8,56,75,92],[7.6,101,70,141],[10.5,62,72,76],[12.9,105,73,123]]],
      ['robot',16,[[2.6,'stair'],[8.2,'saw'],[10.3,'triple'],[12.2,'pad']]],
      ['spider',12,[[1.75,0,86],[3.03,1,85],[4.34,0,86],[5.64,1,91],[7,0,91],[8.34,1,86],[9.65,0,86],[10.95,1,64]]],
      ['ball',12,[[2.1,0,96],[3.95,1,103],[5.85,0,108],[7.68,1,106],[9.53,0,104]]],
      ['cube',20,[[2,'chain'],[6.5,'islands','spindle']]]
    ]]
  ];
  demonCharts.forEach(([title,bpm,color,sky,motif,sections],demon)=>{
    const chapters=[],objects=[],notes=[],knots=[],beat=60/bpm;
    let cursor=2,mode='cube',flipped=false,exitHeight=52;
    for(let i=0;i<2;i++)notes.push({time:i*beat,duration:beat*.42,pitch:45+demon,voice:'bass'});
    function add(kind,x,width=0,height=0,extra={}){objects.push({kind,x,width,height,...extra});}
    sections.forEach(([kind,span,features],index)=>{
      const start=cursor*100,next=kind==='reverse'?'cube':kind,flip=kind==='reverse';
      if(flipped&&!flip&&mode===next)add('upright',start);
      if(mode!==next)add(next,start,0,0,{portalY:exitHeight});
      if(flip&&!flipped)add('invert',start+(mode===next?0:70),0,0,{portalY:Math.max(51,exitHeight-20)});
      chapters.push({x:start,mode:next,flip});
      let previousGate=null;
      for(const [onset,a,b,c] of features){
        const x=start+onset*100;
        if(next==='wave'){
          knots.push({x,y:a,r:b});
        }
        else if(next==='spider'||next==='ball')add('railSpike',x,b,a,{depth:[42,55,62,69,80][demon]});
        else if(['ufo','swing','ship'].includes(next)){
          const opening=Math.max(next==='ufo'?58:0,Math.round(b*[.70,.70,.61,.63,.54][demon]));
          const low=Math.round(a+(b-opening)/2),bevel=Math.min(22,c*.22);
          const fang=demon===2?Math.min(22,Math.round(c*.17)):0;
          const profile=fang?[[0,bevel+fang],[bevel,fang]]:null;
          if(profile){
            const pitch=(c-2*bevel)/3;
            for(let i=0;i<3;i++)profile.push([bevel+(i+.5)*pitch,0],[bevel+(i+1)*pitch,fang]);
            profile.push([c,bevel+fang]);
          }
          add('gate',x,c,low,{opening,bevel,profile});
          if(previousGate&&next==='ship'&&demon>=2){
            const joint=x-previousGate.x;
            add('passage',previousGate.x,joint,previousGate.low,{upper:previousGate.high,endLow:low-bevel-fang,endHigh:low+opening+bevel+fang});
          }
          previousGate={x:x+c,low:low-bevel-fang,high:low+opening+bevel+fang};
        }
        else{
          const put=(k,x,w,h,params)=>add(k,x,w,h,{inverted:flip,...params});
          const spikes=(x,n,base=0)=>{for(let k=0;k<n;k++)put('spike',x+k*24,24,27,{base});};
          if(a==='islands')addCrossing(put,x,b,demon,(mark,i)=>{
            notes.push({time:mark/100*beat,duration:beat*.27,pitch:60+[0,7,3,10][i%4]+demon,voice:'keys'});
          });
          else groundFeature(put,spikes,x+38,a);
        }
        notes.push({time:(cursor+onset)*beat,duration:beat*.24,pitch:67+[0,3,7,10,5][(index+demon)%5],voice:'bell'});
      }
      for(let k=0;k<span;k++){
        const root=[38,43,36,41,39][demon]+[0,3,7,5][(Math.floor(k/4)+index)%4];
        const pitch=root+12+[0,2,3,5,7,9,10,12,14,15][Number(motif[(k+index)%8])];
        if(k%4!==[3,1,2,3,0][demon]||index===0)notes.push({time:(cursor+k)*beat,pitch:root,duration:beat*(k%4===0?.8:.32),voice:'bass'});
        if(k%2===0)notes.push({time:(cursor+k)*beat,duration:beat*.41,pitch:39,voice:'kick'});
        const airborne=['ship','swing','ufo'].includes(next);
        notes.push({time:(cursor+k+(airborne?.25:.5))*beat,pitch,duration:beat*(airborne?.68:.23),voice:airborne?'keys':'pluck'});
      }
      const last=features.at(-1);
      if(next==='wave')exitHeight=last[1];
      else if(next==='ball'||next==='spider')exitHeight=last[1]?52:204;
      else if(['ship','ufo','swing'].includes(next))exitHeight=last[1]+last[2]/2;
      else exitHeight=flip?204:52;
      mode=next;flipped=flip;cursor+=span;
    });
    const length=(cursor+1)*100;
    levels.push({id:130+demon,title,bpm,demon,stars:10,color,sky,chapters,modes:chapters.map(c=>c.mode),worldIndex:5+demon,
      objects:objects.sort((a,b)=>a.x-b.x),knots:knots.length?knots:undefined,notes:notes.sort((a,b)=>a.time-b.time),length,end:length/100*beat});
  });
  function toothDepth(o,x,halfWidth=0){
    const rail=o.kind==='railSpike';
    const teeth=rail?Math.max(2,Math.round(o.width/24)):Math.ceil(o.width/24),pitch=o.width/teeth;
    const offset=Math.max(0,Math.min(o.width,x-o.x));
    const distance=Math.max(0,Math.abs(offset%pitch-pitch/2)-halfWidth);
    return (rail?o.depth:o.height)*(1-(rail?.46:1)*Math.min(1,2*distance/pitch));
  }
  function gateRelief(o,x,radius=0){
    const left=Math.max(0,Math.min(o.width,x-radius-o.x)),right=Math.max(left,Math.min(o.width,x+radius-o.x));
    if(!o.profile)return Math.max(0,(o.bevel||0)-Math.min(right,o.width-left));
    let minimum=Infinity;
    for(let i=1;i<o.profile.length;i++){
      const [a,y0]=o.profile[i-1],[b,y1]=o.profile[i];
      if(b<left||a>right)continue;
      const sample=y0<=y1?Math.max(left,a):Math.min(right,b);
      minimum=Math.min(minimum,y0+(sample-a)/(b-a)*(y1-y0));
    }
    return minimum;
  }
  function planCoins(level){
    return [.23,.54,.82].map(fraction=>{
      let x=Math.round(level.length*fraction);
      // Keep collectibles clear of solid objects and the transitions at each portal.
      for(let offset=0;offset<=240;offset+=12){
        const candidate=x+offset;
        if(level.objects.every(o=>candidate<o.x-30||candidate>o.x+o.width+30)){x=candidate;break;}
      }
      // Put crossing coins on a reachable deck even when the whole floor is lethal.
      const bed=level.objects.find(o=>o.kind==='spikebed'&&o.x<=x&&x<=o.x+o.width);
      if(bed){
        const decks=level.objects.filter(o=>o.kind==='ledge'&&o.x>=bed.x&&o.x<bed.x+bed.width);
        const deck=decks.reduce((best,o)=>!best||Math.abs(o.x-x)<Math.abs(best.x-x)?o:best,null);
        if(deck)return {x:deck.x+deck.width/2,y:deck.inverted?257-deck.height-12:deck.height+12};
      }
      const wall=tunnel(level,x);
      const gate=level.objects.find(o=>o.kind==='gate'&&x>=o.x-10&&x<=o.x+o.width+10);
      const passage=level.objects.find(o=>o.kind==='passage'&&o.x<=x&&x<=o.x+o.width);
      let mode='cube';
      for(const o of level.objects)if(o.x<=x&&Object.hasOwn(forms,o.kind))mode=o.kind;
      const y=wall?wall.y:passage?(passage.height+passage.upper+(passage.endLow+passage.endHigh-passage.height-passage.upper)*(x-passage.x)/passage.width)/2:gate?gate.height+(gate.opening||91)/2:mode==='spider'||mode==='ball'?13:mode==='cube'||mode==='robot'?54:110;
      const chapter=level.chapters?.findLast(c=>c.x<=x);
      return {x,y:chapter?.flip?257-y:y};
    });
  }
  function checkpoint(s){
    return {level:s.level,x:s.x,y:s.y,vy:s.vy,rotation:s.rotation,grounded:s.grounded,mode:s.mode,
      entryUntil:s.entryUntil,effect:s.effect,gravity:s.gravity,lift:s.lift,used:new Set(s.used),coins:s.coins,time:s.time,score:s.score};
  }
  function tunnel(level,x){
    const points=level.knots;
    if(!points||x<points[0].x||x>points.at(-1).x)return null;
    let lo=0,hi=points.length-1;
    while(hi-lo>1){const mid=(lo+hi)>>1;if(points[mid].x<=x)lo=mid;else hi=mid;}
    const a=points[lo],b=points[hi],t=(x-a.x)/(b.x-a.x);
    return {y:a.y+(b.y-a.y)*t,r:a.r+(b.r-a.r)*t};
  }
  function start(id){
    const level=typeof id==='object'&&id?.modes?id:levels.find(l=>l.id===Number(id))||levels[0];
    return {level,x:0,y:0,vy:0,rotation:0,grounded:true,mode:'cube',used:new Set(),buffer:0,trail:[],entryUntil:0,gravity:-1,effect:'normal',lift:0,coins:0,coinSites:planCoins(level)};
  }
  function press(s){s.buffer=.15;}
  function step(s,seconds,held,direction=1){
    // Substeps bound collision error across low frame rates and fast levels.
    let beats=seconds*s.level.bpm/60;
    while(beats>1e-7 && s.status==='playing'){
      const dt=Math.min(beats,1/120);beats-=dt;
      let oldY=s.y;const oldX=s.x;
      s.x=Math.max(0,s.x+100*dt*(s.effect==='fast'?1.45:1)*(s.level.platform?direction:1));
      const nearby=s.level.objects.filter(o=>o.x<s.x+36 && o.x+o.width>s.x-36);
      for(const o of nearby){
        if((o.kind==='invert'||o.kind==='upright') && oldX<o.x && s.x>=o.x){
          s.gravity=o.kind==='invert'?1:-1;s.grounded=false;
        }
        if(Object.hasOwn(modifiers,o.kind)&&oldX<o.x&&s.x>=o.x)s.effect=o.kind;
        if(Object.hasOwn(forms,o.kind) && oldX<o.x && s.x>=o.x){
          if(s.mode===o.kind)continue;
          s.trail.length=0;s.mode=o.kind;s.lift=0;s.gravity=-1;
          s.grounded=s.y<=0&&s.vy<=0;
          s.entryUntil=o.x+115;
          // Keep the position and carry bounded momentum into the new form.
          s.vy=Math.max(-125,Math.min(125,s.vy));
        }
      }
      if(s.mode==='wave'){
        s.vy=(held?100:-100)*(s.effect==='fast'?1.45:1);s.rotation=held?-Math.PI/4:Math.PI/4;s.y+=s.vy*dt;
        const wall=tunnel(s.level,s.x);
        if(wall&&Math.abs(s.y+11-wall.y)+7>wall.r)s.status='lost';
        const last=s.trail.at(-1);
        if(!last||s.x-last.x>=3||last.up!==held){
          s.trail.push({x:s.x,y:s.y,up:held});if(s.trail.length>55)s.trail.shift();
        }
      }else if(s.mode==='spider'||s.mode==='ball'){
        if(s.buffer>0&&s.grounded){
          s.gravity*=-1;s.grounded=false;s.buffer=0;
          if(s.mode==='spider')s.vy=s.gravity*760;
        }
        s.vy+=s.gravity*470*dt;s.y+=s.vy*dt;
        if(s.y<=0||s.y>=235){s.y=Math.max(0,Math.min(235,s.y));s.vy=0;s.grounded=true;}
        s.rotation=s.mode==='ball'?s.rotation+dt*3.4:s.gravity>0?Math.PI:0;
      }else if(s.mode==='ufo'||s.mode==='swing'){
        if(s.buffer>0){
          if(s.mode==='ufo')s.vy=100;
          else s.gravity*=-1;
          s.buffer=0;
        }
        s.vy=Math.max(-135,Math.min(135,s.vy+dt*(s.mode==='ufo'?-165:s.gravity*184)));
        s.y+=s.vy*dt;s.rotation=-s.vy/520;
      }else if(s.mode==='ship'){
        s.vy=Math.max(-125,Math.min(125,s.vy+(held?218:-190)*dt));s.y+=s.vy*dt;
        s.rotation=-s.vy/390;
      }else{
        // Solve ceiling and floor terrain in the same local coordinates.
        const ceiling=s.gravity>0;
        if(ceiling){s.y=235-s.y;oldY=235-oldY;s.vy=-s.vy;}
        const orb=nearby.find(o=>o.kind==='orb'&&!s.used.has(o)&&Math.hypot(s.x-o.x-13,s.y+11-o.height)<34);
        if(s.buffer>0 && orb){s.vy=219;s.used.add(orb);s.grounded=false;s.buffer=0;}
        else if(s.grounded && (s.buffer>0||held)){s.vy=s.mode==='robot'?143:196;s.lift=s.mode==='robot'?.55:0;s.grounded=false;s.buffer=0;}
        if(held&&s.lift>0){s.vy+=145*Math.min(dt,s.lift);s.lift=Math.max(0,s.lift-dt);}
        else s.lift=0;
        s.vy-=260*dt;s.y+=s.vy*dt;
        let floor=nearby.some(o=>(o.kind==='spikebed'||o.kind==='gap') && s.x>o.x && s.x<o.x+o.width)?-Infinity:0;
        for(const o of nearby){
          if(o.kind==='ledge'&&s.x+8>o.x&&s.x-8<o.x+o.width){
            if(oldY>=o.height-.1)floor=Math.max(floor,o.height);
            else if(s.y<o.height-.1&&s.y+20>o.height-o.thickness)s.status='lost';
          }
          if(o.kind==='fang'&&s.x+7>o.x&&s.x-7<o.x+o.width){
            const edge=Math.max(0,Math.abs(s.x-o.x-o.width/2)-7);
            if(s.y+20>o.height+30*edge/(o.width/2))s.status='lost';
          }
          if(o.kind==='spikebed'&&s.x+7>o.x&&s.x-7<o.x+o.width&&s.y+3<toothDepth(o,s.x,7))s.status='lost';
          if(o.kind!=='block'||s.x+8<=o.x||s.x-8>=o.x+o.width)continue;
          if(s.level.platform&&oldY<o.height-.1){
            if(oldX+8<=o.x+.01)s.x=o.x-8;
            else if(oldX-8>=o.x+o.width-.01)s.x=o.x+o.width+8;
            continue;
          }
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
            if(edge<o.width/2 && s.y+20>(o.base||0) && s.y+3<(o.base||0)+o.height*(1-edge/(o.width/2)))s.status='lost';
          }
          if(o.kind==='gap' && oldX<=o.x+o.width && s.x>=o.x+o.width && s.y<-.2)s.status='lost';
        }
        if(s.y< -45)s.status='lost';
        if(ceiling){s.y=235-s.y;s.vy=-s.vy;}
      }
      if(['wave','ship','ufo','swing'].includes(s.mode)&&(s.y<0||s.y>235)){
        if(s.x<=s.entryUntil){s.y=Math.max(0,Math.min(235,s.y));s.vy=0;}
        else s.status='lost';
      }
      for(const o of nearby){
        if(o.kind==='saw'&&Math.hypot(s.x-o.x-o.width/2,s.y+11-(o.inverted?257-o.height:o.height))<o.width/2+7)s.status='lost';
        if(o.kind==='railSpike'&&s.x+7>o.x&&s.x-7<o.x+o.width){
          const depth=o.depth?toothDepth(o,s.x,7):34;
          if(o.height?s.y>235-depth:s.y<depth)s.status='lost';
        }
        if(o.kind==='passage'&&s.x>=o.x&&s.x<=o.x+o.width){
          const t=(s.x-o.x)/o.width;
          if(s.y<o.height+(o.endLow-o.height)*t||s.y+18>o.upper+(o.endHigh-o.upper)*t)s.status='lost';
        }
        if(o.kind==='gate'){
          const radius=s.effect==='mini'?5:9,opening=o.opening||91;
          if(s.x+radius<=o.x||s.x-radius>=o.x+o.width)continue;
          const relief=o.bevel?gateRelief(o,s.x,radius):0;
          const blocked=y=>y+9-radius<o.height-relief||y+9+radius>o.height+opening+relief;
          if(blocked(s.y)||s.effect==='dual'&&blocked(235-s.y))s.status='lost';
        }
      }
      if(s.level.demon!=null&&s.mode!=='wave'&&(!s.trail.length||s.x-s.trail.at(-1).x>=4)){
        s.trail.push({x:s.x,y:s.y,rotation:s.rotation});if(s.trail.length>14)s.trail.shift();
      }
      s.coinSites.forEach((coin,i)=>{if(Math.abs(s.x-coin.x)<16&&Math.abs(s.y+11-coin.y)<21)s.coins|=1<<i;});
      s.buffer=Math.max(0,s.buffer-dt);
      s.score=Math.min(100,Math.floor(100*s.x/s.level.length));
      if(s.x>=s.level.length && s.status==='playing')s.status='won';
    }
  }
  globalThis.lectioPlusDash={levels,grades,rating,forms,modifiers,buildCourse,checkpoint,start,press,step,tunnel,gateRelief,toothDepth};
})();
