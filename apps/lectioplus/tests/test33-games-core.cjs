const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const env={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../extension/quiz-games.js'),'utf8'),env);vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../extension/arcade-collection.js'),'utf8'),env);vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../extension/dash.js'),'utf8'),env);vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../extension/games-core.js'),'utf8'),env);const C=env.lectioPlusGamesCore;
let checks=0;const ok=(v,label)=>{assert.ok(v,label);checks++;},same=(a,b,label)=>{assert.equal(JSON.stringify(a),JSON.stringify(b),label);checks++;};
const make=(id)=>C.create(id,{rng:()=>0.35}),tick=(s,n=1,keys)=>{for(let i=0;i<n;i++)C.step(s,0.016,keys);};
ok(C.catalog.length===30&&new Set(C.catalog.map(g=>g.id)).size===30,'30 games');
for(const game of C.catalog){const s=make(game.id);ok(s.status==='playing'&&Number.isFinite(s.score),game.id+' starts');ok(game.controls.length>20,game.id+' has controls');}
let s=make('dino');C.act(s,'jump');ok(s.vy<0,'jump');tick(s,5);const vy=s.vy;C.act(s,'jump');ok(s.vy===vy,'no double jump');tick(s,55);ok(s.y===276&&s.vy===0,'lands on ground');s.obstacles=[{x:80,y:276,w:28,h:42}];tick(s);ok(s.status==='lost','dino collision');
s=make('snake');C.act(s,'left');ok(!s.next,'no reverse');C.act(s,'up');C.act(s,'left');same(s.next,[0,-1],'only one turn per cell');tick(s,12);same(s.snake[0],[7,7],'queued turn');
s=make('snake');s.food=[8,8];tick(s,12);ok(s.snake.length===4&&s.score===10,'snake grows');ok(!s.snake.some(p=>p[0]===s.food[0]&&p[1]===s.food[1]),'food outside snake');
s=make('snake');s.snake=[[17,1],[16,1]];tick(s,12);ok(s.status==='lost','wall');
s=make('snake');s.snake=[[1,1],[1,2],[2,2],[2,1]];s.dir=[1,0];s.food=[9,9];tick(s,12);ok(s.status==='playing','moving into vacated tail is legal');
s=make('snake');s.size=2;s.snake=[[0,0],[0,1],[1,1]];s.food=[1,0];tick(s,12);ok(s.status==='won'&&!s.food,'full snake board wins');
s=make('blocks');ok(new Set([s.piece.color,s.nextPiece.color,...s.bag.map(x=>x+1)]).size===7,'seven-bag');
s.board[18]=Array(10).fill(1);s.board[19]=Array(10).fill(1);for(const y of [18,19]){s.board[y][4]=0;s.board[y][5]=0;}s.piece={matrix:[[1,1],[1,1]],color:2};s.x=4;s.y=18;C.act(s,'down');ok(s.lines===2&&s.score===300,'clear two lines');ok(s.board.every(r=>r.every(v=>v===0)),'rows removed and blank rows inserted');
s=make('blocks');s.piece={matrix:[[1],[1],[1],[1]],color:1};s.x=9;s.y=2;C.act(s,'rotate');ok(!C.collides(s,s.piece.matrix,s.x,s.y)&&s.piece.matrix[0].length===4,'rotation kicks away from wall');
s=make('blocks');C.act(s,'drop');ok(s.board.some(r=>r.some(Boolean))&&s.score>0,'hard drop locks and scores');s.board[0]=Array(10).fill(1);s.board[1]=Array(10).fill(1);s.piece={matrix:[[1]],color:1};s.x=0;s.y=19;C.act(s,'down');ok(s.status==='playing','full rows removed before next spawn');
s=make('2048');s.board=[[2,2,2,2],[0,0,0,0],[0,0,0,0],[0,0,0,0]];C.act(s,'left');same(s.board[0],[4,4,0,0],'merge once per tile');ok(s.score===8,'merge score');
s=make('2048');s.board=[[2,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];const board=JSON.stringify(s.board);C.act(s,'left');ok(JSON.stringify(s.board)===board,'no random tile after invalid move');
s.board=[[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,4,2]];C.act(s,'left');ok(s.status==='lost','no available moves');
s=make('2048');s.board=[[1024,1024,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];C.act(s,'left');ok(s.status==='won','2048 win');
s=make('mines');C.act(s,'flag',[4,4]);C.act(s,'cell',[4,4]);ok(!s.seeded,'flag protects closed cell');C.act(s,'flag',[4,4]);C.act(s,'cell',[4,4]);ok(s.seeded&&s.board.flat().filter(x=>x===-1).length===10,'ten mines');for(let y=3;y<6;y++)for(let x=3;x<6;x++)ok(s.board[y][x]!==-1,'safe first-click area');
for(let y=0;y<9;y++)for(let x=0;x<9;x++)if(s.board[y][x]!==-1)C.act(s,'cell',[x,y]);ok(s.status==='won'&&s.score===71,'all safe cells win');
s=make('mines');C.act(s,'cell',[0,0]);let bomb;for(let y=0;y<9;y++)for(let x=0;x<9;x++)if(s.board[y][x]===-1)bomb=[x,y];C.act(s,'cell',bomb);ok(s.status==='lost','revealed mine loses');
s=make('memory');const a=0,b=s.cards.findIndex(v=>v!==s.cards[0]);C.act(s,'cell',a);C.act(s,'cell',a);ok(s.flipped.length===1,'cannot pair card with itself');C.act(s,'cell',b);C.act(s,'cell',15);ok(s.flipped.length===2&&s.attempts===1,'two-card lock');tick(s,65);ok(s.flipped.length===0,'unmatched cards turn back');
for(let v=0;v<8;v++){const indices=s.cards.flatMap((value,i)=>value===v?[i]:[]);indices.forEach(i=>C.act(s,'cell',i));}ok(s.status==='won'&&s.matched.length===16,'eight pairs win');
s=make('tic');for(const cell of [[0,0],[0,1],[1,0],[1,1],[2,0]])C.act(s,'cell',cell);ok(s.status==='won'&&s.winner===1&&s.winning.length===3,'tic row win');C.act(s,'cell',[2,2]);ok(s.moves===5,'finished board locked');
s=make('tic');for(const cell of [[0,0],[1,0],[2,0],[1,1],[0,1],[2,1],[1,2],[0,2],[2,2]])C.act(s,'cell',cell);ok(s.status==='draw','tic draw');
s=make('four');for(const col of [0,1,0,1,0,1,0])C.act(s,'column',col);ok(s.status==='won'&&s.winner===1,'four vertical win');
s=make('four');for(const col of [0,0,1,1,2,2,3])C.act(s,'column',col);ok(s.status==='won'&&s.winner===1,'four horizontal win');
s=make('four');s.board[5][0]=1;s.board[4][1]=1;s.board[3][2]=1;for(let y=3;y<6;y++)s.board[y][3]=2;C.act(s,'column',3);ok(s.status==='won'&&s.winner===1,'four diagonal win');
s=make('four');for(let i=0;i<6;i++)C.act(s,'column',2);C.act(s,'column',2);ok(s.moves===6,'full column rejects turn');
s=make('pong');s.serve=0;s.ball={x:38,y:180,vx:-520,vy:0};C.step(s,0.05);ok(s.ball.vx>0,'fast ball cannot tunnel through paddle');C.act(s,'pointer',-100);ok(s.paddle===0,'paddle bounds');s.score=6;s.ball={x:639,y:20,vx:500,vy:0};tick(s);ok(s.status==='won'&&s.score===7,'pong first to seven');
s=make('pong');s.serve=0;s.opponent=6;s.ball={x:1,y:20,vx:-500,vy:0};tick(s);ok(s.status==='lost','pong opponent win');
s=make('breakout');ok(s.launch&&s.lives===3&&s.bricks.length===40,'breakout setup');C.act(s,'launch');tick(s,30);ok(s.ball.y<318&&!s.launch,'ball launched');s.ball={x:0,y:373,vx:0,vy:300};tick(s);ok(s.lives===2&&s.launch,'new serve after lost life');
s.lives=1;s.launch=false;s.ball={x:0,y:373,vx:0,vy:300};tick(s);ok(s.status==='lost'&&s.lives===0,'three lives');
s=make('breakout');s.launch=false;s.bricks=[{x:100,y:80,w:66,h:18}];s.ball={x:130,y:110,vx:0,vy:-300};tick(s,4);ok(s.status==='won'&&s.score===10,'last brick wins');
s=make('choices');for(let i=0;i<24;i++)C.act(s,i%2?'yes':'no');ok(s.status==='won'&&s.yes.length===12&&s.no.length===12,'all bonus choices counted');ok(s.topics.every(t=>t.length===2&&!/https?:|elev|lærer/i.test(t.join(''))),'bonus contains no profiles or remote images');
// Deterministic mixed-input runs exercise state invariants, including restarts.
let seed=33;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
for(const id of ['dino','snake','blocks','pong','breakout','2048'])for(let round=0;round<6;round++){
  s=C.create(id,{rng:random,difficulty:['easy','normal','hard'][round%3]});
  for(let i=0;i<700&&s.status==='playing';i++){if(i%4===0)C.act(s,['up','down','left','right','jump','launch','rotate','drop'][Math.floor(random()*8)]);C.step(s,0.016,new Set(random()<0.5?['left','up']:['right','down']));}
  ok(Number.isFinite(s.score)&&Number.isFinite(s.time)&&s.score>=0,id+' bounded score');
  if(s.board)ok(s.board.every(r=>r.every(Number.isFinite)),id+' valid board');
  if(s.ball)ok(Object.values(s.ball).every(Number.isFinite),id+' finite ball');
}
console.log('TOTAL',checks,'Test 33 game rules, collisions, wins, losses and state checks');
