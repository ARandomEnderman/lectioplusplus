(() => {
  'use strict';
  globalThis.lectioPlusSchoolTools = ({ui,getPreferences,onChange}) => {
    const {element:E,button:B,icon}=ui,M=globalThis.lectioPlusMath,A=globalThis.lectioPlusAppearance;
    const {tools,categories}=globalThis.lectioPlusSchoolCatalog;
    const node=E('main','lxp-school-tools');node.id='lxp-tools';node.hidden=true;
    let activeId='',category='home',subgroup='all',initialized=false,settingsSignature;
    const panels=new Map(),controls=new Map(),toggles=new Map();
    const prefs=()=>getPreferences().toolbox;
    const viewFor=id=>prefs().toolViews?.[id]||prefs().view;
    let fieldSerial=0;
    let saveQueue = Promise.resolve();
    function save(changes){const write=async()=>{const next=typeof changes==='function'?changes(prefs()):changes;if(next.workspaces){const values=Object.values(next.workspaces);if(values.length>256||values.some(v=>typeof v!=='string'||v.length>100000)||values.reduce((n,v)=>n+v.length,0)>2500000)throw Error('Dine gemte arbejdsområder fylder for meget. Eksportér og forkort et større arbejdsområde først. Den nye kladde er stadig åben.');}const saved=await onChange({toolbox:{...prefs(),...next}});notice.textContent=saved===false?'Kunne ikke gemme ændringen. Prøv igen.':'Gemt på denne enhed.';if(saved===false){settingsSignature=undefined;update(!node.hidden);}return saved;};const result=saveQueue.then(write);saveQueue=result.catch(()=>{});return result;}
    const format=(v)=>Array.isArray(v)?'('+v.map(format).join('; ')+')':typeof v==='number'?(Math.abs(v)>0&&(Math.abs(v)<10**(-Number(prefs().decimals))||Math.abs(v)>=1e10)?v.toExponential(Number(prefs().decimals)):v.toLocaleString(prefs().language==='en'?'en-GB':'da-DK',{maximumFractionDigits:Number(prefs().decimals)})):String(v);
    const notice=E('p','lxp-tool-notice');notice.setAttribute('role','status');
    const settings=E('section','lxp-tool-settings');settings.hidden=true;settings.id='lxp-tool-settings';
    const settingsButton=B('lxp-secondary-button','Indstillinger for Hjælpemidler',()=>{settings.hidden=!settings.hidden;settingsButton.setAttribute('aria-expanded',String(!settings.hidden));},icon('settings'),'Indstillinger');
    settingsButton.setAttribute('aria-controls',settings.id);settingsButton.setAttribute('aria-expanded','false');
    function field(parent,descriptor){
      const input=E(descriptor.type==='select'?'select':descriptor.type==='textarea'?'textarea':'input','lxp-setting-control');input.setAttribute('aria-label',descriptor.label);
      if(descriptor.type==='select')descriptor.options.forEach(([v,label])=>input.append(new Option(label,v)));
      else if(descriptor.type==='textarea'){input.rows=5;input.maxLength=descriptor.maxLength||12000;}
      else {input.type='text';input.maxLength=descriptor.maxLength||500;if(descriptor.type==='number')input.inputMode='decimal';}
      input.dataset.field=descriptor.id||'';input.value=descriptor.value??'';
      const hint=E('small','lxp-field-hint');hint.id='lxp-field-hint-'+(++fieldSerial);
      const wrap=E('label','lxp-tool-field',E('span','',descriptor.label),input,hint);parent.append(wrap);describeField(input,descriptor);return input;
    }
    function describeField(input,f){
      const hint=input.closest('label').querySelector('.lxp-field-hint');if(!hint)return;
      const parts=[f.help,f.optional?'Valgfrit – kan stå tomt.':'',f.integer?'Brug et helt tal.':'',f.min!==undefined?`${f.exclusive?'Større end':'Mindst'} ${f.min}.`:'',f.max!==undefined?`Højst ${f.max}.`:''].filter(Boolean);
      hint.textContent=parts.join(' ');hint.hidden=!parts.length;
      if(parts.length)input.setAttribute('aria-describedby',hint.id);else input.removeAttribute('aria-describedby');
      if(f.type!=='select'&&f.value!==undefined&&f.value!=='')input.placeholder='Fx '+f.value;
    }
    // Visible rows feed the original inputs, preserving calculations, presets and imports.
    function dataEditor(parent,columns,{label='Dine målinger',rowLabel='Række',max=1000,newValues=[]}={}){
      const box=E('section','lxp-data-editor'),title=E('h3','',label),table=E('table','lxp-data-table'),head=E('thead'),body=E('tbody');
      table.setAttribute('aria-label',label);head.append(E('tr','',E('th','','Nr.'),...columns.map(c=>E('th','',c.label)),E('th','','Handling')));table.append(head,body);
      const raw=E('details','lxp-data-raw',E('summary','','Indsæt eller redigér som tekst'));
      for(const c of columns)raw.append(c.input.closest('label'));
      const note=E('p','lxp-settings-help','Ét tal i hvert felt. Komma eller punktum kan bruges som decimaltegn.');
      const status=E('p','lxp-tool-notice');status.setAttribute('role','status');
      let rows=[],syncing=false;
      const tokens=value=>String(value).trim().split(/[;\n\s]+/).filter(Boolean);
      function fromRaw(){const lists=columns.map(c=>tokens(c.input.value));rows=Array.from({length:Math.max(1,...lists.map(x=>x.length))},(_,i)=>columns.map((_,j)=>lists[j][i]??''));draw();}
      function write(){syncing=true;columns.forEach((c,j)=>{c.input.value=rows.map(r=>r[j]).join('; ');c.input.dispatchEvent(new Event('input',{bubbles:true}));});syncing=false;}
      function draw(){body.replaceChildren();const shown=rows.slice(0,max);shown.forEach((row,i)=>{const tr=E('tr','',E('th','',String(i+1)));row.forEach((value,j)=>{const input=E('input','lxp-setting-control');input.type='text';input.inputMode='decimal';input.value=value;input.maxLength=80;input.setAttribute('aria-label',`${columns[j].label}, ${rowLabel.toLowerCase()} ${i+1}`);input.dataset.row=String(i);input.dataset.column=String(j);input.addEventListener('input',()=>{rows[i][j]=input.value;input.removeAttribute('aria-invalid');write();});tr.append(E('td','',input));});tr.append(E('td','',B('lxp-small-action',`Fjern ${rowLabel.toLowerCase()} ${i+1}`,()=>{rows.splice(i,1);if(!rows.length)rows=[columns.map(()=> '')];write();draw();body.querySelector('input')?.focus();},'Fjern')));body.append(tr);});add.disabled=rows.length>=max;status.textContent=rows.length>max?`Der er for mange rækker. Højst ${max}. Ret teksten nedenunder.`:'';}
      const add=B('lxp-secondary-button','Tilføj '+rowLabel.toLowerCase(),()=>{if(rows.length>=max)return;rows.push(columns.map((_,i)=>newValues[i]||''));write();draw();body.lastElementChild?.querySelector('input')?.focus();},'＋ Tilføj '+rowLabel.toLowerCase());
      box.append(title,note,E('div','lxp-data-scroll',table),add,status,raw);parent.append(box);
      for(const c of columns)for(const event of ['input','change'])c.input.addEventListener(event,()=>{if(!syncing)fromRaw();});
      fromRaw();
      return {node:box,refresh:fromRaw,validate(){if(rows.length>max)throw Error(`Brug højst ${max} rækker.`);for(let i=0;i<rows.length;i++)for(let j=0;j<columns.length;j++){try{M.number(rows[i][j]);}catch{const input=body.querySelector(`[data-row="${i}"][data-column="${j}"]`);input?.setAttribute('aria-invalid','true');const error=Error(`${rowLabel} ${i+1}, ${columns[j].label}: skriv et tal, eller fjern rækken.`);error.input=input;throw error;}}}};
    }
    function setting(key,label,choices){const row=E('label','lxp-setting-row',E('span','',label));let input;
      if(choices){input=E('select','lxp-setting-control');choices.forEach(([v,t])=>input.append(new Option(t,v)));row.append(input);}
      else {input=E('input');input.type='checkbox';const toggle=A.toggle(input);toggles.set(key,toggle);row.append(toggle.node);}
      input.setAttribute('aria-label',label);input.addEventListener('change',()=>save({[key]:choices?input.value:input.checked}));settings.append(row);controls.set(key,input);
    }
    settings.append(E('h2','','Indstillinger for dine værktøjer'),E('p','lxp-settings-help','Valgene gælder kun Hjælpemidler og gemmes på denne enhed. Beregninger afrundes først, når resultatet vises.'));
    setting('language','Sprog i Hjælpemidler',[['da','Dansk'],['en','English'],['mixed','Dansk + engelske værktøjsnavne']]);
    setting('decimals','Antal decimaler',[['2','2'],['4','4'],['6','6'],['8','8'],['10','10']]);
    setting('angle','Lommeregner og graf: vinkler',[['deg','Grader (DEG)'],['rad','Radianer (RAD)']]);
    for(const [key,label] of [['visuals','Vis illustrationer af beregninger'],['steps','Vis formler og mellemregninger'],['grid','Vis gitter i grafen'],['compact','Kompakt værktøjsoversigt'],['autoCalculate','Beregn automatisk efter ændringer'],['remember','Husk seneste værktøj']])setting(key,label);
    const timerFields=E('div','lxp-tool-inputs');
    for(const [key,label,max] of [['workMinutes','Fokustid (minutter)',120],['breakMinutes','Pause (minutter)',60]]){
      const input=field(timerFields,{id:key,label,type:'number'});controls.set(key,input);
      input.addEventListener('change',()=>{try{const value=M.number(input.value);if(!Number.isInteger(value)||value<1||value>max)M.fail(`Vælg et helt antal minutter mellem 1 og ${max}.`);void save({[key]:value});}catch(error){notice.textContent=error.message;input.value=prefs()[key];}});
    }
    settings.append(timerFields,E('p','lxp-settings-help','Nye tider bruges, når du nulstiller timeren eller starter næste session. Egne noter og flashcards kommer med i Indstillinger → Backup.'));
    const heading=E('header','lxp-tools-heading',E('div','',E('span','lxp-tools-eyebrow','DIN VÆRKTØJSKASSE'),E('h1','','Hjælpemidler'),E('p','','Hvad skal du arbejde med? Vælg et fag, eller søg efter din opgave.')),settingsButton);
    const search=E('input','lxp-tool-search');search.type='search';search.placeholder='Søg fx lommeregner, ioner eller komma…';search.setAttribute('aria-label','Søg i Hjælpemidler');
    const clearSearch=B('lxp-small-action','Ryd værktøjssøgning',()=>{search.value='';drawCatalog();search.focus();},'Ryd');clearSearch.hidden=true;
    const searchbar=E('div','lxp-tool-searchbar',icon('search'),search,clearSearch);
    const filters=E('nav','lxp-tool-categories');filters.setAttribute('aria-label','Fag og kategorier');
    for(const [id,label] of [['home','Overblik'],...categories]){const button=B('lxp-small-action',`Kategori: ${label}`,()=>{category=id;subgroup='all';drawCatalog();},label);button.dataset.category=id;filters.append(button);}
    const subcategories=E('div','lxp-tool-subcategories'),subSelect=E('select','lxp-setting-control');subSelect.setAttribute('aria-label','Emne i faget');subcategories.append(E('label','lxp-tool-field',E('span','','Vælg emne'),subSelect));subSelect.addEventListener('change',()=>{subgroup=subSelect.value;drawCatalog();});
    const subjects={
      math:['chart','Regn, tegn grafer og undersøg tal.'],
      chemistry:['grid','Atomer, ioner, molekyler og reaktioner.'],
      physics:['settings','Bevægelse, energi, kredsløb og enheder.'],
      ...(globalThis.lectioPlusExpanded?{biology:['book','Genetik, celler, enzymer og økologi.'],programming:['grid','Python, kodeøvelser, web og databaser.']}:{}),
      language:['message','Arbejd med tekst, sprog og argumenter.'],
      study:['book','Noter, formler og planlægning af din tid.']
    };
    const subjectGrid=E('div','lxp-tool-subjects');
    for(const [id,label] of categories.filter(([id])=>subjects[id])){
      const [symbol,description]=subjects[id];
      const card=B('lxp-tool-subject',`Vis værktøjer til ${label}`,()=>{category=id;subgroup='all';drawCatalog();resultsTitle.focus();},
        icon(symbol),E('strong','',label),E('span','',description),E('small','',`${tools.filter(t=>t.category===id).length} værktøjer`));
      card.dataset.subject=id;subjectGrid.append(card);
    }
    const subjectSection=E('section','lxp-tool-subject-section',E('h2','','Vælg et fag'),subjectGrid);
    const resultsTitle=E('h2','','Kom hurtigt i gang');resultsTitle.tabIndex=-1;
    const grid=E('div','lxp-tools-grid'),count=E('p','lxp-settings-help');count.setAttribute('role','status');
    const showAll=B('lxp-secondary-button','Vis alle værktøjer',()=>{category='all';search.value='';drawCatalog();resultsTitle.focus();},'Vis alle værktøjer');
    const catalog=E('section','lxp-tool-catalog',searchbar,filters,subcategories,subjectSection,E('div','lxp-tool-results-header',resultsTitle,count),grid,showAll),workspace=E('section','lxp-tool-workspace');workspace.hidden=true;
    const back=E('a','lxp-secondary-button','← Til oversigten');back.href='#lxp-tools/all';
    const toolTitle=E('h2'),toolDescription=E('p','lxp-settings-help'),favorite=B('lxp-small-action','Markér værktøj som favorit',()=>{const ids=prefs().favorites;void save({favorites:ids.includes(activeId)?ids.filter(id=>id!==activeId):[...ids,activeId]});});
    const guide=E('p','lxp-tool-guide'),toolCategory=E('span','lxp-tool-category-label');
    const customize=E('section','lxp-tool-customize',E('h3','','Tilpas indtastning og layout'));
    customize.id='lxp-tool-customize';customize.hidden=true;
    const customizeButton=B('lxp-icon-button lxp-tool-customize-button','Indstillinger for dette værktøj',()=>{customize.hidden=!customize.hidden;customizeButton.setAttribute('aria-expanded',String(!customize.hidden));},icon('settings'));
    customizeButton.setAttribute('aria-controls',customize.id);customizeButton.setAttribute('aria-expanded','false');customizeButton.title='Indstillinger for dette værktøj';
    const stage=E('div','lxp-tool-stage');workspace.append(E('div','lxp-tool-topline',back,E('div','lxp-tool-top-actions',favorite,customizeButton)),toolCategory,toolTitle,toolDescription,guide,stage);
    const scope=E('select','lxp-setting-control');scope.setAttribute('aria-label','Tilpasningen gælder');scope.append(new Option('Alle værktøjer','all'),new Option('Kun dette værktøj','tool'));
    const scopeNote=E('p','lxp-settings-help'),viewControls=new Map(),viewFields=E('div','lxp-tool-view-fields');
    customize.append(E('label','lxp-tool-field',E('span','','Tilpasningen gælder'),scope),scopeNote);
    async function saveView(changes){const id=activeId,local=scope.value==='tool';await save(p=>{const current=local?(p.toolViews[id]||p.view):p.view;return local?{toolViews:{...p.toolViews,[id]:{...current,...changes}}}:{view:{...current,...changes}};});}
    const presets=E('div','lxp-tool-layout-presets');
    for(const [name,changes,lines] of [
      ['Roligt',{layout:'stack',columns:'one',size:'large',guide:true,hints:true},'Ét felt ad gangen ned gennem siden'],
      ['Side om side',{layout:'split',columns:'one',size:'normal',guide:true,hints:true},'Indtastning og resultat ved siden af hinanden'],
      ['Kompakt',{layout:'split',columns:'two',size:'compact',guide:false,hints:false},'Flere felter og mindre afstand']
    ])presets.append(B('lxp-layout-choice','Brug layout: '+name,()=>void saveView(changes),E('strong','',name),E('span','',lines)));
    customize.append(presets,viewFields);
    for(const [key,label,choices] of [
      ['layout','Placering af felter og resultat',[['split','Side om side'],['stack','Under hinanden']]],
      ['columns','Felter pr. række',[['one','Ét felt'],['two','To felter']]],
      ['size','Størrelse på felter',[['compact','Kompakt'],['normal','Normal'],['large','Stor']]],
      ['width','Arbejdsområdets bredde',[['normal','Normal'],['wide','Bred']]],
      ['resultSide','Resultat i delt visning',[['right','Til højre'],['left','Til venstre']]],
      ['guide','Vis brugsvejledning'],['hints','Vis hjælp ved felterne'],['working','Fold mellemregninger ud automatisk']
    ]){const wrap=E('label','lxp-setting-row',E('span','',label));let input,toggle;
      if(choices){input=E('select','lxp-setting-control');choices.forEach(([v,t])=>input.append(new Option(t,v)));wrap.append(input);}
      else{input=E('input');input.type='checkbox';toggle=A.toggle(input);wrap.append(toggle.node);}
      input.setAttribute('aria-label',label);input.addEventListener('change',()=>void saveView({[key]:choices?input.value:input.checked}));viewControls.set(key,{input,toggle});viewFields.append(wrap);
    }
    const resetView=B('lxp-secondary-button','Brug fælles layout for dette værktøj',()=>{const id=activeId;void save(p=>{const next={...p.toolViews};delete next[id];return {toolViews:next};});},'Brug fælles layout');
    customize.append(resetView,E('p','lxp-settings-help','Ændringer vises med det samme og gemmes på denne enhed. Specialværktøjer beholder deres nødvendige grupper og byggefelter. På smalle skærme står resultatet under felterne.'));
    workspace.insertBefore(customize,guide);
    scope.addEventListener('change',syncViewEditor);
    function syncViewEditor(){const own=Boolean(prefs().toolViews?.[activeId]);const view=scope.value==='tool'?viewFor(activeId):prefs().view;
      for(const [key,{input,toggle}]of viewControls){if(toggle)toggle.sync(view[key]);else input.value=view[key];}
      viewControls.get('resultSide').input.disabled=view.layout==='stack';resetView.hidden=!own;scopeNote.textContent=own?'Dette værktøj har sit eget layout. Vælg Kun dette værktøj for at ændre det.':'Dette værktøj følger det fælles layout. Vælg Kun dette værktøj for at lave en undtagelse.';
    }
    function stylePanel(id,panel){const view=viewFor(id);for(const [key,value]of Object.entries(view))panel.node.dataset['view'+key[0].toUpperCase()+key.slice(1)]=String(value);panel.node.dataset.toolId=id;
      const signature=JSON.stringify(view);if(panel.viewSignature!==signature){panel.viewSignature=signature;panel.node.querySelectorAll('.lxp-tool-explanation').forEach(n=>n.open=view.working);}
    }
    node.append(heading,settings,notice,catalog,workspace);
    search.addEventListener('input',drawCatalog);
    const searchText=value=>String(value).toLocaleLowerCase('da-DK').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/æ/g,'ae').replace(/ø/g,'o');
    function toolCard(tool){const link=E('a','lxp-tool-card',
      E('span','lxp-tool-card-top',icon(subjects[tool.category]?.[0]||'grid'),E('span','lxp-tool-category-label',categories.find(([id])=>id===tool.category)?.[1]||'')),
      E('h3','',tool.title),E('p','',tool.description),E('span','lxp-tool-card-action',prefs().favorites.includes(tool.id)?'★ Favorit · Åbn →':'Åbn værktøj →'));link.href='#lxp-tools/'+tool.id;link.dataset.tool=tool.id;return link;}
    function drawCatalog(){const q=searchText(search.value).trim();const favorites=prefs().favorites;
      const home=category==='home'&&!q;
      const groups=[...new Set(tools.filter(t=>t.category===category).map(t=>t.group||'Grundværktøjer'))];subcategories.hidden=!globalThis.lectioPlusExpanded||groups.length<2;subSelect.replaceChildren(new Option('Alle emner','all'),...groups.map(g=>new Option(g,g)));if(!groups.includes(subgroup))subgroup='all';subSelect.value=subgroup;
      let visible=tools.filter(tool=>(['home','all'].includes(category)||(category==='favorites'?favorites.includes(tool.id):tool.category===category))&&(subgroup==='all'||(tool.group||'Grundværktøjer')===subgroup)&&q.split(/\s+/).every(word=>searchText(`${tool.title} ${tool.description} ${tool.group||''} ${tool.keywords||''} ${categories.find(([id])=>id===tool.category)?.[1]||''} ${globalThis.lectioPlusSchoolLanguage.translate(tool.title,'en')} ${globalThis.lectioPlusSchoolLanguage.translate(tool.description,'en')}`).includes(word)));
      if(home){const ids=[...favorites,'basic','graph','periodic','ions','translate','notes'];visible=[...new Set(ids)].slice(0,6).map(id=>tools.find(t=>t.id===id)).filter(Boolean);}
      for(const b of filters.children)b.setAttribute('aria-pressed',String(b.dataset.category===category));
      clearSearch.hidden=!search.value;subjectSection.hidden=!home;showAll.hidden=!home;
      resultsTitle.textContent=home?(favorites.length?'Dine genveje':'Kom hurtigt i gang'):q?'Søgeresultater':categories.find(([id])=>id===category)?.[1]||'Alle værktøjer';
      count.textContent=home?'Favoritter vises først her.':`${visible.length} værktøjer${q?' matcher søgningen':''}`;
      grid.replaceChildren(...visible.map(toolCard));
      if(!visible.length){const empty=E('div','lxp-tool-empty',E('strong','','Ingen værktøjer fundet'),E('p','',category==='favorites'?'Du har ingen matchende favoritter. Åbn et værktøj og tryk på stjernen.':'Prøv fx procent, molarmasse eller oversæt.'));
        if(q&&!['all','home'].includes(category))empty.append(B('lxp-secondary-button','Søg i alle fag',()=>{category='all';drawCatalog();resultsTitle.focus();},'Søg i alle fag'));
        grid.append(empty);}
    }
    function showResult(target,result){target.replaceChildren();target.dataset.error='false';
      const rows=E('dl','lxp-tool-results');
      for(const [label,value,unit=''] of result.rows){if(typeof value==='number')M.finite(value);rows.append(E('div','',E('dt','',label),E('dd','',format(value)+(unit?' '+unit:''))));}
      target.append(E('h3','lxp-result-heading','Dit resultat'));
      if(prefs().visuals&&result.visual){try{const visual=globalThis.lectioPlusSchoolVisual?.(result.visual);if(visual)target.append(visual);}catch{target.append(E('p','lxp-settings-help','Tallene er beregnet, men intervallet er for stort til en pålidelig illustration.'));}}
      target.append(rows);
      if(result.reference){const link=E('a','lxp-text-link','Se stoffets reference i PubChem ↗');link.href=result.reference;link.target='_blank';link.rel='noopener noreferrer';target.append(link);}
      if(result.rows.some(([,v])=>typeof v==='number'&&!Number.isInteger(v)))target.append(E('p','lxp-settings-help','Tal vises afrundet efter dine indstillinger. Mellemregninger bruger den fulde beregningspræcision.'));
      if(prefs().steps&&result.steps?.length){const details=E('details','lxp-tool-explanation',E('summary','','Sådan beregnes det'));details.open=viewFor(target.closest('[data-tool-id]')?.dataset.toolId||activeId).working;for(const step of result.steps)details.append(E('p','',step));target.append(details);}
    }
    function error(target,message){target.replaceChildren(E('p','lxp-tool-error',message));target.dataset.error='true';}
    function generic(tool){const form=E('form','lxp-tool-form'),inputs=E('div','lxp-tool-inputs'),output=E('div','lxp-tool-output'),values=new Map();let ran=false,timer;
      output.setAttribute('role','status');output.setAttribute('aria-live','polite');
      for(const descriptor of tool.fields)values.set(descriptor.id,field(inputs,descriptor));
      let tableEditor;
      if(tool.id==='statistics')tableEditor=dataEditor(inputs,[{input:values.get('data'),label:'Værdi'}],{label:'Indtast dine tal'});
      if(tool.id==='regression')tableEditor=dataEditor(inputs,[{input:values.get('xs'),label:'X'},{input:values.get('ys'),label:'Y'}],{label:'Målepunkter – X og Y på samme række'});
      const raw=()=>Object.fromEntries([...values].map(([id,input])=>[id,input.value]));
      function syncFields(){
        const data=raw(),descriptors=tool.fieldsFor?.(data)||tool.fields;
        for(const descriptor of descriptors){const input=values.get(descriptor.id),wrap=input.closest('label');wrap.hidden=Boolean(descriptor.hidden);input.disabled=Boolean(descriptor.hidden);wrap.firstElementChild.textContent=descriptor.label;input.setAttribute('aria-label',descriptor.label);describeField(input,descriptor);}
        if(tool.id==='ions'){
          const positive=values.get('positive').value,negative=values.get('negative');
          for(const option of negative.options)option.disabled=!globalThis.lectioPlusChemistry.compounds.some(c=>c.positive===positive&&c.negative===option.value);
          if(negative.selectedOptions[0]?.disabled)negative.value=[...negative.options].find(o=>!o.disabled)?.value||'';
        }
      }
      function calculate(focus=false){try{form.querySelectorAll('[aria-invalid]').forEach(n=>n.removeAttribute('aria-invalid'));tableEditor?.validate();showResult(output,tool.calculate(raw(),prefs()));ran=true;}catch(e){ran=false;error(output,e.message);const input=e.input||values.get(e.field);if(input){input.setAttribute('aria-invalid','true');if(focus){const details=input.closest('details');if(details)details.open=true;input.focus();}}}}
      const submit=B('lxp-primary-button','Beregn '+tool.title,()=>{},'Beregn');submit.type='submit';
      const reset=B('lxp-secondary-button','Indlæs eksempel i '+tool.title,()=>{clearTimeout(timer);form.querySelectorAll('[aria-invalid]').forEach(n=>n.removeAttribute('aria-invalid'));for(const f of tool.fields)values.get(f.id).value=f.value;syncFields();tableEditor?.refresh();ran=false;output.replaceChildren(E('p','lxp-settings-help','Eksemplet er indlæst. Tryk Beregn.'));},'Indlæs eksempel');
      const clear=B('lxp-secondary-button','Ryd værdier i '+tool.title,()=>{clearTimeout(timer);form.querySelectorAll('[aria-invalid]').forEach(n=>n.removeAttribute('aria-invalid'));for(const f of tool.fields)if(f.type!=='select')values.get(f.id).value='';syncFields();tableEditor?.refresh();ran=false;output.replaceChildren(E('p','lxp-settings-help','Skriv dine egne værdier. Eksemplet kan hentes igen.'));},'Ryd værdier');
      const actions=E('div','lxp-tool-actions',submit,reset,clear);
      const editor=E('section','lxp-tool-editor',E('h3','lxp-input-heading','Dine værdier'),E('p','lxp-input-intro','Felterne starter med et eksempel. Ret tallene til din opgave, eller vælg Ryd værdier.'),inputs,actions);if(tool.help)editor.append(E('p','lxp-settings-help',tool.help));form.append(editor,output);
      form.addEventListener('submit',event=>{event.preventDefault();calculate(true);});
      function changed(){clearTimeout(timer);syncFields();ran=false;output.replaceChildren(E('p','lxp-settings-help','Input er ændret. Tryk Beregn for et nyt resultat.'));if(prefs().autoCalculate)timer=setTimeout(calculate,350);}
      form.addEventListener('input',changed);form.addEventListener('change',changed);syncFields();
      output.append(E('p','lxp-settings-help','Tilpas eksempelværdierne, og tryk Beregn.'));
      return {node:form,refresh(){if(ran)calculate();}};
    }
    const language=globalThis.lectioPlusSchoolLanguage.attach(node,()=>prefs().language);
    const context={E,B,field,dataEditor,prefs,save,format,showResult,error,ui,getPreferences,onChange,openTool};
    function getPanel(id){
      if(!panels.has(id)){
        const tool=tools.find(t=>t.id===id);if(!tool)throw Error('Ukendt værktøj.');
        const panel=tool.special?globalThis.lectioPlusSchoolSpecial(id,context):generic(tool);
        if(['graph','units','text','sources','argument','planner'].includes(id)){
          const result=[...panel.node.children].find(n=>n.classList.contains('lxp-tool-output'));
          if(result){const editor=E('section','lxp-tool-editor',E('h3','lxp-input-heading','Dine værdier'));for(const child of [...panel.node.children])if(child!==result)editor.append(child);panel.node.prepend(editor);panel.node.classList.add('lxp-arranged-tool');}
        }
        if(['stoichiometry','circuits','precision','simulation','interactive'].includes(id))panel.node.classList.add('lxp-layout-lab');
        panels.set(id,panel);
      }
      return panels.get(id);
    }
    const dock=E('aside','lxp lxp-tool-dock');dock.hidden=true;dock.id='lxp-tool-dock';dock.setAttribute('aria-label','Værktøj ved siden af siden');
    const dockSelect=E('select','lxp-setting-control');dockSelect.setAttribute('aria-label','Værktøj i sidepanel');for(const tool of tools)dockSelect.append(new Option(tool.title,tool.id));dockSelect.value='basic';
    const dockStage=E('div','lxp-dock-stage'),dockWidth=E('input');dockWidth.type='range';dockWidth.min=320;dockWidth.max=760;dockWidth.step=20;dockWidth.value=440;dockWidth.setAttribute('aria-label','Sidepanelets bredde');dockWidth.addEventListener('input',()=>{dock.style.width=dockWidth.value+'px';document.documentElement.style.setProperty('--lxp-dock-width',dockWidth.value+'px');});
    const closeDock=B('lxp-small-action','Luk værktøjspanel',()=>{dock.hidden=true;document.body.classList.remove('lxp-dock-open');document.querySelector('[data-lxp-dock-button]')?.focus();},'Luk');
    dock.append(E('header','lxp-dock-header',E('strong','','Værktøjspanel'),closeDock),dockSelect,E('label','lxp-tool-field',E('span','','Bredde'),dockWidth),dockStage);
    function mountDock(){const panel=getPanel(dockSelect.value);stylePanel(dockSelect.value,panel);dockStage.replaceChildren(panel.node);panel.refresh?.();}
    dockSelect.addEventListener('change',mountDock);
    function toggleDock(){dock.hidden=!dock.hidden;document.body.classList.toggle('lxp-dock-open',!dock.hidden);if(!dock.hidden){mountDock();dockSelect.focus();}}
    function applyInputs(panel,values){
      for(const [id,value] of Object.entries(values||{})){const input=[...panel.node.querySelectorAll('[data-field]')].find(n=>n.dataset.field===id);if(!input||typeof value!=='string'||value.length>12000)continue;if(input.type==='checkbox')input.checked=value==='true';else input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}
    }
    function openTool(id,values){const panel=getPanel(id);if(!dock.hidden&&node.hidden){dockSelect.value=id;mountDock();if(values)applyInputs(panel,values);}else{location.hash='#lxp-tools/'+id;update(true);if(values)applyInputs(panel,values);}}
    const personalActions=E('details','lxp-tool-personal',E('summary','','Gem resultat eller værktøjsopsætning'));
    const nameInput=field(personalActions,{id:'preset-name',label:'Navn på opsætning',value:'',maxLength:80});
    const savedSelect=E('select','lxp-setting-control');savedSelect.setAttribute('aria-label','Gemte opsætninger for værktøjet');savedSelect.dataset.lxpUserContent='';personalActions.append(savedSelect);
    const noPreset=new Set(['notes','flashcards','report','board','worksheet','profiles','punctuation','translate','basic','formulas','glossary',...(globalThis.lectioPlusExpanded?.tools.filter(t=>!t.calculate).map(t=>t.id)||[])]);
    function presetOptions(){const previous=savedSelect.value;const records=prefs().lab?.presets?.filter(p=>p.tool===activeId)||[];savedSelect.replaceChildren(new Option('Vælg opsætning',''),...records.map(p=>new Option(p.title,p.id)));if(records.some(p=>p.id===previous))savedSelect.value=previous;nameInput.closest('label').hidden=noPreset.has(activeId);savedSelect.hidden=noPreset.has(activeId);for(const b of personalActions.querySelectorAll('[data-preset-action]'))b.hidden=noPreset.has(activeId);}
    function personalButton(label,fn,preset=false){const b=B('lxp-secondary-button',label,async()=>{if(b.disabled)return;b.disabled=true;try{await fn();}catch(e){notice.textContent=e.message;}finally{b.disabled=false;}},label);if(preset)b.dataset.presetAction='';personalActions.append(b);return b;}
    personalButton('Gem denne opsætning',async()=>{if(!nameInput.value.trim())throw Error('Giv opsætningen et navn.');if(prefs().lab.presets.length>=20)throw Error('Du kan gemme 20 opsætninger.');const fields=Object.fromEntries([...getPanel(activeId).node.querySelectorAll('[data-field]')].filter(n=>n.dataset.field&&!n.disabled).map(n=>[n.dataset.field,n.type==='checkbox'?String(n.checked):n.value]));const serialized=JSON.stringify(fields);if(serialized.length>20000)throw Error('Opsætningen er for stor.');const record={id:globalThis.lectioPlusLab.uid(),title:nameInput.value.trim(),tool:activeId,fields:serialized};if(await save(p=>({lab:{...p.lab,presets:[...p.lab.presets,record]}}))!==false){nameInput.value='';presetOptions();}},true);
    personalButton('Indlæs valgt opsætning',()=>{const record=prefs().lab.presets.find(p=>p.id===savedSelect.value&&p.tool===activeId);if(!record)throw Error('Vælg en gemt opsætning.');applyInputs(getPanel(activeId),JSON.parse(record.fields));notice.textContent='Opsætningen er indlæst. Kontrollér værdierne og beregn igen.';},true);
    personalButton('Slet valgt opsætning',async()=>{const selected=savedSelect.value;if(selected&&await save(p=>({lab:{...p.lab,presets:p.lab.presets.filter(x=>x.id!==selected)}}))!==false)presetOptions();},true);
    personalButton('Gem resultat på ark',async()=>{if(['worksheet','board','profiles','notes','report','punctuation','translate','basic','formulas','glossary','flashcards'].includes(activeId))throw Error('Brug denne funktion i et beregningsværktøj.');if(prefs().lab.sheets.length>=15)throw Error('Der er plads til 15 beregninger på arket.');const record=globalThis.lectioPlusLab.capture(getPanel(activeId).node,toolTitle.textContent);if(await save(p=>({lab:{...p.lab,sheets:[...p.lab.sheets,record]}}))!==false)notice.textContent='Resultatet er gemt i Mit beregningsark.';});
    personalButton('Åbn mit beregningsark',()=>openTool('worksheet'));
    if(globalThis.lectioPlusLab)workspace.append(personalActions);

    function update(visible){node.hidden=!visible;if(!getPreferences().enabled){dock.hidden=true;document.body.classList.remove('lxp-dock-open');}if(!visible)return;dock.hidden=true;document.body.classList.remove('lxp-dock-open');
      node.dataset.compact=String(prefs().compact);
      language.apply();
      const sig=JSON.stringify(prefs());if(sig!==settingsSignature){settingsSignature=sig;for(const [key,input] of controls){if(toggles.has(key))toggles.get(key).sync(prefs()[key]);else input.value=prefs()[key];}if(initialized)drawCatalog();}
      if(!initialized){initialized=true;drawCatalog();}
      let id=location.hash.slice('#lxp-tools'.length).replace(/^\//,'');if(!id&&prefs().remember)id=prefs().lastTool;
      const tool=tools.find(t=>t.id===id);catalog.hidden=Boolean(tool);workspace.hidden=!tool;node.dataset.page=tool?'workspace':'catalog';
      if(!tool){activeId='';return;}
      const changed=activeId!==tool.id;activeId=tool.id;
      toolTitle.textContent=tool.title;toolDescription.textContent=tool.description;favorite.textContent=prefs().favorites.includes(activeId)?'★ Favorit':'☆ Føj til favoritter';favorite.setAttribute('aria-pressed',String(prefs().favorites.includes(activeId)));
      toolCategory.textContent=categories.find(([id])=>id===tool.category)?.[1]||'';
      guide.replaceChildren(E('strong','','Sådan bruger du det: '),E('span','',tool.guide));
      if(changed){customize.hidden=true;customizeButton.setAttribute('aria-expanded','false');scope.value=prefs().toolViews?.[activeId]?'tool':'all';}
      syncViewEditor();guide.hidden=!viewFor(activeId).guide;workspace.dataset.width=viewFor(activeId).width;
      personalActions.hidden=noPreset.has(activeId);
      if(changed)personalActions.open=false;
      getPanel(activeId);presetOptions();
      const panel=panels.get(activeId);stylePanel(activeId,panel);if(stage.firstChild!==panel.node)stage.replaceChildren(panel.node);panel.refresh?.();
      if(changed&&prefs().remember&&prefs().lastTool!==activeId)void save({lastTool:activeId});
    }
    return {node,update,dockNode:dock,toggleDock,openTool,entries:tools.map(tool=>({href:'#lxp-tools/'+tool.id,label:tool.title,context:'Hjælpemidler',icon:'grid'}))};
  };
})();
