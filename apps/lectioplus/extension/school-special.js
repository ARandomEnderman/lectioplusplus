(() => {
  'use strict';
  globalThis.lectioPlusSchoolSpecial=(id,c)=>{
    const {E,B,field,prefs,save,format,showResult,error}=c,M=globalThis.lectioPlusMath;
    const expanded=globalThis.lectioPlusExpandedUI?.(id,c);if(expanded)return expanded;
    if(id==='translate'&&globalThis.lectioPlusTranslationTool)return globalThis.lectioPlusTranslationTool(c);
    const extra=globalThis.lectioPlusSchoolWriting?.(id,c)||globalThis.lectioPlusSchoolLab?.(id,c);if(extra)return extra;
    const node=E('div','lxp-special-tool');
    const output=E('div','lxp-tool-output');output.setAttribute('role','status');
    const text=(id,label,value='',type='text')=>field(node,{id,label,value,type});
    const numeric=(id,label,value)=>field(node,{id,label,value,type:'number'});
    const select=(id,label,options)=>field(node,{id,label,options,type:'select',value:options[0]?.[0]||''});
    const run=(label,fn)=>{const b=B('lxp-primary-button',label,()=>{try{fn()}catch(e){error(output,e.message)}},label);node.append(b);return b;};
    const help=message=>node.append(E('p','lxp-settings-help',message));
    if(id==='basic'){
      const model=M.classic(),panel=E('section','lxp-classic-calculator'),history=E('div','lxp-calculator-history'),display=E('output','lxp-calculator-display');
      panel.tabIndex=0;panel.setAttribute('aria-label','Klassisk lommeregner');display.setAttribute('aria-live','polite');
      const keys=E('div','lxp-calculator-keys');
      const labels={'C':'Ryd beregning','CE':'Ryd aktuelt tal','Backspace':'Slet sidste ciffer','%':'Procent','/':'Divider','*':'Gang','-':'Minus','+':'Plus','=':'Lig med','±':'Skift fortegn',',':'Decimalkomma',
        'sqrt':'Kvadratrod','square':'Tal i anden','reciprocal':'En divideret med tallet','abs':'Absolut værdi','^':'Opløft i en potens','pi':'Indsæt pi','Ans':'Indsæt seneste resultat','MC':'Ryd hukommelse','MR':'Hent fra hukommelse','MS':'Gem tal i hukommelse','M+':'Læg tal til hukommelse','M-':'Træk tal fra hukommelse'};
      const glyphs={'Backspace':'⌫','/':'÷','*':'×','-':'−'};
      const extras=E('details','lxp-calculator-extras',E('summary','','Flere funktioner'));
      const extraKeys=E('div','lxp-calculator-extra-keys'),memoryKeys=E('div','lxp-calculator-memory-keys'),memoryStatus=E('p','lxp-calculator-memory-state');
      memoryStatus.setAttribute('role','status');
      const log=E('details','lxp-calculator-log',E('summary','','Historik · seneste 20 beregninger'));
      const logItems=E('ol','lxp-calculator-log-items');
      const clearHistory=B('lxp-secondary-button','Ryd beregningshistorik',()=>press('clear-history'),'Ryd historik');
      const copyStatus=E('span','lxp-calculator-copy-status');copyStatus.setAttribute('role','status');
      const copyButton=B('lxp-secondary-button','Kopiér resultat',async()=>{const state=model.state();if(state.error)return;try{await navigator.clipboard.writeText(state.display);copyStatus.textContent='Resultatet er kopieret.';}catch{copyStatus.textContent='Kunne ikke kopiere. Markér tallet og kopiér det manuelt.';}},'Kopiér resultat');
      let logSignature='';
      const numberLabel=value=>String(Number(value.toPrecision(15))).replace('.',',');
      function render(state){
        display.textContent=state.display;history.textContent=state.history.replace(/\*/g,'×').replace(/\//g,'÷');copyStatus.textContent='';copyButton.disabled=Boolean(state.error);
        memoryStatus.textContent=state.memory===null?'Hukommelsen er tom.':'M = '+numberLabel(state.memory);
        for(const b of memoryKeys.children)b.disabled=['MC','MR'].includes(b.dataset.key)?state.memory===null:Boolean(state.error);
        extraKeys.querySelector('[data-key="Ans"]').disabled=state.answer===null;
        if(state.error)error(output,state.error+' Tryk C for at starte igen.');else output.replaceChildren();
        const signature=JSON.stringify(state.records);
        if(signature!==logSignature){logSignature=signature;logItems.replaceChildren(...state.records.map(item=>{
          const b=B('lxp-calculator-history-item','Brug resultat '+numberLabel(item.result),()=>{render(model.use(item.result));panel.focus();},
            E('span','',item.expression.replace(/\*/g,'×').replace(/\//g,'÷')+' ='),E('strong','',numberLabel(item.result)));
          return E('li','',b);
        }));if(!state.records.length)logItems.append(E('li','lxp-settings-help','Ingen beregninger endnu.'));}
        clearHistory.disabled=!state.records.length;
      }
      function press(key){render(model.press(key));}
      function keyButton(key,glyph){const b=B('lxp-calculator-key',labels[key]||key,()=>press(key),glyph||glyphs[key]||key);b.dataset.key=key;return b;}
      for(const key of ['C','Backspace','%','/','7','8','9','*','4','5','6','-','1','2','3','+','±','0',',','=']){
        const b=keyButton(key);if(['+','-','*','/','='].includes(key))b.dataset.operator='true';keys.append(b);
      }
      for(const [key,glyph] of [['sqrt','√x'],['square','x²'],['reciprocal','1/x'],['^','xʸ'],['abs','|x|'],['pi','π'],['Ans','Ans'],['CE','CE']])extraKeys.append(keyButton(key,glyph));
      for(const key of ['MC','MR','MS','M+','M-'])memoryKeys.append(keyButton(key));
      extras.append(extraKeys,memoryKeys,memoryStatus);log.append(logItems,clearHistory);
      panel.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.closest('button,summary'))return;const key=e.key==='Enter'?'=':e.key==='Escape'?'C':e.key==='Delete'?'CE':e.key;if(!e.ctrlKey&&!e.metaKey&&!e.altKey&&(/^[0-9.,+*/%^=−-]$/.test(key)||['Backspace','C','CE'].includes(key))){e.preventDefault();press(key==='−'?'-':key);}});
      panel.append(history,display,E('div','lxp-calculator-copy',copyButton,copyStatus),extras,keys,log);node.append(panel,output);
      help('Regner én handling ad gangen: 2 + 3 × 4 = 20. Brug Lommeregner til parenteser og regnearternes rækkefølge. Tastatur: Enter = resultat, Esc = ryd, Backspace = slet.');
      help('Procent: 200 + 10 % = 220. 200 × 10 % = 20. Resultatet vises med op til 15 betydende cifre.');
      help('Flere funktioner: √x, x², 1/x, xʸ, |x| og π. Ans henter seneste resultat. CE rydder kun det aktuelle tal. MS gemmer; MR henter; M+/M− ændrer hukommelsen; MC rydder den.');
      help('Historik og hukommelse bliver kun i denne åbne værktøjsvisning og nulstilles ved genindlæsning. C rydder beregningen, men bevarer historik og hukommelse.');
      press('C');return {node};
    }
    if(id==='periodic'){
      const search=text('element-search','Find grundstof (navn, symbol eller atomnummer)');search.type='search';
      const host=E('div','lxp-periodic-scroll');host.tabIndex=0;host.setAttribute('role','region');host.setAttribute('aria-label','Periodisk system, rul vandret ved behov');
      const grid=E('div','lxp-periodic-grid'),detail=E('div','lxp-element-detail'),isotopes=new Map();let selected=globalThis.lectioPlusElements[0];
      const describe=()=>{
        showResult(detail,{rows:[['Grundstof',selected.name],['Symbol',selected.symbol],['Atomnummer',selected.z],['Periode',selected.period],['Gruppe',selected.group??'f-blokken'],['Standardatomvægt',selected.mass??'Ingen standardatomvægt'],['Type',selected.category]],steps:['Atomnummeret er antallet af protoner. Neutrale atomer har lige så mange elektroner.','Atomvægtene er afrundede CIAAW-værdier (2024). Et tomt massefelt erstattes ikke med et isotops massetal.']});
        const reference=globalThis.lectioPlusAtomData.find(item=>item.z===selected.z),controls=E('div','lxp-atom-controls'),model=E('div','lxp-atom-model-host');
        const isotope=field(controls,{id:'isotope',label:'Vælg isotop',type:'select',value:String(isotopes.get(selected.z)||reference.defaultIsotope),options:reference.isotopes.map(a=>[String(a),`${selected.symbol}-${a} · ${a-selected.z} neutroner`])});
        const draw=()=>{isotopes.set(selected.z,Number(isotope.value));model.replaceChildren(globalThis.lectioPlusAtomView(selected,Number(isotope.value),prefs().visuals));};
        isotope.addEventListener('change',draw);detail.append(controls,model);draw();
        const sources=E('p','lxp-atom-sources');
        for(const [name,href] of [['Elektrondata: PubChem','https://pubchem.ncbi.nlm.nih.gov/element/'+selected.z],['Isotoper: NIST','https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl?ele='+selected.z+'&isotype=some']]){const link=E('a','lxp-text-link',name);link.href=href;link.target='_blank';link.rel='noopener noreferrer';sources.append(link);}
        if(selected.z===103){const link=E('a','lxp-text-link','Opdateret Lr-konfiguration: NIST');link.href='https://physics.nist.gov/cgi-bin/Elements/elInfo.pl?element=103&context=frames';link.target='_blank';link.rel='noopener noreferrer';sources.append(link);}
        detail.append(sources);
      };
      for(const el of globalThis.lectioPlusElements){const b=B('lxp-element',`${el.z}: ${el.name} (${el.symbol})`,()=>{selected=el;describe();for(const item of grid.querySelectorAll('button'))item.setAttribute('aria-pressed',String(item===b));},E('small','',String(el.z)),E('strong','',el.symbol),E('span','',el.name.split(' (')[0]));b.style.gridRow=el.row;b.style.gridColumn=el.column;b.dataset.kind=el.category;b.dataset.search=`${el.z} ${el.symbol} ${el.name}`.toLocaleLowerCase('da-DK');b.setAttribute('aria-pressed',String(el.z===1));grid.append(b);}
      for(const [row,label] of [[6,'57–71'],[7,'89–103']]){const placeholder=E('span','lxp-element-placeholder',label);placeholder.style.gridRow=row;placeholder.style.gridColumn=3;grid.append(placeholder);}
      search.addEventListener('input',()=>{const q=search.value.toLocaleLowerCase('da-DK').trim();let count=0;for(const b of grid.querySelectorAll('button')){const match=b.dataset.search.includes(q);b.hidden=!match;if(match)count++;}output.textContent=`${count} grundstoffer matcher.`;});
      host.append(grid);node.append(host,detail,output);const source=E('a','lxp-text-link','Kilde: CIAAW · atomvægte 2024');source.href='https://ciaaw.org/abridged-atomic-weights.htm';source.target='_blank';source.rel='noopener noreferrer';node.append(source);describe();return {node,refresh:describe};
    }
    if(id==='graph'){
      const form=E('form','lxp-tool-form'),inputs=E('div','lxp-tool-inputs');node.append(form);const fields={};
      for(const descriptor of [{id:'f',label:'f(x)',type:'text',value:'x^2'},{id:'g',label:'g(x) (valgfri)',type:'text',value:''},{id:'xmin',label:'X minimum',type:'number',value:'-5'},{id:'xmax',label:'X maksimum',type:'number',value:'5'},{id:'ymin',label:'Y minimum',type:'number',value:'-2'},{id:'ymax',label:'Y maksimum',type:'number',value:'10'}])fields[descriptor.id]=field(inputs,descriptor);
      const button=B('lxp-primary-button','Tegn graf',()=>{},'Tegn graf');button.type='submit';form.append(inputs,button,output);let ran=false;
      function draw(){try{const xmin=M.number(fields.xmin.value),xmax=M.number(fields.xmax.value),ymin=M.number(fields.ymin.value),ymax=M.number(fields.ymax.value);if(xmin>=xmax||ymin>=ymax)M.fail('Minimum skal være mindre end maksimum på begge akser.');M.finite(xmax-xmin);M.finite(ymax-ymin);const funcs=[['f',fields.f.value.trim()],['g',fields.g.value.trim()]].filter(([,f])=>f).map(([name,formula])=>({name,formula,evaluate:M.compile(formula,prefs().angle==='deg')}));if(!funcs.length)M.fail('Skriv mindst én funktion.');
        // Validate syntax separately; domains may legitimately be undefined in parts of a plot.

        const ns='http://www.w3.org/2000/svg',svg=(tag,attrs)=>{const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e;};
        const chart=svg('svg',{viewBox:'0 0 760 380',role:'img','aria-label':'Funktionsgraf med x- og y-akser',class:'lxp-function-chart'}),plot={x:65,y:20,w:670,h:310};
        const px=x=>plot.x+(x-xmin)/(xmax-xmin)*plot.w,py=y=>plot.y+(ymax-y)/(ymax-ymin)*plot.h;
        for(let i=0;i<=10;i++){const x=xmin+(xmax-xmin)*i/10,y=ymin+(ymax-ymin)*i/10;
          if(prefs().grid){chart.append(svg('line',{x1:px(x),x2:px(x),y1:plot.y,y2:plot.y+plot.h,class:'lxp-graph-grid'}),svg('line',{x1:plot.x,x2:plot.x+plot.w,y1:py(y),y2:py(y),class:'lxp-graph-grid'}));}
          if(i%2===0){const tx=svg('text',{x:px(x),y:355,'text-anchor':'middle'});tx.textContent=format(x);const ty=svg('text',{x:57,y:py(y)+4,'text-anchor':'end'});ty.textContent=format(y);chart.append(tx,ty);}}
        if(xmin<=0&&xmax>=0)chart.append(svg('line',{x1:px(0),x2:px(0),y1:plot.y,y2:plot.y+plot.h,class:'lxp-graph-axis'}));
        if(ymin<=0&&ymax>=0)chart.append(svg('line',{x1:plot.x,x2:plot.x+plot.w,y1:py(0),y2:py(0),class:'lxp-graph-axis'}));
        const table=E('table','lxp-tool-table'),head=E('tr','',E('th','','x'),...funcs.map(f=>E('th','',f.name+'(x) = '+f.formula)));table.append(E('thead','',head));const body=E('tbody');
        funcs.forEach((f,index)=>{let path='',previous=null;for(let i=0;i<=600;i++){const x=xmin+(xmax-xmin)*i/600;let y;try{y=f.evaluate(x)}catch{previous=null;continue;}if(y<ymin||y>ymax){previous=null;continue;}const point=[px(x),py(y)];const connect=previous&&Math.abs(point[1]-previous[1])<plot.h*0.5;path+=(connect?'L':'M')+point[0].toFixed(2)+' '+point[1].toFixed(2)+' ';previous=point;}chart.append(svg('path',{d:path,fill:'none','stroke-width':2.5,class:f.name==='g'?'lxp-graph-second':'lxp-graph-first'}));});
        for(let i=0;i<=10;i++){const x=xmin+(xmax-xmin)*i/10;const row=E('tr','',E('td','',format(x)));for(const f of funcs){let value;try{value=format(f.evaluate(x))}catch{value='Ikke defineret'}row.append(E('td','',value));}body.append(row);}table.append(body);
        const axisLegend=E('p','lxp-settings-help','Vandret: x · Lodret: y · f: temafarve · g: blå');output.dataset.error='false';output.replaceChildren(chart,axisLegend,E('div','lxp-tool-table-wrap',table));if(![...chart.querySelectorAll('path')].some(path=>path.getAttribute('d')))output.prepend(E('p','lxp-settings-help','Ingen punkter kan vises i dette interval. Kontrollér funktionen og aksernes grænser.'));ran=true;
      }catch(e){error(output,e.message);}}
      form.addEventListener('submit',e=>{e.preventDefault();draw()});form.addEventListener('input',()=>{ran=false;output.replaceChildren(E('p','lxp-settings-help','Input er ændret. Tryk Tegn graf.'));});
      help('Brug x, ^, sqrt, sin, cos, tan, ln, log og pi. Grafer er numeriske stikprøver; brug værditabellen og beregning til præcise løsninger. Vinkeltilstanden følger Indstillinger.');return {node,refresh(){if(ran)draw()}};
    }
    if(id==='units'){
      const category=select('category','Størrelse',Object.entries(M.units).map(([key,u])=>[key,u.label]));const value=numeric('value','Værdi',1),from=select('from','Fra',[]),to=select('to','Til',[]);let ran=false;
      function options(){const units=Object.keys(M.units[category.value].values);for(const input of [from,to]){input.replaceChildren(...units.map(u=>new Option(u,u)));}to.selectedIndex=Math.min(1,units.length-1);output.replaceChildren();ran=false;}
      function calculate(){const input=M.number(value.value),result=M.convert(input,category.value,from.value,to.value);showResult(output,{rows:[['Resultat',result,to.value]],visual:{type:'units',v:{value:input,from:from.value,to:to.value,result}}});ran=true;}
      category.addEventListener('change',options);for(const input of [value,from,to])for(const event of ['input','change'])input.addEventListener(event,()=>{ran=false;output.replaceChildren(E('p','lxp-settings-help','Værdierne er ændret. Tryk Omregn.'));});options();run('Omregn',calculate);node.append(output);return {node,refresh(){if(ran)calculate()}};
    }
    if(id==='text'){
      const input=text('text','Din tekst','','textarea');input.maxLength=50000;const speed=numeric('speed','Læsehastighed (ord pr. minut)',200);
      function calculate(){try{const wpm=M.positive(M.number(speed.value));const words=input.value.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)||[],counts=new Map();for(const word of words){const lower=word.toLocaleLowerCase('da-DK');counts.set(lower,(counts.get(lower)||0)+1);}const top=[...counts].filter(([word])=>word.length>2).sort((a,b)=>b[1]-a[1]).slice(0,8);
        showResult(output,{rows:[['Ord',words.length],['Tegn med mellemrum',[...input.value].length],['Tegn uden mellemrum',[...input.value.replace(/\s/g,'')].length],['Anslået læsetid',words.length/wpm,'min'],['Hyppige ord',top.map(([word,count])=>`${word} (${count})`).join(', ')||'—']],steps:['Læsetid = antal ord / valgte ord pr. minut.','Ord og læsetid er vejledende; værktøjet vurderer ikke grammatik eller faglig kvalitet.']});}catch(e){error(output,e.message);}}
      input.addEventListener('input',calculate);speed.addEventListener('input',calculate);node.append(output);calculate();return {node,refresh:calculate};
    }
    if(id==='sources'||id==='argument'){
      const prompts=id==='sources'?['Hvilken kilde undersøger du?','Hvem står bag, og hvilke kompetencer har de?','Hvornår er kilden lavet, og passer det til dit spørgsmål?','Hvilket formål og hvilken målgruppe har kilden?','Hvilke belæg og andre kilder henviser den til?','Hvilke interesser eller begrænsninger skal du tage højde for?','Hvad kan du bruge kilden til i netop din opgave?']:['Hvad er din påstand?','Hvilket konkret belæg støtter den?','Hvorfor understøtter belægget din påstand (hjemmel)?','Hvilken dokumentation støtter hjemlen (rygdækning)?','Hvor sikkert gælder påstanden (styrkemarkør)?','Hvilke modargumenter eller undtagelser findes (gendrivelse)?'];
      const inputs=prompts.map((prompt,i)=>text('prompt-'+i,prompt,'','textarea'));
      run('Saml min skabelon',()=>{const draft=prompts.map((p,i)=>p+'\n'+(inputs[i].value.trim()||'Ikke udfyldt endnu.')).join('\n\n');output.replaceChildren(E('pre','lxp-generated-text',draft));});
      node.addEventListener('input',()=>output.replaceChildren(E('p','lxp-settings-help','Svarene er ændret. Saml skabelonen igen.')));
      help('Dine egne svar sættes sammen til en arbejdskladde. Der foretages ingen automatisk vurdering af kilden eller argumentets sandhed.');node.append(output);return {node};
    }
    if(id==='notes'){
      const note=text('notes','Mine egne noter',prefs().notes,'textarea');note.maxLength=20000;note.rows=16;let base=prefs().notes,changed=false;
      note.addEventListener('input',()=>{changed=true;output.textContent='Noten er ændret. Tryk Gem note.';});
      const saveNote=B('lxp-primary-button','Gem note',async()=>{if(prefs().notes!==base&&changed){output.textContent='Noten er ændret i en anden fane. Kopiér din tekst, og genåbn siden for at hente den nyeste version.';return;}const draft=note.value;saveNote.disabled=true;try{if(await save({notes:draft})!==false){base=draft;changed=note.value!==draft;output.textContent=changed?'Den tidligere tekst er gemt. Dine nye ændringer er ikke gemt endnu.':'Noten er gemt.';}}finally{saveNote.disabled=false;}},'Gem note');
      node.append(saveNote,output);help('Gemte noter ligger lokalt og kommer med i din backup. Ug emte indtastninger mistes ved genindlæsning.'.replace('Ug emte','Ugemte'));
      return {node,refresh(){if(!changed){note.value=prefs().notes;base=prefs().notes;}}};
    }
    if(id==='flashcards'){
      const question=text('question','Spørgsmål'),answer=text('answer','Svar','','textarea');question.maxLength=1000;answer.maxLength=2000;
      const status=E('p','lxp-settings-help'),card=E('div','lxp-flashcard');let index=0,revealed=false,removed=null;
      let writing=false;
      async function changeCards(action){if(writing)return;writing=true;addButton.disabled=true;remove.disabled=true;undo.disabled=true;try{await action();}finally{writing=false;addButton.disabled=false;undo.disabled=false;draw();}}
      async function add(){if(!question.value.trim()||!answer.value.trim()){error(output,'Udfyld både spørgsmål og svar.');return;}if(prefs().cards.length>=100){error(output,'Du kan have op til 100 kort.');return;}
        const q=question.value,a=answer.value;if(await save({cards:[...prefs().cards,{question:q.trim(),answer:a.trim()}]})!==false){if(question.value===q)question.value='';if(answer.value===a)answer.value='';index=prefs().cards.length-1;revealed=false;draw();}}
      const addButton=B('lxp-primary-button','Tilføj flashcard',()=>changeCards(add),'Tilføj kort');
      const flip=B('lxp-secondary-button','Vend flashcard',()=>{revealed=!revealed;draw()},'Vis svar'),prev=B('lxp-small-action','Forrige flashcard',()=>{index--;revealed=false;draw()},'←'),next=B('lxp-small-action','Næste flashcard',()=>{index++;revealed=false;draw()},'→');
      const random=B('lxp-small-action','Tilfældigt flashcard',()=>{index=Math.floor(Math.random()*prefs().cards.length);revealed=false;draw()},'Tilfældigt kort');
      const remove=B('lxp-secondary-button','Fjern flashcard',()=>changeCards(async()=>{const cards=[...prefs().cards];const item=cards.splice(index,1)[0];if(item&&await save({cards})!==false){removed={item,index};revealed=false;draw();}}),'Fjern dette kort');
      const undo=B('lxp-secondary-button','Fortryd fjernet flashcard',()=>changeCards(async()=>{if(!removed||prefs().cards.length>=100)return;const cards=[...prefs().cards];cards.splice(removed.index,0,removed.item);if(await save({cards})!==false){removed=null;draw();}}),'Fortryd fjernelse');
      function draw(){const cards=prefs().cards;index=cards.length?(index+cards.length)%cards.length:0;const item=cards[index];status.textContent=item?`Kort ${index+1} af ${cards.length}`:'Ingen kort endnu.';card.replaceChildren(E('small','',revealed?'Svar':'Spørgsmål'),E('p','',item?(revealed?item.answer:item.question):'Tilføj dit første kort ovenfor.'));flip.textContent=revealed?'Vis spørgsmål':'Vis svar';for(const b of [flip,prev,next,random,remove])b.disabled=!item||(writing&&b===remove);undo.hidden=!removed;reviewInfo();}
      const reviewStatus=E('p','lxp-settings-help'),ratings=E('div','lxp-widget-actions');
      const reviewKey=item=>JSON.stringify([item.question,item.answer]);
      function reviewInfo(){if(!globalThis.lectioPlusLabCore)return;const item=prefs().cards[index],reviews=prefs().lab.reviews,current=item&&reviews.find(r=>r.key===reviewKey(item)),due=prefs().cards.filter(item=>{const r=reviews.find(x=>x.key===reviewKey(item));return !r||Date.parse(r.due)<=Date.now()}).length;reviewStatus.textContent=`${due} kort klar til gentagelse. `+(current?`Dette kort: ${current.seen} vurderinger · næste gang ${new Date(current.due).toLocaleString('da-DK')}`:'Dette kort er ikke vurderet endnu.');ratings.hidden=!item||!revealed;}
      for(const [grade,label] of [['again','Svært – igen om 10 min'],['hard','Okay – gentag snart'],['easy','Let – længere interval']])ratings.append(B('lxp-small-action',label,()=>changeCards(async()=>{const item=prefs().cards[index];if(!item||!revealed)return;const key=reviewKey(item);await save(p=>{const previous=p.lab.reviews.find(x=>x.key===key);const record={id:previous?.id||globalThis.lectioPlusLab.uid(),key,...globalThis.lectioPlusLabCore.review(previous,grade)};return {lab:{...p.lab,reviews:[...p.lab.reviews.filter(x=>x.key!==key).slice(-99),record]}};});revealed=false;draw();}),label));
      const dueButton=B('lxp-secondary-button','Øv næste kort der er klar',()=>{const reviews=prefs().lab.reviews;const found=prefs().cards.findIndex(item=>{const r=reviews.find(x=>x.key===reviewKey(item));return !r||Date.parse(r.due)<=Date.now()});if(found<0){output.textContent='Alle kort har en senere gentagelsestid. Du kan stadig øve dem manuelt.';return;}index=found;revealed=false;draw();},'Øv kort der er klar');
      node.append(addButton,status,card,E('div','lxp-widget-actions',prev,flip,next,random,remove,undo),reviewStatus,ratings,dueButton,output);draw();return {node,refresh:draw};
    }
    if(id==='pomodoro'){
      let phase='work',remaining=prefs().workMinutes*60,deadline=0,interval=null,running=false;
      const display=E('div','lxp-timer-display'),phaseLabel=E('p','lxp-settings-help');
      const start=B('lxp-primary-button','Start eller pause studietimer',()=>{if(running){remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));clearInterval(interval);running=false;}else{if(!remaining)remaining=(phase==='work'?prefs().workMinutes:prefs().breakMinutes)*60;deadline=Date.now()+remaining*1000;running=true;interval=setInterval(tick,500);}draw();},'Start');
      const reset=B('lxp-secondary-button','Nulstil studietimer',()=>{clearInterval(interval);running=false;remaining=(phase==='work'?prefs().workMinutes:prefs().breakMinutes)*60;output.textContent='';draw()},'Nulstil');
      const mode=B('lxp-secondary-button','Skift mellem fokus og pause',()=>{phase=phase==='work'?'break':'work';reset.click()},'Skift til pause');
      function tick(){remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));if(!remaining){clearInterval(interval);running=false;output.textContent=phase==='work'?'Fokustiden er slut. Tid til en pause.':'Pausen er slut. Klar til næste session.';}draw();}
      function draw(){display.textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');phaseLabel.textContent=phase==='work'?'Fokustid':'Pause';start.textContent=running?'Pause timer':'Start';mode.textContent=phase==='work'?'Skift til pause':'Skift til fokus';}
      window.addEventListener('pagehide',()=>clearInterval(interval));window.addEventListener('pageshow',()=>{if(running){tick();if(running){clearInterval(interval);interval=setInterval(tick,500);}}});node.append(phaseLabel,display,E('div','lxp-widget-actions',start,reset,mode),output);help('Tiderne ændres under Indstillinger. Timeren fortsætter, når du skifter værktøj; den nulstilles ved genindlæsning. Ingen lyd eller systemnotifikationer.');draw();return {node};
    }
    if(id==='planner'){
      const amount=numeric('amount','Sider eller opgaver i alt',60),days=numeric('days','Studiedage til rådighed',7);
      node.addEventListener('input',()=>output.replaceChildren(E('p','lxp-settings-help','Værdierne er ændret. Lav læseplanen igen.')));
      run('Lav læseplan',()=>{const total=M.number(amount.value),count=M.number(days.value);if(!Number.isInteger(total)||total<1||total>100000||!Number.isInteger(count)||count<1||count>365)M.fail('Brug 1–100.000 sider/opgaver og 1–365 studiedage som hele tal.');const per=Math.floor(total/count),extra=total%count;let start=1;const rows=[];for(let i=0;i<count;i++){const n=per+(i<extra?1:0);rows.push(['Dag '+(i+1),n?`${n} · nr. ${start}–${start+n-1}`:'Repetition / fri']);start+=n;}showResult(output,{rows,visual:{type:'planner',rows},steps:['Mængden fordeles så jævnt som muligt. Ekstra enheder lægges på de første dage.','Planen ændrer ikke Lectio og opretter ingen kalenderaftaler.']});});node.append(output);return {node};
    }
    node.append(E('p','','Værktøjet kunne ikke åbnes.'));return {node};
  };
})();
