(() => {
  'use strict';const X=globalThis.lectioPlusExpanded;
  const examples={python:'navn = input("Hvad hedder du? ")\nprint(f"Hej {navn}!")\n\nfor tal in range(1, 6):\n    print(tal, tal ** 2)\n',javascript:'const tal = [2, 4, 6];\nconsole.log("Summen er", tal.reduce((a, b) => a + b, 0));',html:'<!doctype html>\n<html lang="da">\n<head>\n<style>\nbody { font-family: system-ui; padding: 2rem; }\nh1 { font-size: 2rem; }\n</style>\n</head>\n<body>\n<h1>Min første side</h1>\n<p>Her kan jeg skrive HTML og CSS.</p>\n</body>\n</html>',sql:"SELECT fag.navn, SUM(opgaver.minutter) AS minutter\nFROM fag\nJOIN opgaver ON fag.id = opgaver.fag_id\nGROUP BY fag.navn;",regex:'\\b\\d+\\b'};
  const modes={python:'python',javascript:'javascript',html:'htmlmixed',sql:'text/x-sql',regex:null};
  globalThis.lectioPlusCodeWorkshop=(id,c,h)=>{
    if(id==='ocr')return ocr(c,h);
    if(!['code-workshop','sql','regex'].includes(id))return null;
    const {E}=c,{field,button,inputs,actions,out,status,node,save,read,download}=h,saved=read(),lessons=globalThis.lectioPlusCodeLessons||[];
    node.classList.add('lxp-code-workshop');node.dataset.lxpUserContent='';
    const initialLanguage=id==='sql'?'sql':id==='regex'?'regex':(['python','javascript','html','sql'].includes(saved.language)?saved.language:'python');
    const language=field(X.select('language','Programmeringssprog',id==='code-workshop'?[['python','Python'],['javascript','JavaScript'],['html','HTML + CSS'],['sql','SQL (SQLite)']]:[[initialLanguage,initialLanguage==='sql'?'SQL (SQLite)':'Regulært udtryk']],initialLanguage));
    const mode=field(X.select('mode','Arbejdsform',[['free','Fri kode'],['lessons','Python-opgaver – 5 niveauer']]));mode.closest('label').hidden=id!=='code-workshop';
    const level=field(X.select('level','Sværhedsgrad',[['1','1 · Kom godt i gang'],['2','2 · Valg og gentagelser'],['3','3 · Funktioner og data'],['4','4 · Robust problemløsning'],['5','5 · Algoritmer og udfordringer']]));
    const progress=E('p','lxp-settings-help');inputs.append(progress);const choice=field(X.select('lesson','Opgave',[['','Vælg en opgave']])),instruction=E('section','lxp-code-instruction');inputs.append(instruction);
    const name=field(X.txt('name','Filnavn / projektnavn',saved.name||'mit_program.py'));
    const editor=field({...X.area('code','Din kode',saved.code||examples[initialLanguage]),maxLength:100000});editor.spellcheck=false;editor.autocapitalize='off';editor.autocomplete='off';editor.rows=18;editor.classList.add('lxp-code-source');
    let cm=null;try{if(globalThis.CodeMirror)cm=CodeMirror.fromTextArea(editor,{screenReaderLabel:'Kodeeditor',mode:modes[language.value],lineNumbers:true,indentUnit:4,tabSize:4,indentWithTabs:false,viewportMargin:20,extraKeys:{Tab:instance=>instance.replaceSelection('    ','end')}});}catch{status.textContent='Den enkle kodeeditor vises. Du kan stadig skrive og køre kode.';}
    const getCode=()=>cm?cm.getValue():editor.value,setCode=value=>{editor.value=value;if(cm)cm.setValue(value);};
    const settings=E('details','lxp-code-settings',E('summary','','Editorindstillinger'));inputs.append(settings);
    const color=c.field(settings,X.select('colors','Farvemarkering',[['on','Til'],['off','Fra']],c.prefs().code.colors?'on':'off')),numbers=c.field(settings,X.select('numbers','Linjenumre',[['on','Til'],['off','Fra']],c.prefs().code.lineNumbers?'on':'off')),font=c.field(settings,X.select('font','Skriftstørrelse',['12','14','16','18','20','24'].map(x=>[x,x+' px']),c.prefs().code.fontSize)),theme=c.field(settings,X.select('theme','Editorfarver',[['theme','Følg LectioPlus+'],['dark','Mørk kodeeditor'],['light','Lys kodeeditor']],c.prefs().code.theme)),wrap=c.field(settings,X.select('wrap','Lange linjer',[['off','Vandret rulning'],['on','Ombryd linjer']],c.prefs().code.wrap?'on':'off'));
    function appearance(){inputMode.closest('label').hidden=language.value!=='python';stdin.closest('label').hidden=['html','sql'].includes(language.value)||(language.value==='python'&&inputMode.value==='terminal');trace.closest('label').hidden=language.value!=='python';const p=c.prefs().code;node.dataset.codeTheme=p.theme;node.style.setProperty('--lxp-code-size',p.fontSize+'px');cm?.setOption('mode',p.colors?modes[language.value]:null);cm?.setOption('lineNumbers',p.lineNumbers);cm?.setOption('lineWrapping',p.wrap);cm?.refresh();layout?.sync();refreshHTMLPreview();}
    settings.onchange=async()=>{await c.save(p=>({code:{...p.code,colors:color.value==='on',lineNumbers:numbers.value==='on',fontSize:font.value,theme:theme.value,wrap:wrap.value==='on'}}));appearance();};
    const inputMode=field(X.select('inputMode','Python-input',[['terminal','Svar i terminalen'],['prefilled','Forudfyldte svar']],saved.inputMode==='prefilled'?'prefilled':'terminal'));
    inputMode.onchange=()=>appearance();
    const stdin=field(X.area('stdin',id==='regex'?'Tekst at søge i':'Svar til input() – ét svar pr. linje',saved.stdin||'Elev')),trace=field(X.select('trace','Python-variabler',[['off','Normal kørsel'],['on','Optag op til 300 linjetrin']])),flags=id==='regex'?field(X.txt('flags','Regex-flag','g')):null;
    const file=field(X.txt('import','Åbn egen kodefil'));file.type='file';file.accept='.py,.ipynb,.js,.html,.css,.sql,.txt';file.removeAttribute('value');
    let htmlPreview=null,htmlCode='',htmlTheme='';
    let activeLesson=null,controller=null,elapsedTimer,freeDraft=getCode(),freeLanguage=language.value,freeName=name.value,freeDrafts=new Map([[language.value,getCode()]]),lessonDrafts=new Map();const lessonKey=l=>'python-'+l.level+'-'+l.number;
    const runButton=button('Kør program',()=>run(false)),testButton=button('Test min løsning',()=>run(true)),exampleButton=button('Prøv eksemplet',()=>run(false,true)),stopButton=button('Stop program',()=>controller?.abort());stopButton.disabled=true;exampleButton.hidden=true;
    const layout=globalThis.lectioPlusCodeLayout(c,h,{editor,cm,name,language,settings,stdin,trace,inputMode});
    async function run(test,example=false){
      if(controller)return;
      const runLesson=activeLesson,runLanguage=language.value,runInput=stdin.value;
      const code=getCode()+(example&&runLesson?.mode==='function'?'\n\n# Kald med opgavens eksempel (editorens kode ændres ikke).\nprint('+runLesson.entry+'('+runLesson.tests[0].args.map(pythonValue).join(', ')+'))\n':'');
      layout.start(test&&runLesson?'Test: '+runLesson.title:runLanguage+' '+(name.value||'Unavngivet'));
      const invalid=!code.trim()?'Skriv noget kode først.':code.length>100000?'Højst 100.000 tegn kode.':test&&!runLesson?'Vælg først en Python-opgave.':'';
      if(invalid){status.dataset.error='true';status.textContent=invalid;layout.finish(invalid,true);return;}
      status.dataset.error='false';
      if(runLanguage==='html'){
        const frame=E('iframe','lxp-html-preview');frame.title='Din HTML/CSS-side';frame.setAttribute('sandbox','');
        htmlPreview=frame;htmlCode=code;out.append(frame);refreshHTMLPreview(true);layout.selectTab('result');
        status.textContent='HTML/CSS vises lokalt. Scripts og eksterne ressourcer er slået fra i denne visning.';
        layout.finish('HTML/CSS-visningen er klar under Resultat.');return;
      }
      controller=new AbortController();layout.setBusy(true);runButton.disabled=testButton.disabled=exampleButton.disabled=true;stopButton.disabled=false;
      const locked=[language,mode,level,choice,file,inputMode];const disabled=locked.map(el=>el.disabled);locked.forEach(el=>el.disabled=true);
      const start=Date.now();let phase='Åbner kodeværksted',streamed='',lastStage='',hadInput=false;
      layout.append('Starter '+(runLanguage==='python'?'Python':runLanguage)+' lokalt…\n','system');
      const tick=()=>status.textContent=phase+' · '+Math.floor((Date.now()-start)/1000)+' s';elapsedTimer=setInterval(tick,500);tick();
      try{
        const payload={language:runLanguage,code,stdin:runInput,interactiveInput:runLanguage==='python'&&inputMode.value==='terminal'&&!test,trace:trace.value==='on',flags:flags?.value};
        if(test)Object.assign(payload,{tests:runLesson.tests,entry:runLesson.entry,mode:runLesson.mode});
        const result=await globalThis.lectioPlusWorkbenchClient.execute(payload,p=>{
          if(p.phase==='input'&&typeof p.respond==='function'){hadInput=true;phase='Venter på dit svar i terminalen';layout.requestInput(value=>{const sent=p.respond(value);if(sent!==false){phase='Kører program';tick();}return sent;});tick();}
          else if(p.phase==='output'&&typeof p.text==='string'){const chunk=p.text.slice(0,Math.max(0,100000-streamed.length));streamed+=chunk;layout.append(chunk,p.stream==='stderr'?'stderr':'stdout');}
          else {
            phase=p.phase==='working'?'Kører program':p.message||'Indlæser lokal '+runLanguage;
            if(p.phase==='loading'&&p.stage&&p.stage!==lastStage){lastStage=p.stage;layout.append(phase+'…\n','system');}
            tick();
          }
        },controller.signal);
        // Older runtime hosts may return only the final output. Do not print streamed output twice.
        if(result.text){if(!streamed)layout.append(result.text);else if(result.text.startsWith(streamed))layout.append(result.text.slice(streamed.length));}
        if(!result.text&&!streamed&&!test&&!hadInput)layout.append('(Ingen udskrift)'+(runLanguage==='python'?' Brug print(...) for at vise et resultat.':runLanguage==='javascript'?' Brug console.log(...) for at vise et resultat.':'')+'\n','system');
        if(result.tables){for(const t of result.tables)if(t.columns.length)out.append(X.ui.table({head:t.columns,body:t.values},E));layout.append('\nSe tabellerne under Resultat.\n','system');layout.selectTab('result');}
        if(result.matches){const highlighted=E('p','lxp-regex-highlight');let end=0;for(const m of result.matches){highlighted.append(document.createTextNode(runInput.slice(end,m.index)),E('mark','',m.text));end=m.index+m.text.length;}highlighted.append(document.createTextNode(runInput.slice(end)));out.append(highlighted);layout.selectTab('result');}
        if(result.trace?.length){
          const target=layout.variables,step=c.field(target,X.num('step','Vis linjetrin',1,1,result.trace.length)),state=E('div');target.append(state);
          const draw=()=>{const i=Math.max(0,Math.min(result.trace.length-1,Number(step.value)-1)),s=result.trace[i];state.replaceChildren(E('p','lxp-lab-emphasis','Før linje '+s.line),X.ui.table({head:['Variabel','Værdi'],body:Object.entries(s.variables)},E));cm?.setCursor({line:s.line-1,ch:0});};
          step.oninput=draw;button('Forrige trin',()=>{step.value=Math.max(1,Number(step.value)-1);draw();},target);button('Næste trin',()=>{step.value=Math.min(result.trace.length,Number(step.value)+1);draw();},target);draw();layout.append('\nLinjetrin og variabler er klar under Variable.\n','system');
        }
        if(test){
          const checks=result.checks||[],passed=checks.length===runLesson.tests.length&&checks.every(x=>x.passed);
          checks.forEach((x,i)=>{layout.append(`\n${x.passed?'✓ BESTÅET':'✗ FEJLET'}  Test ${i+1}\n`,x.passed?'success':'stderr');if(!x.passed)layout.append(x.error?x.error+'\n':`  Forventet: ${x.expected}\n  Dit resultat: ${x.actual}\n`, 'stderr');});
          layout.finish(`${checks.filter(x=>x.passed).length} af ${runLesson.tests.length} test bestået`,!passed);
          const key=lessonKey(runLesson);const stored=await c.save(p=>({workspaces:{...p.workspaces,[key]:JSON.stringify({code,passed,checkedAt:Date.now()})}}));progressLabel();
          status.textContent=stored===false?'Testen er kørt, men resultatet kunne ikke gemmes.':passed?'Alle opgavens test består. Du kan stadig forbedre navne og læsbarhed.':'Se testresultaterne i terminalen og prøv igen.';
        }else{layout.finish('Kørsel afsluttet · '+((Date.now()-start)/1000).toFixed(1)+' s');status.textContent='Kørsel afsluttet.';}
      }catch(e){const stopped=e.name==='AbortError';status.dataset.error=String(!stopped);status.textContent=stopped?'Programmet er stoppet.':e.message;layout.selectTab('terminal');layout.finish(status.textContent,!stopped);if(/EOFError/.test(e.message)&&inputMode.value==='prefilled')layout.append('Der mangler forudfyldte svar. Tilføj flere under Input, eller vælg Svar i terminalen.\n','system');}
      finally{clearInterval(elapsedTimer);controller=null;layout.setBusy(false);runButton.disabled=false;testButton.disabled=!activeLesson;exampleButton.disabled=false;stopButton.disabled=true;locked.forEach((el,i)=>el.disabled=disabled[i]);}
    }
    function refreshHTMLPreview(force=false){
      if(!htmlPreview?.isConnected)return;
      const root=document.documentElement,dark=root.dataset.lxpMode==='dark',style=getComputedStyle(root);
      const colour=(key,fallback)=>{const value=style.getPropertyValue(key).trim();return /^(#[\da-f]{3,8}|rgba?\([\d.,%\s/]+\))$/i.test(value)?value:fallback;};
      const background=colour('--lxp-bg',dark?'#131726':'#f3f5fa'),ink=colour('--lxp-text',dark?'#eef0fb':'#192237'),signature=[dark,background,ink].join('|');
      if(!force&&htmlTheme===signature)return;htmlTheme=signature;
      const doc=new DOMParser().parseFromString(htmlCode,'text/html'),policy=doc.createElement('meta'),base=doc.createElement('style');
      policy.httpEquiv='Content-Security-Policy';policy.content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:;";
      base.dataset.lxpPreviewTheme='';base.textContent=`:root { color-scheme: ${dark?'dark':'light'}; background-color: ${background}; color: ${ink}; } body { font-family: system-ui, sans-serif; }`;
      // Defaults precede the user's styles. Explicit colours in their HTML remain their choice.
      doc.head.prepend(policy,base);htmlPreview.srcdoc='<!doctype html>\n'+doc.documentElement.outerHTML;
    }
    const previewThemeObserver=new MutationObserver(()=>refreshHTMLPreview());
    previewThemeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-lxp-mode','data-lxp-design','style']});
    addEventListener('pagehide',()=>previewThemeObserver.disconnect(),{once:true});
    function rememberDraft(){if(activeLesson)lessonDrafts.set(lessonKey(activeLesson),getCode());else {freeDraft=getCode();freeDrafts.set(freeLanguage,getCode());freeName=name.value;}}
    function pythonValue(value){
      if(value===null)return 'None';
      if(typeof value==='boolean')return value?'True':'False';
      if(Array.isArray(value))return '['+value.map(pythonValue).join(', ')+']';
      if(value&&typeof value==='object')return '{'+Object.entries(value).map(([k,v])=>pythonValue(k)+': '+pythonValue(v)).join(', ')+'}';
      return JSON.stringify(value);
    }
    const lessonDialog=E('dialog','lxp lxp-lesson-dialog');lessonDialog.setAttribute('aria-label','Læs Python-opgaven');node.append(lessonDialog);
    lessonDialog.addEventListener('click',event=>{if(event.target===lessonDialog)lessonDialog.close();});
    function lessonContent(target,lesson){
      const brief=lesson.brief||{},example=lesson.tests[0],program=lesson.mode==='program';
      target.append(E('span','lxp-tool-category-label',`Niveau ${lesson.level} · opgave ${lesson.number}/25`),E('h3','',lesson.title));
      if(brief.context)target.append(E('p','lxp-lesson-context',brief.context));
      target.append(E('h4','','Din opgave'),E('p','lxp-lab-text',lesson.prompt));
      const steps=E('ol','lxp-lesson-steps');
      steps.append(E('li','',program?(brief.inputs?.length?'Spørg med input() efter: '+brief.inputs.join(', ')+'.':'Der skal ikke indtastes noget i denne opgave.'):'Brug de værdier, som funktionen solve får som parametre.'),E('li','',brief.plan||'Lav beregningen eller behandlingen beskrevet ovenfor.'),E('li','',program?'Vis det ønskede svar med print().':'Aflevér svaret med return. Testen kalder selv funktionen.'));
      target.append(E('h4','','Gør det i tre trin'),steps);
      const sample=E('section','lxp-lesson-example');
      sample.append(E('h4','','Et konkret eksempel'));
      if(program){
        const list=E('dl','lxp-lesson-inputs');example.stdin.forEach((value,i)=>list.append(E('dt','',brief.inputs?.[i]||'Svar '+(i+1)),E('dd','',E('code','',pythonValue(value)))));
        sample.append(E('p','',example.stdin.length?'Du skriver disse svar — ét ad gangen:':'Programmet skal ikke spørge om input.'));if(example.stdin.length)sample.append(list);
        sample.append(E('p','','Programmet skriver:'),E('pre','lxp-code-output',example.expected===''?'(tom linje)':String(example.expected)));
      }else{
        sample.append(E('p','','Funktionen bliver kaldt sådan:'),E('pre','lxp-code-output',lesson.entry+'('+example.args.map(pythonValue).join(', ')+')'),E('p','','Den skal returnere:'),E('pre','lxp-code-output',pythonValue(example.expected)),E('p','lxp-settings-help','Brug Prøv eksemplet for at se returværdien i terminalen. Kør program kører kun den kode, du selv har skrevet.'));
      }
      target.append(sample,E('details','lxp-lesson-hints',E('summary','','Brug for et hint?'),...lesson.hints.map(t=>E('p','',t))),E('details','lxp-lesson-hints',E('summary','','Sådan bliver løsningen testet'),E('p','',lesson.concept),E('p','','Test min løsning afprøver tre eksempler. Et grønt resultat gælder disse eksempler; prøv gerne selv flere værdier.')));
    }
    function showLesson(){
      const lesson=lessons.find(l=>l.level===Number(level.value)&&l.number===Number(choice.value));if(!lesson)return;
      rememberDraft();activeLesson=lesson;let saved={};try{saved=JSON.parse(c.prefs().workspaces[lessonKey(lesson)]||'{}');}catch{}
      setCode(lessonDrafts.get(lessonKey(lesson))??saved.code??lesson.starter);instruction.replaceChildren();lessonContent(instruction,lesson);
      button('Læs opgaven stort',()=>{lessonDialog.replaceChildren();button('Luk opgaven',()=>lessonDialog.close(),lessonDialog);lessonContent(lessonDialog,lesson);lessonDialog.showModal();},instruction);
      testButton.disabled=false;exampleButton.hidden=lesson.mode!=='function';name.value=lessonKey(lesson)+'.py';layout.sync();
      status.textContent=saved.passed?'Du har tidligere bestået denne opgaves test.':'Læs situationen, følg trinene, og prøv din løsning i terminalen.';
    }
    function progressLabel(){let done=0;for(const lesson of lessons){try{if(JSON.parse(c.prefs().workspaces[lessonKey(lesson)]||'{}').passed)done++;}catch{}}progress.textContent=done+' af 125 opgaver bestået på denne enhed.';}function populate(){progressLabel();choice.replaceChildren(...lessons.filter(l=>l.level===Number(level.value)).map(l=>new Option(`${l.number}. ${l.title}`,String(l.number))));showLesson();}
    mode.onchange=()=>{rememberDraft();const exercise=mode.value==='lessons';level.closest('label').hidden=choice.closest('label').hidden=!exercise;instruction.hidden=!exercise;language.disabled=exercise;if(exercise){language.value='python';populate();}else{activeLesson=null;exampleButton.hidden=true;language.value=freeLanguage;name.value=freeName;setCode(freeDraft);testButton.disabled=true;instruction.replaceChildren();}appearance();};level.onchange=populate;choice.onchange=showLesson;
    language.onchange=()=>{rememberDraft();freeLanguage=language.value;setCode(freeDrafts.get(language.value)||examples[language.value]);freeDraft=getCode();name.value=({python:'mit_program.py',javascript:'mit_program.js',html:'min_side.html',sql:'min_query.sql'})[language.value];stdin.closest('label').hidden=language.value==='html'||language.value==='sql';trace.closest('label').hidden=language.value!=='python';appearance();};
    const saveButton=button('Gem kode',async()=>{const code=getCode();if(activeLesson){await c.save(p=>({workspaces:{...p.workspaces,[lessonKey(activeLesson)]:JSON.stringify({code,passed:false})}}));status.textContent='Opgavekladde gemt. Test igen efter ændringer.';}else await save({language:language.value,name:name.value,code,stdin:stdin.value,inputMode:inputMode.value});});
    button('Download kodefil',()=>download(name.value.replace(/[\\/:*?"<>|]/g,'_')||'program.py',getCode()));
    file.onchange=async()=>{try{const f=file.files?.[0];if(!f)return;if(f.size>2000000)throw Error('Kodefilen må højst være 2 MB.');let text=await f.text();if(/\.ipynb$/i.test(f.name)){const notebook=JSON.parse(text);if(!Array.isArray(notebook.cells))throw Error('Filen indeholder ikke en notebook med celler.');text=notebook.cells.filter(cell=>cell.cell_type==='code').map((cell,i)=>'# Celle '+(i+1)+'\n'+(Array.isArray(cell.source)?cell.source.join(''):String(cell.source||''))).join('\n\n');}if(text.length>100000)throw Error('Den samlede kode er over 100.000 tegn. Åbn et mindre udsnit.');rememberDraft();mode.value='free';mode.onchange();language.value=/\.(py|ipynb)$/i.test(f.name)?'python':/\.sql$/i.test(f.name)?'sql':/\.(html|css)$/i.test(f.name)?'html':'javascript';setCode(/\.css$/i.test(f.name)?'<style>\n'+text+'\n</style>\n<h1>CSS-eksempel</h1>':text);freeLanguage=language.value;freeDraft=getCode();freeDrafts.set(freeLanguage,freeDraft);name.value=f.name.replace(/\.ipynb$/i,'.py');appearance();status.textContent='Filen er åbnet. Koden køres først, når du trykker Kør.';}catch(e){status.textContent=e.message;}};
    if(id==='sql')instruction.append(E('p','','Øvelsesdatabasen har fag(id, navn) og opgaver(id, fag_id, titel, minutter). Den nulstilles før hver kørsel. Prøv SELECT, WHERE, JOIN og GROUP BY.'));
    if(id==='regex')instruction.append(E('p','','Fx \\d+ = cifre, \\w+ = ordtegn, ^ = begyndelse, $ = slutning, [a-z] = tegnklasse. Kørsel kan stoppes ved langsomme mønstre.'));
    level.closest('label').hidden=choice.closest('label').hidden=true;testButton.disabled=true;trace.closest('label').hidden=language.value!=='python';settings.append(E('p','lxp-settings-help','Python bruger en lokal browserudgave af CPython. Standardbiblioteket følger med; eksterne pakker, netværk, grafiske desktopvinduer og adgang til din computers filer er ikke tilgængelige her. Python spørger direkte i terminalen. Skriv dit svar og tryk Enter. Under Input kan du vælge forudfyldte svar i stedet.'));
    node.addEventListener('keydown',event=>{
      const modifier=event.ctrlKey||event.metaKey;
      let target=null;
      if((modifier&&event.key==='Enter')||event.key==='F5')target=event.key==='F5'&&event.shiftKey?stopButton:event.shiftKey?testButton:runButton;
      else if(modifier&&event.key.toLowerCase()==='s')target=saveButton;
      else if(modifier&&event.key.toLowerCase()==='b')target=layout.sidebarToggle;
      else if(modifier&&event.key.toLowerCase()==='j')target=layout.terminalToggle;
      if(target){event.preventDefault();event.stopPropagation();if(!target.disabled)target.click();}
    },true);
    progressLabel();appearance();addEventListener('pagehide',()=>{controller?.abort();clearInterval(elapsedTimer);},{once:true});return {node,refresh:appearance};
  };
  function ocr(c,h){const {E}=c,{field,button,out,status,node}=h;const file=field(X.txt('image','Vælg billede'));file.type='file';file.accept='image/png,image/jpeg,image/webp';const language=field(X.select('ocrLanguage','Sprog',[['dan','Dansk'],['eng','Engelsk'],['dan+eng','Dansk og engelsk']])),text=field(X.area('recognized','Gennemse og ret den læste tekst'));let controller;
    button('Læs tekst fra billede',async()=>{const f=file.files?.[0];if(!f)throw Error('Vælg et billede først.');if(controller)throw Error('Stop den igangværende billedlæsning først.');if(f.size>10000000)throw Error('Vælg et billede under 10 MB.');const image=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('Kunne ikke læse billedet.'));r.readAsDataURL(f);});if(controller)throw Error('Stop den igangværende billedlæsning først.');const bitmap=await createImageBitmap(f);const pixels=bitmap.width*bitmap.height;bitmap.close();if(pixels>16000000)throw Error('Vælg et billede på højst 16 megapixel.');controller=new AbortController();try{const result=await globalThis.lectioPlusWorkbenchClient.execute({language:'ocr',code:'',image,ocrLanguage:language.value},p=>status.textContent='Læser billedet lokalt… '+(p.message||''),controller.signal);text.value=result.text;status.textContent='Teksten er læst. Kontrollér især tal, tegn og formler.';}finally{controller=null;}});button('Stop billedlæsning',()=>controller?.abort());button('Download læst tekst',()=>h.download('tekst-fra-billede.txt',text.value));addEventListener('pagehide',()=>controller?.abort(),{once:true});out.append(E('p','lxp-settings-help','Trykt dansk og engelsk tekst. Håndskrift, tabeller og matematiske formler kan blive læst forkert. Billedet sendes ikke til en server.'));return {node};}
})();
