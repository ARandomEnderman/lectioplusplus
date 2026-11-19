(() => {
  'use strict';

  if (window !== window.top || !['/', '/lectio/login_list.aspx'].includes(location.pathname.toLowerCase())) return;
  const appearance = globalThis.lectioPlusAppearance;
  const boot = globalThis.lectioPlusBoot;
  if (!appearance || document.getElementById('lxp-school-picker')) return;
  const media = matchMedia('(prefers-color-scheme: dark)');
  const storage = (globalThis.browser?.storage ?? globalThis.chrome?.storage);
  let mounted=false;
  function mount(){const original=document.querySelector('.site-container')||document.getElementById('schoolsdiv');if(mounted||!original)return false;mounted=true;initialize(original);return true;}
  if(!mount()){const observer=new MutationObserver(()=>{if(mount())observer.disconnect();});observer.observe(document,{childList:true,subtree:true});}
  function initialize(original){
  const originalHidden = original.hidden;
  let preferences = { ...appearance.defaults };
  let root;
  let controls;
  let schools;
  let pending;
  let saveStatus;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function normalize(text) {
    return text.toLocaleLowerCase('da-DK').replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
  }

  function readSchools(scope) {
    const unique = new Map();
    for (const link of scope.querySelectorAll('#schoolsdiv a[href]')) {
      let url;try{url=new URL(link.getAttribute('href'),location.origin);}catch{continue;}
      const name = link.textContent.replace(/\s+/g, ' ').trim();
      if (url.origin !== location.origin || url.username || url.password || !/^\/lectio\/\d+\/default\.aspx$/i.test(url.pathname) || !name) continue;
      if (!unique.has(url.href)) unique.set(url.href, { name, href: url.href, search: normalize(name) });
    }
    return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name, 'da'));
  }

  async function loadSchools() {
    const local = readSchools(document);
    if (local.length) return local;
    const response = await fetch('/lectio/login_list.aspx', {
      credentials: 'same-origin', signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error('School list unavailable');
    return readSchools(new DOMParser().parseFromString(await response.text(), 'text/html'));
  }

  async function save(changes){
    const before=preferences,next=appearance.normalize({...preferences,...changes});preferences=next;apply();
    try{await storage?.local.set(changes);if(saveStatus)saveStatus.textContent='Gemt på denne enhed.';return true;}
    catch{if(preferences===next){preferences=before;apply();}if(saveStatus)saveStatus.textContent='Ændringen kunne ikke gemmes. Prøv igen.';return false;}
  }

  function build() {
    root = element('main', 'lxp-school-picker');
    root.id = 'lxp-school-picker';
    root.hidden = true;
    const header = element('header', 'lxp-school-header');
    const brand = element('div', 'lxp-school-brand', 'Lectio');
    brand.append(element('span', '', 'Plus+'));
    const settings = element('details', 'lxp-school-settings');
    settings.append(element('summary', '', 'Udseende'));
    controls = appearance.controls(save);
    saveStatus=element('p','lxp-school-save-status');saveStatus.setAttribute('role','status');
    settings.append(controls.node,saveStatus);
    header.append(brand, settings);
    const hero = element('section', 'lxp-school-hero');
    hero.append(element('p', 'lxp-school-eyebrow', 'DIN SKOLEDAG STARTER HER'),
      element('h1', '', 'Find din skole'),
      element('p', 'lxp-school-intro', 'Søg efter din skole, og fortsæt til dit skema, dine opgaver og beskeder.'));
    const label = element('label', 'lxp-school-label', 'Skolens navn');
    label.htmlFor = 'lxp-school-search';
    const searchRow = element('div', 'lxp-school-search-row');
    const input = element('input', 'lxp-school-search');
    input.id = label.htmlFor;
    input.type = 'search';
    input.placeholder = 'Søg efter skole…';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('aria-controls', 'lxp-school-results');
    const clear = element('button', 'lxp-school-clear', 'Ryd');
    clear.type = 'button';
    clear.hidden = true;
    clear.setAttribute('aria-label', 'Ryd skolesøgning');
    searchRow.append(input, clear);
    hero.append(label, searchRow);
    const status = element('p', 'lxp-school-status');
    status.setAttribute('role', 'status');
    const list = element('ul', 'lxp-school-results');
    list.id = 'lxp-school-results';
    const empty = element('div', 'lxp-school-empty');
    empty.append(element('h2', '', 'Ingen skoler fundet'), element('p', '', 'Prøv et kortere navn, eller ryd din søgning.'));
    const items = schools.map(school => {
      const item = element('li', '');
      const link = element('a', 'lxp-school-card');
      link.href = school.href;
      const mark = element('span', 'lxp-school-mark', school.name[0].toLocaleUpperCase('da-DK'));
      mark.setAttribute('aria-hidden', 'true');
      const arrow = element('span', 'lxp-school-arrow', '→');
      arrow.setAttribute('aria-hidden', 'true');
      link.append(mark, element('span', 'lxp-school-name', school.name), arrow);
      item.append(link);
      list.append(item);
      return { ...school, item };
    });
    function filter() {
      const terms = normalize(input.value).split(' ').filter(Boolean);
      let count = 0;
      for (const school of items) {
        school.item.hidden = !terms.every(term => school.search.includes(term));
        if (!school.item.hidden) count++;
      }
      status.textContent = terms.length ? `${count} af ${items.length} skoler` : `${items.length} skoler · Alfabetisk oversigt`;
      empty.hidden = count !== 0;
      clear.hidden = input.value.length === 0;
    }
    input.addEventListener('input', filter);
    clear.addEventListener('click', () => { input.value = ''; filter(); input.focus(); });
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') { input.value = ''; filter(); }
      if (event.key === 'ArrowDown') {
        const first = items.find(school => !school.item.hidden);
        if (first) { event.preventDefault(); first.item.querySelector('a').focus(); }
      }
    });
    const footer = element('footer', 'lxp-school-footer');
    const info = element('a', '', 'Om Lectio');
    info.href = '/introduktion.htm';
    const classic = element('button', '', 'Vis original forside');
    classic.type = 'button';
    classic.addEventListener('click', () => save({ enabled: false }));
    footer.append(element('span', '', 'Skolelisten hentes fra Lectio.'), info, classic);
    root.append(header, saveStatus, hero, status, list, empty, footer);
    original.before(root);
    filter();
  }

  function apply() {
    const enabled = preferences.enabled && Boolean(root);
    globalThis.lectioPlusTab?.apply('Find din skole', enabled && preferences.tabBranding);
    appearance.apply(document.documentElement, preferences, media.matches, enabled || (Boolean(boot) && preferences.enabled && !root));
    document.body.classList.toggle('lxp-school-enabled', enabled);
    original.hidden = enabled || originalHidden;
    if (root) root.hidden = !enabled;
    controls?.sync(preferences);
    if (root || !preferences.enabled) boot?.finish();
    if (preferences.enabled && !root && !pending) {
      pending = loadSchools().then(result => {
        if (!result.length) { boot?.finish(); return; }
        schools = result;
        build();
        apply();
      }).catch(() => { boot?.finish(); /* Keep the original picker usable if loading fails. */ })
        .finally(() => { pending = undefined; });
    }
  }

  async function start() {
    try { preferences = appearance.normalize(boot ? await boot.preferences : await storage?.local.get(appearance.defaults)); }
    catch { preferences = { ...appearance.defaults }; }
    boot?.onPreferences?.(settings=>{preferences=appearance.normalize(settings);apply();});
    media.addEventListener('change', apply);
    storage?.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      const next = { ...preferences };
      for (const key of Object.keys(appearance.defaults)) {
        if (changes[key]) next[key] = changes[key].newValue ?? appearance.defaults[key];
      }
      preferences = appearance.normalize(next);
      apply();
    });
    apply();
  }
  void start().catch(()=>boot?.finish());
  }
})();
