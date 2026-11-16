(() => {
  'use strict';
  globalThis.lectioPlusSchoolTools = ({ui,getPreferences,onChange}) => {
    const {element:E,button:B,icon}=ui,M=globalThis.lectioPlusMath,A=globalThis.lectioPlusAppearance;
    const {tools,categories}=globalThis.lectioPlusSchoolCatalog;
    const node=E('main','lxp-school-tools');node.id='lxp-tools';node.hidden=true;
    let activeId='',category='all',initialized=false,settingsSignature;
    const panels=new Map(),controls=new Map(),toggles=new Map();
    const prefs=()=>getPreferences().toolbox;
    let saveQueue = Promise.resolve();
    function save(changes){const write=async()=>{const saved=await onChange({toolbox:{...prefs(),...(typeof changes==='function'?changes(prefs()):changes)}});notice.textContent=saved===false?'Kunne ikke gemme ændringen. Prøv igen.':'Gemt på denne enhed.';if(saved===false){settingsSignature=undefined;update(!node.hidden);}return saved;};const result=saveQueue.then(write);saveQueue=result.catch(()=>{});return result;}
    const format=(v)=>Array.isArray(v)?'('+v.map(format).join('; ')+')':typeof v==='number'?(Math.abs(v)>0&&(Math.abs(v)<10**(-Number(prefs().decimals))||Math.abs(v)>=1e10)?v.toExponential(Number(prefs().decimals)):v.toLocaleString(prefs().language==='en'?'en-GB':'da-DK',{maximumFractionDigits:Number(prefs().decimals)})):String(v);
    const notice=E('p','lxp-tool-notice');notice.setAttribute('role','status');
    const settings=E('section','lxp-tool-settings');settings.hidden=true;settings.id='lxp-tool-settings';
    const settingsButton=B('lxp-secondary-button','Indstillinger for HjælpeMiddler',()=>{settings.hidden=!settings.hidden;settingsButton.setAttribute('aria-expanded',String(!settings.hidden));},icon('settings'),'Indstillinger');
    settingsButton.setAttribute('aria-controls',settings.id);settingsButton.setAttribute('aria-expanded','false');
    function field(parent,descriptor){
      const input=E(descriptor.type==='select'?'select':descriptor.type==='textarea'?'textarea':'input','lxp-setting-control');input.setAttribute('aria-label',descriptor.label);
      if(descriptor.type==='select')descriptor.options.forEach(([v,label])=>input.append(new Option(label,v)));
      else if(descriptor.type==='textarea'){input.rows=5;input.maxLength=descriptor.maxLength||12000;}
      else {input.type='text';input.maxLength=descriptor.maxLength||500;if(descriptor.type==='number')input.inputMode='decimal';}
      input.dataset.field=descriptor.id||'';input.value=descriptor.value??'';const wrap=E('label','lxp-tool-field',E('span','',descriptor.label),input);parent.append(wrap);return input;
    }
    function setting(key,label,choices){const row=E('label','lxp-setting-row',E('span','',label));let input;
      if(choices){input=E('select','lxp-setting-control');choices.forEach(([v,t])=>input.append(new Option(t,v)));row.append(input);}
      else {input=E('input');input.type='checkbox';const toggle=A.toggle(input);toggles.set(key,toggle);row.append(toggle.node);}
      input.setAttribute('aria-label',label);input.addEventListener('change',()=>save({[key]:choices?input.value:input.checked}));settings.append(row);controls.set(key,input);
    }
    settings.append(E('h2','','Indstillinger for dine værktøjer'),E('p','lxp-settings-help','Valgene gælder kun HjælpeMiddler og gemmes på denne enhed. Beregninger afrundes først, når resultatet vises.'));
    setting('language','Sprog i HjælpeMiddler',[['da','Dansk'],['en','English'],['mixed','Dansk + engelske værktøjsnavne']]);
    setting('decimals','Antal decimaler',[['2','2'],['4','4'],['6','6'],['8','8'],['10','10']]);
    setting('angle','Lommeregner og graf: vinkler',[['deg','Grader (DEG)'],['rad','Radianer (RAD)']]);
    for(const [key,label] of [['visuals','Vis illustrationer af beregninger'],['steps','Vis formler og mellemregninger'],['grid','Vis gitter i grafen'],['compact','Kompakt værktøjsoversigt'],['autoCalculate','Beregn automatisk efter ændringer'],['remember','Husk seneste værktøj']])setting(key,label);
    const timerFields=E('div','lxp-tool-inputs');
    for(const [key,label,max] of [['workMinutes','Fokustid (minutter)',120],['breakMinutes','Pause (minutter)',60]]){
      const input=field(timerFields,{id:key,label,type:'number'});controls.set(key,input);
      input.addEventListener('change',()=>{try{const value=M.number(input.value);if(!Number.isInteger(value)||value<1||value>max)M.fail(`Vælg et helt antal minutter mellem 1 og ${max}.`);void save({[key]:value});}catch(error){notice.textContent=error.message;input.value=prefs()[key];}});
    }
    settings.append(timerFields,E('p','lxp-settings-help','Nye tider bruges, når du nulstiller timeren eller starter næste session. Egne noter og flashcards kommer med i Indstillinger → Backup.'));
    const heading=E('header','lxp-tools-heading',E('div','',E('span','lxp-tools-eyebrow','DIN VÆRKTØJSKASSE'),E('h1','','HjælpeMiddler'),E('p','',`${tools.length} værktøjer til beregninger, opgaver og en bedre studiedag.`)),settingsButton);
    const search=E('input','lxp-tool-search');search.type='search';search.placeholder='Find et værktøj…';search.setAttribute('aria-label','Søg i HjælpeMiddler');
    const filters=E('nav','lxp-tool-categories');filters.setAttribute('aria-label','Fag og kategorier');
    for(const [id,label] of categories){const button=B('lxp-small-action',`Kategori: ${label}`,()=>{category=id;drawCatalog();},label);button.dataset.category=id;filters.append(button);}
    const grid=E('div','lxp-tools-grid'),count=E('p','lxp-settings-help');count.setAttribute('role','status');
    const catalog=E('section','lxp-tool-catalog',search,filters,count,grid),workspace=E('section','lxp-tool-workspace');workspace.hidden=true;
    const back=E('a','lxp-secondary-button','← Alle værktøjer');back.href='#lxp-tools/all';
    const toolTitle=E('h2'),toolDescription=E('p','lxp-settings-help'),favorite=B('lxp-small-action','Markér værktøj som favorit',()=>{const ids=prefs().favorites;void save({favorites:ids.includes(activeId)?ids.filter(id=>id!==activeId):[...ids,activeId]});});
    const stage=E('div','lxp-tool-stage');workspace.append(E('div','lxp-tool-topline',back,favorite),toolTitle,toolDescription,stage);
    node.append(heading,settings,notice,catalog,workspace);
    search.addEventListener('input',drawCatalog);
    function drawCatalog(){const q=search.value.toLocaleLowerCase('da-DK').trim();const favorites=prefs().favorites;
      const visible=tools.filter(tool=>(category==='all'||(category==='favorites'?favorites.includes(tool.id):tool.category===category))&&`${tool.title} ${tool.description} ${globalThis.lectioPlusSchoolLanguage.translate(tool.title,'en')} ${globalThis.lectioPlusSchoolLanguage.translate(tool.description,'en')}`.toLocaleLowerCase('da-DK').includes(q));
      for(const b of filters.children)b.setAttribute('aria-pressed',String(b.dataset.category===category));
      count.textContent=`${visible.length} værktøjer${q?' matcher søgningen':''}`;
      grid.replaceChildren(...visible.map(tool=>{const link=E('a','lxp-tool-card',E('span','lxp-tool-category-label',categories.find(([id])=>id===tool.category)?.[1]||''),E('h3','',tool.title),E('p','',tool.description),E('span','lxp-tool-card-action',favorites.includes(tool.id)?'★ Favorit · Åbn →':'Åbn værktøj →'));link.href='#lxp-tools/'+tool.id;link.dataset.tool=tool.id;return link;}));
      if(!visible.length)grid.append(E('p','lxp-empty',category==='favorites'?'Du har ingen matchende favoritter. Åbn et værktøj og tryk på stjernen.':'Ingen værktøjer matcher. Prøv et andet søgeord.'));
    }
    function showResult(target,result){target.replaceChildren();target.dataset.error='false';
      const rows=E('dl','lxp-tool-results');
      for(const [label,value,unit=''] of result.rows){if(typeof value==='number')M.finite(value);rows.append(E('div','',E('dt','',label),E('dd','',format(value)+(unit?' '+unit:''))));}
      target.append(E('h3','lxp-result-heading','Dit resultat'));
      if(prefs().visuals&&result.visual){try{const visual=globalThis.lectioPlusSchoolVisual?.(result.visual);if(visual)target.append(visual);}catch{target.append(E('p','lxp-settings-help','Tallene er beregnet, men intervallet er for stort til en pålidelig illustration.'));}}
      target.append(rows);
      if(result.reference){const link=E('a','lxp-text-link','Se stoffets reference i PubChem ↗');link.href=result.reference;link.target='_blank';link.rel='noopener noreferrer';target.append(link);}
      if(result.rows.some(([,v])=>typeof v==='number'&&!Number.isInteger(v)))target.append(E('p','lxp-settings-help','Tal vises afrundet efter dine indstillinger. Mellemregninger bruger den fulde beregningspræcision.'));
      if(prefs().steps&&result.steps?.length){const details=E('div','lxp-tool-explanation',E('h3','','Sådan beregnes det'));for(const step of result.steps)details.append(E('p','',step));target.append(details);}
    }
    function error(target,message){target.replaceChildren(E('p','lxp-tool-error',message));target.dataset.error='true';}
    function generic(tool){const form=E('form','lxp-tool-form'),inputs=E('div','lxp-tool-inputs'),output=E('div','lxp-tool-output'),values=new Map();let ran=false,timer;
      output.setAttribute('role','status');output.setAttribute('aria-live','polite');
      for(const descriptor of tool.fields)values.set(descriptor.id,field(inputs,descriptor));
      const raw=()=>Object.fromEntries([...values].map(([id,input])=>[id,input.value]));
      function syncFields(){
        const data=raw(),descriptors=tool.fieldsFor?.(data)||tool.fields;
        for(const descriptor of descriptors){const input=values.get(descriptor.id),wrap=input.closest('label');wrap.hidden=Boolean(descriptor.hidden);input.disabled=Boolean(descriptor.hidden);wrap.firstElementChild.textContent=descriptor.label;input.setAttribute('aria-label',descriptor.label);}
        if(tool.id==='ions'){
          const positive=values.get('positive').value,negative=values.get('negative');
          for(const option of negative.options)option.disabled=!globalThis.lectioPlusChemistry.compounds.some(c=>c.positive===positive&&c.negative===option.value);
          if(negative.selectedOptions[0]?.disabled)negative.value=[...negative.options].find(o=>!o.disabled)?.value||'';
        }
      }
      function calculate(){try{showResult(output,tool.calculate(raw(),prefs()));ran=true;}catch(e){ran=false;error(output,e.message);}}
      const submit=B('lxp-primary-button','Beregn '+tool.title,()=>{},'Beregn');submit.type='submit';
      const reset=B('lxp-secondary-button','Indlæs eksempel i '+tool.title,()=>{clearTimeout(timer);for(const f of tool.fields)values.get(f.id).value=f.value;syncFields();ran=false;output.replaceChildren(E('p','lxp-settings-help','Eksemplet er indlæst. Tryk Beregn.'));},'Indlæs eksempel');
      const actions=E('div','lxp-tool-actions',submit,reset);
      const editor=E('section','lxp-tool-editor',E('h3','lxp-input-heading','Dine værdier'),inputs,actions);if(tool.help)editor.append(E('p','lxp-settings-help',tool.help));form.append(editor,output);
      form.addEventListener('submit',event=>{event.preventDefault();calculate();});
      function changed(){clearTimeout(timer);syncFields();ran=false;output.replaceChildren(E('p','lxp-settings-help','Input er ændret. Tryk Beregn for et nyt resultat.'));if(prefs().autoCalculate)timer=setTimeout(calculate,350);}
      form.addEventListener('input',changed);form.addEventListener('change',changed);syncFields();
      output.append(E('p','lxp-settings-help','Tilpas eksempelværdierne, og tryk Beregn.'));
      return {node:form,refresh(){if(ran)calculate();}};
    }
    const language=globalThis.lectioPlusSchoolLanguage.attach(node,()=>prefs().language);
    const context={E,B,field,prefs,save,format,showResult,error,ui,getPreferences,onChange,openTool};
    function getPanel(id){if(!panels.has(id)){const tool=tools.find(t=>t.id===id);if(!tool)throw Error('Ukendt værktøj.');panels.set(id,tool.special?globalThis.lectioPlusSchoolSpecial(id,context):generic(tool));}return panels.get(id);}
    const dock=E('aside','lxp lxp-tool-dock');dock.hidden=true;dock.id='lxp-tool-dock';dock.setAttribute('aria-label','Værktøj ved siden af siden');
    const dockSelect=E('select','lxp-setting-control');dockSelect.setAttribute('aria-label','Værktøj i sidepanel');for(const tool of tools)dockSelect.append(new Option(tool.title,tool.id));dockSelect.value='basic';
    const dockStage=E('div','lxp-dock-stage'),dockWidth=E('input');dockWidth.type='range';dockWidth.min=320;dockWidth.max=760;dockWidth.step=20;dockWidth.value=440;dockWidth.setAttribute('aria-label','Sidepanelets bredde');dockWidth.addEventListener('input',()=>{dock.style.width=dockWidth.value+'px';document.documentElement.style.setProperty('--lxp-dock-width',dockWidth.value+'px');});
    const closeDock=B('lxp-small-action','Luk værktøjspanel',()=>{dock.hidden=true;document.body.classList.remove('lxp-dock-open');document.querySelector('[data-lxp-dock-button]')?.focus();},'Luk');
    dock.append(E('header','lxp-dock-header',E('strong','','Værktøjspanel'),closeDock),dockSelect,E('label','lxp-tool-field',E('span','','Bredde'),dockWidth),dockStage);
    function mountDock(){const panel=getPanel(dockSelect.value);dockStage.replaceChildren(panel.node);panel.refresh?.();}
    dockSelect.addEventListener('change',mountDock);
    function toggleDock(){dock.hidden=!dock.hidden;document.body.classList.toggle('lxp-dock-open',!dock.hidden);if(!dock.hidden){mountDock();dockSelect.focus();}}
    function applyInputs(panel,values){
      for(const [id,value] of Object.entries(values||{})){const input=[...panel.node.querySelectorAll('[data-field]')].find(n=>n.dataset.field===id);if(!input||typeof value!=='string'||value.length>12000)continue;if(input.type==='checkbox')input.checked=value==='true';else input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}
    }
    function openTool(id,values){const panel=getPanel(id);if(!dock.hidden&&node.hidden){dockSelect.value=id;mountDock();if(values)applyInputs(panel,values);}else{location.hash='#lxp-tools/'+id;update(true);if(values)applyInputs(panel,values);}}
    const personalActions=E('details','lxp-tool-personal',E('summary','','Gem resultat eller værktøjsopsætning'));
    const nameInput=field(personalActions,{id:'preset-name',label:'Navn på opsætning',value:'',maxLength:80});
    const savedSelect=E('select','lxp-setting-control');savedSelect.setAttribute('aria-label','Gemte opsætninger for værktøjet');savedSelect.dataset.lxpUserContent='';personalActions.append(savedSelect);
    const noPreset=new Set(['notes','flashcards','report','board','worksheet','profiles','punctuation','translate','basic','formulas','glossary']);
    function presetOptions(){const previous=savedSelect.value;const records=prefs().lab?.presets?.filter(p=>p.tool===activeId)||[];savedSelect.replaceChildren(new Option('Vælg opsætning',''),...records.map(p=>new Option(p.title,p.id)));if(records.some(p=>p.id===previous))savedSelect.value=previous;nameInput.closest('label').hidden=noPreset.has(activeId);savedSelect.hidden=noPreset.has(activeId);for(const b of personalActions.querySelectorAll('[data-preset-action]'))b.hidden=noPreset.has(activeId);}
    function personalButton(label,fn,preset=false){const b=B('lxp-secondary-button',label,async()=>{if(b.disabled)return;b.disabled=true;try{await fn();}catch(e){notice.textContent=e.message;}finally{b.disabled=false;}},label);if(preset)b.dataset.presetAction='';personalActions.append(b);return b;}
    personalButton('Gem denne opsætning',async()=>{if(!nameInput.value.trim())throw Error('Giv opsætningen et navn.');if(prefs().lab.presets.length>=20)throw Error('Du kan gemme 20 opsætninger.');const fields=Object.fromEntries([...getPanel(activeId).node.querySelectorAll('[data-field]')].filter(n=>n.dataset.field&&!n.disabled).map(n=>[n.dataset.field,n.type==='checkbox'?String(n.checked):n.value]));const serialized=JSON.stringify(fields);if(serialized.length>20000)throw Error('Opsætningen er for stor.');const record={id:globalThis.lectioPlusLab.uid(),title:nameInput.value.trim(),tool:activeId,fields:serialized};if(await save(p=>({lab:{...p.lab,presets:[...p.lab.presets,record]}}))!==false){nameInput.value='';presetOptions();}},true);
    personalButton('Indlæs valgt opsætning',()=>{const record=prefs().lab.presets.find(p=>p.id===savedSelect.value&&p.tool===activeId);if(!record)throw Error('Vælg en gemt opsætning.');applyInputs(getPanel(activeId),JSON.parse(record.fields));notice.textContent='Opsætningen er indlæst. Kontrollér værdierne og beregn igen.';},true);
    personalButton('Slet valgt opsætning',async()=>{const selected=savedSelect.value;if(selected&&await save(p=>({lab:{...p.lab,presets:p.lab.presets.filter(x=>x.id!==selected)}}))!==false)presetOptions();},true);
    personalButton('Gem resultat på ark',async()=>{if(['worksheet','board','profiles','notes','report','punctuation','translate','basic','formulas','glossary','flashcards'].includes(activeId))throw Error('Brug denne funktion i et beregningsværktøj.');if(prefs().lab.sheets.length>=15)throw Error('Der er plads til 15 beregninger på arket.');const record=globalThis.lectioPlusLab.capture(getPanel(activeId).node,toolTitle.textContent);if(await save(p=>({lab:{...p.lab,sheets:[...p.lab.sheets,record]}}))!==false)notice.textContent='Resultatet er gemt i Mit beregningsark.';});
    personalButton('Åbn mit beregningsark',()=>openTool('worksheet'));
    if(globalThis.lectioPlusLab)workspace.insertBefore(personalActions,stage);

    function update(visible){node.hidden=!visible;if(!getPreferences().enabled){dock.hidden=true;document.body.classList.remove('lxp-dock-open');}if(!visible)return;dock.hidden=true;document.body.classList.remove('lxp-dock-open');
      node.dataset.compact=String(prefs().compact);
      language.apply();
      const sig=JSON.stringify(prefs());if(sig!==settingsSignature){settingsSignature=sig;for(const [key,input] of controls){if(toggles.has(key))toggles.get(key).sync(prefs()[key]);else input.value=prefs()[key];}if(initialized)drawCatalog();}
      if(!initialized){initialized=true;drawCatalog();}
      let id=location.hash.slice('#lxp-tools'.length).replace(/^\//,'');if(!id&&prefs().remember)id=prefs().lastTool;
      const tool=tools.find(t=>t.id===id);catalog.hidden=Boolean(tool);workspace.hidden=!tool;
      if(!tool){activeId='';return;}
      const changed=activeId!==tool.id;activeId=tool.id;
      toolTitle.textContent=tool.title;toolDescription.textContent=tool.description;favorite.textContent=prefs().favorites.includes(activeId)?'★ Favorit':'☆ Føj til favoritter';favorite.setAttribute('aria-pressed',String(prefs().favorites.includes(activeId)));
      getPanel(activeId);presetOptions();
      const panel=panels.get(activeId);if(stage.firstChild!==panel.node)stage.replaceChildren(panel.node);panel.refresh?.();
      if(changed&&prefs().remember&&prefs().lastTool!==activeId)void save({lastTool:activeId});
    }
    return {node,update,dockNode:dock,toggleDock,openTool,entries:tools.map(tool=>({href:'#lxp-tools/'+tool.id,label:tool.title,context:'HjælpeMiddler',icon:'grid'}))};
  };
})();
