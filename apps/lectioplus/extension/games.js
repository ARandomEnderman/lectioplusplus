(() => {
  'use strict';
  const C=globalThis.lectioPlusGamesCore;
  globalThis.lectioPlusGames=({getPreferences,onChange})=>{
    const E=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
    const B=(text,fn,cls='')=>{const b=E('button','lxp-game-button '+cls,text);b.type='button';b.addEventListener('click',fn);return b;};
    const link=(title,href,cls)=>{const a=E('a',cls,title);a.href=href;return a;};
    const node=E('main','lxp-games');node.id='lxp-games';node.hidden=true;
    const lobby=E('section','lxp-games-lobby'),play=E('section','lxp-game-play');node.append(lobby,play);
    const heading=E('header','lxp-games-heading'),eyebrow=E('p','lxp-game-eyebrow','TAG EN PAUSE'),title=E('h1','','Spil'),intro=E('p','','10 klassikere og et bonusspil. Vælg et spil, og gå i gang.');
    heading.append(eyebrow,title,intro);lobby.append(heading);
    const filters=E('nav','lxp-games-filters');filters.setAttribute('aria-label','Spilkategorier');lobby.append(filters);
    const cards=E('div','lxp-games-cards');lobby.append(cards);
    const small=E('p','lxp-game-footnote','Spillene kører lokalt. Dine rekorder gemmes på denne enhed.');lobby.append(small);
    let category='Alle';
    for(const name of ['Alle','Arkade','Hjernevridere','For to','Bonus']){const b=B(name,()=>{category=name;showCards();});filters.append(b);}
    function showCards(){
      for(const b of filters.children)b.setAttribute('aria-pressed',String(b.textContent===category));
      cards.replaceChildren();
      for(const game of C.catalog.filter(g=>category==='Alle'||g.category===category)){
        const card=link('','#lxp-games/'+game.id,'lxp-game-card');card.dataset.game=game.id;
        const art=E('div','lxp-game-card-art');art.setAttribute('aria-hidden','true');art.append(E('span','',game.symbol));
        const body=E('div','lxp-game-card-body');body.append(E('span','lxp-game-tag',game.category==='For to'?'2 spillere · samme skærm':game.category==='Bonus'?'Bonus · 24 valg':game.category),E('h2','',game.title),E('p','',game.description),E('span','lxp-game-card-cta','Spil nu ↗'));
        card.append(art,body);cards.append(card);
      }
    }
    showCards();
    const top=E('div','lxp-game-top'),back=link('← Alle spil','#lxp-games','lxp-game-back'),name=E('h1'),description=E('p');top.append(back,name,description);
    const toolbar=E('div','lxp-game-toolbar'),start=B('Start spil',()=>toggle()),restart=B('Start forfra',()=>openGame(current.id,true));
    const settings=E('label','lxp-game-difficulty','Tempo '),difficulty=E('select');difficulty.setAttribute('aria-label','Spillets tempo');
    for(const [value,text]of [['easy','Roligt'],['normal','Normalt'],['hard','Hurtigt']]){const o=E('option','',text);o.value=value;difficulty.append(o);}settings.append(difficulty);
    difficulty.addEventListener('change',()=>{void save({difficulty:difficulty.value});openGame(current.id,true);});
    toolbar.append(start,restart,settings);
    const layout=E('div','lxp-game-layout'),panel=E('div','lxp-game-panel'),stats=E('div','lxp-game-stats'),score=E('span'),best=E('span'),clock=E('span');
    stats.append(score,best,clock);
    const arena=E('div','lxp-game-arena');arena.tabIndex=0;arena.setAttribute('aria-label','Spilleområde');
    const surface=E('div','lxp-game-surface'),veil=E('div','lxp-game-veil'),veilTitle=E('strong'),veilCopy=E('p'),veilButton=B('Start spil',()=>toggle(),'lxp-game-primary');veil.append(veilTitle,veilCopy,veilButton);arena.append(surface,veil);
    const feedback=E('p','lxp-game-feedback');feedback.setAttribute('role','status');
    const controls=E('div','lxp-game-controls');controls.setAttribute('aria-label','Spilknapper');panel.append(stats,arena,feedback,controls);
    const aside=E('aside','lxp-game-guide'),guideTitle=E('h2','','Sådan spiller du'),guide=E('p'),tip=E('p','lxp-game-tip'),extra=E('div','lxp-game-extra');aside.append(guideTitle,guide,tip,extra);
    layout.append(panel,aside);play.append(top,toolbar,layout);
    let current=null,state=null,visible=false,running=false,started=false,frame=0,previous=0,lastGrid='',recorded=false,flagMode=false,canvas=null,ctx=null;
    const keys=new Set(),symbols=['🍒','🍋','🍇','🥝','🍓','🍊','🍉','🫐'];
    const direction={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',W:'up',S:'down',A:'left',D:'right'};
    const recordKey=()=>current.id+':'+state.difficulty;
    const prefs=()=>getPreferences().games||{difficulty:'normal',bests:{}};
    async function save(changes){try{if(await onChange({games:{...prefs(),...changes}})===false)throw Error('storage');}catch{feedback.textContent='Indstillingen eller rekorden kunne ikke gemmes. Du kan stadig spille.';}}
    const setText=(el,text)=>{if(el.textContent!==text)el.textContent=text;};
    function stop(){running=false;keys.clear();if(frame)cancelAnimationFrame(frame);frame=0;previous=0;}
    function pause(){if(!state||state.status!=='playing')return;stop();render();}
    function toggle(){
      if(!visible||!state||document.hidden)return;
      if(state.status!=='playing'){openGame(current.id,true);}
      if(running){pause();return;}
      running=true;started=true;previous=0;render();arena.focus({preventScroll:true});frame=requestAnimationFrame(loop);
    }
    function loop(now){
      frame=0;if(!running||!visible||document.hidden)return;
      const dt=previous?Math.min((now-previous)/1000,0.05):0;previous=now;
      C.step(state,dt,keys);render();
      if(state.status!=='playing'){stop();render();return;}
      frame=requestAnimationFrame(loop);
    }
    function action(type,value){
      if(!visible||!state||state.status!=='playing')return;
      if(!running){if(started)return;toggle();}
      C.act(state,type,value);render();if(state.status!=='playing'){stop();render();}
    }
    function control(text,type,hold=false){
      const b=B(text,()=>{if(!hold)action(type);});b.setAttribute('aria-label',text);
      if(hold){
        b.addEventListener('pointerdown',event=>{event.preventDefault();if(!running&&!started)toggle();if(running){keys.add(type);b.setPointerCapture?.(event.pointerId);}});
        for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(type));
        b.addEventListener('keydown',event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();if(!started)toggle();if(running)keys.add(type);}});
        b.addEventListener('keyup',()=>keys.delete(type));b.addEventListener('blur',()=>keys.delete(type));
      }
      controls.append(b);return b;
    }
    function openGame(id,reset=false){
      const game=C.catalog.find(g=>g.id===id);if(!game)return;
      if(current?.id===id&&!reset)return;
      stop();current=game;state=C.create(id,{difficulty:game.live?(reset?difficulty.value:prefs().difficulty):'normal'});recorded=false;started=false;lastGrid='';flagMode=false;
      setText(name,game.title);setText(description,game.description);setText(guide,game.controls);difficulty.value=state.difficulty;settings.hidden=!game.live;
      tip.textContent=game.category==='For to'?'Giv turen videre til den anden spiller.':game.category==='Bonus'?'Dine valg bliver kun i denne runde.':'Pause virker med P eller Escape. Spillet pauser automatisk, når du forlader det.';
      surface.replaceChildren();controls.replaceChildren();extra.replaceChildren();canvas=ctx=null;
      if(game.live){
        canvas=E('canvas','lxp-game-canvas');canvas.width=id==='snake'?720:id==='blocks'?480:1280;canvas.height=id==='snake'?720:id==='blocks'?800:720;
        canvas.setAttribute('role','img');canvas.setAttribute('aria-label',game.title+' spillebane');canvas.append(document.createTextNode('Spillet kræver en browser med canvas.'));surface.append(canvas);ctx=canvas.getContext('2d');
        if(!ctx)feedback.textContent='Spilbanen kunne ikke tegnes. Prøv en opdateret browser.';
        if(id==='dino')control('Hop ↑','jump');
        if(id==='snake'||id==='blocks'){
          control(id==='blocks'?'Drej ↻':'Op ↑','up');control('Venstre ←','left');control('Ned ↓','down');control('Højre →','right');if(id==='blocks')control('Slip brik ⤓','drop');
        }
        if(id==='pong'){control('Hold op ↑','up',true);control('Hold ned ↓','down',true);}
        if(id==='breakout'){control('Hold venstre ←','left',true);control('Send bold ↗','launch');control('Hold højre →','right',true);}
        if(id==='blocks'){extra.append(E('h3','','Næste brik'));const preview=E('div','lxp-game-next');preview.setAttribute('aria-label','Næste brik');extra.append(preview);}
      }else if(id==='2048'){control('Op ↑','up');control('Venstre ←','left');control('Ned ↓','down');control('Højre →','right');}
      else if(id==='mines'){const flag=control('Flag: fra ⚑','noop');flag.onclick=()=>{flagMode=!flagMode;flag.textContent=flagMode?'Flag: til ⚑':'Flag: fra ⚑';flag.setAttribute('aria-pressed',String(flagMode));};flag.setAttribute('aria-pressed','false');}
      render();
    }
    function finishText(){
      if(state.status==='lost')return current.id==='pong'?'Computeren vandt denne runde':'Spillet er slut';
      if(state.status==='draw')return 'Uafgjort — prøv igen!';
      if(current.id==='tic')return (state.winner===1?'X':'O')+' vandt!';
      if(current.id==='four')return (state.winner===1?'Rød':'Gul')+' vandt!';
      if(current.id==='choices')return 'Dine 24 valg er klar';
      return 'Godt spillet — du vandt!';
    }
    function render(){
      if(!state)return;
      const finished=state.status!=='playing';
      const localTwo=current.category==='For to';
      setText(score,current.id==='pong'?`Dig ${state.score} : ${state.opponent} Computer`:localTwo?`Træk ${state.moves}`:current.id==='memory'?`Forsøg ${state.attempts} · Par ${state.matched.length/2}/8`:current.id==='choices'?`Valg ${state.index}/24`:`Point ${state.score}`);
      setText(clock,`${Math.floor(state.time/60)}:${String(Math.floor(state.time)%60).padStart(2,'0')}`);
      best.hidden=localTwo||['choices','memory','mines'].includes(current.id);
      setText(best,'Rekord '+Math.max(prefs().bests[recordKey()]||0,state.score));
      start.textContent=finished?'Spil igen':running?'Pause':started?'Fortsæt':'Start spil';
      start.disabled=Boolean(current.live&&!ctx);difficulty.disabled=running;
      veil.hidden=!(current.live&&!started||started&&!running&&!finished);
      veilTitle.textContent=started?'På pause':'Klar til '+current.title+'?';veilCopy.textContent=started?'Fortsæt, når du er klar.':current.controls;veilButton.textContent=started?'Fortsæt':'Start spil';veilButton.disabled=start.disabled;
      surface.inert=started&&!running&&!finished;
      for(const button of controls.querySelectorAll('button'))button.disabled=finished||(started&&!running);
      if(finished){
        setText(feedback,finishText());
        if(!recorded){recorded=true;if(!best.hidden&&state.score>(prefs().bests[recordKey()]||0))void save({bests:{...prefs().bests,[recordKey()]:state.score}});}
      }else if(current.id==='breakout')setText(feedback,`♥ ${state.lives} liv · ${state.bricks.length} mursten tilbage${state.launch?' · Send bolden for at fortsætte':''}`);
      else if(current.id==='blocks')setText(feedback,`${state.lines} rækker ryddet · Niveau ${1+Math.floor(state.lines/10)}`);
      else if(current.id==='mines')setText(feedback,`${state.flags.flat().filter(Boolean).length} flag / 10 miner · ${state.score}/71 sikre felter`);
      else if(localTwo)setText(feedback,'Tur: '+(current.id==='tic'?(state.player===1?'X':'O'):(state.player===1?'Rød':'Gul')));
      else setText(feedback,running?'Spillet er i gang.':started?'Spillet er på pause.':current.live?'Tryk Start spil.':'Vælg dit første træk, eller tryk Start spil.');
      if(ctx)draw();else if(!current.live)drawBoard();else setText(feedback,'Spilbanen kunne ikke tegnes. Prøv en opdateret browser.');
      node.dataset.gameState=finished?state.status:running?'playing':started?'paused':'ready';
    }
    function drawBoard(){
      const signature=JSON.stringify([state.board,state.open,state.flags,state.flipped,state.matched,state.index,state.status,state.winning]);
      if(signature===lastGrid)return;lastGrid=signature;
      // Preserve keyboard focus by coordinate when a board is redrawn.
      const focused=surface.contains(document.activeElement)?document.activeElement.dataset.cell:null;
      surface.replaceChildren();
      const grid=E('div','lxp-game-grid lxp-game-grid-'+current.id);surface.append(grid);
      const cell=(text,key,label,fn,cls='')=>{const b=B(text,fn,'lxp-game-cell '+cls);b.dataset.cell=key;b.setAttribute('aria-label',label);grid.append(b);return b;};
      if(current.id==='2048'){
        for(const [y,row]of state.board.entries())for(const [x,v]of row.entries()){const tile=E('div','lxp-game-tile',v||'');tile.dataset.power=v?Math.min(11,Math.log2(v)):0;tile.setAttribute('aria-label',`Række ${y+1}, kolonne ${x+1}: ${v||'tom'}`);grid.append(tile);}
      }else if(current.id==='mines'){
        state.board.forEach((row,y)=>row.forEach((v,x)=>{
          const reveal=state.open[y][x]||state.status==='lost'&&v===-1,flag=state.flags[y][x],text=reveal?(v===-1?'✹':v||''):flag?'⚑':'';
          const b=cell(text,x+','+y,`Række ${y+1}, kolonne ${x+1}: ${reveal?(v===-1?'mine':v+' miner omkring'):flag?'flag':'lukket'}`,()=>action(flagMode?'flag':'cell',[x,y]),reveal?'lxp-game-revealed':'');b.dataset.number=reveal?v:0;
          b.disabled=state.status!=='playing'||Boolean(state.open[y][x]);b.addEventListener('contextmenu',event=>{event.preventDefault();action('flag',[x,y]);});
        }));
      }else if(current.id==='memory'){
        state.cards.forEach((v,i)=>{const open=state.flipped.includes(i)||state.matched.includes(i),matched=state.matched.includes(i);const b=cell(open?symbols[v]:'?',String(i),`Kort ${i+1}${open?': '+symbols[v]:', lukket'}`,()=>action('cell',i),matched?'lxp-game-matched':'');b.disabled=matched||Boolean(state.wait)||state.flipped.includes(i)||state.status!=='playing';});
      }else if(current.id==='tic'){
        state.board.forEach((r,y)=>r.forEach((v,x)=>{const b=cell(v===1?'X':v===2?'O':'',x+','+y,`Række ${y+1}, kolonne ${x+1}: ${v?(v===1?'X':'O'):'tom'}`,()=>action('cell',[x,y]));b.dataset.player=v;b.disabled=Boolean(v)||state.status!=='playing';if(state.winning?.some(([i,j])=>i===x&&j===y))b.classList.add('lxp-game-winning');}));
      }else if(current.id==='four'){
        for(let x=0;x<7;x++){const b=cell('↓',String(x),'Læg en brik i kolonne '+(x+1),()=>action('column',x),'lxp-game-drop');b.disabled=Boolean(state.board[0][x])||state.status!=='playing';}
        state.board.forEach((r,y)=>r.forEach((v,x)=>{const n=E('span','lxp-game-disc',v?(v===1?'●':'○'):'');n.dataset.player=v;n.setAttribute('aria-label',`Række ${y+1}, kolonne ${x+1}: ${v?(v===1?'rød':'gul'):'tom'}`);if(state.winning?.some(([i,j])=>i===x&&j===y))n.classList.add('lxp-game-winning');grid.append(n);}));
      }else if(current.id==='choices'){
        if(state.status==='playing'){
          const [symbol,text]=state.topics[state.index];grid.append(E('div','lxp-game-choice-symbol',symbol),E('h2','',text),E('p','','Er det noget for dig?'));
          const buttons=E('div','lxp-game-choice-actions');buttons.append(B('Rød · Spring over',()=>action('no'),'lxp-game-red'),B('Grøn · Ja tak',()=>action('yes'),'lxp-game-green'));grid.append(buttons);
        }else{
          grid.append(E('h2','','Din runde'),E('p','',`${state.yes.length} grønne · ${state.no.length} røde`));
          for(const [label,items]of [['Ja tak',state.yes],['Spring over',state.no]]){grid.append(E('h3','',label));const list=E('ul');for(const [emoji,text]of items)list.append(E('li','',emoji+' '+text));grid.append(list);}
        }
      }
      if(focused!==null&&focused!==undefined){const b=[...surface.querySelectorAll('[data-cell]')].find(el=>el.dataset.cell===focused);if(b&&!b.disabled)b.focus({preventScroll:true});else arena.focus({preventScroll:true});}
    }
    function colors(){const css=getComputedStyle(node);return {bg:css.getPropertyValue('--lxp-bg').trim()||'#10141c',surface:css.getPropertyValue('--lxp-surface').trim()||'#1a2030',ink:css.getPropertyValue('--lxp-text').trim()||'#edf0f6',muted:css.getPropertyValue('--lxp-muted').trim()||'#8894aa',accent:css.getPropertyValue('--lxp-accent').trim()||'#f2ae3b',border:css.getPropertyValue('--lxp-border').trim()||'#344057'};}
    function draw(){
      const p=colors(),w=canvas.width/2,h=canvas.height/2;ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);
      const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
      const circle=(x,y,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
      const text=(v,x,y,size=16,color=p.ink)=>{ctx.fillStyle=color;ctx.font=`600 ${size}px system-ui`;ctx.fillText(String(v),x,y);};
      if(current.id==='dino'){
        rect(0,318,640,2,p.border);for(let i=0;i<12;i++)rect((i*70-state.distance*8)%780,336,28,2,p.border);
        for(const o of state.obstacles){rect(o.x,o.y,o.w,o.h,'#45b68c');rect(o.x-6,o.y+10,8,6,'#45b68c');rect(o.x+o.w-2,o.y+4,8,6,'#45b68c');}
        rect(72,state.y+12,26,23,p.accent);rect(87,state.y,27,20,p.accent);rect(66,state.y+15,10,8,p.accent);rect(76,state.y+33,6,9,p.accent);rect(91,state.y+31,6,11,p.accent);rect(105,state.y+5,4,4,p.bg);text('DINO RUN',24,35,14,p.muted);text(state.score,540,35,22);
      }else if(current.id==='snake'){
        const n=20;for(let i=0;i<=18;i++){rect(i*n,0,1,360,p.border);rect(0,i*n,360,1,p.border);}if(state.food){circle(state.food[0]*n+10,state.food[1]*n+10,6,'#ee6674');}
        sDrawSnake();function sDrawSnake(){state.snake.forEach(([x,y],i)=>rect(x*n+2,y*n+2,n-4,n-4,i===0?p.ink:p.accent));const [x,y]=state.snake[0];circle(x*n+10+state.dir[0]*4,y*n+10+state.dir[1]*4,2,p.bg);}
      }else if(current.id==='blocks'){
        const size=20,offset=20,palette=['', '#40b9d3','#f5c04f','#b78bf0','#63c493','#ed7589','#669de5','#e7a357'];
        const tile=(x,y,v,ghost=false)=>{if(y<0)return;ctx.globalAlpha=ghost?0.22:1;rect(offset+x*size+1,y*size+1,18,18,palette[v]);ctx.globalAlpha=1;};
        for(let y=0;y<20;y++)for(let x=0;x<10;x++){rect(offset+x*size,y*size,19,19,p.surface);if(state.board[y][x])tile(x,y,state.board[y][x]);}
        let gy=state.y;while(!C.collides(state,state.piece.matrix,state.x,gy+1))gy++;
        state.piece.matrix.forEach((row,y)=>row.forEach((v,x)=>{if(v){tile(state.x+x,gy+y,state.piece.color,true);tile(state.x+x,state.y+y,state.piece.color);}}));
        const preview=extra.querySelector('.lxp-game-next'),key=JSON.stringify(state.nextPiece);
        if(preview.dataset.piece!==key){preview.dataset.piece=key;preview.style.gridTemplateColumns=`repeat(${state.nextPiece.matrix[0].length}, 22px)`;preview.replaceChildren();state.nextPiece.matrix.flat().forEach(v=>{const n=E('span');n.style.background=v?palette[state.nextPiece.color]:'transparent';preview.append(n);});}
      }else if(current.id==='pong'){
        for(let y=0;y<360;y+=24)rect(319,y,2,12,p.border);rect(18,state.paddle,12,76,p.accent);rect(610,state.ai,12,76,p.ink);circle(state.ball.x,state.ball.y,7,p.ink);text(state.score,240,45,30,p.accent);text(state.opponent,380,45,30);if(state.serve>0)text('Klar…',290,210,16,p.muted);
      }else if(current.id==='breakout'){
        const palette=['#a78bdd','#7c9fe5','#51b5ba','#68bd91','#e8b05e'];for(const b of state.bricks)rect(b.x,b.y,b.w,b.h,palette[b.color]);rect(state.paddle,330,100,10,p.accent);circle(state.ball.x,state.ball.y,7,p.ink);if(state.launch)text('Send bolden ↗',255,220,18,p.muted);
      }
      if(state.status!=='playing'){ctx.globalAlpha=0.85;rect(0,h/2-40,w,80,p.bg);ctx.globalAlpha=1;text(state.status==='won'?'Du vandt!':'Spillet er slut',w/2-80,h/2+8,23);}
    }
    node.addEventListener('keydown',event=>{
      if(!visible||play.hidden||!state)return;
      if(event.ctrlKey||event.metaKey||event.altKey||event.target.closest('select,input,textarea'))return;
      if(event.key==='Escape'||event.key.toLowerCase()==='p'){event.preventDefault();if(running)pause();return;}
      if(event.target.closest('button')&&(event.key===' '||event.key==='Enter'))return;
      const dir=direction[event.key];let type=dir;
      if(event.key===' ')type={dino:'jump',blocks:'drop',breakout:'launch'}[current?.id];
      if(!type||!current)return;
      event.preventDefault();if(!running&&!started)toggle();if(!running)return;
      if(['pong','breakout'].includes(current.id)&&dir)keys.add(dir);else if(!event.repeat||['left','right','down'].includes(type))action(type);
    });
    node.addEventListener('keyup',event=>{if(direction[event.key])keys.delete(direction[event.key]);});
    window.addEventListener('keyup',event=>{if(direction[event.key])keys.delete(direction[event.key]);});
    node.addEventListener('focusout',event=>{if(running&&event.relatedTarget&&!node.contains(event.relatedTarget))pause();});
    arena.addEventListener('pointermove',event=>{
      if(!canvas||!running||!['pong','breakout'].includes(current.id))return;
      const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
      const scale=Math.min(r.width/640,r.height/360),left=r.left+(r.width-640*scale)/2,top=r.top+(r.height-360*scale)/2;
      C.act(state,'pointer',current.id==='pong'?(event.clientY-top)/scale:(event.clientX-left)/scale);
    });
    arena.addEventListener('pointerdown',event=>{if(event.target!==canvas)return;arena.focus({preventScroll:true});if(current.id==='dino')action('jump');else if(current.id==='breakout')action('launch');});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
    window.addEventListener('blur',()=>{if(running)pause();});window.addEventListener('pagehide',()=>stop());
    function update(open){
      visible=open;node.hidden=!open;
      if(!open){if(running)pause();return;}
      const id=location.hash.split('/')[1],game=C.catalog.find(g=>g.id===id);
      lobby.hidden=Boolean(game);play.hidden=!game;
      if(game){openGame(game.id);render();}else{if(running)pause();showCards();}
    }
    return {node,update,entries:C.catalog.map(g=>({href:'#lxp-games/'+g.id,key:'games',label:g.title,icon:'game',context:'Spil'}))};
  };
})();
