const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),ext=root+'/extension/';let checks=0,draws=0;
const {run:runPython}=require('./helpers/workbench-vm.cjs');
const ok=(v,label)=>{assert.ok(v,label);checks++;},wait=()=>new Promise(resolve=>setTimeout(resolve,75));
(async()=>{
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/CSS stylesheet/.test(e.message))errors.push(e);});
  const dom=new JSDOM(fs.readFileSync(root+'/preview/index.html','utf8'),{url:'https://example.test/preview/index.html#lxp-games',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window,d=w.document;
  w.structuredClone=structuredClone;w.matchMedia=q=>({matches:q.includes('dark'),addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  w.Range.prototype.getBoundingClientRect=()=>({left:0,top:0,right:0,bottom:0,width:0,height:0});w.Range.prototype.getClientRects=()=>[];
  w.AudioContext=class {
    get currentTime(){return 0;}
    createGain(){return {gain:{},connect(){}};}
    resume(){return Promise.resolve();}
    close(){return Promise.resolve();}
  };
  w.HTMLCanvasElement.prototype.getContext=function(){return this.classList.contains('lxp-game-canvas')?{setTransform(){},clearRect(){},fillRect(){draws++;},beginPath(){},closePath(){},lineTo(){},ellipse(){},save(){},translate(){},scale(){},rotate(){},restore(){},moveTo(){},quadraticCurveTo(){},arc(){},stroke(){},fill(){},fillText(){}}:null;};
  for(const s of d.querySelectorAll('script[src]'))w.eval(fs.readFileSync(ext+s.getAttribute('src').replace('../extension/',''),'utf8'));
  await wait();const games=d.querySelector('.lxp-games'),arena=()=>games.querySelector('.lxp-game-arena'),toolbar=()=>games.querySelector('.lxp-game-toolbar');
  const route=async id=>{w.location.hash=id;await wait();};
  const click=(scope,label)=>{const b=[...scope.querySelectorAll('button')].find(b=>b.textContent===label||b.getAttribute('aria-label')===label);ok(b&&!b.disabled,'click '+label);b.click();return b;};
  ok(!games.hidden&&games.querySelectorAll('.lxp-game-card').length===30,'lobby contains 30 games');
  ok(d.querySelector('.lxp-nav a[href="#lxp-games"]')?.getAttribute('aria-current')==='page','sidebar game tab active');
  click(games.querySelector('.lxp-games-filters'),'For to');ok(games.querySelectorAll('.lxp-game-card').length===3,'category filter');click(games.querySelector('.lxp-games-filters'),'Alle');
  for(const game of w.lectioPlusGamesCore.catalog){
    await route('#lxp-games/'+game.id);ok(!games.querySelector('.lxp-game-play').hidden,'route '+game.id);ok(games.querySelector('.lxp-game-top h1').textContent===game.title,'title '+game.id);
    ok(games.querySelector('.lxp-game-guide').textContent.includes(game.id==='dash'?'Terning':game.controls),'guide '+game.id);
    if(game.id==='teacher'){ok(toolbar().querySelector('button').disabled && !arena().querySelector('img'),'preview requires school roster');continue;}
    if(game.id==='osu')ok([...toolbar().querySelectorAll('button')].some(b=>b.textContent==='Vælg sangfil'),'pop start requests the actual song');
    click(toolbar(),game.id==='osu'?'Spil med øvebeat':'Start spil');await wait();ok(games.dataset.gameState==='playing','start '+game.id);
    click(toolbar(),'Pause');const stopped=draws;await wait();ok(games.dataset.gameState==='paused'&&draws===stopped,'pause stops rendering '+game.id);
    click(toolbar(),'Fortsæt');click(toolbar(),'Start forfra');ok(games.dataset.gameState==='ready','restart '+game.id);
    ok(!games.querySelector('img[src],iframe'),'no remote profiles or embeds '+game.id);
  }
  await route('#lxp-games/dash');
  const menu=games.querySelector('.lxp-dash-menu'),picker=menu.querySelector('select');
  const rank=()=>menu.querySelector('.lxp-dash-rating').textContent;
  const tiles=()=>Array.from(menu.querySelectorAll('.lxp-dash-tiles button'));
  const pick=value=>{picker.value=value;picker.dispatchEvent(new w.Event('change'));};
  ok(rank()==='Easy · ★ 2' && tiles().length===15,'classic level ratings');
  for(const [i,g] of w.lectioPlusDash.grades.entries()){
    pick('grade-'+i);
    const matches=w.lectioPlusDash.levels.filter(l=>w.lectioPlusDash.rating(l).name===g.name);
    ok(tiles().length===matches.length && tiles().every(b=>b.title.includes(' · '+g.name+' · ')),'all matching levels '+g.name);
    tiles().at(-1).click();
    if(matches.length>1){
      click(menu,'Næste bane');ok(tiles()[0].getAttribute('aria-pressed')==='true','wrap within '+g.name);
    }else ok(menu.querySelector('[aria-label="Næste bane"]').disabled,'single level '+g.name);
  }
  pick('124');ok(rank()==='Easy · ☾ 2','platformers display moons');pick('0');
  ok(rank()==='Uden vurdering' && !tiles()[0].textContent.includes('★'),'workshop unrated');
  // Drive a finish through the normal UI to check the saved first-clear totals.
  const gameStep=w.lectioPlusGamesCore.step;
  w.lectioPlusGamesCore.step=(s,...args)=>s.id==='dash'?Object.assign(s,{status:'won',score:100}):gameStep(s,...args);
  const bank=()=>menu.querySelector('.lxp-dash-earned').getAttribute('aria-label');
  async function waitForFinish(){
    for(let i=0;i<50&&games.dataset.gameState!=='won';i++)await wait();
    assert.equal(games.dataset.gameState,'won');
  }
  pick('124');click(menu,'Øv med checkpoints');await waitForFinish();
  ok(bank().includes('0 stjerner og 0 måner'),'practice awards no moons');
  for(let i=0;i<2;i++){
    pick('124');menu.querySelector('.lxp-dash-launch').click();await waitForFinish();
    ok(bank().includes('0 stjerner og 2 måner'),'platformer first-clear counted once');
  }
  pick('grade-9');menu.querySelector('.lxp-dash-launch').click();await waitForFinish();
  ok(bank().includes('10 stjerner og 2 måner'),'demon stars and platformer moons tracked separately');
  w.lectioPlusGamesCore.step=gameStep;
  ok(menu.querySelector('.lxp-dash-selection p').textContent.includes('Terning › Wave › Skib › Robot › Edderkop › Kugle › Terning'),'course lists actual forms');
  const withRecords=w.lectioPlusAppearance.normalize({games:{bests:{'dash2:134':100,'dash2:124':100,'dash2:135':100,'dash3:134':70,'dash3:129':90,'dash4:134':81,'dash4:129':17},dashCoins:{'v2-134':5,'v2-135':7,'v3-134':3,'v3-129':7,'v4-134':6,'v4-129':3}}}).games;
  ok(withRecords.bests['dash4:134']===81 && !withRecords.bests['dash4:129'] && withRecords.dashCoins['v4-134']===6 && !withRecords.dashCoins['v4-129'],'precision course records survive normalization');
  ok(withRecords.bests['dash3:134']===70 && !withRecords.bests['dash3:129'] && withRecords.dashCoins['v3-134']===3 && !withRecords.dashCoins['v3-129'],'revised levels have separate records');
  ok(withRecords.bests['dash2:134']===100 && !withRecords.bests['dash2:135'] && withRecords.dashCoins['v2-134']===5 && !withRecords.dashCoins['v2-135'],'previous demon records remain stored');
  await route('#lxp-games/osu');
  const binds=games.querySelector('.lxp-game-bindings'),first=binds.querySelector('button');
  const press=(el,key,type='keydown')=>el.dispatchEvent(new w.KeyboardEvent(type,{key,bubbles:true,cancelable:true}));
  first.click();press(first,'x');ok(binds.textContent.includes('allerede'),'duplicate bind rejected');
  press(first,'f');await wait();ok(first.textContent==='F','bind updates on screen');
  ok(JSON.parse(w.localStorage.getItem('lectioPlusPreview')).games.bindings.first==='f','bind survives persistence');
  first.click();press(first,'Escape');ok(first.textContent==='F','cancel keeps binding');
  click(toolbar(),'Spil med øvebeat');
  const canvas=arena().querySelector('canvas'),oldHit=w.lectioPlusRhythm.hit;
  let strikes=0;w.lectioPlusRhythm.hit=()=>strikes++;
  canvas.dispatchEvent(new w.MouseEvent('pointermove',{clientX:100,clientY:100,bubbles:true}));
  press(arena(),'z');press(arena(),'f');ok(strikes===1,'custom strike replaces old key');press(arena(),'f','keyup');
  press(arena(),'p');ok(games.dataset.gameState==='paused','osu pause key');
  press(arena(),'p');ok(games.dataset.gameState==='playing','osu resume key');
  w.lectioPlusRhythm.hit=oldHit;press(arena(),'Escape');
  click(binds,'Gendan standardtaster');await wait();ok(first.textContent==='Z','defaults restored');
  const selector=toolbar().querySelector('[aria-label="osu! spilform"]');
  for(const mode of ['taiko','mania','catch']){
    selector.value=mode;selector.dispatchEvent(new w.Event('change'));await wait();
    ok(JSON.parse(w.localStorage.getItem('lectioPlusPreview')).games.ruleset===mode,'saved mode '+mode);
    click(toolbar(),'Spil med øvebeat');await wait();
    ok(games.dataset.gameState==='playing'&&selector.disabled,'running '+mode);
    const capture=mode==='catch'?'modeTick':'modePress',original=w.lectioPlusRhythm[capture];
    let events=0;w.lectioPlusRhythm[capture]=(...args)=>{events++;return original(...args);};
    const key=mode==='catch'?'ArrowRight':mode==='taiko'?'f':'d';
    press(arena(),key);await wait();press(arena(),key,'keyup');
    ok(events>0,'mapped input '+mode);
    const field=arena().querySelector('canvas');field.getBoundingClientRect=()=>({left:0,top:0,width:640,height:360});
    const pointer=(event,x)=>field.dispatchEvent(new w.MouseEvent(event,{clientX:x,clientY:255,bubbles:true,button:0}));
    const was=events;pointer('pointerdown',400);await wait();pointer('pointerup',400);
    ok(events>was,'canvas input '+mode);w.lectioPlusRhythm[capture]=original;
    click(toolbar(),'Pause');click(toolbar(),'Start forfra');
  }
  await route('#lxp-games/dino');click(toolbar(),'Start spil');await route('#home');const pausedDraws=draws;await wait();ok(games.hidden&&draws===pausedDraws,'leaving games suspends animation');await route('#lxp-games/dino');ok(games.dataset.gameState==='paused','return does not resume silently');
  click(toolbar(),'Fortsæt');w.dispatchEvent(new w.Event('blur'));ok(games.dataset.gameState==='paused','window blur pauses');click(toolbar(),'Fortsæt');
  Object.defineProperty(d,'hidden',{configurable:true,value:true});d.dispatchEvent(new w.Event('visibilitychange'));ok(games.dataset.gameState==='paused','hidden browser tab pauses');Object.defineProperty(d,'hidden',{configurable:true,value:false});
  const outside=new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true});d.body.dispatchEvent(outside);ok(!outside.defaultPrevented,'arrows elsewhere are unaffected');
  await route('#lxp-games/tic');for(const xy of ['0,0','0,1','1,0','1,1','2,0'])games.querySelector(`[data-cell="${xy}"]`).click();ok(games.dataset.gameState==='won'&&games.querySelector('.lxp-game-feedback').textContent==='X vandt!','play tic through UI');
  await route('#lxp-games/four');for(const x of [0,1,0,1,0,1,0])games.querySelector(`[data-cell="${x}"]`).click();ok(games.dataset.gameState==='won'&&games.querySelectorAll('.lxp-game-winning').length===4,'play connect four through UI');
  await route('#lxp-games/mines');const flag=click(games.querySelector('.lxp-game-controls'),'Flag: fra ⚑');games.querySelector('[data-cell="4,4"]').click();ok(flag.getAttribute('aria-pressed')==='true'&&games.querySelector('[data-cell="4,4"]').textContent==='⚑','touch flag mode');
  await route('#lxp-games/choices');for(let i=0;i<24;i++)click(games,i%2?'Grøn · Ja tak':'Rød · Spring over');ok(games.textContent.includes('12 grønne · 12 røde'),'bonus results');
  ok(Boolean(games.querySelector('.lxp-choice-profile')?.textContent),'green/red personality result');
  await route('#lxp-games/teacher');
  ok(games.querySelector('.lxp-game-feedback').textContent.includes('skoles Lectio-side'),'preview sends the player to school');
  await route('#lxp-games/dive');click(arena(),'Start dagens dyk');
  const answer=arena().querySelector('form');answer.querySelector('input').value='zzzz';answer.dispatchEvent(new w.Event('submit',{cancelable:true}));
  ok(arena().querySelector('.lxp-quiz-result').textContent.includes('0 point'),'timed answer receives feedback');click(arena(),'Næste runde');
  press(arena().querySelector('input'),'Escape');ok(games.dataset.gameState==='paused','timed quiz pauses with cursor in answer field');
  const original=w.lectioPlusGamesCore.create;w.lectioPlusGamesCore.create=(id,o)=>{const s=original(id,o);if(id==='dino'){s.distance=500;s.obstacles=[{x:80,y:276,w:28,h:42}];}return s;};
  await route('#lxp-games/dino');click(toolbar(),'Start forfra');click(toolbar(),'Start spil');await wait();await wait();ok(JSON.parse(w.localStorage.getItem('lectioPlusPreview')).games.bests['dino:normal']>=500,'record persists locally');w.lectioPlusGamesCore.create=original;
  const A=w.lectioPlusAppearance,old=A.defaultNavigation().filter(x=>x.id!=='games'),migrated=A.normalize({navigation:old});ok(migrated.navigation.findIndex(x=>x.id==='games')===migrated.navigation.findIndex(x=>x.id==='tools')+1,'old navigation gains games after tools');
  const guarded=A.normalize({games:{difficulty:'bad',bests:{'dino:normal':12,'snake:hard':-1,'__proto__':88,'dino:easy':Infinity,'madeup:easy':9}}});ok(guarded.games.difficulty==='normal'&&Object.keys(guarded.games.bests).length===1,'invalid game settings dropped');
  const backup=w.lectioPlusSettingsTransfer.parse(w.lectioPlusSettingsTransfer.serialize(migrated));ok(backup.navigation.some(x=>x.id==='games'),'settings backup retains games');
  const legacy=JSON.parse(w.lectioPlusSettingsTransfer.serialize(migrated));legacy.preferences.navigation=old;delete legacy.preferences.games;
  ok(w.lectioPlusSettingsTransfer.parse(JSON.stringify(legacy)).navigation.some(x=>x.id==='games'),'older backup migrates navigation safely');
  await route('#lxp-tools/code-workshop');const stage=d.querySelector('.lxp-tool-stage');
  const control=label=>[...stage.querySelectorAll('[aria-label]')].find(el=>el.getAttribute('aria-label')===label);
  const change=(label,value)=>{const el=control(label);el.value=value;el.dispatchEvent(new w.Event('change',{bubbles:true}));};
  change('Arbejdsform','lessons');
  for(let level=1;level<=5;level++){change('Sværhedsgrad',String(level));for(let number=1;number<=25;number++){
    change('Opgave',String(number));const instruction=stage.querySelector('.lxp-code-instruction');
    ok(instruction.querySelector('.lxp-lesson-context')?.textContent.length>45,'context '+level+'/'+number);
    ok(instruction.querySelectorAll('.lxp-lesson-steps li').length===3,'three steps '+level+'/'+number);
    ok(instruction.querySelector('.lxp-lesson-example')&&!instruction.textContent.includes('"expected":'),'readable example '+level+'/'+number);
  }}
  click(stage,'Læs opgaven stort');const dialog=stage.querySelector('.lxp-lesson-dialog');ok(dialog.open&&dialog.textContent.includes('sikker'),'large reading view');click(dialog,'Luk opgaven');ok(!dialog.open,'close reading view');
  change('Sværhedsgrad','2');change('Opgave','1');let payload;
  w.lectioPlusWorkbenchClient={execute:async p=>{payload=p;return {text:'lige\n'};}};
  const editor=stage.querySelector('.CodeMirror').CodeMirror;editor.setValue('def solve(n):\n    return "lige" if n % 2 == 0 else "ulige"');const draft=editor.getValue();
  click(stage,'Prøv eksemplet');await wait();ok(payload.code.includes('print(solve(2))')&&!payload.tests,'example calls function in normal runtime');ok(editor.getValue()===draft,'example leaves editor code intact');
  ok(stage.querySelector('.lxp-code-terminal').textContent.includes('lige'),'example result in terminal');
  const real=await runPython(payload);ok(real.event.type==='result'&&real.event.result.text==='lige\n','example button payload executes in real Python');
  const references=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/python-lesson-references.json'),'utf8'));
  for(const [level,number]of [[3,19],[4,8],[5,7],[5,15]]){
    change('Sværhedsgrad',String(level));change('Opgave',String(number));const lesson=references.find(l=>l.level===level&&l.number===number);editor.setValue(lesson.reference);
    click(stage,'Prøv eksemplet');await wait();const result=await runPython(payload);
    ok(result.event.type==='result',lesson.title+': '+result.event.message);ok(result.event.result.text.length>0,'structured example produces output '+lesson.title);
  }
  change('Arbejdsform','free');ok(control('Prøv eksemplet').hidden,'example action hidden for free code');
  await wait();ok(!errors.length,errors.map(e=>e.message).join('\n'));dom.window.close();
  console.log('TOTAL',checks,'Test 33 game navigation, controls, lifecycle, storage and 125 lesson presentations (JSDOM; no live browser)');
})().catch(error=>{console.error(error);process.exit(1);});
