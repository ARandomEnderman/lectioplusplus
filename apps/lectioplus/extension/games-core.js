(() => {
  'use strict';
  const catalog = [
    {id:'osu',title:'osu! · Rytmecirkler',symbol:'♫',category:'Arkade',description:'Spil 10 popbaner med øvebeat eller egen sangfil, og 20 instrumentalbaner.',controls:'Klik eller tryk på den næste cirkel, når ringen møder kanten. Du kan også sigte med musen og bruge Z eller X.',live:true},
    {id:'lights',title:'Lys ud',symbol:'💡',category:'Hjernevridere',description:'Sluk hele brættet. Hvert tryk skifter flere lys.',controls:'Vælg et felt for at skifte det og dets naboer oppe, nede og til siderne. Sluk alle 25 lys.'},
    {id:'dino',title:'Dinohop',symbol:'🦖',category:'Arkade',description:'Hop over kaktusser, og hold løbet i gang.',controls:'Mellemrum, ↑ eller Hop. Ét hop ad gangen.',live:true},
    {id:'snake',title:'Snake',symbol:'🐍',category:'Arkade',description:'Saml frugter, og giv slangen plads til at vokse.',controls:'Piletaster, WASD eller retningsknapper. Undgå vægge og din egen hale.',live:true},
    {id:'blocks',title:'Tetris · Blokfald',symbol:'🧩',category:'Arkade',description:'Drej brikkerne, og ryd hele rækker.',controls:'← → flytter · ↑ drejer · ↓ sænker · mellemrum slipper brikken.',live:true},
    {id:'pong',title:'Pong',symbol:'🏓',category:'Arkade',description:'Udfordr computeren. Først til 7 vinder.',controls:'↑ ↓, W/S eller flyt markøren på banen. Du styrer venstre bat.',live:true},
    {id:'breakout',title:'Breakout',symbol:'🧱',category:'Arkade',description:'Ryd murstenene, og pas på dine tre liv.',controls:'← →, A/D eller flyt markøren. Mellemrum / Send bold starter bolden.',live:true},
    {id:'2048',title:'2048',symbol:'🔢',category:'Hjernevridere',description:'Saml ens tal, til du når 2048.',controls:'Piletaster, WASD eller retningsknapper. Hver flise kan kun samles én gang pr. træk.'},
    {id:'mines',title:'Minestryger',symbol:'💣',category:'Hjernevridere',description:'Find de sikre felter på et bræt med 10 miner.',controls:'Klik for at åbne. Højreklik eller slå Flag til for at markere. Første åbning er altid sikker.'},
    {id:'memory',title:'Vendespil',symbol:'🎴',category:'Hjernevridere',description:'Find de otte par med så få forsøg som muligt.',controls:'Vælg to kort. Brug mus, berøring eller Tab og Enter.'},
    {id:'tic',title:'Kryds og bolle',symbol:'⭕',category:'For to',description:'Tre på stribe. Spil sammen på samme skærm.',controls:'X starter, derefter skiftes I til at vælge et felt. Tre på stribe vinder.'},
    {id:'four',title:'Fire på stribe',symbol:'🔴',category:'For to',description:'Læg en plan, og få fire brikker på stribe.',controls:'Spil sammen på samme skærm. Vælg en kolonne. Rød starter.'},
    {id:'choices',title:'Grøn eller rød',symbol:'🟢',category:'Bonus',description:'Din smag, dine valg. Mad, aktiviteter og spil.',controls:'Grøn = ja tak · rød = spring over. Ingen rigtige eller forkerte svar.'}
  ];
  const topics=[['🍕','Pizza til aftensmad'],['🎮','En aften med spil'],['🏖️','En dag på stranden'],['🍍','Ananas på pizza'],['🎢','Rutsjebaner'],['❄️','Vinter frem for sommer'],['🏕️','En nat i telt'],['🎧','Musik mens du arbejder'],['🍣','Sushi'],['📚','En god bog'],['🏃','En løbetur'],['🎬','Filmmaraton'],['🥞','Pandekager til morgenmad'],['♟️','Brætspil'],['🌶️','Stærk mad'],['🚲','Cykeltur uden en plan'],['🧩','Et svært puslespil'],['🍫','Mørk chokolade'],['🛸','Science fiction'],['🎤','Karaoke'],['🍦','Is om vinteren'],['🌅','At stå op til solopgangen'],['🎳','Bowling'],['🌲','En tur i skoven']];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const shuffle=(a,r)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const empty=(w,h)=>Array.from({length:h},()=>Array(w).fill(0));
  const shapes=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]]];
  function create(id,{difficulty='normal',rng=Math.random}={}){
    if(!catalog.some(g=>g.id===id))throw Error('Ukendt spil');
    const s={id,status:'playing',score:0,time:0,difficulty:['easy','normal','hard'].includes(difficulty)?difficulty:'normal',rng};
    s.factor={easy:0.8,normal:1,hard:1.25}[s.difficulty];
    if(id==='dino')Object.assign(s,{y:276,vy:0,obstacles:[],spawn:1.4,distance:0});
    if(id==='snake'){Object.assign(s,{snake:[[7,8],[6,8],[5,8]],dir:[1,0],next:null,clock:0,size:18});food(s);}
    if(id==='blocks'){Object.assign(s,{board:empty(10,20),bag:[],lines:0,clock:0});s.nextPiece=takePiece(s);spawnPiece(s);}
    if(id==='pong'){Object.assign(s,{paddle:142,ai:142,opponent:0,serve:0.8});servePong(s,1);}
    if(id==='breakout'){Object.assign(s,{paddle:270,lives:3,bricks:Array.from({length:40},(_,i)=>({x:24+i%8*74,y:48+Math.floor(i/8)*26,w:66,h:18,color:Math.floor(i/8)}))});serveBreakout(s);}
    if(id==='lights'){
      s.board=empty(5,5);s.moves=0;
      for(const pos of shuffle(Array.from({length:25},(_,i)=>i),rng).slice(0,8))switchLights(s,pos%5,Math.floor(pos/5));
      if(!s.board.flat().some(Boolean))switchLights(s,2,2);
    }
    if(id==='2048'){s.board=empty(4,4);addTile(s);addTile(s);}
    if(id==='mines')Object.assign(s,{board:empty(9,9),open:empty(9,9),flags:empty(9,9),seeded:false,mines:10});
    if(id==='memory')Object.assign(s,{cards:shuffle(Array.from({length:16},(_,i)=>i%8),rng),matched:[],flipped:[],attempts:0,wait:0});
    if(id==='tic')Object.assign(s,{board:empty(3,3),player:1,moves:0});
    if(id==='four')Object.assign(s,{board:empty(7,6),player:1,moves:0});
    if(id==='choices')Object.assign(s,{topics:shuffle(topics.map(x=>x.slice()),rng),index:0,yes:[],no:[]});
    return s;
  }
  function food(s){const spaces=[];for(let y=0;y<s.size;y++)for(let x=0;x<s.size;x++)if(!s.snake.some(p=>p[0]===x&&p[1]===y))spaces.push([x,y]);s.food=spaces[Math.floor(s.rng()*spaces.length)]||null;if(!s.food)s.status='won';}
  function snakeStep(s){
    if(s.next){s.dir=s.next;s.next=null;}
    const h=[s.snake[0][0]+s.dir[0],s.snake[0][1]+s.dir[1]],eat=s.food&&h[0]===s.food[0]&&h[1]===s.food[1];
    if(h.some(v=>v<0||v>=s.size)||s.snake.slice(0,eat?undefined:-1).some(p=>p[0]===h[0]&&p[1]===h[1])){s.status='lost';return;}
    s.snake.unshift(h);if(eat){s.score+=10;food(s);}else s.snake.pop();
  }
  function takePiece(s){if(!s.bag.length)s.bag=shuffle([0,1,2,3,4,5,6],s.rng);const n=s.bag.pop();return {matrix:shapes[n].map(r=>r.slice()),color:n+1};}
  function spawnPiece(s){s.piece=s.nextPiece;s.nextPiece=takePiece(s);s.x=Math.floor((10-s.piece.matrix[0].length)/2);s.y=0;if(collides(s,s.piece.matrix,s.x,s.y))s.status='lost';}
  function collides(s,m,x,y){return m.some((row,j)=>row.some((v,i)=>v&&(x+i<0||x+i>=10||y+j>=20||(y+j>=0&&s.board[y+j][x+i]))));}
  function lockPiece(s){
    s.piece.matrix.forEach((row,j)=>row.forEach((v,i)=>{if(v&&s.y+j>=0)s.board[s.y+j][s.x+i]=s.piece.color;}));
    const remaining=s.board.filter(row=>row.some(v=>!v)),cleared=20-remaining.length;
    s.board=[...empty(10,cleared),...remaining];s.lines+=cleared;s.score+=[0,100,300,500,800][cleared]*(1+Math.floor(s.lines/10));s.clock=0;spawnPiece(s);
  }
  function drop(s,score=false){if(!collides(s,s.piece.matrix,s.x,s.y+1)){s.y++;if(score)s.score++;return true;}lockPiece(s);return false;}
  function rotate(s){const m=s.piece.matrix[0].map((_,i)=>s.piece.matrix.map(r=>r[i]).reverse());for(const offset of [0,-1,1,-2,2,-3,3])if(!collides(s,m,s.x+offset,s.y)){s.piece.matrix=m;s.x+=offset;return;}}
  function addTile(s){const cells=[];s.board.forEach((r,y)=>r.forEach((v,x)=>{if(!v)cells.push([x,y]);}));if(cells.length){const [x,y]=cells[Math.floor(s.rng()*cells.length)];s.board[y][x]=s.rng()<0.9?2:4;}}
  function slide(s,dir){
    const old=JSON.stringify(s.board);
    for(let a=0;a<4;a++){
      const coords=Array.from({length:4},(_,b)=>dir==='left'?[b,a]:dir==='right'?[3-b,a]:dir==='up'?[a,b]:[a,3-b]);
      const values=coords.map(([x,y])=>s.board[y][x]).filter(Boolean),line=[];
      for(let i=0;i<values.length;i++){if(values[i]===values[i+1]){line.push(values[i]*2);s.score+=values[i]*2;i++;}else line.push(values[i]);}
      coords.forEach(([x,y],i)=>s.board[y][x]=line[i]||0);
    }
    if(JSON.stringify(s.board)!==old)addTile(s);
    if(s.board.some(r=>r.some(v=>v>=2048))){s.status='won';return;}
    if(s.board.every((r,y)=>r.every((v,x)=>v&&(x===3||v!==r[x+1])&&(y===3||v!==s.board[y+1][x]))))s.status='lost';
  }
  function seedMines(s,x,y){
    const places=[];for(let j=0;j<9;j++)for(let i=0;i<9;i++)if(Math.abs(i-x)>1||Math.abs(j-y)>1)places.push([i,j]);
    shuffle(places,s.rng).slice(0,10).forEach(([i,j])=>s.board[j][i]=-1);
    for(let j=0;j<9;j++)for(let i=0;i<9;i++)if(s.board[j][i]!==-1)s.board[j][i]=neighbors(i,j).filter(([a,b])=>s.board[b][a]===-1).length;
    s.seeded=true;
  }
  function neighbors(x,y){const a=[];for(let j=Math.max(0,y-1);j<=Math.min(8,y+1);j++)for(let i=Math.max(0,x-1);i<=Math.min(8,x+1);i++)if(i!==x||j!==y)a.push([i,j]);return a;}
  function reveal(s,x,y){
    if(s.open[y][x]||s.flags[y][x])return;
    if(!s.seeded)seedMines(s,x,y);
    if(s.board[y][x]===-1){s.open[y][x]=1;s.status='lost';return;}
    const todo=[[x,y]];
    while(todo.length){const [i,j]=todo.pop();if(s.open[j][i]||s.flags[j][i]||s.board[j][i]===-1)continue;s.open[j][i]=1;s.score++;if(s.board[j][i]===0)todo.push(...neighbors(i,j));}
    if(s.score===71)s.status='won';
  }
  function winner(s,need){
    const h=s.board.length,w=s.board[0].length;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(s.board[y][x])for(const [dx,dy]of [[1,0],[0,1],[1,1],[1,-1]]){
      const cells=Array.from({length:need},(_,i)=>[x+dx*i,y+dy*i]);
      if(cells.every(([a,b])=>a>=0&&a<w&&b>=0&&b<h&&s.board[b][a]===s.board[y][x])){s.winner=s.board[y][x];s.winning=cells;s.status='won';return;}
    }
    if(s.board.every(r=>r.every(Boolean)))s.status='draw';
  }
  function servePong(s,dir){s.ball={x:320,y:180,vx:dir*250*s.factor,vy:(s.rng()<0.5?-1:1)*125*s.factor};s.serve=0.8;}
  function serveBreakout(s){s.ball={x:s.paddle+50,y:318,vx:145*s.factor,vy:-220*s.factor};s.launch=true;}
  function switchLights(s,x,y){
    for(const [dx,dy] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]){
      const row=s.board[y+dy];
      if(row && row[x+dx]!==undefined) row[x+dx]^=1;
    }
  }
  function act(s,action,value){
    if(s.status!=='playing')return;
    if(s.id==='lights' && action==='cell' && Array.isArray(value)){
      const [x,y]=value;
      if(![x,y].every(v=>Number.isInteger(v)&&v>=0&&v<5))return;
      switchLights(s,x,y);s.moves++;
      if(!s.board.flat().some(Boolean))s.status='won';
    }
    if(s.id==='dino'&&(action==='jump'||action==='up')&&s.y>=276){s.vy=-540;}
    if(s.id==='snake'){
      const dir={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[action];
      if(dir&&!s.next&&(dir[0]!==-s.dir[0]||dir[1]!==-s.dir[1]))s.next=dir;
    }
    if(s.id==='blocks'){
      if(action==='left'||action==='right'){const x=s.x+(action==='left'?-1:1);if(!collides(s,s.piece.matrix,x,s.y))s.x=x;}
      if(action==='up'||action==='rotate')rotate(s);
      if(action==='down')drop(s,true);
      if(action==='drop'){while(!collides(s,s.piece.matrix,s.x,s.y+1)){s.y++;s.score+=2;}lockPiece(s);}
    }
    if(s.id==='2048'&&['up','down','left','right'].includes(action))slide(s,action);
    if(s.id==='mines'&&Array.isArray(value)){
      const [x,y]=value;if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||x>8||y<0||y>8)return;
      if(action==='flag'&&!s.open[y][x])s.flags[y][x]=s.flags[y][x]?0:1;
      if(action==='cell')reveal(s,x,y);
    }
    if(s.id==='memory'&&action==='cell'&&Number.isInteger(value)&&value>=0&&value<16&&!s.wait&&!s.flipped.includes(value)&&!s.matched.includes(value)){
      s.flipped.push(value);
      if(s.flipped.length===2){s.attempts++;const [a,b]=s.flipped;if(s.cards[a]===s.cards[b]){s.matched.push(a,b);s.flipped=[];s.score+=100;if(s.matched.length===16)s.status='won';}else s.wait=0.9;}
    }
    if(s.id==='tic'&&action==='cell'&&Array.isArray(value)){
      const [x,y]=value;if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||x>2||y<0||y>2||s.board[y][x])return;
      s.board[y][x]=s.player;s.moves++;winner(s,3);if(s.status==='playing')s.player=3-s.player;
    }
    if(s.id==='four'&&action==='column'&&Number.isInteger(value)&&value>=0&&value<7){
      let y=5;while(y>=0&&s.board[y][value])y--;if(y<0)return;s.board[y][value]=s.player;s.moves++;winner(s,4);if(s.status==='playing')s.player=3-s.player;
    }
    if(s.id==='pong'&&action==='pointer'&&Number.isFinite(value))s.paddle=clamp(value-38,0,284);
    if(s.id==='breakout'){
      if(action==='pointer'&&Number.isFinite(value))s.paddle=clamp(value-50,0,540);
      if(action==='launch')s.launch=false;
    }
    if(s.id==='choices'&&(action==='yes'||action==='no')){s[action].push(s.topics[s.index]);s.index++;if(s.index===s.topics.length)s.status='won';}
  }
  function overlaps(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
  function step(s,dt,keys=new Set()){
    if(s.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;
    dt=Math.min(dt,0.05);s.time+=dt;
    if(s.id==='snake'){s.clock+=dt;const pace=Math.max(0.065,0.17/s.factor-s.score*0.0004);if(s.clock>=pace){s.clock-=pace;snakeStep(s);}}
    if(s.id==='blocks'){s.clock+=dt;if(s.clock>=Math.max(0.1,0.75/s.factor-Math.floor(s.lines/10)*0.07)){s.clock=0;drop(s);}}
    if(s.id==='memory'&&s.wait){s.wait=Math.max(0,s.wait-dt);if(!s.wait)s.flipped=[];}
    if(s.id==='dino'){
      const speed=(235+Math.min(200,s.time*3))*s.factor;
      s.vy+=1500*dt;s.y=Math.min(276,s.y+s.vy*dt);if(s.y===276)s.vy=0;
      s.distance+=speed*dt/12;s.score=Math.floor(s.distance);s.spawn-=dt;
      if(s.spawn<=0){const h=30+Math.floor(s.rng()*24);s.obstacles.push({x:660,y:318-h,w:22+Math.floor(s.rng()*15),h});s.spawn=(0.95+s.rng()*0.6)/Math.sqrt(s.factor);}
      s.obstacles.forEach(o=>o.x-=speed*dt);s.obstacles=s.obstacles.filter(o=>o.x+o.w>0);
      if(s.obstacles.some(o=>overlaps({x:76,y:s.y+5,w:30,h:36},{x:o.x+3,y:o.y+3,w:o.w-6,h:o.h-3})))s.status='lost';
    }
    if(s.id==='pong'){
      s.paddle=clamp(s.paddle+((keys.has('down')?1:0)-(keys.has('up')?1:0))*330*dt,0,284);
      const target=s.ball.vx>0?s.ball.y-38:142,move=(s.difficulty==='easy'?130:s.difficulty==='hard'?290:200)*dt;
      s.ai=clamp(s.ai+clamp(target-s.ai,-move,move),0,284);
      if(s.serve>0){s.serve-=dt;return;}
      const b=s.ball,oldX=b.x;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.y<7||b.y>353){b.y=clamp(b.y,7,353);b.vy=-b.vy;}
      if(b.vx<0&&oldX>=37&&b.x<=37&&b.y>=s.paddle-7&&b.y<=s.paddle+83){b.x=37;b.vx=Math.min(520,Math.abs(b.vx)*1.05);b.vy=(b.y-s.paddle-38)*6;}
      if(b.vx>0&&oldX<=603&&b.x>=603&&b.y>=s.ai-7&&b.y<=s.ai+83){b.x=603;b.vx=-Math.min(520,Math.abs(b.vx)*1.05);b.vy=(b.y-s.ai-38)*6;}
      if(b.x<0||b.x>640){if(b.x>640)s.score++;else s.opponent++;if(s.score===7)s.status='won';else if(s.opponent===7)s.status='lost';else servePong(s,b.x>640?-1:1);}
    }
    if(s.id==='breakout'){
      s.paddle=clamp(s.paddle+((keys.has('right')?1:0)-(keys.has('left')?1:0))*390*dt,0,540);
      const b=s.ball;if(s.launch){b.x=s.paddle+50;return;}
      // Substeps prevent a fast ball from passing through thin bricks.
      const count=Math.ceil(dt/0.008),part=dt/count;
      for(let k=0;k<count;k++){
        const px=b.x,py=b.y;b.x+=b.vx*part;b.y+=b.vy*part;
        if(b.x<7||b.x>633){b.x=clamp(b.x,7,633);b.vx=-b.vx;}if(b.y<7){b.y=7;b.vy=Math.abs(b.vy);}
        if(b.vy>0&&b.y+7>=330&&py+7<=340&&b.x>=s.paddle-7&&b.x<=s.paddle+107){b.y=323;b.vx=(b.x-s.paddle-50)*5;b.vy=-Math.max(170,290*s.factor-Math.abs(b.vx)*0.3);}
        const index=s.bricks.findIndex(r=>overlaps({x:b.x-7,y:b.y-7,w:14,h:14},r));
        if(index>=0){const brick=s.bricks[index];if(px+7<=brick.x||px-7>=brick.x+brick.w)b.vx=-b.vx;else b.vy=-b.vy;s.bricks.splice(index,1);s.score+=10;b.x=px;b.y=py;if(!s.bricks.length){s.status='won';break;}}
        if(b.y>374){s.lives--;if(s.lives===0)s.status='lost';else serveBreakout(s);break;}
      }
    }
  }
  globalThis.lectioPlusGamesCore={catalog,create,act,step,collides};
})();
