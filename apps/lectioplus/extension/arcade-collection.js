(() => {
  'use strict';
  const catalog=[
    ['teacher','Gæt læreren','🎓','Bonus','Genkend en lærer fra din egen skole på billedet.','Se lærerens foto, og vælg det rigtige navn blandt fire lærere fra skolen.'],
    ['flap','Vingesus','🐦','Arkade','Flyv gennem 15 porte på én tur.','Klik på banen, brug mellemrum eller tryk på Bask for at holde fuglen i luften.'],
    ['moles','Muldvarpejagt','🐾','Arkade','Hvor mange muldvarpe kan du nå på 30 sekunder?','Tryk på muldvarpen, når den dukker op. Et tomt hul koster ét point.'],
    ['echo','Farveekko','🎵','Hjernevridere','Husk en voksende lyssekvens på fire felter.','Se rækkefølgen, og gentag den. Hver runde lægger én farve til. Klar otte runder.'],
    ['slide','15-puslespil','🔳','Hjernevridere','Skub de femten tal på plads.','Vælg en brik ved siden af det tomme felt. Sortér tallene fra 1 til 15 med hullet nederst til højre.'],
    ['sudoku','Mini-sudoku','✏️','Hjernevridere','Udfyld et 4 × 4-bræt med tallene 1–4.','Vælg et åbent felt og et tal. Hver række, kolonne og 2 × 2-boks skal indeholde alle fire tal.'],
    ['code','Knæk koden','🔐','Hjernevridere','Find den skjulte farvekode på højst otte forsøg.','Vælg fire farver. Facit viser antal på rigtig plads og antal rigtige farver på forkert plads. Farver kan gentages.'],
    ['word','Bogstavjagt','🔤','Hjernevridere','Gæt det danske ord, før du bruger dine seks fejl.','Brug ledetråden og vælg ét bogstav ad gangen. Rigtige bogstaver afsløres alle steder i ordet.'],
    ['maze','Labyrintløb','🧭','Hjernevridere','Find udgangen af tre nye labyrinter.','Brug piletaster, WASD eller retningsknapper. Du kan også vælge et tilstødende felt.'],
    ['crates','Kasseskubber','📦','Hjernevridere','Få alle kasser hen på mærkerne i tre lagerrum.','Skub én kasse ad gangen med piletaster eller knapper. Fortryd et træk, hvis en kasse sidder fast.'],
    ['reversi','Reversi','⚫','For to','Omring modstanderens brikker og vend dem til din farve.','Læg en brik i et markeret felt. En spiller uden lovlige træk springes over. Flest brikker til sidst vinder.']
  ].map(([id,title,symbol,category,description,controls])=>({id,title,symbol,category,description,controls,live:id==='flap'}));
  const quizzes=globalThis.lectioPlusQuizGames;
  if(quizzes)catalog.push(...quizzes.catalog);
  const ids=new Set(catalog.map(g=>g.id));
  const random=(s,n)=>Math.floor(s.rng()*n);
  const numbers=n=>Array.from({length:n},(_,i)=>i);
  function mix(s,items){
    const result=[...items];
    for(let i=result.length-1;i>0;i--){const j=random(s,i+1);[result[i],result[j]]=[result[j],result[i]];}
    return result;
  }
  const names=['Rød','Blå','Grøn','Gul','Lilla','Orange'];
  const words=[
    ['KOMPAS','Det hjælper dig med at finde nord.'],['CYKEL','Den har pedaler og to hjul.'],['VULKAN','Et bjerg med en varm inderside.'],
    ['MÅNESKIN','Lys på en skyfri nat.'],['KIKKERT','Den får noget fjernt til at se tæt på ud.'],['BIBLIOTEK','Her kan du låne en historie.'],
    ['REGNBUE','Farver efter en regnbyge.'],['SNEFNUG','En lille krystal om vinteren.'],['TANGENT','Du finder den på et klaver.'],
    ['NØGLE','Den passer til en lås.'],['SØSTJERNE','Et dyr med arme på havbunden.'],['ÆBLETRÆ','En plante med spiselig frugt.'],
    ['PENSEL','Den kan lægge farve på et lærred.'],['SATELLIT','Den er i kredsløb.'],['KÆLKEBAKKE','Et godt sted på en snedag.']
  ];
  const decks=[
    ['#######','#     #','# @$. #','#     #','#######'],
    ['#######','# . . #','# $ $ #','#  @  #','#######'],
    ['########','# .    #','# $ $ .#','#   @  #','########']
  ];
  const deltas={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]};
  function near(a,b,w){return Math.abs(a%w-b%w)+Math.abs(Math.floor(a/w)-Math.floor(b/w))===1;}
  function room(s){
    const rows=decks[s.round];s.width=rows[0].length;s.map=rows.join('');s.pos=s.map.indexOf('@');
    s.boxes=numbers(s.map.length).filter(i=>s.map[i]==='$');s.history=[];s.roomMoves=0;
  }
  function labyrinth(s){
    s.width=9+2*s.round;const w=s.width,cells=Array(w*w).fill('#');
    const path=[w+1];cells[w+1]=' ';
    while(path.length){
      const here=path.at(-1),x=here%w,y=Math.floor(here/w);
      const dirs=mix(s,Object.values(deltas));
      const dir=dirs.find(([dx,dy])=>x+2*dx>0&&x+2*dx<w-1&&y+2*dy>0&&y+2*dy<w-1&&cells[here+2*(dx+w*dy)]==='#');
      if(!dir){path.pop();continue;}
      const step=dir[0]+w*dir[1];cells[here+step]=cells[here+2*step]=' ';path.push(here+2*step);
    }
    s.map=cells.join('');s.pos=w+1;s.exit=w*(w-1)-2;
  }
  function reversals(board,i,p){
    if(board[i]!==0)return [];
    const result=[],x=i%8,y=Math.floor(i/8);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy)continue;
      let col=x+dx,row=y+dy;const line=[];
      while(col>=0&&col<8&&row>=0&&row<8&&board[row*8+col]===3-p){line.push(row*8+col);col+=dx;row+=dy;}
      if(col>=0&&col<8&&row>=0&&row<8&&board[row*8+col]===p)result.push(...line);
    }
    return result;
  }
  function legal(board,p){return numbers(64).filter(i=>reversals(board,i,p).length);}
  function init(s){
    s.revision=0;s.moves=0;s.message='';
    if(quizzes?.ids.has(s.id)){quizzes.init(s);return;}
    switch(s.id){
      case 'teacher':Object.assign(s,{stage:'loading',rounds:[],answer:null,correct:0,mistakes:[],more:false});break;
      case 'flap':Object.assign(s,{birdY:165,vy:0,gates:[],spawn:.6,passed:0,launched:false});break;
      case 'moles':Object.assign(s,{hole:random(s,9),cooldown:.9,hits:0,misses:0});break;
      case 'echo':Object.assign(s,{sequence:[random(s,4)],phase:'watch',beat:-1,lit:-1,delay:.42,turn:0});break;
      case 'slide':{
        s.tiles=[...numbers(15).map(i=>i+1),0];let gap=15,prev=-1;
        for(let n=0;n<91;n++){const next=mix(s,numbers(16).filter(i=>i!==prev&&near(i,gap,4)))[0];s.tiles[gap]=s.tiles[next];s.tiles[next]=0;prev=gap;gap=next;}
        break;
      }
      case 'sudoku':{
        // This mask has a unique solution. Permuting digits and rotating the board preserve it.
        const perm=mix(s,[1,2,3,4]),rotation=random(s,4),mask='1001011010010110';
        s.solution=[];s.fixed=[];s.cells=[];s.selected=-1;
        for(let i=0;i<16;i++){
          let x=i%4,y=i>>2;for(let n=0;n<rotation;n++)[x,y]=[3-y,x];
          const v=perm[(x+y*2+Math.floor(y/2))%4];s.solution[i]=v;s.fixed[i]=mask[4*y+x]==='1';s.cells[i]=s.fixed[i]?v:0;
        }
        break;
      }
      case 'code':Object.assign(s,{secret:numbers(4).map(()=>random(s,6)),guess:[],log:[]});break;
      case 'word':[s.word,s.hint]=words[random(s,words.length)];s.letters=[];s.errors=0;break;
      case 'maze':s.round=0;labyrinth(s);break;
      case 'crates':s.round=0;room(s);break;
      case 'reversi':s.board=Array(64).fill(0);s.board[27]=s.board[36]=2;s.board[28]=s.board[35]=1;s.player=1;s.legal=legal(s.board,1);break;
    }
  }
  function nextRoom(s,load){
    s.score+=100;
    if(s.round===2)s.status='won';else{s.round++;load(s);}
  }
  function move(s,type,value){
    if(quizzes?.ids.has(s.id)){quizzes.move(s,type,value);return;}
    const pick=type==='pick',i=value;s.revision++;
    switch(s.id){
      case 'teacher':{
        if(type==='question' && s.stage==='loading'){
          const names=[...new Set(i.names)];
          if(names.length<4 || !names.includes(i.name) || s.rounds.some(q=>q.name===i.name))break;
          const distractors=mix(s,names.filter(n=>n!==i.name)).slice(0,3);
          s.rounds.push({name:i.name,options:mix(s,[i.name,...distractors])});
          s.more=i.more && s.rounds.length<12;s.stage='ready';s.answer=null;
        }else if(s.stage==='ready'){
          const q=s.rounds.at(-1);
          if(pick && s.answer===null && q.options.includes(i)){
            s.answer=i;if(i===q.name){s.correct++;s.score+=100;}else s.mistakes.push({name:q.name,answer:i});
          }else if(type==='next' && s.answer!==null){
            if(s.more){s.stage='loading';s.answer=null;}else s.status='won';
          }
        }
        break;
      }
      case 'flap':if(type==='jump'||type==='up'){s.launched=true;s.vy=-206;}break;
      case 'moles':if(pick&&Number.isInteger(i)&&i>=0&&i<9){
        if(i===s.hole){s.hits++;s.score+=3;s.hole=-1;s.cooldown=.15;}
        else{s.misses++;s.score=Math.max(0,s.score-1);}
      }break;
      case 'echo':if(pick&&s.phase==='repeat'&&Number.isInteger(i)&&i>=0&&i<4){
        if(i!==s.sequence[s.turn]){s.expected=s.sequence[s.turn];s.status='lost';break;}
        s.turn++;s.score+=10;
        if(s.turn===s.sequence.length){
          if(s.turn===8)s.status='won';
          else{s.sequence.push(random(s,4));s.turn=0;s.beat=-1;s.delay=.55;s.phase='watch';s.lit=-1;}
        }
      }break;
      case 'slide':if(pick&&s.tiles[i]&&near(i,s.tiles.indexOf(0),4)){
        const gap=s.tiles.indexOf(0);s.tiles[gap]=s.tiles[i];s.tiles[i]=0;s.moves++;
        if(s.tiles.every((v,j)=>v===(j+1)%16)){s.score=Math.max(1,1000-s.moves);s.status='won';}
      }break;
      case 'sudoku':
        if(pick&&Number.isInteger(i)&&i>=0&&i<16&&!s.fixed[i])s.selected=i;
        if(type==='digit'&&s.selected>=0&&Number.isInteger(i)&&i>=0&&i<=4){
          s.cells[s.selected]=i;s.moves++;
          if(s.cells.every((v,j)=>v===s.solution[j])){s.score=Math.max(1,200-s.moves);s.status='won';}
        }break;
      case 'code':
        if(pick&&s.guess.length<4&&Number.isInteger(i)&&i>=0&&i<6)s.guess.push(i);
        if(type==='undo')s.guess.pop();
        if(type==='check'&&s.guess.length===4){
          const exact=s.guess.filter((v,j)=>v===s.secret[j]).length;
          const total=numbers(6).reduce((n,k)=>n+Math.min(s.secret.filter(v=>v===k).length,s.guess.filter(v=>v===k).length),0);
          s.log.push({guess:s.guess,exact,other:total-exact});s.guess=[];
          if(exact===4){s.score=100*(9-s.log.length);s.status='won';}else if(s.log.length===8)s.status='lost';
        }break;
      case 'word':
        if(!pick||typeof i!=='string'||!/^([A-ZÆØÅ])$/.test(i)||s.letters.includes(i))break;
        s.letters.push(i);if(!s.word.includes(i))s.errors++;
        if([...s.word].every(c=>s.letters.includes(c))){s.score=(7-s.errors)*100;s.status='won';}
        else if(s.errors===6)s.status='lost';break;
      case 'maze':case 'crates':{
        if(type==='undo'&&s.id==='crates'&&s.history.length){
          const h=s.history.pop();s.pos=h.pos;s.boxes=h.boxes;s.moves--;s.roomMoves--;break;
        }
        if(type==='resetRoom'&&s.id==='crates'){s.moves-=s.roomMoves;room(s);break;}
        const delta=deltas[type],to=delta?s.pos+delta[0]+s.width*delta[1]:pick?i:-1;
        if(!Number.isInteger(to)||to<0||to>=s.map.length||!near(to,s.pos,s.width)||s.map[to]==='#')break;
        if(s.id==='crates'){
          const box=s.boxes.indexOf(to),after=to+(to-s.pos);
          if(box>=0&&(s.map[after]==='#'||s.boxes.includes(after)))break;
          s.history.push({pos:s.pos,boxes:[...s.boxes]});s.roomMoves++;
          if(box>=0)s.boxes[box]=after;
        }
        s.pos=to;s.moves++;
        if(s.id==='maze'&&to===s.exit)nextRoom(s,labyrinth);
        if(s.id==='crates'&&s.boxes.every(n=>s.map[n]==='.'))nextRoom(s,room);
        break;
      }
      case 'reversi':{
        if(!pick||!s.legal.includes(i))break;
        for(const pos of [i,...reversals(s.board,i,s.player)])s.board[pos]=s.player;s.moves++;
        s.player=3-s.player;s.legal=legal(s.board,s.player);s.message='';
        if(!s.legal.length){
          s.message=(s.player===1?'Sort':'Hvid')+' må springe over.';s.player=3-s.player;s.legal=legal(s.board,s.player);
          if(!s.legal.length){
            const black=s.board.filter(v=>v===1).length,white=s.board.filter(v=>v===2).length;
            s.winner=black===white?0:black>white?1:2;s.status=s.winner?'won':'draw';
          }
        }
      }
    }
  }
  function tick(s,dt){
    if(quizzes?.ids.has(s.id)){quizzes.tick(s);return;}
    if(s.id==='moles'){
      if(s.time>=30){s.status='won';return;}
      if((s.cooldown-=dt)<=0){
        s.hole=s.hole<0?random(s,9):(s.hole+1+random(s,8))%9;s.cooldown=Math.max(.38,1-s.time*.016);s.revision++;
      }
    }
    if(s.id==='echo'&&s.phase==='watch'&&(s.delay-=dt)<=0){
      s.beat++;s.revision++;
      if(s.beat>=s.sequence.length*2){s.phase='repeat';s.lit=-1;}
      else{s.lit=s.beat%2===0?s.sequence[s.beat/2]:-1;s.delay=s.lit<0?.18:.48;}
    }
    if(s.id==='flap'&&s.launched){
      s.vy+=590*dt;s.birdY+=s.vy*dt;
      if((s.spawn-=dt)<=0){s.gates.push({x:665,mid:95+random(s,155),gap:(132-Math.min(24,s.passed*2))/Math.sqrt(s.factor),counted:false});s.spawn=1.62;}
      for(const g of s.gates){
        g.x-=154*s.factor*dt;
        if(g.x<109&&g.x+47>91&&(s.birdY-9<g.mid-g.gap/2||s.birdY+9>g.mid+g.gap/2))s.status='lost';
        if(!g.counted&&g.x+47<91){g.counted=true;s.passed++;s.score+=10;}
      }
      s.gates=s.gates.filter(g=>g.x>-50);
      if(s.birdY<=9||s.birdY>=339)s.status='lost';
      if(s.status==='playing'&&s.passed>=15)s.status='won';
    }
  }
  globalThis.lectioPlusArcade={catalog,ids,init,move,tick,legal,names};
})();
