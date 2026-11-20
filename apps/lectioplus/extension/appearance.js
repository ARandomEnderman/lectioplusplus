(() => {
  'use strict';

  const widgets = [
    ['hero', 'Velkomst og dato', 'full'], ['summary', 'Nøgletal', 'full'],
    ['schedule', 'Dagens skema', 'half'], ['tasks', 'Næste afleveringer', 'half'],
    ['messages', 'Beskeder', 'full'], ['shortcuts', 'Genveje', 'half'], ['clicker', 'Strafe Clicker', 'full']
  ];
  const navigationItems = [['home','Overblik'],['schedule','Skema'],['tasks','Opgaver'],['homework','Lektier'],['messages','Beskeder'],['tools','Hjælpemidler'],['games','Spil'],['clicker','Strafe Clicker'],['attendance','Fravær'],['grades','Karakterer'],['study','Studieplan'],['documents','Dokumenter'],['books','Bøger'],['surveys','Spørgeskemaer'],['support','SPS'],['electives','Valgfag'],['profile','Profil'],['school','Hovedmenu']];
  const defaultNavigation = () => navigationItems.map(([id]) => ({ id, visible: true, pinned: false }));
  function navigation(values) {
    const seen = new Set();
    const items = (Array.isArray(values) ? values : []).flatMap((item) => {
      if (!item || seen.has(item.id) || !navigationItems.some(([id]) => id === item.id)) return [];
      seen.add(item.id);
      return [{ id: item.id, visible: item.visible !== false, pinned: item.pinned === true }];
    });
    if(!seen.has('games')&&seen.has('tools')){items.splice(items.findIndex(item=>item.id==='tools')+1,0,{id:'games',visible:true,pinned:false});seen.add('games');}
    return [...items, ...defaultNavigation().filter((item) => !seen.has(item.id))];
  }
  const sidebarIcons=[['external','Link'],['book','Bog'],['calendar','Kalender'],['file','Dokument'],['chart','Graf'],['grid','Værktøjer'],['home','Hjem'],['game','Spil'],['message','Besked'],['help','Hjælp']];
  function customSidebar(value){const seen=new Set();return (Array.isArray(value)?value:[]).slice(0,20).flatMap(item=>{if(!item||typeof item.id!=='string'||!/^link-[a-z0-9-]{1,64}$/i.test(item.id)||seen.has(item.id))return [];const url=safeUrl(cleanText(item.url,2000)),label=cleanText(item.label,60).trim();if(!url||!label)return [];seen.add(item.id);return [{id:item.id,label,url,icon:choice(item.icon,[...sidebarIcons.map(x=>x[0]),'emoji'],'external'),emoji:cleanText(item.emoji,16),newTab:item.newTab!==false}];});}
  const defaultDashboard = () => ({ columns: 'two', title: 'Dit overblik', custom: [],
    slots: widgets.map(([id, , width]) => ({ id, width, visible: id !== 'shortcuts' })) });
  const defaults = { enabled: true, theme: 'dark', design: 'strafe', density: 'comfortable', hideProfilePhoto: false, anonymizeName: false,
    showClicker: false, tabBranding: true, reducedMotion: false, party: false, contentWidth: 'normal', font: 'system',
    navigationDensity: 'comfortable', navigationGroups: 'collapsed', tableDensity: 'comfortable', sectionShortcuts: true,
    scheduleSize: '76', scheduleView: 'auto', showBreaks: true, colorLessons: true, showLessonRoom: true,
    dashboard: defaultDashboard(), navigation: defaultNavigation(), customSidebar: [], toolbox: toolbox(), games: games() };
  function osuKey(key){
    if(typeof key!=='string')return '';
    if(key===' '||key==='Space')return 'Space';
    if(/^(?:Arrow(?:Up|Down|Left|Right)|Enter|Backspace|Insert|Delete|Home|End|PageUp|PageDown)$/.test(key))return key;
    return /^[\p{L}\p{N}\p{P}\p{S}]$/u.test(key)?key.toLowerCase():'';
  }
  function osuBindings(input={}){
    const defaults={first:'z',second:'x',pause:'p',retry:'r'};
    const result=Object.fromEntries(Object.keys(defaults).map(key=>[key,osuKey(input?.[key])||defaults[key]]));
    return new Set(Object.values(result)).size===4?result:defaults;
  }
  function games(value={}){
    const input=value&&typeof value==='object'?value:{},allowed=['dino','snake','blocks','pong','breakout','2048','mines','memory','tic','four','choices'];
    return {bindings:osuBindings(input.bindings),mouseHits:input.mouseHits!==false,difficulty:choice(input.difficulty,['easy','normal','hard'],'normal'),bests:Object.fromEntries(Object.entries(input.bests&&typeof input.bests==='object'?input.bests:{}).filter(([key,v])=>{const [id,difficulty,...rest]=key.split(':');const valid=id==='dash'? /^(?:[1-9]|1[0-5])$/.test(difficulty)&&v<=100 : id==='osu' ? /^([a-z][a-z-]{0,31})$/.test(difficulty||'') : allowed.includes(id)&&['easy','normal','hard'].includes(difficulty);return !rest.length&&valid&&Number.isInteger(v)&&v>=0&&v<=1000000000;}).slice(-95))};
  }
  function choice(value, options, fallback) { return options.includes(value) ? value : fallback; }
  function cleanText(value, length) { return typeof value === 'string' ? value.slice(0, length) : ''; }
  function safeUrl(value) {
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
    } catch { return ''; }
  }
  function dashboard(values) {
    const input = values && typeof values === 'object' ? values : defaultDashboard();
    const seen = new Set();
    const custom = (Array.isArray(input.custom) ? input.custom : []).slice(0, 12).flatMap((item) => {
      if (!item || !/^custom-[a-z0-9-]{1,64}$/i.test(item.id) || seen.has(item.id)) return [];
      seen.add(item.id);
      return [{ id: item.id, type: item.type === 'link' ? 'link' : 'note', title: cleanText(item.title, 60) || 'Mit felt',
        text: cleanText(item.text, 1000), url: safeUrl(cleanText(item.url, 2000)) }];
    });
    const allowed = new Set([...widgets.map(([id]) => id), ...custom.map(({ id }) => id)]);
    seen.clear();
    const slots = (Array.isArray(input.slots) ? input.slots : []).flatMap((slot) => {
      if (!slot || !allowed.has(slot.id) || seen.has(slot.id)) return [];
      seen.add(slot.id);
      return [{ id: slot.id, width: slot.width === 'full' ? 'full' : 'half', visible: slot.visible !== false }];
    });
    for (const slot of defaultDashboard().slots) if (!seen.has(slot.id)) slots.push(slot);
    for (const item of custom) if (!seen.has(item.id)) slots.push({ id: item.id, width: 'half', visible: true });
    return { columns: choice(input.columns, ['one', 'two', 'three'], 'two'), title: cleanText(input.title, 80) || 'Dit overblik', custom, slots };
  }
  function toolbox(values = {}) {
    const input = values && typeof values === 'object' ? values : {};
    const ids = (list, max) => [...new Set((Array.isArray(list) ? list : []).filter((id) => typeof id === 'string' && id !== 'ai' && /^[a-z-]{1,30}$/.test(id)))].slice(0, max);
    const cards = (Array.isArray(input.cards) ? input.cards : []).slice(0, 100).flatMap((card) => {
      if (!card || typeof card.question !== 'string' || typeof card.answer !== 'string') return [];
      return [{ question: cleanText(card.question, 1000), answer: cleanText(card.answer, 2000) }];
    });
    return { language: choice(input.language, ['da','en','mixed'], 'da'), decimals: choice(input.decimals, ['2','4','6','8','10'], '4'), angle: choice(input.angle, ['deg','rad'], 'deg'),
      steps: input.steps !== false, visuals: input.visuals !== false, grid: input.grid !== false, compact: input.compact === true, autoCalculate: input.autoCalculate === true,
      remember: input.remember !== false, lastTool: ids([input.lastTool], 1)[0] || '', favorites: ids(input.favorites, 50),
      workMinutes: Number.isInteger(input.workMinutes) && input.workMinutes >= 1 && input.workMinutes <= 120 ? input.workMinutes : 25,
      breakMinutes: Number.isInteger(input.breakMinutes) && input.breakMinutes >= 1 && input.breakMinutes <= 60 ? input.breakMinutes : 5,
      view: toolView(input.view), toolViews: toolViews(input.toolViews), workspaces: workspaces(input.workspaces),
      code: {colors:input.code?.colors!==false,lineNumbers:input.code?.lineNumbers!==false,fontSize:choice(input.code?.fontSize,['12','14','16','18','20','24'],'16'),theme:choice(input.code?.theme,['theme','dark','light'],'theme'),wrap:input.code?.wrap===true,height:Math.round(Math.max(600,Math.min(1600,Number(input.code?.height)||820))),terminalHeight:Math.round(Math.max(120,Math.min(600,Number(input.code?.terminalHeight)||240))),sidebarWidth:Math.round(Math.max(200,Math.min(440,Number(input.code?.sidebarWidth)||260))),sidebarOpen:input.code?.sidebarOpen!==false},
      notes: cleanText(input.notes, 20000), cards, lab: labState(input.lab) };
  }
  function toolView(value) {
    const v=value&&typeof value==='object'?value:{};
    return {layout:choice(v.layout,['split','stack'],'split'),columns:choice(v.columns,['one','two'],'one'),
      size:choice(v.size,['compact','normal','large'],'normal'),width:choice(v.width,['normal','wide'],'normal'),
      resultSide:choice(v.resultSide,['right','left'],'right'),guide:v.guide!==false,hints:v.hints!==false,working:v.working===true};
  }
  function workspaces(value) {
    if(!value||typeof value!=='object'||Array.isArray(value))return {};
    let budget=2500000;
    return Object.fromEntries(Object.entries(value).filter(([key,v])=>/^[a-z][a-z0-9-]{0,59}$/.test(key)&&!['constructor','prototype','__proto__'].includes(key)&&typeof v==='string').slice(0,256).flatMap(([key,v])=>{if(!v||v.length>100000||v.length>budget)return [];try{JSON.parse(v);}catch{return [];}budget-=v.length;return [[key,v]];}));
  }
  function toolViews(value) {
    if(!value||typeof value!=='object'||Array.isArray(value))return {};
    return Object.fromEntries(Object.entries(value).filter(([id])=>/^[a-z][a-z0-9-]{0,29}$/.test(id)&&!['constructor','prototype','__proto__'].includes(id)).slice(0,180).map(([id,v])=>[id,toolView(v)]));
  }
  function labState(value) {
    const src=value&&typeof value==='object'?value:{};
    const list=(key,max,shape)=>{const seen=new Set();return (Array.isArray(src[key])?src[key]:[]).slice(0,max).flatMap(row=>{
      if(!row||typeof row!=='object'||typeof row.id!=='string'||!/^[-a-z0-9]{1,80}$/i.test(row.id)||seen.has(row.id))return [];
      seen.add(row.id);const item={id:row.id};for(const [key,limit] of Object.entries(shape))item[key]=cleanText(row[key],limit);return [item];
    });};
    return {
      notebooks:list('notebooks',40,{title:80,subject:80,text:12000}),
      sheets:list('sheets',15,{title:80,inputs:4000,result:8000,figure:24000,note:2000}),
      presets:list('presets',20,{title:80,tool:30,fields:20000}),
      profiles:list('profiles',5,{title:80,settings:120000}),
      board:list('board',100,{title:160,subject:80,minutes:6,status:12,steps:3000}),
      reviews:list('reviews',100,{key:4000,interval:8,due:24,seen:8,grade:12}),
      report:cleanText(src.report,80000)
    };
  }
  const designs = [
    ['strafe', 'Strafe'],
    ['indigo', 'Indigo'], ['ocean', 'Havblå'], ['forest', 'Skovgrøn'], ['teal', 'Turkis'], ['slate', 'Skifer'],
    ['lavender', 'Lavendel'], ['raspberry', 'Hindbær'], ['ruby', 'Rubin'], ['coral', 'Koral'], ['amber', 'Rav']
  ];
  const themes = [['system', 'Følg systemet'], ['light', 'Lys'], ['dark', 'Mørk']];
  const densities = [['comfortable', 'Luftig'], ['compact', 'Kompakt']];
  const valid = (choices, value, fallback) => choices.some(([key]) => key === value) ? value : fallback;

  function normalize(values = {}) {
    if (!values || typeof values !== 'object') values = {};
    return {
      enabled: typeof values.enabled === 'boolean' ? values.enabled : defaults.enabled,
      theme: valid(themes, values.theme, defaults.theme),
      design: valid(designs, values.design, defaults.design),
      density: valid(densities, values.density, defaults.density),
      hideProfilePhoto: values.hideProfilePhoto === true,
      anonymizeName: values.anonymizeName === true,
      showClicker: values.showClicker === true,
      tabBranding: values.tabBranding !== false,
      reducedMotion: values.reducedMotion === true,
      party: values.party === true,
      contentWidth: choice(values.contentWidth, ['normal', 'wide'], 'normal'),
      font: choice(values.font, ['system', 'arial'], 'system'),
      navigationDensity: choice(values.navigationDensity, ['comfortable', 'compact'], 'comfortable'),
      navigationGroups: choice(values.navigationGroups, ['collapsed', 'expanded', 'flat'], 'collapsed'),
      tableDensity: choice(values.tableDensity, ['comfortable', 'compact'], 'comfortable'),
      sectionShortcuts: values.sectionShortcuts !== false,
      scheduleSize: choice(values.scheduleSize, ['60', '76', '92'], '76'),
      scheduleView: choice(values.scheduleView, ['auto', 'week', 'day'], 'auto'),
      showBreaks: values.showBreaks !== false,
      colorLessons: values.colorLessons !== false,
      showLessonRoom: values.showLessonRoom !== false,
      dashboard: dashboard(values.dashboard),
      navigation: navigation(values.navigation),
      customSidebar: customSidebar(values.customSidebar),
      toolbox: toolbox(values.toolbox),
      games: games(values.games)
    };
  }

  function dark(preferences, systemDark) {
    return preferences.theme === 'dark' || (preferences.theme === 'system' && systemDark);
  }

  const attributeNames = ['data-lxp-navigation-density', 'data-lxp-table-density', 'data-lxp-content-width',
    'data-lxp-font', 'data-lxp-reduced-motion', 'data-lxp-hide-profile-photo', 'data-lxp-anonymize-name', 'data-lxp-mode', 'data-lxp-design', 'data-lxp-density', 'data-lxp-party'];
  function apply(root, preferences, systemDark, active = true) {
    const values = [preferences.navigationDensity, preferences.tableDensity, preferences.contentWidth, preferences.font,
      preferences.reducedMotion ? '' : null, preferences.hideProfilePhoto ? '' : null, preferences.anonymizeName ? '' : null,
      dark(preferences, systemDark) ? 'dark' : 'light', preferences.design, preferences.density,
      preferences.party && !preferences.reducedMotion ? '' : null];
    // Reassert owned attributes without generating another mutation when unchanged.
    // Lectio can update page-level attributes after document_end.
    attributeNames.forEach((attribute, index) => {
      const value = active ? values[index] : null;
      if (root.getAttribute(attribute) === value) return;
      if (value === null) root.removeAttribute(attribute);
      else root.setAttribute(attribute, value);
    });
  }

  // Keep the native checkbox for keyboard, label activation and form semantics.
  function toggle(input) {
    const node = document.createElement('span');
    node.className = 'lxp-toggle';
    const track = document.createElement('span');
    track.className = 'lxp-toggle-track';
    track.setAttribute('aria-hidden', 'true');
    const state = document.createElement('span');
    state.className = 'lxp-toggle-state';
    state.setAttribute('aria-hidden', 'true');
    input.setAttribute('role', 'switch');
    if (input.parentNode) input.replaceWith(node);
    node.append(input, track, state);
    function sync(value = input.checked) {
      input.checked = value;
      node.dataset.state = value ? 'on' : 'off';
      state.textContent = value ? 'Til' : 'Fra';
    }
    input.addEventListener('change', () => sync());
    sync();
    return { node, sync };
  }

  function controls(onChange) {
    const node = document.createElement('div');
    node.className = 'lxp-appearance';

    function select(key, label, choices) {
      const field = document.createElement('select');
      for (const [value, text] of choices) field.add(new Option(text, value));
      field.addEventListener('change', () => onChange({ [key]: field.value }));
      const row = document.createElement('label');
      row.className = 'lxp-appearance-row';
      row.append(label, field);
      node.append(row);
      return field;
    }

    const theme = select('theme', 'Tema', themes);
    const group = document.createElement('fieldset');
    const heading = document.createElement('legend');
    heading.textContent = 'Design';
    const choices = document.createElement('div');
    choices.className = 'lxp-design-options';
    const radios = designs.map(([value, label]) => {
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'lectioplus-design';
      radio.value = value;
      radio.addEventListener('change', () => onChange({ design: radio.value }));
      const swatch = document.createElement('span');
      swatch.className = 'lxp-design-swatch';
      swatch.dataset.swatch = value;
      swatch.setAttribute('aria-hidden', 'true');
      const card = document.createElement('label');
      card.className = 'lxp-design-option';
      card.append(radio, swatch, label);
      choices.append(card);
      return radio;
    });
    const hideProfilePhoto = document.createElement('input');
    hideProfilePhoto.type = 'checkbox';
    hideProfilePhoto.setAttribute('aria-label', 'Skjul mit profilbillede');
    const photoToggle = toggle(hideProfilePhoto);
    hideProfilePhoto.addEventListener('change', () => onChange({ hideProfilePhoto: hideProfilePhoto.checked }));
    const photoRow = document.createElement('label');
    photoRow.className = 'lxp-appearance-row lxp-photo-setting';
    photoRow.append('Skjul mit profilbillede', photoToggle.node);
    const anonymizeName = document.createElement('input');
    anonymizeName.type = 'checkbox';
    anonymizeName.setAttribute('aria-label', 'Vis mit navn som Anonym');
    const nameToggle = toggle(anonymizeName);
    anonymizeName.addEventListener('change', () => onChange({ anonymizeName: anonymizeName.checked }));
    const nameRow = document.createElement('label');
    nameRow.className = 'lxp-appearance-row';
    nameRow.append('Vis mit navn som Anonym', nameToggle.node);
    const privacyHelp = document.createElement('p');
    privacyHelp.className = 'lxp-privacy-help';
    privacyHelp.textContent = 'Skjuler personbilleder også i kort og elevlister. Anonym ændrer kun visningen af dit navn. Oplysninger hos skolen og indhold i skrivefelter, filer og billeder ændres ikke.';
    group.append(heading, choices, photoRow, nameRow, privacyHelp);
    node.append(group);
    const density = select('density', 'Afstand', densities);

    return { node, sync(preferences) {
      theme.value = preferences.theme;
      density.value = preferences.density;
      photoToggle.sync(preferences.hideProfilePhoto);
      nameToggle.sync(preferences.anonymizeName);
      for (const radio of radios) radio.checked = radio.value === preferences.design;
    } };
  }

  globalThis.lectioPlusAppearance = { defaults, normalize, osuBindings, osuKey, dark, apply, attributeNames, controls, toggle, widgets, defaultDashboard, safeUrl, sidebarIcons, navigationItems, defaultNavigation, themes, designs };
})();
