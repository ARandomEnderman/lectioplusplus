(() => {
  'use strict';
  const C=globalThis.lectioPlusGamesCore,arcade=globalThis.lectioPlusArcade,arcadeUI=globalThis.lectioPlusArcadeBoard;
  globalThis.lectioPlusGames=({getPreferences,onChange})=>{
    const E=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
    const B=(text,fn,cls='')=>{const b=E('button','lxp-game-button '+cls,text);b.type='button';b.addEventListener('click',fn);return b;};
    const link=(title,href,cls)=>{const a=E('a',cls,title);a.href=href;return a;};
    const node=E('main','lxp-games');node.id='lxp-games';node.hidden=true;
    const lobby=E('section','lxp-games-lobby'),play=E('section','lxp-game-play');node.append(lobby,play);
    const heading=E('header','lxp-games-heading'),eyebrow=E('p','lxp-game-eyebrow',C.catalog.length+' spil'),title=E('h1','','Spil'),intro=E('p','','Vælg et spil, og gå i gang.');
    heading.append(eyebrow,title,intro);lobby.append(heading);
    const search=E('input','lxp-games-search');search.type='search';search.placeholder='Søg efter et spil';search.setAttribute('aria-label','Søg efter et spil');
    search.addEventListener('input',showCards);lobby.append(search);
    const filters=E('nav','lxp-games-filters');filters.setAttribute('aria-label','Spilkategorier');lobby.append(filters);
    const cards=E('div','lxp-games-cards');lobby.append(cards);
    const small=E('p','lxp-game-footnote','Spillene kører lokalt. Dine rekorder gemmes på denne enhed.');lobby.append(small);
    let category='Alle';
    for(const name of ['Alle','Arkade','Hjernevridere','For to','Bonus','Quiz']){const b=B(name,()=>{category=name;showCards();});filters.append(b);}
    function showCards(){
      for(const b of filters.children)b.setAttribute('aria-pressed',String(b.textContent===category));
      cards.replaceChildren();
      const query=search.value.trim().toLocaleLowerCase('da');
      const matches=C.catalog.filter(g=>(category==='Alle'||g.category===category)&&(g.title+' '+g.category).toLocaleLowerCase('da').includes(query));
      if(!matches.length)cards.append(E('p','','Ingen spil matcher din søgning.'));
      for(const game of matches){
        const card=link('','#lxp-games/'+game.id,'lxp-game-card');card.dataset.game=game.id;
        const art=E('div','lxp-game-card-art');art.setAttribute('aria-hidden','true');art.append(E('span','',game.symbol));
        const body=E('div','lxp-game-card-body');body.append(E('span','lxp-game-tag',game.category==='For to'?'2 spillere · samme skærm':game.id==='choices'?'Bonus · 24 valg':game.category),E('h2','',game.title),E('p','',game.description),E('span','lxp-game-card-cta','Spil nu ↗'));
        card.append(art,body);cards.append(card);
      }
    }
    showCards();
    const top=E('div','lxp-game-top'),back=link('← Alle spil','#lxp-games','lxp-game-back'),name=E('h1'),description=E('p');top.append(back,name,description);
    const toolbar=E('div','lxp-game-toolbar'),start=B('Start spil',()=>toggle()),restart=B('Start forfra',()=>{if(current.id==='dash')checkpoint=null;openGame(current.id,true);});
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
    const rulesLabel=E('label','lxp-game-difficulty','Spilform '),rules=E('select');
    rules.setAttribute('aria-label','osu! spilform');rulesLabel.append(rules);
    for(const [id,mode] of Object.entries(R.rulesets)){const opt=E('option','',mode.name);opt.value=id;rules.append(opt);}
    let loadedRules=false;
    rules.addEventListener('change',()=>{const mode=rules.value;openGame('osu',true,rhythm?.track.seed);void save({ruleset:mode});});
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
    practice.setAttribute('aria-pressed','false');toolbar.append(start,playBeat,restart,settings,rulesLabel,songLabel,ownButton,practice);
    const layout=E('div','lxp-game-layout'),panel=E('div','lxp-game-panel'),stats=E('div','lxp-game-stats'),score=E('span'),best=E('span'),clock=E('span');
    stats.append(score,best,clock);
    const arena=E('div','lxp-game-arena');arena.tabIndex=0;arena.setAttribute('aria-label','Spilleområde');
    const surface=E('div','lxp-game-surface'),veil=E('div','lxp-game-veil'),veilTitle=E('strong'),veilCopy=E('p'),veilButton=B('Start spil',()=>toggle(),'lxp-game-primary');veil.append(veilTitle,veilCopy,veilButton);arena.append(surface,veil);
    const feedback=E('p','lxp-game-feedback');feedback.setAttribute('role','status');
    const controls=E('div','lxp-game-controls');controls.setAttribute('aria-label','Spilknapper');panel.append(stats,arena,feedback,controls);
    const aside=E('aside','lxp-game-guide'),guideTitle=E('h2','','Sådan spiller du'),guide=E('p'),tip=E('p','lxp-game-tip'),extra=E('div','lxp-game-extra');aside.append(guideTitle,guide,tip,extra);
    layout.append(panel,aside);play.append(top,toolbar,layout);
    let current=null,state=null,visible=false,running=false,started=false,frame=0,previous=0,lastGrid='',recorded=false,flagMode=false,canvas=null,ctx=null;
    let teacherRequest=null,teacherDirectory=null,teacherPhoto=null,teacherPrivacy=false;
    function clearTeachers(){
      teacherRequest?.abort();teacherRequest=null;teacherDirectory=null;teacherPhoto=null;
    }
    async function loadTeacher(){
      const quiz=state;
      teacherRequest ||= new AbortController();
      const signal=teacherRequest.signal;
      const active=()=>!signal.aborted && state===quiz;
      quiz.stage='loading';quiz.message='Henter lærerfoto fra Lectio…';quiz.revision++;render();
      try{
        const directory=teacherDirectory || await globalThis.lectioPlusTeacherDirectory.open(signal);
        if(!active())return;
        teacherDirectory=directory;
        const found=await teacherDirectory.next();
        if(!active())return;
        if(found.image){
          teacherPhoto=found.image;
          C.act(quiz,'question',{name:found.name,names:teacherDirectory.names,more:found.more});
        }else if(found.more){
          quiz.stage='retry';quiz.message='De seneste lærere havde intet tilgængeligt foto. Prøv igen for at fortsætte med andre lærere.';
        }else if(quiz.rounds.length){quiz.status='won';stop();}
        else{quiz.stage='error';quiz.message='Lectio viste ingen tilgængelige lærerfotos på din skole.';}
      }catch(error){
        if(!active())return;
        quiz.stage='retry';
        quiz.message=error instanceof TypeError || error.name==='TimeoutError'?'Lectio kunne ikke hentes. Prøv igen.':error.message;
      }
      quiz.revision++;render();
    }
    const keys=new Set(),symbols=['🍒','🍋','🍇','🥝','🍓','🍊','🍉','🫐'];
    const direction={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',W:'up',S:'down',A:'left',D:'right'};
    let rhythm=null, player=null, aim=null, audioError='', lastAudioTick=0;
    let recording=null,importNumber=0,loadingFile=false,lastHud=0,rhythmPalette=null;
    const soundPanel=E('section','lxp-song-audio');
    const soundStatus=E('p');soundStatus.setAttribute('role','status');
    const tempoLabel=E('label','','Spiltempo'),tempo=E('input'),tempoValue=E('span','lxp-osu-tempo-value');
    tempo.type='range';tempo.min='50';tempo.max='200';tempo.step='any';tempo.value='100';
    tempo.setAttribute('aria-label','Spiltempo');tempoLabel.append(tempoValue,tempo);
    const bpmLabel=E('label','','Spiltempo i BPM'),bpmInput=E('input');
    bpmInput.type='number';bpmInput.min='0';bpmInput.step='any';bpmInput.setAttribute('aria-label','Spiltempo i BPM');
    bpmLabel.append(bpmInput);
    let savedPercent=100;
    function showTempo(percent=Number(tempo.value)){
      const base=rhythm?.track.bpm;
      const text=Number(percent.toFixed(2)).toLocaleString('da-DK')+' %';
      tempoValue.textContent=text;tempo.setAttribute('aria-valuetext',text);
      bpmLabel.hidden=!base;bpmInput.value=base?String(Number((base*percent/100).toFixed(2))):'';
    }
    function setTempoSlider(percent){
      tempo.min=String(Math.min(50,percent));tempo.max=String(Math.max(200,percent));
      tempo.value=String(percent);showTempo(percent);
    }
    function changeTempo(percent){
      if(running||loadingFile)return;
      if(!Number.isFinite(percent)||percent<=0){
        setTempoSlider(savedPercent);soundStatus.textContent='Skriv et positivt tempo i BPM.';return;
      }
      try{media.playbackRate=percent/100;}
      catch{
        setTempoSlider(savedPercent);soundStatus.textContent='Browserens lydafspiller understøtter ikke denne afspilningshastighed.';return;
      }
      savedPercent=percent;setTempoSlider(percent);updateSoundPanel();
      void save({osuRate:percent});render();
    }
    tempo.addEventListener('input',()=>showTempo(Math.round(Number(tempo.value))));
    tempo.addEventListener('change',()=>changeTempo(Math.max(1,Math.round(Number(tempo.value)))));
    bpmInput.addEventListener('change',()=>{
      if(rhythm?.track.bpm)changeTempo(Number((bpmInput.valueAsNumber/rhythm.track.bpm*100).toPrecision(12)));
    });
    const densityLabel=E('label','','Nodetæthed'),density=E('select');
    for(const [id,label] of [['sparse','Færre slag'],['normal','Normal'],['dense','Flere slag']]){
      const opt=E('option','',label);opt.value=id;density.append(opt);
    }
    density.setAttribute('aria-label','Nodetæthed');densityLabel.append(density);
    density.addEventListener('change',()=>{
      if(running||loadingFile)return;
      const value=density.value;openGame('osu',true,rhythm?.track.seed);void save({osuDensity:value});
    });
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
        try{media.playbackRate=savedPercent/100;}catch{backupAudio=true;}
        media.hidden=!hasRecording() && Boolean(rhythm?.track.artist);
      }
      if(hasRecording())load(recording.file);
      else if(!source.custom)R.renderScore(source).then(load).catch(()=>{ /* The live synthesizer also plays this score. */ });
    }
    const removeFile=B('Fjern sangfil',()=>{releaseClip();recording=null;openGame('osu',true);});
    soundPanel.append(E('h3','','Musik'),soundStatus,tempoLabel,bpmLabel,densityLabel,fileLabel,media,offsetLabel,removeFile);
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
      soundStatus.textContent=attached?'Lydfil: '+recording.filename+' · '+duration(rhythm.track.end)+(rhythm.track.estimated?' · ca. '+rhythm.track.bpm+' BPM':' · fast øvepuls')
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
      openGame('osu',true,rhythm.track.seed);
    });
    const A=globalThis.lectioPlusAppearance;
    const D=globalThis.lectioPlusDash;
    let selectedCourse=1, customCourse=null,practiceRun=false,checkpoint=null;
    const courseMenu=E('section','lxp-dash-menu'),worldSelect=E('select');
    const collections=new Map(),byGrade=D.grades.map(()=>[]);
    for(const item of D.levels){
      const group=item.demon!=null?'Demonbaner':item.effect?'Portalprøver':item.platform?'Platformbaner':item.modes?'Portalturnéen':item.world||'Klassiske baner';
      if(!collections.has(group))collections.set(group,[]);
      collections.get(group).push(item);
      byGrade[D.rating(item).tier].push(item);
    }
    const worldsGroup=E('optgroup'),gradesGroup=E('optgroup');
    worldsGroup.label='Verdener';gradesGroup.label='Sværhedsgrader på tværs af verdener';
    worldSelect.setAttribute('aria-label','Vælg verden eller sværhedsgrad');
    function menuOption(group,label,value){
      const option=E('option','',label);option.value=value;group.append(option);
    }
    for(const [name,items] of collections)menuOption(worldsGroup,name,items[0].id);
    for(const [index,grade] of D.grades.entries())menuOption(gradesGroup,grade.name+' ('+byGrade[index].length+')','grade-'+index);
    worldSelect.append(gradesGroup,worldsGroup);
    menuOption(worldSelect,'Mit baneværksted',0);
    let gradeFilter=null;
    const gallery=E('div','lxp-dash-gallery'),courseArt=E('canvas'),tileTitle=E('h2'),tileMeta=E('p');
    courseArt.width=640;courseArt.height=140;courseArt.setAttribute('aria-hidden','true');
    const courseTiles=E('div','lxp-dash-tiles'),headline=E('div','lxp-dash-head');
    const browseLabel=E('label','lxp-dash-browse','Verden eller sværhedsgrad');browseLabel.append(worldSelect);
    const earned=E('span','lxp-dash-earned');
    headline.append(E('strong','','Banevælger'),earned,browseLabel);
    const selection=E('div','lxp-dash-selection');
    function chooseCourse(id){
      if(id===0)gradeFilter=null;
      if(id===0&&!customCourse){
        const draft=getPreferences().games?.dashDraft||initial;customCourse=D.buildCourse(draft.title,draft.modes);
      }
      practiceRun=false;checkpoint=null;selectedCourse=id;openGame('dash',true);
    }
    function adjacentCourse(direction){
      const pool=gradeFilter===null?D.levels:byGrade[gradeFilter];
      const index=pool.findIndex(item=>item.id===selectedCourse);
      if(index===-1){chooseCourse(direction>0?pool[0].id:pool.at(-1).id);return;}
      chooseCourse(pool[(index+direction+pool.length)%pool.length].id);
    }
    const prev=B('❮',()=>adjacentCourse(-1)),next=B('❯',()=>adjacentCourse(1));
    prev.setAttribute('aria-label','Forrige bane');next.setAttribute('aria-label','Næste bane');
    function beginCourse(practice){
      practiceRun=practice;checkpoint=null;openGame('dash',true);toggle();
    }
    const launch=B('▶ Spil bane',()=>beginCourse(false),'lxp-dash-launch');
    const emblem=E('span','lxp-dash-face'),badge=E('span','lxp-dash-series'),ratingText=E('strong','lxp-dash-rating');
    emblem.append(E('i','lxp-face-eyes'),E('i','lxp-face-mouth'));
    emblem.setAttribute('aria-hidden','true');
    const practiceButton=B('Øv med checkpoints',()=>beginCourse(true));
    const courseActions=E('div','lxp-dash-actions');courseActions.append(launch,practiceButton);
    selection.append(badge,emblem,tileTitle,ratingText,tileMeta,courseActions);
    const studio=E('details','lxp-dash-studio'),editor=E('div','lxp-dash-editor'),sequence=E('div','lxp-dash-sequence');
    const initial=getPreferences().games?.dashDraft||{title:'Min portalbane',modes:['cube','wave','ship']};
    let draftModes=[...initial.modes],activeSection=0,studioLoaded=false;
    const titleInput=E('input');titleInput.value=initial.title;titleInput.maxLength=42;
    titleInput.setAttribute('aria-label','Banens navn');
    const forms=E('select');forms.setAttribute('aria-label','Ny sektion');
    for(const [mode,[label]] of Object.entries(D.forms)){
      const opt=E('option','',label);opt.value=mode;forms.append(opt);
    }
    const editStatus=E('span');editStatus.setAttribute('role','status');
    const appendForm=B('Tilføj sektion',()=>{if(draftModes.length<16){draftModes.push(forms.value);activeSection=draftModes.length-1;}updateDraft();});
    const undo=B('Fjern valgt',()=>{if(draftModes.length>1)draftModes.splice(activeSection,1);activeSection=Math.min(activeSection,draftModes.length-1);updateDraft();});
    function shiftSection(by){
      const dest=activeSection+by;
      [draftModes[activeSection],draftModes[dest]]=[draftModes[dest],draftModes[activeSection]];
      activeSection=dest;updateDraft();
    }
    const earlier=B('← Flyt',()=>shiftSection(-1)),later=B('Flyt →',()=>shiftSection(1));
    function updateDraft(){
      sequence.replaceChildren(...draftModes.map((m,i)=>{
        const b=B(String(i+1)+' · '+D.forms[m][0],()=>{activeSection=i;updateDraft();sequence.children[i].focus();});
        b.setAttribute('aria-pressed',String(i===activeSection));return b;
      }));
      earlier.disabled=activeSection===0;later.disabled=activeSection===draftModes.length-1;
      appendForm.disabled=draftModes.length>=16;undo.disabled=draftModes.length<=1;editStatus.textContent='';
    }
    editor.append(titleInput,forms,appendForm,sequence,earlier,later,undo,B('Gem og vælg bane',async()=>{
      const draft={title:titleInput.value.trim()||'Min portalbane',modes:[...draftModes]};
      const saved=await save({dashDraft:draft});customCourse=D.buildCourse(draft.title,draft.modes);
      chooseCourse(0);editStatus.textContent=saved?'Banen er gemt på denne enhed.':'Banen kan spilles i denne session.';
    }),editStatus);
    const exchange=E('details','lxp-dash-exchange'),code=E('textarea');
    code.setAttribute('aria-label','Banekode');code.placeholder='Indsæt en banekode';code.maxLength=1500;
    exchange.append(E('summary','','Del eller indlæs en banekode'),code,B('Lav banekode',()=>{
      code.value=JSON.stringify({version:1,title:titleInput.value.trim()||'Min portalbane',modes:draftModes});code.select();
    }),B('Indlæs kode',()=>{
      try{
        const data=JSON.parse(code.value);
        if(data?.version!==1||typeof data.title!=='string'||!Array.isArray(data.modes)||!data.modes.length||data.modes.length>16||
          !data.modes.every(mode=>typeof mode==='string'&&Object.hasOwn(D.forms,mode)))throw Error();
        titleInput.value=data.title.slice(0,42);draftModes=[...data.modes];activeSection=0;updateDraft();editStatus.textContent='Banen er indlæst. Vælg Gem og vælg bane for at spille.';
      }catch{editStatus.textContent='Ugyldig banekode. Kopiér hele koden fra baneværkstedet.';}
    }));editor.append(exchange);
    updateDraft();studio.append(E('summary','','Baneværksted'),editor);
    const garage=E('details','lxp-dash-studio'),inks=E('div','lxp-dash-inks');
    garage.append(E('summary','','Ikonfarve'),inks);
    for(const [label,ink] of [['Banens farve','auto'],['Mint','#50ffbc'],['Rosa','#ff87bb'],['Guld','#ffe06c'],['Isblå','#8dc8ff']]){
      const b=B(label,async()=>{if(await save({dashInk:ink}))for(const el of inks.children)el.setAttribute('aria-pressed',String(el===b));});
      b.dataset.ink=ink;b.style.setProperty('--ink',ink==='auto'?'var(--course-color)':ink);
      b.setAttribute('aria-pressed',String((getPreferences().games?.dashInk||'auto')===ink));inks.append(b);
    }
    gallery.append(courseArt,prev,selection,next);courseMenu.append(headline,gallery,courseTiles,studio,garage);
    toolbar.after(courseMenu);
    worldSelect.addEventListener('change',()=>{
      const value=worldSelect.value;
      gradeFilter=value.startsWith('grade-')?Number(value.slice(6)):null;
      chooseCourse(gradeFilter===null?Number(value):byGrade[gradeFilter][0].id);
    });
    const dashBestKey=id=>(id>=130?'dash4:':'dash2:')+id;
    const dashCoinKey=id=>(id>=130?'v4-':'v2-')+id;
    const demonArt=globalThis.lectioPlusDashScenery;
    function showCourse(level){
      const collection=[...collections].find(([,items])=>items.includes(level));
      const pool=gradeFilter===null?(collection?.[1]||[level]):byGrade[gradeFilter];
      const grade=D.rating(level);
      badge.textContent=collection?.[0]||'Baneværksted';
      worldSelect.value=gradeFilter===null?collection?.[1][0].id||0:'grade-'+gradeFilter;
      courseMenu.style.setProperty('--course-color',level.color);
      emblem.dataset.tier=grade?.tier??'none';
      emblem.classList.toggle('lxp-face-demon',level.demon!=null);
      emblem.classList.toggle('lxp-face-frown',Boolean(grade && grade.tier>=3));
      emblem.style.setProperty('--face-color',grade?.color||'#aeb9c8');
      ratingText.textContent=grade?grade.name+' · '+grade.symbol+' '+grade.amount:'Uden vurdering';
      ratingText.setAttribute('aria-label',grade?grade.name+' · '+grade.amount+' '+grade.unit:'Uden vurdering');
      prev.disabled=next.disabled=gradeFilter!==null && pool.length<2;
      courseMenu.style.setProperty('--course-sky',level.sky||'#162647');
      tileTitle.textContent=level.wave?level.title.split(' · ')[0]:level.title;
      const records=prefs().bests;
      const bestFor=id=>Math.max(records[dashBestKey(id)]||0,!practiceRun&&id===state.level.id?state.score:0);
      let stars=0,moons=0;
      for(const course of D.levels){
        if(bestFor(course.id)!==100)continue;
        if(course.platform)moons+=course.stars;else stars+=course.stars;
      }
      earned.textContent='Optjent  ★ '+stars+'  ·  ☾ '+moons;
      earned.setAttribute('aria-label','Optjent på gennemførte baner: '+stars+' stjerner og '+moons+' måner');
      const coins=prefs().dashCoins?.[dashCoinKey(level.id)]||0;
      tileMeta.textContent=(level.demon!=null?level.modes.map(m=>D.forms[m][0]).join(' › ')+' · '+Math.round(level.end)+' s':level.effect?D.modifiers[level.effect]+' · Wave':level.platform?'Fri bevægelse · ← → og hop':level.modes?level.modes.map(m=>D.forms[m][0]).join(' › '):level.wave?'Wave '+level.wave+' / 100':'Klassiker '+level.id+' / 15 · '+Math.round(level.end)+' s')+'  ·  '+level.bpm+' BPM  ·  Rekord '+bestFor(level.id)+' %  ·  '+[1,2,4].filter(bit=>coins&bit).length+'/3 mønter';
      courseTiles.replaceChildren();courseTiles.classList.toggle('lxp-dash-filtered',gradeFilter!==null);
      for(const item of pool){
        const itemGrade=D.rating(item);
        const title=gradeFilter!==null?item.title:item.demon!=null?itemGrade.name:item.id===0?'Min bane':String(item.wave||pool.indexOf(item)+1);
        const btn=B(title+(bestFor(item.id)===100?' ✓':''),()=>{
          chooseCourse(item.id);courseTiles.querySelector('[aria-pressed=true]')?.focus({preventScroll:true});
        });
        const detail=itemGrade?itemGrade.name+' · '+itemGrade.amount+' '+itemGrade.unit:'Uden vurdering';
        if(itemGrade && gradeFilter===null){
          const value=E('small','lxp-dash-tile-rating',itemGrade.symbol+' '+itemGrade.amount);
          value.style.setProperty('--rank-color',itemGrade.color);btn.append(value);
        }
        btn.title=item.title+' · '+detail;btn.setAttribute('aria-label',btn.title);
        btn.setAttribute('aria-pressed',String(item.id===level.id));courseTiles.append(btn);
      }
      const c=courseArt.getContext('2d');if(!c)return;
      c.clearRect(0,0,640,140);
      if(level.demon!=null){
        c.save();c.scale(1,.5);
        demonArt.background(c,level,level.id*15,640,280,0);
        c.restore();
      }else{
        c.fillStyle=level.color;
        for(let i=0;i<38;i++){const x=(i*123+level.id*17)%640,y=(i*71+level.id*3)%116;c.fillRect(x,y,2,2);}
        c.globalAlpha=.45;c.beginPath();c.arc(540,46,26,0,Math.PI*2);c.fill();c.globalAlpha=1;
        for(let i=0;i<25;i++){
          const height=15+((i*37+level.id*7)%45);
          c.fillStyle=level.sky||'#162647';c.fillRect(i*28,140-height,24,height);
          c.fillStyle=level.color;for(let j=5;j<height-3;j+=9)c.fillRect(i*28+5,141-height+j,3,3);
        }
      }
      if(level.chapters){
        // Draw the course's actual elevations and flight openings on the level card.
        const scale=640/level.length;
        for(const o of level.objects){
          const x=o.x*scale,wide=Math.max(2,o.width*scale),y=o.inverted?61:131;
          c.fillStyle=level.color;
          if(o.kind==='gate'){
            c.fillRect(x,61,wide,Math.max(1,70-(o.height+o.opening)*.27));c.fillRect(x,131-o.height*.27,wide,o.height*.27);
          }else if(o.kind==='ledge'){
            c.fillRect(x,o.inverted?61+o.height*.27:131-o.height*.27,wide,4);
          }else if(o.kind==='railSpike'){
            const depth=(o.depth||30)*.27;c.fillRect(x,o.height?61:131-depth,wide,depth);
          }else if(o.kind==='saw'){
            c.beginPath();c.arc(x+wide/2,o.inverted?66:126,3,0,2*Math.PI);c.fill();
          }else if(o.kind==='block'||o.kind==='spike'){
            const rise=(o.height+(o.base||0))*.27;c.fillRect(x,o.inverted?y:y-rise,wide,rise);
          }else if(o.kind==='orb'||o.kind==='pad'){c.fillStyle='#ffe99d';c.fillRect(x,130-o.height*.27,3,3);}
        }
        if(level.knots){
          c.beginPath();level.knots.forEach((k,i)=>{if(i)c.lineTo(k.x*scale,131-k.y*.27);else c.moveTo(k.x*scale,131-k.y*.27);});
          c.lineWidth=2;c.strokeStyle=level.color;c.stroke();
        }
        return;
      }
      const points=level.knots||level.objects.map(o=>({x:o.x,y:o.height||40,r:12}));
      c.beginPath();
      points.forEach((pt,i)=>{const x=640*pt.x/level.length,y=119-pt.y*.45;
        if(i)c.lineTo(x,y);else c.moveTo(x,y);
      });
      c.strokeStyle=level.color;c.lineWidth=4;c.stroke();
    }
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
        dashUrl=URL.createObjectURL(blob);dashMedia.src=dashUrl;dashMedia.loop=Boolean(level.platform);
        if(running&&current?.id==='dash')startDashMusic();
      }).catch(()=>{ /* The live synthesizer can play the same notes. */ });
    }
    function startDashMusic(){
      if(dashAudio)dashAudio.close();
      dashAudio=null;
      try{
        const offset=state.level.platform?state.time%state.level.end:state.time;
        const audio=dashUrl?R.mediaPlayback(dashMedia,state.level,offset):R.playback(state.level,offset);
        dashAudio=audio;dashAudioError=false;
        audio.ready.catch(()=>{if(audio===dashAudio){audio.close();dashAudio=null;dashAudioError=true;}});
      }catch{dashAudioError=true;}
    }
    const labels={first:'Slag 1',second:'Slag 2',pause:'Pause / fortsæt',retry:'Start banen forfra'};
    const bindingButtons=new Map(),inputs=new Map();
    const modeLabels={taiko:['Midte V','Midte H','Kant V','Kant H'],mania:['Spor 1','Spor 2','Spor 3','Spor 4'],catch:['Venstre','Højre','Sprint']};
    function activeBindings(){
      return rules.value==='standard'?A.osuBindings(prefs().bindings):A.modeBindings(rules.value,prefs().modeKeys?.[rules.value]);
    }
    function saveBindings(bindings){
      return rules.value==='standard'?save({bindings}):save({modeKeys:{...prefs().modeKeys,[rules.value]:bindings}});
    }
    function inputLane(index){return rules.value==='taiko'?Number(index>=2):index;}
    function pressMode(source,index){
      if(!player||inputs.has(source))return;
      inputs.set(source,index);
      if(rules.value!=='catch')R.modePress(rhythm,inputLane(index),player.now());
      else aim=null;
    }
    function releaseMode(source){
      if(!inputs.has(source))return;
      const index=inputs.get(source);inputs.delete(source);
      if(player&&rhythm.mode==='mania'&&![...inputs.values()].includes(index))R.modeRelease(rhythm,index,player.now());
    }
    let capturing=null;
    const keyName=k=>({Space:'Mellemrum',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→'}[k]||k.toUpperCase());
    function showBindings(){
      const bindings=activeBindings();
      for(const [id,button] of bindingButtons){
        button.parentNode.hidden=!Object.hasOwn(bindings,id);if(button.parentNode.hidden)continue;
        const label=id.startsWith('lane')?modeLabels[rules.value][Number(id.slice(4))]:labels[id];
        button.previousElementSibling.textContent=label;
        button.textContent=capturing===id?'Tryk på en tast …':keyName(bindings[id]);
        button.setAttribute('aria-label',label+' · '+button.textContent);
      }
      mouseLabel.hidden=rules.value!=='standard';mouseInput.checked=prefs().mouseHits!==false;
    }
    for(const [id,label] of Object.entries({...labels,lane0:'',lane1:'',lane2:'',lane3:''})){
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
      capturing=null;await saveBindings(A.modeBindings(rules.value));if(rules.value==='standard')await save({mouseHits:true});showBindings();
    }),bindStatus);
    bindPanel.addEventListener('keydown',async event=>{
      if(!capturing)return;
      event.preventDefault();event.stopPropagation();
      if(event.repeat)return;
      if(event.key==='Escape'){capturing=null;bindStatus.textContent='';showBindings();return;}
      const key=A.osuKey(event.key);
      if(!key||event.ctrlKey||event.altKey||event.metaKey){bindStatus.textContent='Vælg én tast, fx F, J eller mellemrum.';return;}
      const bindings=activeBindings();
      if(Object.entries(bindings).some(([id,k])=>id!==capturing&&k===key)){
        bindStatus.textContent='Tasten bruges allerede. Vælg en anden.';return;
      }
      bindings[capturing]=key;capturing=null;
      const saved=await saveBindings(bindings);showBindings();bindStatus.textContent=saved?'Gemt · '+keyName(key):'Tasten kunne ikke gemmes.';
    });
    function clearRetry(){clearTimeout(retryTimer);retryTimer=0;}
    function retryDash(){
      openGame('dash',true);
      if(practiceRun&&checkpoint?.level===state.level){
        Object.assign(state,checkpoint,{used:new Set(checkpoint.used),trail:[],buffer:0});
      }
      toggle();
    }
    function recordKey(){
      if(current.id==='dash')return dashBestKey(state.level.id);
      if(current.id!=='osu')return current.id+':'+state.difficulty;
      const mode=rhythm.mode==='standard'?'osu':'osu-'+rhythm.mode;
      const songKey=mode+':'+(rhythm.track.recordId||rhythm.track.id);
      return density.value==='normal' && tempo.value==='100'?songKey:songKey+':'+density.value+'-'+tempo.value;
    }
    const prefs=()=>getPreferences().games||{difficulty:'normal',bests:{}};
    async function save(changes){
      try{if(await onChange({games:{...prefs(),...changes}})!==false)return true;}catch{}
      feedback.textContent='Indstillingen eller rekorden kunne ikke gemmes. Du kan stadig spille.';return false;
    }
    const setText=(el,text)=>{if(el.textContent!==text)el.textContent=text;};
    function stop(){
      clearRetry();if(dashAudio){dashAudio.close();dashAudio=null;}
      stopPreview();
      for(const source of inputs.keys())releaseMode(source);
      if(player){if(rhythm)rhythm.time=player.now();player.close();player=null;}
      running=false;keys.clear();if(frame)cancelAnimationFrame(frame);frame=0;previous=0;}
    function pause(){if(!state||state.status!=='playing')return;stop();render();}
    function toggle(){
      if(!visible||!state||document.hidden||loadingFile)return;
      if(state.status!=='playing'){openGame(current.id,true);}
      if(running){pause();return;}
      if(current.id==='teacher' && !started && state.stage!=='ready')return;
      if(current.id==='osu'){
        if(!hasRecording() && (rhythm.track.custom || rhythm.track.artist && !silent && !beatChosen)){chooseFile.click();return;}
        stopPreview();audioError='';
        const rate=Number(tempo.value)/100;
        const nativePlayer=Boolean(clipUrl) && !silent && !backupAudio;
        const failed=()=>{if(nativePlayer)backupAudio=true;
          audioError=nativePlayer?'Afspilleren kunne ikke starte. Prøv igen med den alternative lydafspiller.':'Lyden kunne ikke starte. Tjek fanens lyd, og prøv igen.';stop();render();};
        try {
          if(silent){
            const origin=performance.now()/1000-rhythm.time/rate;
            player={now:()=>(performance.now()/1000-origin)*rate,schedule(){},close(){},ready:Promise.resolve()};
          }else if(nativePlayer)player=R.mediaPlayback(media,rhythm.track,rhythm.time,rate);
          else if(hasRecording())player=R.playRecording(rhythm.track,recording,rhythm.time,rate);
          else player=R.playback(rhythm.track,rhythm.time,rate);
          lastAudioTick=performance.now();
          const active=player;player.ready.catch(()=>{if(player===active)failed();});
        } catch {failed();return;}
      }
      if(current.id==='dash'){
        attempt+=started?0:1;
        prepareDashMusic(state.level);startDashMusic();
      }
      running=true;started=true;previous=0;render();(surface.querySelector('.lxp-quiz-form input')||arena).focus({preventScroll:true});frame=requestAnimationFrame(loop);
    }
    function loop(now){
      frame=0;if(!running||!visible||document.hidden)return;
      const elapsed=previous?(now-previous)/1000:0;
      const dt=['dive','moles'].includes(current.id)?elapsed:Math.min(elapsed,current.id==='dash'?.15:.05);previous=now;
      if(player){
        const position=player.now();
        if(position>rhythm.time)lastAudioTick=performance.now();
        if(performance.now()-lastAudioTick>2600){
          if(clipUrl&&!backupAudio){backupAudio=true;audioError='Afspilningen gik i stå. Prøv igen med den alternative lydafspiller.';}
          else audioError='Lyden starter ikke. Tjek fanens lyd og lydudgangen.';
          stop();render();return;
        }
        player.schedule();
        if(rhythm.mode==='standard'){R.follow(rhythm,position,aim,keys.size>0);R.advance(rhythm,position);}
        else{
          const held=new Set(inputs.values());
          R.modeTick(rhythm,position,{x:aim?.x,direction:Number(held.has(1))-Number(held.has(0)),sprint:held.has(2)||aim!==null});
        }
        state.time=rhythm.time;state.score=rhythm.score;
        if(state.time>=rhythm.track.end)state.status='won';
      }else if(current.id==='dash'){
        // Input and physics keep running even when a device suspends its audio clock.
        if(dashAudio){
          try{
            dashAudio.schedule();
            const position=state.level.platform?state.time%state.level.end:state.time;
            if(dashUrl&&!dashMedia.paused&&dashMedia.readyState>=3&&Math.abs(dashMedia.currentTime-position)>.25)dashMedia.currentTime=position;
          }catch{dashAudio.close();dashAudio=null;dashAudioError=true;}
        }
        // Recover short frame stalls without skipping hazards or slowing down the song.
        for(let remaining=dt;remaining>1e-7;remaining-=.05)C.step(state,Math.min(.05,remaining),keys);
        if(practiceRun&&state.status==='playing'&&state.x-(checkpoint?.x||0)>650){
          const clear=!state.level.objects.some(o=>!Object.hasOwn(D.forms,o.kind)&&o.x+o.width>state.x-25&&o.x<state.x+125);
          if(clear&&(state.grounded||state.y>55&&state.y<180))checkpoint=D.checkpoint(state);
        }
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
      if(current.id==='teacher'){
        if(type==='retry' && state.stage==='retry'){void loadTeacher();return;}
        if(state.stage!=='ready')return;
      }
      if(!running){if(started)return;toggle();}
      C.act(state,type,value);
      if(current.id==='teacher' && state.stage==='loading'){teacherPhoto=null;void loadTeacher();return;}
      render();if(state.status!=='playing'){stop();render();}
    }
    function control(text,type,hold=false){
      const b=B(text,()=>{if(!hold)action(type);});b.setAttribute('aria-label',text);
      if(hold){
        b.addEventListener('pointerdown',event=>{event.preventDefault();if(!running&&!started)toggle();if(running){keys.add(type);if(current.id==='dash'&&type==='jump')keys.add('touch-jump');b.setPointerCapture?.(event.pointerId);}});
        for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>{keys.delete(type);if(type==='jump')keys.delete('touch-jump');});
        b.addEventListener('keydown',event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();if(!started)toggle();if(running)keys.add(type);}});
        b.addEventListener('keyup',()=>keys.delete(type));b.addEventListener('blur',()=>keys.delete(type));
      }
      controls.append(b);return b;
    }
    function openGame(id,reset=false,seed){
      const game=C.catalog.find(g=>g.id===id);if(!game)return;
      if(current?.id===id&&!reset)return;
      if(current?.id==='teacher')clearTeachers();
      const keepBeat=beatChosen && id==='osu' && current?.id===id && rhythm?.track.id===song.value;
      if(id==='dash' && (current?.id!=='dash'||state.level.id!==selectedCourse))attempt=0;
      if(id!=='dash'){practiceRun=false;checkpoint=null;}
      stop();capturing=null;dashAudioError=false;courseMenu.hidden=id!=='dash';current=game;state=C.create(id,{level:selectedCourse||customCourse,difficulty:game.live?(reset?difficulty.value:prefs().difficulty):'normal'});recorded=false;started=false;lastGrid='';flagMode=false;
      importNumber++;loadingFile=false;beatChosen=keepBeat;aim=null;audioError='';ownButton.hidden=songLabel.hidden=practice.hidden=id!=='osu';rhythmPalette=null;
      const selected=allTracks.find(t=>t.id===song.value)||allTracks[0];
      if(id==='osu'&&!loadedRules){rules.value=prefs().ruleset||'standard';savedPercent=prefs().osuRate||100;setTempoSlider(savedPercent);
        density.value=prefs().osuDensity||'normal';loadedRules=true;}
      rulesLabel.hidden=id!=='osu';
      const source=recording?.id===selected.id?recording.chart:selected;
      rhythm=id==='osu'?R.modeSession(R.newChart(source,density.value,seed),rules.value):null;
      if(rhythm)showTempo();
      restart.textContent=id==='osu'?'Ny bane':'Start forfra';
      setText(name,game.title);setText(description,game.description);setText(guide,game.controls);difficulty.value=state.difficulty;settings.hidden=!game.live||id==='osu'||id==='dash';
      tip.textContent=game.category==='For to'?'Giv turen videre til den anden spiller.':game.category==='Bonus'?'Dine valg bliver kun i denne runde.':'Pause virker med P eller Escape. Spillet pauser automatisk, når du forlader det.';
      if(id==='osu'&&rhythm.mode!=='standard')guide.textContent=R.rulesets[rhythm.mode].guide;
      if(id==='osu')tip.textContent='Ny bane giver sangen et nyt mønster. Spiltempo ændrer musikkens hastighed, og nodetæthed bestemmer, hvor mange slag du spiller.';
      if(id==='dash'){
        if(!studioLoaded){
          const saved=prefs().dashDraft||initial;
          draftModes=[...saved.modes];titleInput.value=saved.title;updateDraft();studioLoaded=true;
        }
        for(const b of inks.children)b.setAttribute('aria-pressed',String(b.dataset.ink===(prefs().dashInk||'auto')));
        showCourse(state.level);
      }
      if(id!=='dash'||dashLevel!==state.level)prepareDashMusic(null);
      if(id==='dash'){
        const modes=state.level.platform?[]:[...new Set(['cube',...state.level.objects.map(o=>o.kind).filter(m=>Object.hasOwn(D.forms,m))])];
        guide.textContent=state.level.platform?'Brug ← og → til at gå og mellemrum til at hoppe.':modes.map(m=>D.forms[m].join(' · ')).join('  ');
      }
      if(id==='dash'&&practiceRun)tip.textContent='Øvelse gemmer checkpoints undervejs. Tryk C for selv at sætte et checkpoint.';
      else if(id==='dash')tip.textContent='Efter et styrt starter banen igen. Din bedste procent gemmes for hver bane.';
      surface.replaceChildren();controls.replaceChildren();extra.replaceChildren();canvas=ctx=null;
      if(id==='teacher'){
        tip.textContent='Quizzen bruger de lærernavne og fotos, som din Lectio-konto kan se på skolen.';
        teacherPrivacy=Boolean(getPreferences().hideProfilePhoto);
        if(teacherPrivacy){state.stage='error';state.message='Personbilleder er skjult. Slå “Skjul mit profilbillede” fra i indstillingerne for at spille.';}
        else if(document.body.hasAttribute('data-lxp-preview')){state.stage='error';state.message='Åbn Gæt læreren på din skoles Lectio-side for at se skolens lærere.';}
        else void loadTeacher();
      }
      if(rhythm){extra.append(bindPanel,soundPanel);showBindings();prepareClip();updateSoundPanel();}
      if(game.live){
        canvas=E('canvas','lxp-game-canvas');canvas.width=id==='snake'?720:id==='blocks'?480:1280;canvas.height=id==='snake'?720:id==='blocks'?800:720;
        canvas.setAttribute('role','img');canvas.setAttribute('aria-label',game.title+' spillebane');canvas.append(document.createTextNode('Spillet kræver en browser med canvas.'));surface.append(canvas);ctx=canvas.getContext('2d');
        if(!ctx)feedback.textContent='Spilbanen kunne ikke tegnes. Prøv en opdateret browser.';
        if(id==='dash'&&practiceRun)controls.append(B('Sæt checkpoint',()=>{if(running)checkpoint=D.checkpoint(state);}));
        if(id==='dash'&&document.fullscreenEnabled)controls.append(B('Fuld skærm',async()=>{
          try{if(document.fullscreenElement)await document.exitFullscreen();else await arena.requestFullscreen();}catch{}
        }));
        if(id==='dash'&&state.level.platform){control('← Venstre','left',true);control('Hop','jump',true);control('Højre →','right',true);}
        if(id==='flap')control('Bask ↑','jump');
        if(id==='dino')control('Hop ↑','jump');
        if(id==='snake'||id==='blocks'){
          control(id==='blocks'?'Drej ↻':'Op ↑','up');control('Venstre ←','left');control('Ned ↓','down');control('Højre →','right');if(id==='blocks')control('Slip brik ⤓','drop');
        }
        if(id==='pong'){control('Hold op ↑','up',true);control('Hold ned ↓','down',true);}
        if(id==='breakout'){control('Hold venstre ←','left',true);control('Send bold ↗','launch');control('Hold højre →','right',true);}
        if(id==='blocks'){extra.append(E('h3','','Næste brik'));const preview=E('div','lxp-game-next');preview.setAttribute('aria-label','Næste brik');extra.append(preview);}
      }else if(['2048','maze','crates'].includes(id)){control('Op ↑','up');control('Venstre ←','left');control('Ned ↓','down');control('Højre →','right');}
      else if(id==='mines'){const flag=control('Flag: fra ⚑','noop');flag.onclick=()=>{flagMode=!flagMode;flag.textContent=flagMode?'Flag: til ⚑':'Flag: fra ⚑';flag.setAttribute('aria-pressed',String(flagMode));};flag.setAttribute('aria-pressed','false');}
      render();
    }
    function finishText(){
      if(arcade?.ids.has(current.id))return arcadeUI.status(state);
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
      stats.hidden=current.id==='teacher' && !state.rounds.length;
      best.hidden=localTwo||['choices','memory','mines','lights'].includes(current.id);
      setText(best,'Rekord '+Math.max(prefs().bests[recordKey()]||0,current.id==='dash'&&practiceRun?0:state.score)+(current.id==='dash'?' %':''));
      start.textContent=finished?'Spil igen':running?'Pause':started?'Fortsæt':'Start spil';
      const needsFile=rhythm?.track.artist&&!hasRecording()&&(rhythm.track.custom||!silent&&!beatChosen);
      playBeat.hidden=!(needsFile&&!rhythm.track.custom&&!running);playBeat.disabled=loadingFile;
      if(needsFile)start.textContent='Vælg sangfil';
      courseMenu.hidden=current.id!=='dash'||running||state.status==='lost';
      layout.hidden=current.id==='dash'&&!started;
      if(rhythm)media.controls=!running;rules.disabled=tempo.disabled=bpmInput.disabled=density.disabled=running||loadingFile;
      start.disabled=Boolean(current.live&&!ctx)||loadingFile||current.id==='teacher' && !finished && !running && state.stage!=='ready' && !started;
      chooseFile.disabled=running||loadingFile;removeFile.disabled=offsetInput.disabled=running||loadingFile;difficulty.disabled=running;song.disabled=ownButton.disabled=running;practice.disabled=running||Boolean(rhythm?.track.custom&&!hasRecording());
      veil.hidden=!(current.live&&!started||started&&!running&&!finished);
      veilTitle.textContent=started?'På pause':'Klar til '+current.title+'?';veilCopy.textContent=started?'Fortsæt, når du er klar.':guide.textContent;veilButton.textContent=started?'Fortsæt':'Start spil';veilButton.disabled=start.disabled;
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
        if(!recorded){recorded=true;if(current.id==='dash'&&state.status==='won')showCourse(state.level);if(!best.hidden&&(current.id!=='dash'||!practiceRun&&state.level.id!==0)){
          const changes={};
          if(state.score>(prefs().bests[recordKey()]||0))changes.bests={...prefs().bests,[recordKey()]:state.score};
          if(current.id==='dash'&&state.status==='won'&&state.coins)changes.dashCoins={...prefs().dashCoins,[dashCoinKey(state.level.id)]:(prefs().dashCoins?.[dashCoinKey(state.level.id)]||0)|state.coins};
          if(Object.keys(changes).length)void save(changes).then(()=>{if(current?.id==='dash'&&state.status==='won')showCourse(state.level);});
        }}
      }else if(current.id==='osu')setText(feedback,audioError||(silent?'Uden lyd':hasRecording()?'Sangfil: '+recording.filename:rhythm.track.artist?(beatChosen?'Øvebeat':'Ingen sangfil valgt'):'Instrumental')+(rhythm.track.bpm?' · '+Math.round(rhythm.track.bpm*Number(tempo.value)/100)+' BPM':'')+' · Serie '+rhythm.combo+' · '+rhythm.hits+'/'+rhythm.track.targets.length+' ramt');
      else if(current.id==='dash')setText(feedback,state.level.title+' · '+(D.rating(state.level)?.name||'Uden vurdering')+' · Forsøg '+Math.max(1,attempt)+' · '+D.forms[state.mode][0]+(practiceRun?' · Øvelse · checkpoint '+(checkpoint?.score||0)+' %':'')+(dashAudioError?' · Uden lyd':''));
      else if(current.id==='lights')setText(feedback,state.board.flat().filter(Boolean).length+' lys tilbage');
      else if(current.id==='breakout')setText(feedback,`♥ ${state.lives} liv · ${state.bricks.length} mursten tilbage${state.launch?' · Send bolden for at fortsætte':''}`);
      else if(current.id==='blocks')setText(feedback,`${state.lines} rækker ryddet · Niveau ${1+Math.floor(state.lines/10)}`);
      else if(current.id==='mines')setText(feedback,`${state.flags.flat().filter(Boolean).length} flag / 10 miner · ${state.score}/71 sikre felter`);
      else if(arcade?.ids.has(current.id))setText(feedback,arcadeUI.status(state));
      else if(localTwo)setText(feedback,'Tur: '+(current.id==='tic'?(state.player===1?'X':'O'):(state.player===1?'Rød':'Gul')));
      else setText(feedback,running?'Spillet er i gang.':started?'Spillet er på pause.':current.live?'Tryk Start spil.':'Vælg dit første træk, eller tryk Start spil.');
      if(ctx)draw();else if(!current.live)drawBoard();else setText(feedback,'Spilbanen kunne ikke tegnes. Prøv en opdateret browser.');
      node.dataset.gameState=finished?state.status:running?'playing':started?'paused':'ready';
    }
    function drawBoard(){
      const signature=JSON.stringify([state.board,state.open,state.flags,state.flipped,state.matched,state.index,state.status,state.winning,state.revision,started]);
      if(signature===lastGrid)return;lastGrid=signature;
      // Preserve keyboard focus by coordinate when a board is redrawn.
      const focused=surface.contains(document.activeElement)?document.activeElement.dataset.cell:null;
      surface.replaceChildren();
      const grid=E('div','lxp-game-grid lxp-game-grid-'+current.id);surface.append(grid);
      const cell=(text,key,label,fn,cls='')=>{const b=B(text,fn,'lxp-game-cell '+cls);b.dataset.cell=key;b.setAttribute('aria-label',label);grid.append(b);return b;};
      if(arcade?.ids.has(current.id))arcadeUI.board(state,grid,E,B,action,started,toggle,teacherPhoto);
      else if(current.id==='lights'){
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
          const profile=C.choiceProfile(state);
          grid.append(E('h2','lxp-choice-profile',profile.title),E('p','lxp-choice-story',profile.body),E('p','',`${state.yes.length} grønne · ${state.no.length} røde`));
          const details=E('details','lxp-choice-details');details.append(E('summary','','Se dine valg'));grid.append(details);
          for(const [label,items]of [['Ja tak',state.yes],['Spring over',state.no]]){if(!items.length)continue;details.append(E('h3','',label));const list=E('ul');for(const [emoji,text]of items)list.append(E('li','',emoji+' '+text));details.append(list);}
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
      if(rhythm&&rhythm.mode!=='standard'){
        const ts=rhythm.time,mode=rhythm.mode,track=rhythm.track,held=new Set(inputs.values());
        const palette=['#88c6ff','#eb91c1','#77dec4','#d9afff'];
        const bindings=activeBindings(),horizon=mode==='taiko'?1.5:1.12;
        if(mode==='mania'){
          for(let lane=0;lane<4;lane++){
            const x=lane*160;
            rect(x+2,35,156,270,held.has(lane)?p.border:p.surface);
            rect(x+2,279,156,4,palette[lane]);text(keyName(bindings['lane'+lane]),x+73,320,16,p.ink);
          }
        }else if(mode==='taiko'){
          rect(0,103,w,92,p.surface);rect(0,147,w,2,p.border);
          circle(100,148,29,p.ink);circle(100,148,25,p.bg);
          for(let zone=0;zone<2;zone++){
            const ink=zone?'#67bdf3':'#ff827d',pressed=zone?(held.has(2)||held.has(3)):(held.has(0)||held.has(1));
            rect(zone*320+5,243,310,64,pressed?p.border:p.surface);
            circle(zone*320+36,275,14,ink);circle(zone*320+36,275,zone?9:4,p.surface);
            text((zone?'Kant':'Midte')+'   '+keyName(bindings['lane'+(zone*2)])+' / '+keyName(bindings['lane'+(zone*2+1)]),zone*320+62,282,17,p.ink);
          }
        }else{
          rect(0,280,w,2,p.border);
          rect(rhythm.basket-28,280,56,6,'#f2ce70');rect(rhythm.basket-23,286,46,9,'#bd8948');
          text(keyName(bindings.lane0)+' / '+keyName(bindings.lane1)+'   ·   Sprint '+keyName(bindings.lane2),20,327,14,p.muted);
        }
        if(mode==='taiko'&&rhythm.roll){
          rect(100,140,Math.max(0,(rhythm.roll.rollEnd-ts)*320),16,'#f8c75e');
        }
        for(let i=rhythm.index;i<track.targets.length;i++){
          const note=track.targets[i],left=note.time-ts;if(left>horizon)break;
          if(rhythm.judged.has(i))continue;
          if(mode==='mania'){
            const x=note.lane*160+8,y=Math.min(281,281-left*218),ink=palette[note.lane];
            if(note.end){const topY=281-(note.end-ts)*218;rect(x+47,topY,50,Math.max(0,y-topY),ink);}
            rect(x,y-5,144,10,ink);rect(x+4,y-4,136,2,'#fff');
          }else if(mode==='taiko'){
            const x=100+left*320,ink=note.rollEnd?'#f8c75e':note.lane?'#67bdf3':'#ff827d';
            if(note.rollEnd)rect(x,140,(note.rollEnd-note.time)*320,16,ink);
            circle(x,148,18,p.ink);circle(x,148,15,ink);circle(x,148,note.lane?9:3,p.surface);
          }else{
            const y=274-left*216;circle(note.x,y,10,palette[i%4]);rect(note.x+2,y-13,5,4,'#86d690');
          }
        }
        rect(0,h-4,w*Math.min(1,ts/(track.end||1)),4,p.accent);
        text(rhythm.verdict||R.rulesets[mode].name,14,25,15,p.ink);
      }else if(current.id==='osu'){
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
        const chapter=level.chapters?.findLast(part=>part.x<=x) || level.chapters?.[0];
        const sectionIndex=chapter?level.chapters.indexOf(chapter):0;
        const pulse=1-(x%100)/100;
        const skies=['#163f78','#423166','#165b63','#3c367d','#5c335f','#204f87'];
        const sky=chapter?skies[(sectionIndex+level.id-1)%skies.length]:level.sky||'#142144';
        const glow=level.color;
        const polygon=(points,fill,edge)=>{
          ctx.beginPath();ctx.moveTo(...points[0]);for(const vertex of points.slice(1))ctx.lineTo(...vertex);
          ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(edge){ctx.strokeStyle=edge;ctx.lineWidth=2;ctx.stroke();}
        };
        function drawPortal(kind,px,height){
          const tint=({ship:'#60befb',wave:'#51f3db',spider:'#cf97fd',ufo:'#f6c35d',ball:'#ff8575',robot:'#e4edfa',cube:'#73e9ab',swing:'#f8a6d6',invert:'#ffd45a',upright:'#65caff'})[kind]||'#ffd178';
          const cy=ground-(height??(kind==='ship'||kind==='invert'?65:kind==='upright'?194:110)),phase=x*.004;
          if(level.demon!=null){demonArt.portal(ctx,px,cy,phase,tint,kind);return;}
          ctx.globalAlpha=.16;ctx.beginPath();ctx.ellipse(px,cy,23,70,0,0,2*Math.PI);ctx.fillStyle=tint;ctx.fill();ctx.globalAlpha=1;
          // Segmented halo and a narrow bright rim stay legible on patterned terrain.
          for(let k=0;k<8;k++){
            const a=k*Math.PI/4+phase,ex=px+16*Math.cos(a),ey=cy+64*Math.sin(a);
            rect(ex-2,ey-2,4,4,tint);
          }
          for(const [rx,ry,edge,weight] of [[16,63,'#10162b',6],[16,63,tint,3],[10,55,'#f0fcff',1]]){
            ctx.beginPath();ctx.ellipse(px,cy,rx,ry,0,0,2*Math.PI);ctx.strokeStyle=edge;ctx.lineWidth=weight;ctx.stroke();
          }
          if(kind==='invert'||kind==='upright'){
            const sign=kind==='invert'?-1:1;
            polygon([[px-6,cy+4*sign],[px,cy-3*sign],[px+6,cy+4*sign],[px,cy+10*sign]],tint);
          }
        }
        const theme=level.demon!=null?demonArt.palettes[level.demon]:null;
        if(theme){
          demonArt.background(ctx,level,x,w,ground,sectionIndex);
        }else{
          rect(0,0,w,h,sky);
          if(chapter && sectionIndex && x-chapter.x<100){
            ctx.globalAlpha=1-(x-chapter.x)/100;rect(0,0,w,h,skies[(sectionIndex+level.id-2)%skies.length]);ctx.globalAlpha=1;
          }
          if(chapter){
            for(let band=0;band<5;band++){
              ctx.globalAlpha=.04+band*.024;rect(0,ground*band/5,w,ground/5+1,'#06102c');
            }
            ctx.globalAlpha=.10+pulse*.05;
            for(let k=-1;k<12;k++){
              const px=k*72-x*.12%72,py=45+((k+12)*53)%135;
              polygon([[px,py],[px+26,py-26],[px+52,py],[px+26,py+26]],glow);
            }
            ctx.globalAlpha=1;
          }
          if(level.knots||level.modes){
            const orbit=(level.worldIndex%3===0?67:43);
            circle(494-(x*.016)%120,81,orbit,glow);
            circle(505-(x*.016)%120,71,orbit-4,level.sky);
            for(let i=0;i<35;i++){
              const px=((i*137-x*.08)%680+680)%680,py=28+(i*83)%185;
              rect(px,py,i%5===0?3:1.5,i%5===0?3:1.5,'#c6e4ff');
            }
          }
          ctx.globalAlpha=.1+.07*(1-(x%100)/100);
          for(let col=-(x*.26%50);col<w;col+=50)rect(col,0,1,ground,glow);
          for(let row=38;row<ground;row+=50)rect(0,row,w,1,glow);
          ctx.globalAlpha=1;
          const scenery=(level.worldIndex??level.id)%4;
          for(let k=-1;k<12;k++){
            const worldColumn=Math.floor(x*.23/72)+k,px=k*72-(x*.23%72);
            const rise=37+(Math.abs(worldColumn*37)%93);
            if(scenery===0||scenery===3){
              rect(px,ground-rise,52,rise,'#16243b');
              if(scenery===0){
                for(let r=8;r<rise;r+=14)for(let col=8;col<48;col+=13)if((col+r+k)%3)rect(px+col,ground-rise+r,4,5,'#466780');
              }else{
                rect(px+8,ground-rise-12,7,13,'#284461');rect(px+30,ground-rise-22,8,22,'#284461');
              }
            }else if(scenery===1){
              polygon([[px,ground],[px+20,ground-rise],[px+37,ground-rise-13],[px+48,ground]],'#24304d');
              polygon([[px+20,ground-rise],[px+37,ground-rise-13],[px+25,ground-4]],'#354566');
            }else{
              circle(px,ground-rise,12,'#254058');rect(px-2,ground-rise,4,rise,'#254058');
            }
          }
          for(let k=-1;k<7;k++){
            const base=k*150-(x*.14%150);
            polygon([[base,ground],[base+80,ground-98],[base+150,ground]],'#1d2946');
            polygon([[base+80,ground-98],[base+112,ground-16],[base+150,ground]],'#17213a');
          }
        }
        rect(0,ground,w,h-ground,theme?.near||'#142037');
        for(let px=-(offset%32);px<w;px+=32){
          const y=ground+9;
          polygon([[px+1,y],[px+31,y],[px+31,y+27]],theme?.far||'#283b58');
          rect(px+1,y+29,30,2,'#0c1226');
        }
        rect(0,ground,w,4,glow);rect(0,ground,w,1,'#efffff');
        for(const [i,part] of (level.chapters||[]).entries()){
          if(!part.flip)continue;
          const ax=part.x-offset,bx=(level.chapters[i+1]?.x||level.length)-offset;
          if(ax>w||bx<0)continue;
          rect(ax,0,bx-ax,ground-257,'#162439');rect(ax,ground-258,bx-ax,2,glow);
        }
        for(let k=-(offset%36);k<w;k+=36)rect(k,ground+8,2,h-ground-8,'#2b4258');
        for(const o of level.objects){
          const left=o.x-offset;
          if(left+o.width< -22||left>w+22)continue;
          const ow=o.width,top=ground-o.height;
          const flipped=o.inverted&&['block','spike','gap','pad','orb','saw','ledge','spikebed','fang'].includes(o.kind);
          if(flipped){ctx.save();ctx.translate(0,ground*2-257);ctx.scale(1,-1);}
          switch(o.kind){
            case 'ledge':demonArt.girder(ctx,left,top,ow,o.thickness,theme);break;
            case 'fang':demonArt.hangingTooth(ctx,left,ground,o,theme);break;
            case 'spikebed':demonArt.spikeBed(ctx,left,ground,o,w,theme);break;
            case 'gap':rect(left,ground,ow,h-ground,'#0a1022');break;
            case 'spike':{
              const base=ground-(o.base||0),tip=base-o.height;
              if(theme){demonArt.tooth(ctx,left,base,ow,o.height,-1,theme);break;}
              polygon([[left,base],[left+ow/2,tip],[left+ow,base]],'#10162c','#edf8ff');
              polygon([[left+ow*.5,tip+7],[left+ow*.79,base-3],[left+ow*.52,base-3]],glow);break;
            }
            case 'block':{
              if(theme){demonArt.girder(ctx,left,top,ow,o.height,theme);break;}
              rect(left,top,ow,o.height,'#0e182e');
              for(let col=0;col<ow;col+=30)for(let row=0;row<o.height;row+=30){
                const px=left+col,py=top+row,bw=Math.min(30,ow-col),bh=Math.min(30,o.height-row);
                if(bw<4||bh<4)continue;
                rect(px+2,py+2,bw-3,bh-3,theme?.far||'#2c435d');
                polygon([[px+3,py+3],[px+bw-2,py+3],[px+3,py+bh-2]],theme?.light||'#38556c');
              }
              rect(left,top,ow,3,'#e6f9ff');rect(left+1,top+3,ow-2,2,glow);
              rect(left,top+3,2,o.height-3,glow);break;
            }
            case 'pad':
              polygon([[left-2,ground],[left+4,ground-8],[left+ow-3,ground-8],[left+ow+2,ground]],'#ffca4e','#fff5b4');break;
            case 'orb':
              ctx.beginPath();ctx.arc(left+13,top,17+pulse*5,0,Math.PI*2);ctx.strokeStyle='#ffe997';ctx.lineWidth=1;ctx.stroke();
              circle(left+13,top,15,'#ffc14d');circle(left+13,top,10,'#614b38');circle(left+13,top,5,'#ffeeb0');break;
            case 'saw':demonArt.saw(ctx,left+ow/2,top,ow/2,x,glow);break;
            case 'passage':demonArt.passage(ctx,o,left,ground,theme);break;
            case 'railSpike':{
              if(o.depth){demonArt.rail(ctx,left,ground,o,theme);break;}
              const base=o.height?ground-257:ground,dy=o.height?32:-32;
              for(let i=0;i<3;i++)polygon([[left+i*ow/3,base],[left+(i+.5)*ow/3,base+dy],[left+(i+1)*ow/3,base]],'#ff6899','#ffd8e8');
              break;
            }
            case 'cube':case 'ship':case 'wave':case 'ball':case 'ufo':case 'robot':case 'spider':case 'swing':
            case 'invert':case 'upright':case 'mini':case 'fast':case 'dual':case 'normal':
              drawPortal(o.kind,left,o.portalY);break;
            case 'gate':
              if(o.bevel){demonArt.gate(ctx,o,left,ground,level);break;}
              rect(left,0,ow,top-(o.opening||91),'#304664');rect(left,top,ow,o.height,'#304664');
              for(let k=5;k<ow-2;k+=20){
                rect(left+k,top+5,2,Math.max(3,o.height-8),'#20354f');
                rect(left+k,2,2,Math.max(1,top-(o.opening||91)-6),'#20354f');
              }
              rect(left,top-(o.opening||91)-3,ow,3,glow);rect(left,top,ow,3,glow);break;
          }
          if(flipped)ctx.restore();
        }
        if(level.knots){
          // Draw the same tunnel boundaries that are used for collisions.
          for(let i=1;i<level.knots.length;i++){
            const a=level.knots[i-1],b=level.knots[i],ax=a.x-offset,bx=b.x-offset;
            if(bx<0)continue;if(ax>w)break;
            for(const sign of [-1,1]){
              const ay=ground-a.y+sign*a.r,by=ground-b.y+sign*b.r,edge=sign>0?h:0;
              polygon([[ax,edge],[bx,edge],[bx,by],[ax,ay]],theme?.near||level.sky);
              if(theme){
                const span=bx-ax,bands=Math.max(1,Math.ceil(span/30));
                for(let j=0;j<bands;j++){
                  const t=j/bands,tx=ax+span*t,ty=ay+(by-ay)*t;
                  polygon([[tx,ty+sign*18],[tx+span/bands*.55,ty+sign*36],[tx+2,ty+sign*48]],theme.far);
                }
              }
              polygon([[ax,ay],[bx,by],[bx,by+sign*6],[ax,ay+sign*6]],glow);
              const mx=(ax+bx)/2,my=(ay+by)/2;
              ctx.globalAlpha=.20;
              polygon([[ax,ay+sign*15],[mx,my+sign*(26+i%3*8)],[bx,by+sign*15]],glow);
              ctx.globalAlpha=1;
              polygon([[ax,ay+sign*10],[bx,by+sign*10],[bx,by+sign*12],[ax,ay+sign*12]],'#6385a0');
            }
          }
        }
        if(state.mode==='wave'&&state.trail.length>1){
            ctx.beginPath();state.trail.forEach((pt,i)=>{
              const tx=pt.x-offset,ty=ground-pt.y-11;if(i)ctx.lineTo(tx,ty);else ctx.moveTo(tx,ty);
            });ctx.lineWidth=5;ctx.strokeStyle=glow;ctx.stroke();
            ctx.lineWidth=1.5;ctx.strokeStyle='#fff';ctx.stroke();
        }
        const finish=level.length-offset;
        if(finish<w){
          if(theme){
            demonArt.portal(ctx,finish,ground-84,x*.004,'#afff90','finish');
          }else for(let k=0;k<12;k++)for(let j=0;j<2;j++)rect(finish+j*7,ground-7*(k+1),7,7,(j+k)%2?'#16233d':'#f0f7ff');
        }
        if(state.mode==='ship'){rect(0,0,w,ground-257,'#1d2946');rect(0,ground-257,w,2,glow);}
        const ink=prefs().dashInk,body=ink&&ink!=='auto'?ink:theme?['#77ffcb','#ffe99d','#72efff','#8efbd0','#68f6e5'][level.demon]:glow;
        if(theme&&state.mode!=='wave'){
          for(let i=0;i<state.trail.length-1;i++){
            const point=state.trail[i],fraction=i/state.trail.length,size=1+fraction*3;
            ctx.globalAlpha=fraction*.65;
            rect(point.x-offset-3,ground-point.y-9+Math.sin(i*2)*2,size,size,body);
          }
          ctx.globalAlpha=1;
        }
        state.coinSites.forEach((coin,i)=>{
          const px=coin.x-offset,py=ground-coin.y;
          if(px<0||px>w||state.coins&(1<<i))return;
          circle(px,py,10,'#805119');circle(px,py,8,'#ffdc72');
          polygon([[px,py-6],[px+4,py],[px,py+6],[px-4,py]],'#ad7425');
        });
        if(['ball','spider','ufo','swing'].includes(state.mode))rect(0,ground-257,w,3,glow);
        const cy=ground-y-11;
        if(state.effect==='dual'){
          ctx.save();ctx.translate(runner,ground-(235-y)-11);ctx.rotate(-state.rotation);
          polygon([[15,0],[-10,-9],[-5,0],[-10,9]],'#ff8dbe','#fff');ctx.restore();
        }
        ctx.save();ctx.translate(runner,cy);ctx.rotate(state.rotation);if(state.effect==='mini')ctx.scale(.56,.56);
        if(state.mode==='cube'){
          rect(-12,-12,24,24,'#e9fcff');rect(-10,-10,20,20,body);
          if(theme){
            polygon([[-9,8],[-9,-8],[8,-8],[3,-3],[-4,-3]],'#f3ffff');
            polygon([[9,-7],[9,9],[-8,9],[-4,5],[5,5]],'#106283');
          }
          rect(-7,-5,4,4,'#17243a');rect(3,-5,4,4,'#17243a');rect(-4,4,9,3,'#17243a');
        }else if(state.mode==='wave'){
          polygon([[15,0],[-10,-9],[-5,0],[-10,9]],body,'#fff');
        }else if(state.mode==='ball'){
          const teeth=Array.from({length:24},(_,i)=>{const r=i%2?10:14;return [r*Math.cos(i*Math.PI/12),r*Math.sin(i*Math.PI/12)];});
          polygon(teeth,body,'#fff');circle(0,0,6,'#20263d');circle(0,0,3,body);
        }else if(state.mode==='spider'||state.mode==='robot'){
          for(const dx of [-9,4])polygon([[dx,-1],[dx+6,0],[dx+9,11],[dx+4,11]],body,'#fff');
          rect(-10,-10,21,13,body);rect(1,-7,9,4,'#152038');
          if(state.mode==='spider')polygon([[-9,-5],[-19,3],[-17,10]],body,'#fff');
        }else if(state.mode==='ufo'||state.mode==='swing'){
          circle(0,-2,10,body);circle(2,-4,6,'#20344a');
          if(state.mode==='ufo')polygon([[-16,0],[16,0],[8,8],[-8,8]],body,'#fff');
          else for(const dx of [-1,1])polygon([[dx*7,-4],[dx*17,-8],[dx*11,6]],body,'#fff');
        }else{
          const exhaust=16+Math.sin(x*.15)*3+(state.vy>0?7:0);
          polygon([[-11,-4],[-13-exhaust,1],[-11,5]],'#ff9544');
          polygon([[-11,-2],[-15-exhaust*.52,1],[-11,3]],'#ffefa0');
          polygon([[-13,-4],[-16,-12],[-8,-10],[-3,-3]],body,'#17243a');
          rect(-5,-11,11,10,'#ecfaff');rect(-3,-9,7,7,body);
          rect(0,-7,3,3,'#13223a');
          polygon([[-15,-2],[-5,-4],[6,-4],[17,0],[10,7],[-8,7],[-15,3]],body,'#efffff');
          polygon([[-10,2],[6,1],[0,6],[-8,6]],'#283d54');
        }
        ctx.restore();rect(20,18,145,4,'#30435d');rect(20,18,145*x/level.length,4,glow);
        text(state.score+' %',177,25,12,'#efffff');
        for(let i=0;i<3;i++){circle(239+i*15,20,5,state.coins&(1<<i)?'#ffdc72':'#4b566a');}
        if(practiceRun)text('ØVELSE · '+(checkpoint?.score||0)+' %',287,25,11,'#99ffcc');
        if(level.modes){
          text(state.effect==='normal'?D.forms[state.mode][0].toUpperCase():D.modifiers[state.effect].toUpperCase(),500,25,13,'#eafaff');

        }
        if(level.wave){
          text('WAVE '+String(level.wave).padStart(2,'0'),512,25,13,'#efffff');

        }
      }else if(current.id==='flap'){
        rect(0,0,w,h,'#18374f');
        for(let i=0;i<9;i++){
          const x=(i*103+800-state.time*14%800)%800-65,y=32+(i*47)%108;
          circle(x,y,14,'#396177');circle(x+14,y+4,11,'#396177');
        }
        for(let i=0;i<10;i++)circle((i*97+850-state.time*30%850)%850-100,363+i%3*14,66,'#255457');
        for(const g of state.gates){
          const top=g.mid-g.gap/2,bottom=g.mid+g.gap/2;
          rect(g.x,0,47,top,'#39867a');rect(g.x,bottom,47,h-bottom,'#39867a');
          rect(g.x,top-8,47,8,'#85e7b9');rect(g.x,bottom,47,8,'#85e7b9');
        }
        const y=state.birdY;circle(100,y,11,'#ffcb62');circle(94,y+(state.vy<0?-3:3),6,'#e28c44');circle(105,y-3,3,'#192838');rect(109,y,5,3,'#ff995a');
        rect(0,349,w,11,'#396e63');
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
      if(current.id==='dash'&&state.status==='lost'){
        for(let i=0;i<15;i++){
          const a=i*2.39996,r=16+((i*11)%28);
          rect(104+Math.cos(a)*r,277-state.y+Math.sin(a)*r,4+i%3,4+i%3,state.level.color);
        }
      }
      if(state.status!=='playing'){ctx.globalAlpha=0.85;rect(0,h/2-40,w,80,p.bg);ctx.globalAlpha=1;text(current.id==='osu'?'Bane færdig!':state.status==='won'?'Du vandt!':'Spillet er slut',w/2-80,h/2+8,23);}
    }
    node.addEventListener('keydown',event=>{
      if(!visible||play.hidden||!state)return;
      if(event.ctrlKey||event.metaKey||event.altKey)return;
      if(event.target.closest('select,input,textarea')){
        if(event.key==='Escape'&&running&&event.target.closest('.lxp-quiz-form')){event.preventDefault();pause();}
        return;
      }
      if(rhythm){
        if(bindPanel.contains(event.target))return;
        const key=A.osuKey(event.key),bindings=activeBindings();
        if(event.target.closest('button')&&(key==='Space'||key==='Enter'))return;
        if(event.key==='Escape'||key===bindings.pause){
          event.preventDefault();if(!event.repeat && started && state.status==='playing'){if(running)pause();else toggle();}return;
        }
        if(key===bindings.retry && !event.repeat && started){event.preventDefault();openGame('osu',true);toggle();return;}
        if(running&&rhythm.mode!=='standard'){
          const id=Object.keys(bindings).find(k=>k.startsWith('lane')&&bindings[k]===key);
          if(id){event.preventDefault();if(!event.repeat)pressMode('key-'+(event.code||key),Number(id.slice(4)));}
          return;
        }
        if(running && (key===bindings.first||key===bindings.second)){
          event.preventDefault();if(!event.repeat && aim){keys.add('hit-'+(event.code||key));rhythmHit(aim);}
        }
        return;
      }
      if(event.key==='Escape'||event.key.toLowerCase()==='p'){event.preventDefault();if(running)pause();return;}
      if(event.target.closest('button')&&(event.key===' '||event.key==='Enter'))return;
      if(current.id==='dash'){
        if(courseMenu.contains(event.target))return;
        if(event.key.toLowerCase()==='c'&&practiceRun&&running&&!event.repeat){event.preventDefault();checkpoint=D.checkpoint(state);render();return;}
        const horizontal=direction[event.key];
        if(state.level.platform&&(horizontal==='left'||horizontal==='right')){
          event.preventDefault();if(running)keys.add(horizontal);return;
        }
        if([' ','ArrowUp','w','W'].includes(event.key)){
          event.preventDefault();if(event.repeat)return;
          if(!running){if(started)return;toggle();}
          keys.add('dash-'+event.key);keys.add('jump');C.act(state,'jump');
        }
        return;
      }
      const dir=direction[event.key];let type=dir;
      if(event.key===' ')type={dino:'jump',flap:'jump',blocks:'drop',breakout:'launch'}[current?.id];
      if(!type||!current)return;
      if(arcade?.ids.has(current.id)&&!['maze','crates','flap'].includes(current.id))return;
      event.preventDefault();if(!running&&!started)toggle();if(!running)return;
      if(['pong','breakout'].includes(current.id)&&dir)keys.add(dir);else if(!event.repeat||['left','right','down'].includes(type))action(type);
    });
    node.addEventListener('keyup',event=>{if(direction[event.key])keys.delete(direction[event.key]);});
    window.addEventListener('keyup',event=>{releaseMode('key-'+(event.code||A.osuKey(event.key)));keys.delete('hit-'+(event.code||A.osuKey(event.key)));if(current?.id==='dash'){keys.delete('dash-'+event.key);if(!Array.from(keys).some(key=>key.startsWith('dash-')||key==='touch-jump'))keys.delete('jump');}if(direction[event.key])keys.delete(direction[event.key]);});
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
      if(current?.id==='osu'&&event.target===canvas&&canvas){if(rhythm.mode==='standard'||rhythm.mode==='catch')aim=position(event);return;}
      if(!canvas||!running||!['pong','breakout'].includes(current.id))return;
      const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
      const scale=Math.min(r.width/640,r.height/360),left=r.left+(r.width-640*scale)/2,top=r.top+(r.height-360*scale)/2;
      C.act(state,'pointer',current.id==='pong'?(event.clientY-top)/scale:(event.clientX-left)/scale);
    });
    arena.addEventListener('pointerdown',event=>{if(event.target!==canvas)return;arena.focus({preventScroll:true});if(current.id==='dash'&&event.button===0){
        if(!running){if(started)return;toggle();}event.preventDefault();canvas.setPointerCapture?.(event.pointerId);keys.add('dash-pointer-'+event.pointerId);keys.add('jump');C.act(state,'jump');
      }else if(rhythm&&rhythm.mode!=='standard'&&running){
        if(event.button!==0)return;
        event.preventDefault();canvas.setPointerCapture?.(event.pointerId);
        const point=position(event);
        if(rhythm.mode==='catch')aim=point;
        else pressMode('pad-'+event.pointerId,rhythm.mode==='mania'?Math.min(3,Math.max(0,Math.floor(point.x/160))):point.x<320?0:2);
      }else if(current.id==='osu'&&event.pointerType!=='mouse'&&event.button===0&&running){event.preventDefault();keys.add('pointer-'+event.pointerId);canvas.setPointerCapture?.(event.pointerId);aim=position(event);rhythmHit(aim);}else if(['dino','flap'].includes(current.id))action('jump');else if(current.id==='breakout')action('launch');});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])
      window.addEventListener(type,event=>{releaseMode('pad-'+event.pointerId);keys.delete('pointer-'+event.pointerId);if(current?.id==='dash'){keys.delete('dash-pointer-'+event.pointerId);if(!Array.from(keys).some(key=>key.startsWith('dash-')||key==='touch-jump'))keys.delete('jump');}});
    arena.addEventListener('mousedown',event=>{
      if(rhythm?.mode!=='standard'||!running||event.target!==canvas||![0,2].includes(event.button)||prefs().mouseHits===false)return;
      if(event.sourceCapabilities?.firesTouchEvents)return;
      event.preventDefault();keys.add('mouse-'+event.button);aim=position(event);rhythmHit(aim);
    });
    window.addEventListener('mouseup',event=>keys.delete('mouse-'+event.button));
    arena.addEventListener('contextmenu',event=>{if(rhythm&&running&&prefs().mouseHits!==false)event.preventDefault();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){stopPreview();pause();}});
    window.addEventListener('blur',()=>{clearRetry();if(running)pause();});window.addEventListener('pagehide',()=>{
      if(current?.id==='teacher')leaveTeacher();else stop();
    });
    window.addEventListener('pageshow',event=>{
      if(event.persisted && visible && !current && location.hash==='#lxp-games/teacher')update(true);
    });
    function leaveTeacher(){
      clearTeachers();stop();surface.replaceChildren();feedback.textContent='';score.textContent='';
      state=null;current=null;started=false;
    }
    function update(open){
      visible=open;node.hidden=!open;
      if(current?.id==='teacher' && (!open || location.hash!=='#lxp-games/teacher' || Boolean(getPreferences().hideProfilePhoto)!==teacherPrivacy))leaveTeacher();
      if(!open){clearRetry();stopPreview();if(running)pause();return;}
      const id=location.hash.split('/')[1],game=C.catalog.find(g=>g.id===id);
      lobby.hidden=Boolean(game);play.hidden=!game;
      if(game){openGame(game.id);render();}else{clearRetry();stopPreview();if(running)pause();showCards();}
    }
    return {node,update,entries:C.catalog.map(g=>({href:'#lxp-games/'+g.id,key:'games',label:g.title,icon:'game',context:'Spil'}))};
  };
})();
