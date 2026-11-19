(() => {
  'use strict';
  const C=globalThis.lectioPlusGamesCore;
  globalThis.lectioPlusGames=({getPreferences,onChange})=>{
    const E=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
    const B=(text,fn,cls='')=>{const b=E('button','lxp-game-button '+cls,text);b.type='button';b.addEventListener('click',fn);return b;};
    const link=(title,href,cls)=>{const a=E('a',cls,title);a.href=href;return a;};
    const node=E('main','lxp-games');node.id='lxp-games';node.hidden=true;
    const lobby=E('section','lxp-games-lobby'),play=E('section','lxp-game-play');node.append(lobby,play);
    const heading=E('header','lxp-games-heading'),eyebrow=E('p','lxp-game-eyebrow','TAG EN PAUSE'),title=E('h1','','Spil'),intro=E('p','','Vælg et spil, og gå i gang.');
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
    const R=globalThis.lectioPlusRhythm;
    const songLabel=E('label','lxp-game-difficulty','Bane '),song=E('select');
    const allTracks=[...R.popTracks,...R.tracks,R.customTrack];
    for(const [label,tracks] of [['Pophits',R.popTracks],['Instrumental',R.tracks]]){
      const group=E('optgroup');group.label=label;
      for(const track of tracks){
        const rate=track.targets.length/track.end;
        const level=rate<1.65?'Let':rate<2.13?'Øvet':'Svær';
        const title=track.artist ? track.title+' · '+track.artist : track.title;
        const option=E('option','',title+' · '+level+' · '+Math.ceil(track.end)+' s');
        option.value=track.id;group.append(option);
      }
      song.append(group);
    }
    const ownOption=E('option','','Egen sang …');ownOption.value=R.customTrack.id;song.append(ownOption);
    const ownButton=B('Åbn egen sang…',()=>{
      song.value=R.customTrack.id;openGame('osu',true);chooseFile.click();
    });
    songLabel.append(song);song.addEventListener('change',()=>openGame('osu',true));
    const practice=B('Øv uden lyd',()=>{
      silent=!silent;audioError='';practice.setAttribute('aria-pressed',String(silent));
      if(current?.id==='osu')render();
    });
    let silent=false,beatChosen=false;
    const playBeat=B('Spil med øvebeat',()=>{beatChosen=true;toggle();});
    practice.setAttribute('aria-pressed','false');toolbar.append(start,playBeat,restart,settings,songLabel,ownButton,practice);
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
    let rhythm=null, player=null, aim=null, audioError='', lastAudioTick=0;
    let recording=null,importNumber=0,loadingFile=false,lastHud=0,rhythmPalette=null;
    const soundPanel=E('section','lxp-song-audio');
    const soundStatus=E('p');soundStatus.setAttribute('role','status');
    const chooseFile=E('input');chooseFile.type='file';chooseFile.accept='audio/*,.mp3,.wav,.m4a,.ogg,.flac';
    const fileLabel=E('label','','Vælg sangfil');fileLabel.append(chooseFile);
    const offsetInput=E('input');offsetInput.type='number';offsetInput.min='0';offsetInput.step='0.01';
    const offsetLabel=E('label','','Første slag i lydfilen (sekunder)');offsetLabel.append(offsetInput);
    const media=E('audio');media.controls=true;media.preload='auto';
    media.setAttribute('aria-label','Lyt til sangfilen');
    let clipUrl='',clipStart=null,clipSource=null,backupAudio=false;
    function stopPreview(){if(clipUrl&&!media.paused)media.pause();}
    function releaseClip(){
      if(!clipUrl)return;
      media.pause();media.removeAttribute('src');media.load();
      URL.revokeObjectURL(clipUrl);clipUrl='';clipStart=null;
    }
    function prepareClip(){
      const source=hasRecording()?recording:allTracks.find(track=>track.id===rhythm.track.id);
      if(clipSource===source && clipStart===source.start)return;
      releaseClip();backupAudio=false;clipSource=source;clipStart=source.start;
      function load(blob){
        if(clipSource!==source)return;
        clipUrl=URL.createObjectURL(blob);media.src=clipUrl;
        media.hidden=!hasRecording() && Boolean(rhythm?.track.artist);
      }
      if(hasRecording())load(recording.file);
      else if(!source.custom)R.renderScore(source).then(load).catch(()=>{ /* The live synthesizer also plays this score. */ });
    }
    const removeFile=B('Fjern sangfil',()=>{releaseClip();recording=null;openGame('osu',true);});
    soundPanel.append(E('h3','','Musik'),soundStatus,fileLabel,media,offsetLabel,removeFile);
    function hasRecording(){return recording!==null && recording.id===rhythm?.track.id;}
    function updateSoundPanel(){
      if(!rhythm)return;
      fileLabel.hidden=!rhythm.track.artist;
      const attached=hasRecording();
      offsetLabel.hidden=removeFile.hidden=!attached;
      media.hidden=!clipUrl||(!attached && Boolean(rhythm.track.artist));
      if(attached){
        offsetInput.max=(Math.floor(recording.maxStart*100)/100).toFixed(2);
        offsetInput.value=recording.start.toFixed(2);
      }
      ownOption.textContent=recording?.id===R.customTrack.id?recording.chart.title:'Egen sang …';
      const duration=seconds=>Math.floor(seconds/60)+':'+String(Math.floor(seconds)%60).padStart(2,'0');
      for(const group of song.querySelectorAll('optgroup')){
        for(const option of group.children){
          if(!option.dataset.label)option.dataset.label=option.textContent;
          option.textContent=attached && option.value===recording.id
            ?rhythm.track.title+' · '+duration(rhythm.track.end):option.dataset.label;
        }
      }
      soundStatus.textContent=attached?'Lydfil: '+recording.filename+' · '+duration(rhythm.track.end)
        :rhythm.track.custom?'Vælg en lydfil. Banen laves ud fra rytmen i hele sangen.'
        :!rhythm.track.artist?rhythm.track.title+' · Instrumental'
        :'Vælg en lokal MP3- eller WAV-fil med '+rhythm.track.title+' for at høre sangen. Du kan også spille med øvebeat.';
    }
    chooseFile.addEventListener('change',async()=>{
      const file=chooseFile.files[0];chooseFile.value='';
      if(!file||running||!rhythm?.track.artist)return;
      stopPreview();const request=++importNumber;
      loadingFile=true;render();soundStatus.textContent='Læser lydfilen …';
      try{
        const loaded=await R.importRecording(file,allTracks.find(track=>track.id===song.value));
        if(request!==importNumber)return;
        releaseClip();recording=loaded;silent=false;practice.setAttribute('aria-pressed','false');
        openGame('osu',true);
      }catch(error){
        if(request===importNumber){loadingFile=false;render();soundStatus.textContent=error.message;}
      }
    });
    offsetInput.addEventListener('change',()=>{
      if(!hasRecording()||running)return;
      const value=offsetInput.valueAsNumber;
      if(!Number.isFinite(value))return;
      const previousStart=recording.start;
      recording.start=Math.max(0,Math.min(recording.maxStart,value));
      try{recording.chart=R.fullChart(recording.profile,recording);}
      catch(error){recording.start=previousStart;offsetInput.value=previousStart.toFixed(2);soundStatus.textContent=error.message;return;}
      openGame('osu',true);
    });
    const A=globalThis.lectioPlusAppearance;
    const D=globalThis.lectioPlusDash;
    const courseLabel=E('label','lxp-game-difficulty','Bane '),course=E('select');
    course.setAttribute('aria-label','Geometry Dash-bane');
    for(const level of D?.levels||[]){
      const o=E('option','',level.id+' · '+level.title+' · '+level.bpm+' BPM');o.value=level.id;course.append(o);
    }
    courseLabel.append(course);course.addEventListener('change',()=>openGame('dash',true));
    toolbar.append(courseLabel);
    let dashAudio=null,dashAudioError=false,retryTimer=0,attempt=0;
    const bindPanel=E('details','lxp-game-bindings'), bindStatus=E('p'),bindTitle=E('summary','','Tastbindinger');
    bindStatus.setAttribute('role','status');bindPanel.append(bindTitle);
    const dashMedia=E('audio');
    let dashLevel=null,dashUrl='';
    function prepareDashMusic(level){
      if(dashLevel===level)return;
      dashLevel=level;
      if(dashUrl){dashMedia.removeAttribute('src');dashMedia.load();URL.revokeObjectURL(dashUrl);dashUrl='';}
      if(!level)return;
      R.renderScore(level).then(blob=>{
        if(dashLevel!==level)return;
        dashUrl=URL.createObjectURL(blob);dashMedia.src=dashUrl;
        if(running&&current?.id==='dash')startDashMusic();
      }).catch(()=>{ /* The live synthesizer can play the same notes. */ });
    }
    function startDashMusic(){
      if(dashAudio)dashAudio.close();
      dashAudio=null;
      try{
        const audio=dashUrl?R.mediaPlayback(dashMedia,state.level,state.time):R.playback(state.level,state.time);
        dashAudio=audio;dashAudioError=false;
        audio.ready.catch(()=>{if(audio===dashAudio){audio.close();dashAudio=null;dashAudioError=true;}});
      }catch{dashAudioError=true;}
    }
    const labels={first:'Slag 1',second:'Slag 2',pause:'Pause / fortsæt',retry:'Start banen forfra'};
    const bindingButtons=new Map();
    let capturing=null;
    const keyName=k=>({Space:'Mellemrum',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→'}[k]||k.toUpperCase());
    function showBindings(){
      const bindings=A.osuBindings(prefs().bindings);
      for(const [id,button] of bindingButtons){
        button.textContent=capturing===id?'Tryk på en tast …':keyName(bindings[id]);
        button.setAttribute('aria-label',labels[id]+' · '+button.textContent);
      }
      mouseInput.checked=prefs().mouseHits!==false;
    }
    for(const [id,label] of Object.entries(labels)){
      const row=E('div','lxp-bind-row'),button=B('',()=>{
        if(running)pause();
        capturing=id;bindStatus.textContent='Tryk på din nye tast. Escape annullerer.';showBindings();
      });
      bindingButtons.set(id,button);row.append(E('span','',label),button);bindPanel.append(row);
      button.addEventListener('blur',()=>{if(capturing===id){capturing=null;bindStatus.textContent='';showBindings();}});
    }
    const mouseLabel=E('label'),mouseInput=E('input');mouseInput.type='checkbox';
    mouseLabel.append(mouseInput,document.createTextNode(' Brug også venstre og højre museknap'));
    mouseInput.addEventListener('change',()=>void save({mouseHits:mouseInput.checked}));
    bindPanel.append(mouseLabel,B('Gendan standardtaster',async()=>{
      capturing=null;await save({bindings:A.osuBindings(),mouseHits:true});showBindings();
    }),bindStatus);
    bindPanel.addEventListener('keydown',async event=>{
      if(!capturing)return;
      event.preventDefault();event.stopPropagation();
      if(event.repeat)return;
      if(event.key==='Escape'){capturing=null;bindStatus.textContent='';showBindings();return;}
      const key=A.osuKey(event.key);
      if(!key||event.ctrlKey||event.altKey||event.metaKey){bindStatus.textContent='Vælg én tast, fx F, J eller mellemrum.';return;}
      const bindings=A.osuBindings(prefs().bindings);
      if(Object.entries(bindings).some(([id,k])=>id!==capturing&&k===key)){
        bindStatus.textContent='Tasten bruges allerede. Vælg en anden.';return;
      }
      bindings[capturing]=key;capturing=null;
      const saved=await save({bindings});showBindings();bindStatus.textContent=saved?'Gemt · '+keyName(key):'Tasten kunne ikke gemmes.';
    });
    function clearRetry(){clearTimeout(retryTimer);retryTimer=0;}
    function retryDash(){openGame('dash',true);toggle();}
    const recordKey=()=>current.id==='dash'?'dash:'+state.level.id:current.id==='osu'?'osu:'+(rhythm.track.recordId||rhythm.track.id):current.id+':'+state.difficulty;
    const prefs=()=>getPreferences().games||{difficulty:'normal',bests:{}};
    async function save(changes){
      try{if(await onChange({games:{...prefs(),...changes}})!==false)return true;}catch{}
      feedback.textContent='Indstillingen eller rekorden kunne ikke gemmes. Du kan stadig spille.';return false;
    }
    const setText=(el,text)=>{if(el.textContent!==text)el.textContent=text;};
    function stop(){
      clearRetry();if(dashAudio){dashAudio.close();dashAudio=null;}
      stopPreview();
      if(player){if(rhythm)rhythm.time=player.now();player.close();player=null;}
      running=false;keys.clear();if(frame)cancelAnimationFrame(frame);frame=0;previous=0;}
    function pause(){if(!state||state.status!=='playing')return;stop();render();}
    function toggle(){
      if(!visible||!state||document.hidden||loadingFile)return;
      if(state.status!=='playing'){openGame(current.id,true);}
      if(running){pause();return;}
      if(current.id==='osu'){
        if(!hasRecording() && (rhythm.track.custom || rhythm.track.artist && !silent && !beatChosen)){chooseFile.click();return;}
        stopPreview();audioError='';
        const nativePlayer=Boolean(clipUrl) && !silent && !backupAudio;
        const failed=()=>{if(nativePlayer)backupAudio=true;
          audioError=nativePlayer?'Afspilleren kunne ikke starte. Prøv igen med den alternative lydafspiller.':'Lyden kunne ikke starte. Tjek fanens lyd, og prøv igen.';stop();render();};
        try {
          if(silent){
            const origin=performance.now()/1000-rhythm.time;
            player={now:()=>performance.now()/1000-origin,schedule(){},close(){},ready:Promise.resolve()};
          }else if(nativePlayer)player=R.mediaPlayback(media,rhythm.track,rhythm.time);
          else if(hasRecording())player=R.playRecording(rhythm.track,recording,rhythm.time);
          else player=R.playback(rhythm.track,rhythm.time);
          lastAudioTick=performance.now();
          const active=player;player.ready.catch(()=>{if(player===active)failed();});
        } catch {failed();return;}
      }
      if(current.id==='dash'){
        attempt+=started?0:1;
        startDashMusic();
      }
      running=true;started=true;previous=0;render();arena.focus({preventScroll:true});frame=requestAnimationFrame(loop);
    }
    function loop(now){
      frame=0;if(!running||!visible||document.hidden)return;
      const dt=previous?Math.min((now-previous)/1000,0.05):0;previous=now;
      if(player){
        const position=player.now();
        if(position>rhythm.time)lastAudioTick=performance.now();
        if(performance.now()-lastAudioTick>2600){
          if(clipUrl&&!backupAudio){backupAudio=true;audioError='Afspilningen gik i stå. Prøv igen med den alternative lydafspiller.';}
          else audioError='Lyden starter ikke. Tjek fanens lyd og lydudgangen.';
          stop();render();return;
        }
        player.schedule();R.follow(rhythm,position,aim,keys.size>0);R.advance(rhythm,position);
        state.time=rhythm.time;state.score=rhythm.score;
        if(state.time>=rhythm.track.end)state.status='won';
      }else if(current.id==='dash'){
        // Input and physics keep running even when a device suspends its audio clock.
        if(dashAudio){
          try{
            dashAudio.schedule();
            if(dashUrl&&!dashMedia.paused&&dashMedia.readyState>=3&&Math.abs(dashMedia.currentTime-state.time)>.25)
              dashMedia.currentTime=state.time;
          }catch{dashAudio.close();dashAudio=null;dashAudioError=true;}
        }
        C.step(state,dt,keys);
      }else C.step(state,dt,keys);
      if((rhythm||current.id==='dash') && ctx && now-lastHud<100 && state.status==='playing')draw();
      else {lastHud=now;render();}
      if(state.status!=='playing'){
        stop();render();
        if(current.id==='dash'&&state.status==='lost'){
          retryTimer=setTimeout(()=>{if(visible&&!play.hidden&&!document.hidden&&current.id==='dash')retryDash();},750);
        }
        return;
      }
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
      const keepBeat=beatChosen && id==='osu' && current?.id===id && rhythm?.track.id===song.value;
      if(id==='dash' && (current?.id!=='dash'||state.level.id!==Number(course.value)))attempt=0;
      stop();capturing=null;dashAudioError=false;courseLabel.hidden=id!=='dash';current=game;state=C.create(id,{level:course.value,difficulty:game.live?(reset?difficulty.value:prefs().difficulty):'normal'});recorded=false;started=false;lastGrid='';flagMode=false;
      importNumber++;loadingFile=false;beatChosen=keepBeat;aim=null;audioError='';ownButton.hidden=songLabel.hidden=practice.hidden=id!=='osu';rhythmPalette=null;
      const selected=allTracks.find(t=>t.id===song.value)||allTracks[0];
      rhythm=id==='osu'?R.playingSession(recording?.id===selected.id?recording.chart:selected):null;
      setText(name,game.title);setText(description,game.description);setText(guide,game.controls);difficulty.value=state.difficulty;settings.hidden=!game.live||id==='osu'||id==='dash';
      tip.textContent=game.category==='For to'?'Giv turen videre til den anden spiller.':game.category==='Bonus'?'Dine valg bliver kun i denne runde.':'Pause virker med P eller Escape. Spillet pauser automatisk, når du forlader det.';
      if(id==='osu')tip.textContent='Du kan ændre slag, pause og genstart under Tastbindinger. Escape sætter også spillet på pause.';
      prepareDashMusic(id==='dash'?state.level:null);
      if(id==='dash')tip.textContent='Efter et styrt starter banen igen. Din bedste procent gemmes for hver bane.';
      surface.replaceChildren();controls.replaceChildren();extra.replaceChildren();canvas=ctx=null;
      if(rhythm){extra.append(bindPanel,soundPanel);showBindings();prepareClip();updateSoundPanel();}
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
      if(current.id==='osu')return rhythm.track.title+' · '+rhythm.hits+'/'+rhythm.track.targets.length+' ramt · '+Math.round(rhythm.points/(300*rhythm.track.targets.length)*100)+' % præcision · Bedste serie '+rhythm.longest;
      if(current.id==='dash')return state.level.title+' · '+state.score+' % · '+(state.status==='won'?'Gennemført!':'Nyt forsøg …');
      if(current.id==='lights')return 'Alle lys er slukket på '+state.moves+' træk!';
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
      setText(score,current.id==='dash'?state.score+' %':current.id==='lights'?'Træk '+state.moves:current.id==='pong'?`Dig ${state.score} : ${state.opponent} Computer`:localTwo?`Træk ${state.moves}`:current.id==='memory'?`Forsøg ${state.attempts} · Par ${state.matched.length/2}/8`:current.id==='choices'?`Valg ${state.index}/24`:`Point ${state.score}`);
      setText(clock,`${Math.floor(state.time/60)}:${String(Math.floor(state.time)%60).padStart(2,'0')}`);
      best.hidden=localTwo||['choices','memory','mines','lights'].includes(current.id);
      setText(best,'Rekord '+Math.max(prefs().bests[recordKey()]||0,state.score)+(current.id==='dash'?' %':''));
      start.textContent=finished?'Spil igen':running?'Pause':started?'Fortsæt':'Start spil';
      const needsFile=rhythm?.track.artist&&!hasRecording()&&(rhythm.track.custom||!silent&&!beatChosen);
      playBeat.hidden=!(needsFile&&!rhythm.track.custom&&!running);playBeat.disabled=loadingFile;
      if(needsFile)start.textContent='Vælg sangfil';
      course.disabled=running;
      if(rhythm)media.controls=!running;
      start.disabled=Boolean(current.live&&!ctx)||loadingFile;
      chooseFile.disabled=running||loadingFile;removeFile.disabled=offsetInput.disabled=running||loadingFile;difficulty.disabled=running;song.disabled=ownButton.disabled=running;practice.disabled=running||Boolean(rhythm?.track.custom&&!hasRecording());
      veil.hidden=!(current.live&&!started||started&&!running&&!finished);
      veilTitle.textContent=started?'På pause':'Klar til '+current.title+'?';veilCopy.textContent=started?'Fortsæt, når du er klar.':current.controls;veilButton.textContent=started?'Fortsæt':'Start spil';veilButton.disabled=start.disabled;
      if(rhythm?.track.artist && !started){
        veilTitle.textContent=rhythm.track.title;
        veilCopy.textContent=rhythm.track.artist+' · '+(silent?'Uden lyd':hasRecording()?'Din lydfil':beatChosen?'Øvebeat':'Vælg sangfil for at høre sangen');
      }
      if(needsFile)veilButton.textContent='Vælg sangfil';
      if(audioError){veilTitle.textContent='Lyden kunne ikke starte';veilCopy.textContent=audioError;veilButton.textContent='Prøv igen';}
      surface.inert=started&&!running&&!finished;
      for(const button of controls.querySelectorAll('button'))button.disabled=finished||(started&&!running);
      if(finished){
        setText(feedback,finishText());
        if(!recorded){recorded=true;if(!best.hidden&&state.score>(prefs().bests[recordKey()]||0))void save({bests:{...prefs().bests,[recordKey()]:state.score}});}
      }else if(current.id==='osu')setText(feedback,audioError||(silent?'Uden lyd':hasRecording()?'Sangfil: '+recording.filename:rhythm.track.artist?(beatChosen?'Øvebeat':'Ingen sangfil valgt'):'Instrumental')+(rhythm.track.bpm?' · '+rhythm.track.bpm+' BPM':'')+' · Serie '+rhythm.combo+' · '+rhythm.hits+'/'+rhythm.track.targets.length+' ramt');
      else if(current.id==='dash')setText(feedback,state.level.title+' · Forsøg '+Math.max(1,attempt)+' · '+(state.mode==='ship'?'Skib':'Terning')+(dashAudioError?' · Uden lyd':''));
      else if(current.id==='lights')setText(feedback,state.board.flat().filter(Boolean).length+' lys tilbage');
      else if(current.id==='breakout')setText(feedback,`♥ ${state.lives} liv · ${state.bricks.length} mursten tilbage${state.launch?' · Send bolden for at fortsætte':''}`);
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
      if(current.id==='lights'){
        state.board.forEach((row,y)=>row.forEach((v,x)=>{
          const b=cell(v?'☀':'·',x+','+y,'Række '+(y+1)+', kolonne '+(x+1)+(v?', tændt':', slukket'),()=>action('cell',[x,y]));
          b.setAttribute('aria-pressed',String(Boolean(v))); b.disabled=state.status!=='playing';
        }));
      }else if(current.id==='2048'){
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
      const p=(rhythm||current.id==='dash')?(rhythmPalette||=colors()):colors(),w=canvas.width/2,h=canvas.height/2;ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);
      const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
      const circle=(x,y,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
      const text=(v,x,y,size=16,color=p.ink)=>{ctx.fillStyle=color;ctx.font=`600 ${size}px system-ui`;ctx.fillText(String(v),x,y);};
      if(current.id==='osu'){
        const lead=.95;
        function drawSlider(path,color){
          ctx.lineCap='round';
          ctx.beginPath();ctx.moveTo(path.x,path.y);
          ctx.quadraticCurveTo(path.cx,path.cy,path.ex,path.ey);
          ctx.strokeStyle=color;ctx.lineWidth=35;ctx.stroke();
          ctx.strokeStyle=p.surface;ctx.lineWidth=29;ctx.stroke();
        }
        const accents=[p.accent,'#41c4ac','#b58aef','#64acf1'];
        let last=rhythm.index;
        while(last+1<rhythm.track.targets.length && rhythm.track.targets[last+1].time-rhythm.time<=lead)last++;
        for(let i=Math.min(last,rhythm.track.targets.length-1);i>=rhythm.index;i--){
          const target=rhythm.track.targets[i],left=target.time-rhythm.time;
          if(left>lead)continue;
          const active=i===rhythm.index, r=28;
          const accent=accents[Math.floor(i/8)%accents.length];
          ctx.globalAlpha=Math.min(1,(lead-left)*8)*(active?1:.76);
          if(target.spinEnd){
            circle(320,180,86,p.surface);
            ctx.lineWidth=4;ctx.strokeStyle=p.muted;ctx.beginPath();ctx.arc(320,180,79,0,2*Math.PI);ctx.stroke();
            ctx.strokeStyle=accent;ctx.lineWidth=8;ctx.beginPath();
            ctx.arc(320,180,79,-Math.PI/2,-Math.PI/2+2*Math.PI*Math.min(1,(rhythm.rotation||0)/target.required));
            ctx.stroke();ctx.textAlign='center';text('Hold og drej',320,185,18,p.ink);ctx.textAlign='start';
            continue;
          }
          const path=rhythm.sliders.get(i);
          if(path)drawSlider(path,accent);
          circle(target.x,target.y,r,accent);
          circle(target.x,target.y,r-3,p.surface);
          ctx.textAlign='center';text(i%8+1,target.x,target.y+6,17,p.ink);ctx.textAlign='start';
          ctx.beginPath();ctx.arc(target.x,target.y,r+Math.max(0,left)*37,0,Math.PI*2);
          ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.stroke();
        }
        ctx.globalAlpha=1;
        if(rhythm.following){
          drawSlider(rhythm.following,p.accent);
          const ball=R.sliderPoint(rhythm.following,rhythm.time);
          circle(ball.x,ball.y,18,p.accent);circle(ball.x,ball.y,11,p.surface);
        }
        rect(0,h-4,w*Math.min(1,rhythm.time/(rhythm.track.end||1)),4,p.accent);
        text(rhythm.verdict||'Følg ringen',16,27,15,p.muted);
      }else if(current.id==='dash'){
        const {level,x,y}=state,ground=288,runner=104,offset=x-runner;
        const glow=level.color;
        const polygon=(points,fill,edge)=>{
          ctx.beginPath();ctx.moveTo(...points[0]);for(const vertex of points.slice(1))ctx.lineTo(...vertex);
          ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(edge){ctx.strokeStyle=edge;ctx.lineWidth=2;ctx.stroke();}
        };
        rect(0,0,w,h,'#0e132b');
        ctx.globalAlpha=.1+.07*(1-(x%100)/100);
        for(let col=-(x*.26%50);col<w;col+=50)rect(col,0,1,ground,glow);
        for(let row=38;row<ground;row+=50)rect(0,row,w,1,glow);
        ctx.globalAlpha=1;
        for(let k=-1;k<7;k++){
          const base=k*150-(x*.14%150);
          polygon([[base,ground],[base+80,ground-98],[base+150,ground]],'#1d2946');
          polygon([[base+80,ground-98],[base+112,ground-16],[base+150,ground]],'#17213a');
        }
        rect(0,ground,w,h-ground,'#1d3045');rect(0,ground,w,3,glow);
        for(let k=-(offset%36);k<w;k+=36)rect(k,ground+8,2,h-ground-8,'#2b4258');
        for(const o of level.objects){
          const left=o.x-offset;
          if(left+o.width< -22||left>w+22)continue;
          const ow=o.width,top=ground-o.height;
          switch(o.kind){
            case 'gap':rect(left,ground,ow,h-ground,'#0a1022');break;
            case 'spike':
              polygon([[left,ground],[left+ow/2,top],[left+ow,ground]],'#ec6894','#ffe4ef');break;
            case 'block':
              rect(left,top,ow,o.height,'#314866');rect(left,top,ow,3,glow);
              rect(left+5,top+7,ow-10,3,'#53738b');break;
            case 'pad':
              polygon([[left-2,ground],[left+4,ground-8],[left+ow-3,ground-8],[left+ow+2,ground]],'#ffca4e','#fff5b4');break;
            case 'orb':
              circle(left+13,top,15,'#ffc14d');circle(left+13,top,10,'#614b38');circle(left+13,top,5,'#ffeeb0');break;
            case 'cube':case 'ship':
              ctx.strokeStyle=o.kind==='ship'?'#60befb':'#73e9ab';ctx.lineWidth=4;
              ctx.beginPath();ctx.ellipse(left,ground-100,12,65,0,0,Math.PI*2);ctx.stroke();
              text(o.kind==='ship'?'SKIB':'TERNING',left-18,ground-178,10,'#d7eaff');break;
            case 'gate':
              rect(left,0,ow,top-91,'#304664');rect(left,top,ow,o.height,'#304664');
              rect(left,top-94,ow,3,glow);rect(left,top,ow,3,glow);break;
          }
        }
        const finish=level.length-offset;
        if(finish<w){
          for(let k=0;k<12;k++)for(let j=0;j<2;j++)rect(finish+j*7,ground-7*(k+1),7,7,(j+k)%2?'#16233d':'#f0f7ff');
        }
        if(state.mode==='ship'){rect(0,0,w,ground-257,'#1d2946');rect(0,ground-257,w,2,glow);}
        const cy=ground-y-11;
        ctx.save();ctx.translate(runner,cy);ctx.rotate(state.rotation);
        if(state.mode==='cube'){
          rect(-12,-12,24,24,'#e9fcff');rect(-10,-10,20,20,glow);
          rect(-7,-5,4,4,'#17243a');rect(3,-5,4,4,'#17243a');rect(-4,4,9,3,'#17243a');
        }else{
          polygon([[-14,-8],[17,0],[-14,8],[-8,0]],glow,'#efffff');
          polygon([[-13,-4],[-22,0],[-13,4]],'#ffae56');
        }
        ctx.restore();rect(20,18,145,4,'#30435d');rect(20,18,145*x/level.length,4,glow);
        text(state.score+' %',177,25,12,'#efffff');
      }else if(current.id==='dino'){
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
      if(state.status!=='playing'){ctx.globalAlpha=0.85;rect(0,h/2-40,w,80,p.bg);ctx.globalAlpha=1;text(current.id==='osu'?'Bane færdig!':state.status==='won'?'Du vandt!':'Spillet er slut',w/2-80,h/2+8,23);}
    }
    node.addEventListener('keydown',event=>{
      if(!visible||play.hidden||!state)return;
      if(event.ctrlKey||event.metaKey||event.altKey||event.target.closest('select,input,textarea'))return;
      if(rhythm){
        if(bindPanel.contains(event.target))return;
        const key=A.osuKey(event.key),bindings=A.osuBindings(prefs().bindings);
        if(event.target.closest('button')&&(key==='Space'||key==='Enter'))return;
        if(event.key==='Escape'||key===bindings.pause){
          event.preventDefault();if(!event.repeat && started && state.status==='playing'){if(running)pause();else toggle();}return;
        }
        if(key===bindings.retry && !event.repeat && started){event.preventDefault();openGame('osu',true);toggle();return;}
        if(running && (key===bindings.first||key===bindings.second)){
          event.preventDefault();if(!event.repeat && aim){keys.add('hit-'+(event.code||key));rhythmHit(aim);}
        }
        return;
      }
      if(event.key==='Escape'||event.key.toLowerCase()==='p'){event.preventDefault();if(running)pause();return;}
      if(event.target.closest('button')&&(event.key===' '||event.key==='Enter'))return;
      if(current.id==='dash'){
        if([' ','ArrowUp','w','W'].includes(event.key)){
          event.preventDefault();if(event.repeat)return;
          if(!running){if(started)return;toggle();}
          keys.add('dash-'+event.key);keys.add('jump');C.act(state,'jump');
        }
        return;
      }
      const dir=direction[event.key];let type=dir;
      if(event.key===' ')type={dino:'jump',blocks:'drop',breakout:'launch'}[current?.id];
      if(!type||!current)return;
      event.preventDefault();if(!running&&!started)toggle();if(!running)return;
      if(['pong','breakout'].includes(current.id)&&dir)keys.add(dir);else if(!event.repeat||['left','right','down'].includes(type))action(type);
    });
    node.addEventListener('keyup',event=>{if(direction[event.key])keys.delete(direction[event.key]);});
    window.addEventListener('keyup',event=>{keys.delete('hit-'+(event.code||A.osuKey(event.key)));if(current?.id==='dash'){keys.delete('dash-'+event.key);if(keys.size===1)keys.delete('jump');}if(direction[event.key])keys.delete(direction[event.key]);});
    node.addEventListener('focusout',event=>{if(running&&event.relatedTarget&&!node.contains(event.relatedTarget))pause();});
    function position(event){
      const r=canvas.getBoundingClientRect(),scale=Math.min(r.width/640,r.height/360);
      return {x:(event.clientX-r.left-(r.width-640*scale)/2)/scale,y:(event.clientY-r.top-(r.height-360*scale)/2)/scale};
    }
    function rhythmHit(point){
      if(!player||!running)return;
      R.hit(rhythm,point.x,point.y,player.now());state.score=rhythm.score;render();
    }
    arena.addEventListener('pointerleave',()=>{aim=null;});
    arena.addEventListener('pointermove',event=>{
      if(current?.id==='osu'&&event.target===canvas&&canvas){aim=position(event);return;}
      if(!canvas||!running||!['pong','breakout'].includes(current.id))return;
      const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
      const scale=Math.min(r.width/640,r.height/360),left=r.left+(r.width-640*scale)/2,top=r.top+(r.height-360*scale)/2;
      C.act(state,'pointer',current.id==='pong'?(event.clientY-top)/scale:(event.clientX-left)/scale);
    });
    arena.addEventListener('pointerdown',event=>{if(event.target!==canvas)return;arena.focus({preventScroll:true});if(current.id==='dash'&&event.button===0){
        if(!running){if(started)return;toggle();}event.preventDefault();canvas.setPointerCapture?.(event.pointerId);keys.add('dash-pointer-'+event.pointerId);keys.add('jump');C.act(state,'jump');
      }else if(current.id==='osu'&&event.pointerType!=='mouse'&&event.button===0&&running){event.preventDefault();keys.add('pointer-'+event.pointerId);canvas.setPointerCapture?.(event.pointerId);aim=position(event);rhythmHit(aim);}else if(current.id==='dino')action('jump');else if(current.id==='breakout')action('launch');});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])
      window.addEventListener(type,event=>{keys.delete('pointer-'+event.pointerId);if(current?.id==='dash'){keys.delete('dash-pointer-'+event.pointerId);if(keys.size===1)keys.delete('jump');}});
    arena.addEventListener('mousedown',event=>{
      if(!rhythm||!running||event.target!==canvas||![0,2].includes(event.button)||prefs().mouseHits===false)return;
      if(event.sourceCapabilities?.firesTouchEvents)return;
      event.preventDefault();keys.add('mouse-'+event.button);aim=position(event);rhythmHit(aim);
    });
    window.addEventListener('mouseup',event=>keys.delete('mouse-'+event.button));
    arena.addEventListener('contextmenu',event=>{if(rhythm&&running&&prefs().mouseHits!==false)event.preventDefault();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){stopPreview();pause();}});
    window.addEventListener('blur',()=>{clearRetry();if(running)pause();});window.addEventListener('pagehide',()=>stop());
    function update(open){
      visible=open;node.hidden=!open;
      if(!open){clearRetry();stopPreview();if(running)pause();return;}
      const id=location.hash.split('/')[1],game=C.catalog.find(g=>g.id===id);
      lobby.hidden=Boolean(game);play.hidden=!game;
      if(game){openGame(game.id);render();}else{clearRetry();stopPreview();if(running)pause();showCards();}
    }
    return {node,update,entries:C.catalog.map(g=>({href:'#lxp-games/'+g.id,key:'games',label:g.title,icon:'game',context:'Spil'}))};
  };
})();
