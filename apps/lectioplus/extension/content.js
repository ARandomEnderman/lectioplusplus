(() => {
  'use strict';

  const preview = document.body?.hasAttribute('data-lxp-preview');
  const schoolPath = location.pathname.match(/^\/lectio\/\d+\//i)?.[0];
  const file = location.pathname.split('/').pop().toLowerCase();
  const boot = globalThis.lectioPlusBoot;
  if (!preview && (!schoolPath || /login|logout|logud|auth|eksam|proeve/.test(file))) {
    boot?.finish();
    return;
  }

  let mounted=false;
  function mount(){
    const native=document.getElementById('masterContent');
    if(mounted||!native)return false;
    mounted=true;initialize(native);return true;
  }
  if(!mount()){
    const pending=new MutationObserver(()=>{if(mount())pending.disconnect();});
    pending.observe(document,{childList:true,subtree:true});
  }
  function initialize(native){
  const pages = [
    { key: 'home', label: 'Overblik', lectio: 'Forside', icon: 'home', route: /^forside\.aspx$/i },
    { key: 'schedule', label: 'Skema', lectio: 'Skema', icon: 'calendar', route: /^(skema|skemany)\.aspx$/i },
    { key: 'tasks', label: 'Opgaver', lectio: 'Opgaver', icon: 'file', route: /^(opgaver|eleveropgaver|opgaverelev|opgaveoversigt|elevaflevering)\.aspx$/i },
    { key: 'homework', label: 'Lektier', lectio: 'Lektier', icon: 'book', route: /^(lektier|lektieoversigt|material_lektieoversigt)\.aspx$/i },
    { key: 'messages', label: 'Beskeder', lectio: 'Beskeder', icon: 'message', route: /^(beskeder2?|beskedoversigt)\.aspx$/i },
    { key: 'attendance', label: 'Fravær', lectio: 'Fravær', icon: 'chart', route: /^(fravaer|(?:subnav)?fravaerelev(?:_fravaersaarsager)?)\.aspx$/i },
    { key: 'grades', label: 'Karakterer', lectio: 'Karakterer', icon: 'chart', route: /^(karakterer|grades|grade_report)\.aspx$/i },
    { key: 'study', label: 'Studieplan', lectio: 'Studieplan', icon: 'calendar', route: /^(studieplan2?|forloeb_vis)\.aspx$/i },
    { key: 'documents', label: 'Dokumenter', lectio: 'Dokumenter', icon: 'file', route: /^(dokumenter|dokumentoversigt|dokumentfolderrediger|document)\.aspx$/i },
    { key: 'books', label: 'Bøger', lectio: 'Bøger', icon: 'book', route: /^(boeger|bogoversigt)\.aspx$/i },
    { key: 'surveys', label: 'Spørgeskemaer', lectio: 'Spørgeskema', icon: 'file', route: /^(spoergeskemaer?|spoergeskema_(?:rapport|besvar)|questionnaire)\.aspx$/i },
    { key: 'support', label: 'SPS', lectio: 'SPS', icon: 'help', route: /^sps[\w-]*\.aspx$/i },
    { key: 'electives', label: 'Valgfag', lectio: 'Studieretning', aliases: ['Studieretning og valgfag', 'Valgfag'], icon: 'book', route: /^studieretningValgfag\.aspx$/i },
    { key: 'profile', label: 'Profil', lectio: 'Profil', icon: 'user', route: /^(profil|profile)\.aspx$/i },
    { key: 'school', label: 'Hovedmenu', lectio: 'Hovedmenu', icon: 'grid', route: /^default\.aspx$/i }
  ];
  const appearance = globalThis.lectioPlusAppearance;
  const defaults = appearance.defaults;
  const darkMode = matchMedia('(prefers-color-scheme: dark)');
  const narrow = matchMedia('(max-width: 760px)');
  const storage = preview ? null : globalThis.chrome?.storage;
  const icon = globalThis.lectioPlusIcon;
  const lectio = globalThis.lectioPlusData;
  const initialUrl = location.href;
  const initialTitle = globalThis.lectioPlusPrivacy?.getOriginalTitle() ?? document.title;
  let sourceTitle = initialTitle;
  const fastPages = new Set(['home', 'schedule', 'tasks', 'homework', 'messages', 'school']);
  const navigationSelector = '#m_mastermenu, #m_MobilMenuNav, #mobilMereSheetMenu, nav, [role="navigation"], [role="tablist"], .ls-master-header-container, .ls-subnav-container, .ls-subnav1, .ls-subnav2, [id*="menutab" i], [class*="menutab" i]';
  const activityPage = { key: 'activity', label: 'Aktivitet', icon: 'calendar' };
  // Extension-owned tab (not a Lectio page): an embed of Strafe Clicker, opened via the #lxp-clicker hash.
  const toolsPage = { key: 'tools', label: 'Hjælpemidler', icon: 'grid', href: '#lxp-tools' };
  const gamesPage = { key: 'games', label: 'Spil', icon: 'game', href: '#lxp-games' };
  const gamesHash = () => /^#lxp-games(?:\/|$)/.test(location.hash);
  const toolsHash = () => /^#lxp-tools(?:\/|$)/.test(location.hash);
  const clickerHash = '#lxp-clicker';
  const clickerUrl = 'https://clicker.strafe-mc.com/#/clicker';
  const clickerPage = { key: 'clicker', label: 'Strafe Clicker', icon: 'game', href: clickerHash };
  const homeSources = new Map();
  const pageCache = new Map();
  let preferences = { ...defaults };
  let source = native;
  let sourceUrl = initialUrl;
  let pendingNavigation;
  let links = new Map();
  let overviewData;
  let activePage;
  let showNative = false;
  let workspaceReady = false;
  let refreshFrame;
  let missingContentTimer;
  let lastDialogTrigger;
  let settingsControls;
  let settingsHomeScope;
  let settingsHomeUrl;
  let settingsPreviewStatus;
  let nativeHeading;
  let replacedHeading;
  let nativePageScope;
  let sectionNavSignature;
  let sectionNavSources = [];
  let secondaryNavigationOpen = false;
  let navigationPreferences;
  const bodyState = new Map();
  const nativeLayout = globalThis.lectioPlusNativeLayout?.();

  function setBodyState(name, enabled) {
    bodyState.set(name, Boolean(enabled));
    if (document.body.classList.contains(name) !== Boolean(enabled)) document.body.classList.toggle(name, Boolean(enabled));
  }

  function restorePresentation() {
    if (failed || !activePage) return;
    appearance.apply(document.documentElement, preferences, darkMode.matches, preferences.enabled);
    for (const [name, enabled] of bodyState) setBodyState(name, enabled);
    if (root.hidden === preferences.enabled) root.hidden = !preferences.enabled;
  }

  function element(tag, className = '', ...children) {
    const result = document.createElement(tag);
    result.className = className;
    result.append(...children);
    return result;
  }

  function button(className, label, handler, ...children) {
    const result = element('button', className, ...children);
    result.type = 'button';
    result.setAttribute('aria-label', label);
    result.addEventListener('click', handler);
    return result;
  }

  function anchor(className, href, ...children) {
    const result = element('a', className, ...children);
    result.href = href;
    return result;
  }

  function normalize(value) {
    return value.replace(/\s+/g, ' ').trim().toLocaleLowerCase('da-DK');
  }

  function safeHref(link, base = sourceUrl) {
    const raw = link?.getAttribute('href');
    if (!raw) return null;
    if (preview) return raw.startsWith('#') ? raw : null;
    try {
      const url = new URL(raw, base);
      return url.origin === location.origin && url.pathname.startsWith(schoolPath) ? url.href : null;
    } catch {
      return null;
    }
  }

  function navigationText(node) {
    const omitted = '.ls-fonticon, .material-icons, .material-symbols-outlined, [aria-hidden="true"], [hidden]';
    if (!node?.querySelector(omitted)) return readableText(node);
    const copy = node.cloneNode(true);
    copy.querySelectorAll(omitted).forEach((child) => child.remove());
    return readableText(copy);
  }

  function nativeTitle(scope, identityOnly = false) {
    const selectors = identityOnly ? ['.ls-master-pageheader :is(#MainTitle, .maintitle, h1, [role="heading"][aria-level="1"])'] :
      ['#MainTitle', '.ls-identity-container .maintitle', '.ls-master-pageheader :is(h1, [role="heading"][aria-level="1"])', 'h1'];
    for (const selector of selectors) {
      for (const node of scope.querySelectorAll(selector)) {
        if (node.closest('nav, [role="tablist"], .ls-subnav-container, [hidden], [aria-hidden="true"]') ||
            node.querySelector('nav, [role="tablist"], .ls-subnav-container, form, button, input, select, textarea') ||
            node.querySelectorAll('a[href]').length > 1) continue;
        const text = navigationText(node);
        if (text && text.length <= 120 && !/\b(?:arrow_back|keyboard_arrow_\w+|more_vert)\b/.test(text)) return { node, text };
      }
    }
    return null;
  }

  function getNavigation() {
    const navigation = preview ? native.querySelector('[data-lxp-nav]') : source;
    const names = new Set(pages.flatMap((page) => [page.lectio, ...(page.aliases || [])].map(normalize)));
    const candidates = Array.from(navigation.querySelectorAll('a[href]'))
      .filter((link) => !link.closest('[data-lxp-owned]'))
      .map((link) => ({ link, title: normalize(navigationText(link)), inMenu: Boolean(link.closest(navigationSelector)) }))
      .filter(({ title }) => preview || names.has(title))
      .map((candidate) => ({ ...candidate, href: safeHref(candidate.link) }))
      .filter(({ href }) => href)
      .sort((first, second) => Number(second.inMenu) - Number(first.inMenu));
    const entries = pages.flatMap((page) => {
      const candidate = candidates.find(({ link, href, title, inMenu }) => preview
        ? link.dataset.page === page.key
        : [page.lectio, ...(page.aliases || [])].map(normalize).includes(title) && (inMenu || page.route.test(new URL(href).pathname.split('/').pop())));
      return candidate ? [[page.key, { ...page, href: candidate.href }]] : [];
    });
    const result = new Map(entries);
    if (!preview && !result.has('school')) {
      result.set('school', { ...pages.at(-1), href: `${schoolPath}default.aspx` });
    }
    return result;
  }

  function searchablePages() {
    const entries = [...links.values(), toolsPage, gamesPage, ...schoolTools.entries, ...games.entries];
    const known = new Set(entries.map((entry) => entry.href));
    const extraLinks = source.querySelectorAll(`:is(${navigationSelector}, #m_Content_elevUL) a[href]`);
    for (const link of extraLinks) {
      const label = navigationText(link);
      const href = safeHref(link);
      if (!href || !/\p{L}/u.test(label) || /^(log ind|log ud|login|keyboard_arrow)/i.test(label) ||
          known.has(href) || (!preview && /#/.test(href))) continue;
      known.add(href);
      const previewGroup = preview && link.closest('[data-lxp-view]')?.dataset.lxpView.split('/')[0];
      const context = previewGroup ? pages.find((page) => page.key === previewGroup)?.label :
        link.closest('.ls-subnav1, .ls-subnav2, .lectioTabToolbar, [role="tablist"]') ? activePage?.parent || activePage?.label : 'Flere sider';
      entries.push({ href, label, lectio: label, icon: 'grid', context });
    }
    return entries;
  }

  function pageInfo() {
    if (gamesHash()) return gamesPage;
    if (toolsHash()) return toolsPage;
    if (preferences.showClicker && location.hash === clickerHash) return clickerPage;
    if (preview) {
      const view = location.hash.slice(1);
      const detail = [...native.querySelectorAll('[data-lxp-parent]')].find((node) => node.dataset.lxpView === view);
      const page = pages.find(({ key }) => key === (detail?.dataset.lxpParent || view.split('/')[0])) || pages[0];
      return detail ? { ...page, label: detail.dataset.lxpLabel || page.label, parent: page.label, view, detail: true } : page;
    }
    const url = new URL(sourceUrl);
    const name = url.pathname.split('/').pop();
    const documentTitle = sourceTitle.split(/\s+[-–|]\s+/);
    const feedbackPage = /^(?:elevfeedback|aktivitets?feedback)\d*\.aspx$/i.test(name) || /\belevfeedback\b/i.test(sourceTitle);
    if (feedbackPage || /\baktivitetsforside\b/i.test(sourceTitle) || /^(?:aktivitet|aktivitetsforside|aktivitetforside)\d*\.aspx$/i.test(name)) {
      const selectedTabs = source.querySelectorAll(':is([role="tablist"], .lectioTabToolbar, .ls-subnav2) :is([aria-selected="true"], [aria-current="page"], [aria-current="true"], [current-page], .ls-subnav-active, .selected, .sel)');
      const feedbackTab = [...selectedTabs].some((tab) => normalize(navigationText(tab)) === 'elevfeedback');
      return feedbackPage || feedbackTab ? { ...activityPage, label: 'Elevfeedback' } : activityPage;
    }
    const matching = [...links.values()].filter(({ href }) => new URL(href, url).pathname.toLowerCase() === url.pathname.toLowerCase());
    const match = pages.find(({ route }) => route.test(name)) || matching.find(({ href }) => new URL(href, url).search === url.search) ||
      (matching.length === 1 ? matching[0] : null);
    if (match) {
      const detail = nativeWorkflow(match, sourceUrl, source) || /^(forloeb_vis|dokumentfolderrediger|spoergeskema_besvar|fravaerelev_fravaersaarsager)\.aspx$/i.test(name);
      return detail ? { ...match, label: nativeTitle(source)?.text || match.label, parent: match.label, detail: true } : match;
    }
    const heading = nativeTitle(source)?.text;
    const lectioIndex = documentTitle.findIndex((part) => normalize(part) === 'lectio');
    const title = lectioIndex > 0 ? documentTitle[lectioIndex - 1].trim() : '';
    return { key: '', label: title && title.length <= 65 && !/\b(?:arrow_back|keyboard_arrow_\w+|more_vert)\b/.test(title) ? title : heading || 'Lectio' };
  }

  function nativeWorkflow(page, href, scope) {
    if (preview) return Boolean(page.detail);
    if (!['tasks', 'homework', 'messages'].includes(page.key)) return false;
    if (/\/elevaflevering\.aspx$/i.test(new URL(href).pathname)) return true;
    const params = new URL(href).searchParams;
    const detailKeys = page.key === 'messages' ? /^(beskedid|messageid|threadid|conversationid)$/i : /^(opgaveid|elevopgaveid|afleveringid|absid)$/i;
    return [...params].some(([key, value]) => value && (detailKeys.test(key) ||
      (page.key === 'messages' && /^type$/i.test(key) && /^(visbesked|nybesked|besvar|svar|reply|compose)$/i.test(value)) ||
      (/^(mode|action)$/i.test(key) && /^(edit|new|reply|compose|upload|aflever)$/i.test(value)))) ||
      /(?:^|[-–]\s+)(?:ny besked|besvar besked|aflever opgave|rediger opgave)\b/i.test(nativeTitle(scope)?.text || '');
  }

  const root = element('div', 'lxp');
  root.id = 'lxp-root';
  const sidebar = element('aside', 'lxp-sidebar');
  sidebar.id = 'lxp-sidebar';
  const topbar = element('header', 'lxp-topbar');
  const navigationStatus = element('span', 'lxp-navigation-status');
  navigationStatus.setAttribute('role', 'status');
  const overview = element('main', 'lxp-overview');
  overview.id = 'lxp-overview';
  const sectionNav = element('nav', 'lxp-section-nav');
  sectionNav.hidden = true;
  sectionNav.setAttribute('aria-label', 'Undermenuer');
  const nativeOverview = element('section', 'lxp-native-overview');
  nativeOverview.id = 'lxp-native-overview';
  const schoolTools = globalThis.lectioPlusSchoolTools({ ui: { element, button, icon }, getPreferences: () => preferences, onChange: savePreferences });
  const games = globalThis.lectioPlusGames({ getPreferences: () => preferences, onChange: savePreferences });
  const clickerView = element('main', 'lxp-clicker-view');
  clickerView.id = 'lxp-clicker';
  clickerView.hidden = true;
  const clickerExternal = anchor('lxp-secondary-button lxp-clicker-external', clickerUrl,
    'Åbn i ny fane', icon('external'));
  clickerExternal.target = '_blank';
  clickerExternal.rel = 'noopener noreferrer';
  clickerExternal.setAttribute('aria-label', 'Åbn Strafe Clicker i ny fane');
  clickerView.append(element('div', 'lxp-clicker-toolbar',
    element('span', '', 'Forsvinder dit login? Åbn spillet i en ny fane, og log ind der.'), clickerExternal));
  const workspace = globalThis.lectioPlusWorkspace({
    ui: { element, button, anchor, icon }, data: lectio, narrow, safeHref, revealOriginal, getPreferences: () => preferences, onPreferences: savePreferences, getSourceUrl: () => sourceUrl
  });
  const skip = anchor('lxp-skip', '#lxp-overview', 'Spring til indhold');
  skip.addEventListener('click', (event) => {
    const target = document.getElementById(skip.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
    target.focus();
    target.scrollIntoView({ block: 'start' });
  });
  const search = element('dialog', 'lxp lxp-dialog');
  const settings = element('dialog', 'lxp lxp-dialog lxp-settings');
  let failed=false;
  const restore = button('lxp-restore', 'Aktivér LectioPlus+', () => failed ? location.reload() : savePreferences({ enabled: true }), 'Aktivér LectioPlus+');
  root.hidden = true;
  restore.hidden = true;
  root.append(skip, sidebar, topbar, navigationStatus, sectionNav, overview, workspace.node, clickerView, schoolTools.node, games.node, nativeOverview);
  if(schoolTools.dockNode)root.append(schoolTools.dockNode);
  native.before(root);
  document.body.append(search, settings, restore);
  const hideHints = globalThis.lectioPlusHints();

  function updateNativeOverview(visible) {
    const page = activePage;
    const scope = preview ? native.querySelector('[data-lxp-view]:not([hidden])') : native.querySelector('#m_outerContentFrameDiv, .ls-content-container') || native;
    const supported = visible && page && scope;
    nativeOverview.hidden = !supported;
    if (nativePageScope !== (supported ? scope : null)) {
      nativePageScope?.classList.remove('lxp-native-page');
      nativePageScope = supported ? scope : null;
      nativePageScope?.classList.add('lxp-native-page');
    }
    nativeLayout?.update(supported ? scope : null);
    setBodyState('lxp-native-heading', Boolean(supported));
    if (!supported) {
      replacedHeading?.removeAttribute('data-lxp-replaced-title');
      replacedHeading = undefined;
      return;
    }

    const titleInfo = nativeTitle(scope, page.key === 'activity');
    const title = titleInfo?.text || '';
    const replace = titleInfo?.node.matches('#MainTitle, .maintitle') || titleInfo?.node.closest('.ls-master-pageheader');
    const replacement = replace ? titleInfo.node : null;
    if (replacedHeading !== replacement) {
      replacedHeading?.removeAttribute('data-lxp-replaced-title');
      replacedHeading = replacement;
      replacedHeading?.setAttribute('data-lxp-replaced-title', '');
    }
    const label = nativeWorkflow(page, sourceUrl, scope) && title ? title : page.label;
    const suffix = ` - ${page.label}`;
    const context = page.key === 'activity' || normalize(title) === normalize(label) ? '' : title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
    const found = new Set([normalize(label)]);
    const sections = [...(scope?.querySelectorAll('h2, h3, .islandHeaderContainer, .ls-island-header') || [])].flatMap((target) => {
      const label = navigationText(target.querySelector('.islandHeader, h2, h3') || target);
      const key = normalize(label);
      if (!label || label.length > 75 || found.has(key) || target.closest('[hidden], [aria-hidden="true"]')) return [];
      found.add(key);
      return [{ target: target.querySelector('.islandHeader, h2, h3') || target, label }];
    });
    const signature = JSON.stringify([page.key, label, context, preferences.sectionShortcuts, sections.map(({ label }) => label)]);
    if (nativeHeading?.signature === signature && sections.every(({ target }, index) => nativeHeading.sections[index]?.target === target)) return;
    nativeHeading = { signature, sections };
    nativeOverview.replaceChildren(workspace.pageHeading(label, page.icon || 'grid', context));
    if (page.key === 'profile') {
      nativeOverview.append(button('lxp-secondary-button lxp-profile-settings', 'Designindstillinger', openSettings, icon('settings'), 'Designindstillinger'));
    }
    if (!preferences.sectionShortcuts || sections.length < 2) return;
    const shortcuts = element('nav', 'lxp-native-links', element('span', '', 'På siden'));
    shortcuts.setAttribute('aria-label', 'På siden');
    const jumpTo = (target) => {
      if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'start' });
    };
    if (sections.length > 4) {
      const picker = element('select', 'lxp-section-picker');
      picker.setAttribute('aria-label', 'Hop til afsnit');
      picker.append(new Option(`Hop til afsnit (${sections.length})…`, ''));
      sections.forEach(({ label }, index) => picker.append(new Option(label, String(index))));
      picker.addEventListener('change', () => {
        if (picker.value !== '') jumpTo(sections[Number(picker.value)].target);
        picker.value = '';
      });
      shortcuts.append(picker);
      nativeOverview.append(shortcuts);
      return;
    }
    for (const { target, label } of sections) {
      shortcuts.append(button('lxp-native-jump', `Gå til ${label}`, () => {
        jumpTo(target);
      }, label));
    }
    nativeOverview.append(shortcuts);
  }

  function updateSectionNavigation(visible) {
    const scope = preview ? native.querySelector('[data-lxp-view]:not([hidden])') : source;
    const groups = visible && scope ? [...scope.querySelectorAll('.ls-subnav1, .ls-subnav2, .lectioTabToolbar, [role="tablist"]')]
      .filter((group) => !group.parentElement.closest('.ls-subnav1, .ls-subnav2, .lectioTabToolbar, [role="tablist"]')) : [];
    const known = [...links.values()];
    const seen = new Set();
    const rows = groups.map((group) => [...group.querySelectorAll('a[href], button, input[type="button"], input[type="submit"]')].flatMap((control) => {
      if (control.closest('[hidden], [aria-hidden="true"]')) return [];
      const label = navigationText(control) || control.value || control.getAttribute('aria-label');
      const href = safeHref(control);
      if (!label || known.some((page) => normalize(page.lectio) === normalize(label) && page.href === href)) return [];
      const key = href || `${label}:${control.getAttribute('onclick') || ''}`;
      if (seen.has(key)) return [];
      seen.add(key);
      const selected = Boolean(control.closest('[aria-selected="true"], [aria-current="page"], [current-page], .ls-subnav-active, .selected, .sel'));
      const disabled = control.disabled || control.hasAttribute('disabled') || control.getAttribute('aria-disabled') === 'true';
      return [{ control, href, label, selected, disabled }];
    })).filter((row) => row.length);
    sectionNav.hidden = !rows.length;
    const sources = rows.flat().map((entry) => entry.control);
    const signature = JSON.stringify(rows.map((row) => row.map(({ href, label, selected, disabled }) => [href, label, selected, disabled])));
    if (sectionNavSignature === signature && sources.every((control, index) => control === sectionNavSources[index])) return;
    sectionNavSignature = signature;
    sectionNavSources = sources;
    sectionNav.replaceChildren(...rows.map((row) => element('div', 'lxp-section-nav-row', ...row.map(({ control, href, label, selected, disabled }) => {
      const postback = control.hasAttribute('onclick') || !href || control.getAttribute('href') === '#';
      const link = postback || disabled ? button('lxp-section-link', label, () => revealOriginal(control, true), label) : anchor('lxp-section-link', href, label);
      if (disabled) link.disabled = true;
      if (selected) link.setAttribute('aria-current', 'page');
      return link;
    }))));
  }

  function updateViewVisibility() {
    const enabled = preferences.enabled;
    const home = activePage?.key === 'home';
    const toolsOpen = enabled && activePage?.key === 'tools';
    schoolTools.update(toolsOpen);
    const gamesOpen = enabled && activePage?.key === 'games';
    games.update(gamesOpen);
    const clickerOpen = enabled && preferences.showClicker && activePage?.key === 'clicker';
    if (!enabled || !preferences.showClicker) clickerView.querySelector('iframe')?.remove();
    // A delegated menu action may open a real Lectio dialog inside the source.
    // Reveal that form for its lifetime, then automatically resume the modern view.
    const nativeDialog = source === native && [...native.querySelectorAll('dialog[open], [role="dialog"][aria-hidden="false"]')].some(dialog => !dialog.closest('[hidden]') && getComputedStyle(dialog).display !== 'none');
    const enhanced = enabled && !showNative && !nativeDialog && !clickerOpen && !toolsOpen && !gamesOpen && (home || workspaceReady);
    updateSectionNavigation(enhanced || toolsOpen || gamesOpen);
    if (toolsOpen || gamesOpen) sectionNav.hidden = true;
    overview.hidden = !enhanced || !home;
    workspace.node.hidden = !enhanced || home;
    clickerView.hidden = !clickerOpen;
    if (clickerOpen && !clickerView.querySelector('iframe')) {
      // Created on first open and kept afterwards, so the game keeps running while other tabs are shown.
      const frame = element('iframe', 'lxp-clicker-frame');
      frame.src = clickerUrl;
      frame.title = 'Strafe Clicker';
      frame.allow = 'fullscreen; autoplay; clipboard-write';
      frame.referrerPolicy = 'no-referrer';
      clickerView.append(frame);
    }
    setBodyState('lxp-native-hidden', enhanced || clickerOpen || toolsOpen || gamesOpen || (enabled && source !== native));
    setBodyState('lxp-inline-native', enabled && !showNative && !enhanced && !clickerOpen && !toolsOpen && !gamesOpen);
    setBodyState('lxp-activity-page', enabled && source === native && activePage?.key === 'activity');
    updateNativeOverview(enabled && !enhanced && !clickerOpen && !toolsOpen && !gamesOpen && source === native);
    const originalButton = topbar.querySelector('[data-lxp-original]');
    if (originalButton) {
      originalButton.hidden = clickerOpen || toolsOpen || gamesOpen;
      const label = showNative ? 'Tilbage til LectioPlus+' : 'Lectios værktøjer';
      originalButton.setAttribute('aria-expanded', String(showNative));
      originalButton.setAttribute('aria-label', label);
      originalButton.dataset.lxpHint = showNative ? 'Vis siden i LectioPlus+ igen' : 'Åbn de oprindelige formularer og værktøjer';
      originalButton.lastElementChild.textContent = label;
    }
    globalThis.lectioPlusNativeTheme?.flush();
    skip.href = gamesOpen ? '#lxp-games' : toolsOpen ? '#lxp-tools' : clickerOpen ? clickerHash : enhanced ? (home ? '#lxp-overview' : '#lxp-workspace') : !nativeOverview.hidden ? '#lxp-native-overview' :
      (document.getElementById('m_outerContentFrameDiv') ? '#m_outerContentFrameDiv' : '#masterContent');
  }

  function revealOriginal(control, keepWorkspace = false) {
    hideHints();
    pendingNavigation = undefined;
    navigationProgress();
    if (source !== native) {
      history.replaceState({ ...history.state, lectioPlusOriginal: !keepWorkspace }, '');
      location.reload();
      return;
    }
    if (keepWorkspace && control?.isConnected) {
      // Delegate to the real control, including Lectio's own JS wrappers.
      // Selecting an item is not a request to stay in the original UI.
      control.click();
      requestAnimationFrame(()=>refresh(true));
      return;
    }

    showNative = true;
    updateViewVisibility();
    if (control?.isConnected) {
      control.focus();
      control.click();
    } else window.scrollTo(0, 0);
  }

  function loadPage(href) {
    const previous = pageCache.get(href);
    if (previous && previous.expires > Date.now()) return previous.request;
    const entry = { expires: Date.now() + 25000, request: null };
    entry.request = (async () => {
      const response = await fetch(href, { credentials: 'same-origin', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('Lectio returned an unavailable page.');
      const markup = document.createElement('template');
      markup.innerHTML = await response.text();
      const scope = markup.content.querySelector('#masterContent');
      if (!scope || !markup.content.querySelector('#aspnetForm')) throw new Error('Lectio content was not found.');
      return { scope, title: readableText(markup.content.querySelector('title')) };
    })().catch((error) => {
      if (pageCache.get(href) === entry) pageCache.delete(href);
      throw error;
    });
    pageCache.delete(href);
    pageCache.set(href, entry);
    if (pageCache.size > 8) pageCache.delete(pageCache.keys().next().value);
    return entry.request;
  }

  function navigationTarget(link) {
    if (!link.matches('.lxp-nav-link, .lxp-brand, .lxp-search-result, .lxp-week-arrow, .lxp-hero-link, .lxp-summary-card, .lxp-text-link, .lxp-detail-row')) return null;
    const href = safeHref(link);
    if (!href) return null;
    const url = new URL(href);
    if (url.hash || (link.matches('.lxp-detail-row') && ![...links.values()].some((entry) => entry.href === href))) return null;
    const page = pages.find(({ route }) => route.test(url.pathname.split('/').pop()));
    return page && fastPages.has(page.key) && !nativeWorkflow(page, href, source) ? { href, page } : null;
  }

  function navigationProgress(label = '') {
    topbar.classList.toggle('lxp-is-loading', Boolean(label));
    navigationStatus.textContent = label ? `Åbner ${label.toLocaleLowerCase('da-DK')}…` : '';
  }

  async function navigate(href, page, fromHistory = false) {
    if (pendingNavigation?.href === href && !fromHistory) return;
    hideHints();
    pendingNavigation = undefined;
    navigationProgress();
    if (href === sourceUrl) {
      if (!fromHistory && location.href !== href) history.pushState({ lectioPlusNavigation: true }, '', href);
      if (activePage?.key === 'clicker' || activePage?.key === 'tools' || activePage?.key === 'games') refresh();
      if (showNative) {
        showNative = false;
        updateViewVisibility();
      }
      return;
    }
    const request = { href };
    pendingNavigation = request;
    navigationProgress(page.label);
    try {
      const result = href === initialUrl ? { scope: native, title: initialTitle } : await loadPage(href);
      if (pendingNavigation !== request || !preferences.enabled) return;
      if (result.scope !== native && (nativeWorkflow(page, href, result.scope) || !workspace.supports(result.scope, page.key))) {
        location.assign(href);
        return;
      }
      if (!fromHistory && location.href !== href) history.pushState({ lectioPlusNavigation: true }, '', href);
      source = result.scope;
      sourceUrl = href;
      showNative = false;
      sourceTitle = result.title || `${page.label} – Lectio`;
      document.title = sourceTitle;
      refresh();
      if (source !== native && page.key !== 'home' && !workspaceReady) {
        location.reload();
        return;
      }
      window.scrollTo(0, 0);
      const main = page.key === 'home' ? overview : workspace.node;
      if (!main.hidden) {
        main.tabIndex = -1;
        main.focus({ preventScroll: true });
      }
    } catch {
      if (pendingNavigation === request) location.assign(href);
    } finally {
      if (pendingNavigation === request) {
        pendingNavigation = undefined;
        navigationProgress();
      }
    }
  }

  function setSidebar(open) {
    sidebar.classList.toggle('lxp-sidebar-open', open);
    sidebar.inert = narrow.matches && !open;
    const menu = topbar.querySelector('.lxp-menu-button');
    menu?.setAttribute('aria-expanded', String(open));
    menu?.setAttribute('aria-label', open ? 'Skjul navigation' : 'Vis navigation');
    if (menu) menu.dataset.lxpHint = open ? 'Skjul navigation' : 'Vis navigation';
  }

  function renderNavigation() {
    const logo = [element('span', 'lxp-brand-icon', icon('mark')), element('span', 'lxp-brand-name', 'Lectio', element('span', '', 'Plus+'))];
    const brand = links.has('home') ? anchor('lxp-brand', links.get('home').href, ...logo) : element('div', 'lxp-brand', ...logo);
    const institution = source.querySelector('.ls-master-header-institution-name')?.textContent.trim();
    const navigation = element('nav', 'lxp-nav');
    navigation.setAttribute('aria-label', 'Navigation i LectioPlus+');
    const ordered = preferences.navigation.filter((item) => item.visible);
    const pinned = ordered.filter((item) => item.pinned).map((item) => item.id);
    const customOrder = preferences.navigation.some((item, index) => item.id !== appearance.navigationItems[index][0]);
    const groups = customOrder ? [['Menuer', ordered.map((item) => item.id)]] : [
      ['Skole', ['home', 'schedule', 'tasks', 'homework', 'messages', 'tools', 'games', 'clicker']],
      ['Elev', ['attendance', 'grades', 'study', 'documents', 'books']],
      ['Flere menuer', ['surveys', 'support', 'electives', 'profile', 'school']]
    ];
    if (pinned.length) groups.unshift(['Favoritter', pinned]);
    for (const [label, keys] of groups) {
      const group = keys.filter((key) => ordered.some((item) => item.id === key) && (label === 'Favoritter' || !pinned.includes(key))).map((key) => (key === 'tools' ? toolsPage : key === 'games' ? gamesPage : key === 'clicker' ? (preferences.showClicker ? clickerPage : null) : links.get(key))).filter(Boolean);
      if (!group.length) continue;
      let container = navigation;
      if (label === 'Flere menuer' && preferences.navigationGroups !== 'flat') {
        const disclosure = element('details', 'lxp-nav-group');
        disclosure.open = preferences.navigationGroups === 'expanded' || secondaryNavigationOpen || group.some((entry) => entry.key === activePage.key);
        disclosure.addEventListener('toggle', () => { secondaryNavigationOpen = disclosure.open; });
        disclosure.append(element('summary', '', label, icon('chevron')));
        container = element('div', 'lxp-nav-group-links');
        disclosure.append(container);
        navigation.append(disclosure);
      } else navigation.append(element('div', 'lxp-nav-heading', label));
      for (const entry of group) {
        const link = anchor('lxp-nav-link', entry.href, icon(entry.icon), element('span', '', entry.label));
        if (entry.key === activePage.key) link.setAttribute('aria-current', 'page');
        link.addEventListener('click', () => setSidebar(false));
        container.append(link);
      }
    }

    if(preferences.customSidebar.length){
      navigation.append(element('div','lxp-nav-heading','Mine links'));
      for(const item of preferences.customSidebar){const link=anchor('lxp-nav-link lxp-custom-nav-link',item.url,item.icon==='emoji'?element('span','',item.emoji||'🔗'):icon(item.icon),element('span','',item.label));if(item.newTab){link.target='_blank';link.rel='noopener noreferrer';}link.addEventListener('click',()=>setSidebar(false));navigation.append(link);}
    }

    if (!preview && searchablePages().some((entry) => entry.context)) {
      navigation.append(button('lxp-nav-more', 'Find flere sider og undermenuer', openSearch, icon('search'), 'Flere sider…'));
    }
    const sidebarEnd = element('div', 'lxp-sidebar-end');
    if (institution) sidebarEnd.append(element('div', 'lxp-school-name', icon('grid'), element('span', '', institution)));
    if (preview) sidebarEnd.append(element('p', 'lxp-preview-label', 'Forhåndsvisning · Eksempeldata'));
    sidebar.replaceChildren(brand, navigation, sidebarEnd);

    const menu = button('lxp-icon-button lxp-menu-button', 'Vis navigation', () => {
      setSidebar(!sidebar.classList.contains('lxp-sidebar-open'));
      if (!sidebar.inert) sidebar.querySelector('a')?.focus();
    }, icon('menu'));
    menu.setAttribute('aria-controls', sidebar.id);
    const shortcut = element('kbd', '', /Mac/i.test(navigator.platform) ? '⌘ K' : 'Ctrl K');
    const searchButton = button('lxp-search-button', 'Find en side', () => openSearch(), icon('search'),
      element('span', '', 'Find en side…'), shortcut);
    searchButton.dataset.lxpHint = `Find en side · ${shortcut.textContent}`;
    const themeButton = button('lxp-icon-button', 'Skift mellem lys og mørk visning', () => {
      savePreferences({ theme: isDark() ? 'light' : 'dark' });
    });
    themeButton.dataset.lxpThemeToggle = '';
    const settingsButton = button('lxp-icon-button', 'Indstillinger', () => openSettings(), icon('settings'));
    settingsButton.dataset.lxpHint = 'Vælg tema, farver og afstand';
    const originalButton = button('lxp-original-button', 'Lectios værktøjer', () => {
      if (!showNative) revealOriginal();
      else {
        showNative = false;
        updateViewVisibility();
        window.scrollTo(0, 0);
      }
    }, icon('external'), element('span', '', 'Lectios værktøjer'));
    originalButton.dataset.lxpOriginal = '';
    originalButton.setAttribute('aria-controls', native.id);
    const dockButton=button('lxp-icon-button','Åbn værktøjspanel',()=>schoolTools.toggleDock?.(),icon('grid'));dockButton.dataset.lxpDockButton='';
    const repairButton=button('lxp-icon-button','Reparér visningen',()=>{showNative=false;failed=false;workspace.invalidate?.();appearance.apply(document.documentElement,preferences,darkMode.matches,preferences.enabled);refresh();navigationStatus.textContent=failed?'Kunne ikke genopbygge visningen. Genindlæs siden.':'Visningen er genopbygget. Dine indstillinger og input er bevaret.';},element('span','','↻'));
    topbar.replaceChildren(
      element('div', 'lxp-topbar-label', menu, element('span', 'lxp-breadcrumb', ...(activePage.parent && links.get(activePage.key) ? [anchor('', links.get(activePage.key).href, activePage.parent)] : ['Lectio']), icon('chevron')),
        element('span', 'lxp-current-page', activePage.label)),
      element('div', 'lxp-topbar-actions', searchButton, originalButton, dockButton, repairButton, themeButton, settingsButton)
    );
    setSidebar(false);
    updateThemeButton();
  }

  function readableText(node) {
    return (node?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function findPanel(pattern, scope = source) {
    const titles = scope.querySelectorAll('h2, h3, h4, legend, .islandHeaderContainer, .islandHeader, .islandTitle, .ls-island-header, .ls-island-title');
    for (const title of titles) {
      if (title.closest('[data-lxp-owned]') || !pattern.test(normalize(title.textContent))) continue;
      const panel = title.closest('.lf-island, .island, .ls-island, section, fieldset, [data-front-panel]') || title.parentElement;
      if (panel.querySelector('a[href], a[onclick]')) return panel;
    }
    return null;
  }

  function panelItems(panel, key, base = sourceUrl) {
    if (!panel) return [];
    const items = [];
    const visited = new Set();
    for (const link of panel.querySelectorAll('a[href], a[onclick]')) {
      const direct = safeHref(link, base);
      const hasNativeAction = link.hasAttribute('onclick') || link.getAttribute('href')?.startsWith('javascript:');
      const href = direct || (hasNativeAction && links.get(key)?.href);
      const title = readableText(link);
      const identity = direct || title;
      if (!href || !title || visited.has(identity) || (direct && [...links.values()].some((entry) => entry.href === direct)) ||
          /^(vis|se|gå til|åbn) (alle|mere|skema|opgaver|beskeder)|^(mere|opdater)$/i.test(title)) continue;
      visited.add(identity);
      const row = link.closest('li, tr, [data-front-item]') || link.parentElement;
      const time = row?.querySelector('time, [data-item-time]');
      const rowText = readableText(row);
      items.push({
        href, title,
        time: readableText(time) || rowText.match(/\b\d{1,2}[.:]\d{2}\s*[-–]\s*\d{1,2}[.:]\d{2}\b/)?.[0] || '',
        detail: readableText(row?.querySelector('[data-item-detail]')),
        tag: readableText(row?.querySelector('[data-item-tag]'))
      });
    }
    return items;
  }

  function cancelHomeSources() {
    homeSources.clear();
  }

  function sourceItems(key, scope, base, now) {
    if (key === 'schedule') {
      const schedule = lectio.scheduleView(scope);
      if (!schedule?.confirmedDays.includes(now.date)) return null;
      const lessons = schedule.lessons.filter((lesson) => lesson.date === now.date);
      if (schedule.lessons.some((lesson) => !lesson.date)) return null;
      return lessons.sort((first, second) => first.order.localeCompare(second.order)).map((lesson) => ({
        title: lesson.title, time: lesson.time, detail: lesson.detail, tag: lesson.status, href: safeHref(lesson.link, base) || base
      }));
    }
    const table = lectio.tableView(scope, 'tasks');
    if (!table?.hasStatus) return null;
    const upcoming = table.rows.filter((row) => row.state === 'open' && row.due && `${row.due}T${row.dueTime}` >= `${now.date}T${now.time}`);
    if (table.rows.some((row) => (!row.state && (!row.due || row.due >= now.date)) || (row.state === 'open' && !row.due))) return null;
    return upcoming.sort((first, second) => `${first.due}T${first.dueTime}`.localeCompare(`${second.due}T${second.dueTime}`)).map((row) => ({
      title: row.title, time: row.dueText, detail: row.subject, tag: '', href: safeHref(row.link, base) || base
    }));
  }

  function homeSource(key, now) {
    const entry = links.get(key);
    if (preview || !entry || !entry.route.test(new URL(entry.href).pathname.split('/').pop())) return undefined;
    const href = entry.href;
    const current = homeSources.get(key);
    if (current?.href === href && current.date === now.date) return current;
    const source = { href, date: now.date, pending: true, items: null };
    homeSources.set(key, source);
    void load();
    return source;

    async function load() {
      try {
        const scope = href === initialUrl ? native : (await loadPage(href)).scope;
        source.items = sourceItems(key, scope, href, lectio.today());
      } catch {
        // The original page stays available when Lectio redirects or the response is unavailable.
      } finally {
        source.pending = false;
        if (preferences.enabled && homeSources.get(key) === source) {
          if (activePage.key === 'home') renderOverview();
          if (settings.open) settingsControls?.refreshPreview();
        }
      }
    }
  }

  function actionLink(key, label, className = 'lxp-text-link') {
    const entry = links.get(key);
    return entry ? anchor(className, entry.href, label, icon('arrow')) : null;
  }

  function summaryCard(key, label, accent, items, emptyLabel, verified = false) {
    const page = links.get(key);
    const content = element('div', 'lxp-summary-content', element('div', 'lxp-summary-label', label),
      element('div', 'lxp-summary-value', items.length || verified ? String(items.length) : page ? emptyLabel : '—'));
    const children = [element('span', `lxp-summary-icon lxp-${accent}`, icon(pages.find((item) => item.key === key).icon)), content];
    if (!page) return element('div', 'lxp-summary-card', ...children);
    return anchor('lxp-summary-card', page.href, ...children, element('span', 'lxp-summary-arrow', icon('chevron')));
  }

  function detailCard(title, key, linkLabel, items, kind, emptyLabel) {
    const heading = element('div', 'lxp-card-heading', element('h2', '', title));
    const link = actionLink(key, linkLabel);
    if (link) heading.append(link);
    const list = element('ul', `lxp-detail-list lxp-${kind}-list`);
    const accents = ['violet', 'blue', 'green', 'amber'];
    for (const [index, item] of items.slice(0, 5).entries()) {
      const accent = item.tag === 'Aflyst' ? 'red' : item.tag === 'Ændret' ? 'amber' : accents[index % accents.length];
      const detail = element('span', 'lxp-detail-copy', element('strong', '', item.title));
      if (item.detail || (kind !== 'schedule' && item.time)) {
        detail.append(element('span', 'lxp-detail-meta', item.detail || item.time));
      }
      const lead = kind === 'schedule' && item.time
        ? element('span', 'lxp-detail-time', item.time)
        : element('span', `lxp-detail-icon lxp-${accent}`, icon(kind === 'schedule' ? 'calendar' : kind === 'messages' ? 'message' : 'file'));
      const row = anchor('lxp-detail-row', item.href, lead, detail);
      if (item.tag || (kind !== 'schedule' && item.detail && item.time)) {
        row.append(element('span', `lxp-detail-tag lxp-${accent}`, item.tag || item.time));
      }
      list.append(element('li', '', row));
    }
    return element('section', 'lxp-detail-card', heading, items.length ? list : element('p', 'lxp-empty', emptyLabel));
  }

  function buildOverviewWidgets(config, scope, base = sourceUrl) {
    const now = preview ? new Date(document.body.dataset.lxpPreviewDate) : new Date();
    const today = lectio.today(now);
    const frontSchedule = panelItems(findPanel(/^(?:(dagens (skema|lektioner)|skema i dag)\b|i dag$)/, scope), 'schedule', base);
    const frontTasks = panelItems(findPanel(/^(kommende (opgaver|afleveringer)|næste afleveringer)\b/, scope), 'tasks', base);
    const scheduleSource = frontSchedule.length ? undefined : homeSource('schedule', today);
    const taskSource = frontTasks.length ? undefined : homeSource('tasks', today);
    const schedule = scheduleSource?.items || frontSchedule;
    const tasks = taskSource?.items || frontTasks;
    const messages = panelItems(findPanel(/^ulæste beskeder\b/, scope), 'messages', base);
    const generalTasks = tasks.length || taskSource?.items || taskSource?.pending ? [] : panelItems(findPanel(/^(afleveringer|opgaver)\b/, scope), 'tasks', base);
    const date = lectio.displayDay(today.date);
    const data = JSON.stringify([date, schedule, tasks, messages, generalTasks, scheduleSource?.pending, Boolean(scheduleSource?.items),
      taskSource?.pending, Boolean(taskSource?.items), [...links], config.dashboard, config.showClicker]);
    const hero = element('div', 'lxp-hero', element('div', 'lxp-hero-art'),
      element('div', 'lxp-hero-copy', element('div', 'lxp-hero-date', icon('calendar'), date),
        element('h1', '', config.dashboard.title)));
    const heroLink = actionLink('schedule', 'Se dit skema', 'lxp-hero-link');
    if (heroLink) hero.append(heroLink);
    const summaries = element('div', 'lxp-summary-grid',
      summaryCard('schedule', 'Skema i dag', 'violet', schedule, 'Se skema', Boolean(scheduleSource?.items)),
      summaryCard('tasks', 'Kommende afleveringer', 'amber', tasks, 'Se opgaver', Boolean(taskSource?.items)),
      summaryCard('messages', 'Ulæste beskeder', 'blue', messages, 'Se beskeder'));
    const details = element('div', 'lxp-details-grid',
      detailCard('Dagens skema', 'schedule', 'Hele skemaet', schedule, 'schedule', scheduleSource?.pending
        ? 'Henter dagens skema…' : scheduleSource?.items ? 'Ingen aktiviteter i dagens skema.' : 'Åbn dit skema for at se dagens lektioner.'),
      detailCard(generalTasks.length ? 'Opgaver på forsiden' : 'Næste afleveringer', 'tasks', 'Alle opgaver', tasks.length ? tasks : generalTasks, 'tasks', taskSource?.pending
        ? 'Henter afleveringer…' : taskSource?.items ? 'Ingen kommende afleveringer i opgavelisten.' : 'Åbn dine opgaver for at se fristerne.'));
    if (messages.length) details.append(detailCard('Ulæste beskeder', 'messages', 'Alle beskeder', messages, 'messages', ''));
    const clickerArtwork = element('img', 'lxp-clicker-art');
    clickerArtwork.alt = '';
    clickerArtwork.width = 512;
    clickerArtwork.height = 512;
    const clickerIconUrl = preview ? '../extension/strafe-clicker-icon.png' : globalThis.chrome?.runtime?.getURL('strafe-clicker-icon.png');
    if (clickerIconUrl) clickerArtwork.src = clickerIconUrl;
    const clicker = anchor('lxp-clicker-link', clickerHash,
      element('span', 'lxp-clicker-name', 'Strafe', element('span', '', 'Clicker')),
      clickerArtwork, icon('arrow'));
    clicker.setAttribute('aria-label', 'Åbn Strafe Clicker');
    const registry = new Map([['hero', hero], ['summary', summaries], ['schedule', details.children[0]], ['tasks', details.children[1]],
      ['messages', detailCard('Ulæste beskeder', 'messages', 'Alle beskeder', messages, 'messages', 'Ingen ulæste beskeder på forsiden.')], ['clicker', clicker]]);
    const shortcuts = element('section', 'lxp-detail-card lxp-custom-card', element('h2', '', 'Genveje'));
    const shortcutsList = element('div', 'lxp-dashboard-shortcuts');
    for (const key of ['schedule', 'tasks', 'homework', 'messages', 'documents']) {
      const entry = links.get(key);
      if (entry) shortcutsList.append(anchor('lxp-secondary-button', entry.href, icon(entry.icon), entry.label));
    }
    shortcuts.append(shortcutsList);
    registry.set('shortcuts', shortcuts);
    for (const item of config.dashboard.custom) {
      const card = element('section', 'lxp-detail-card lxp-custom-card', element('h2', '', item.title));
      if (item.text) card.append(element('p', 'lxp-custom-text', item.text));
      const url = appearance.safeUrl(item.url);
      if (item.type === 'link' && url) {
        const link = anchor('lxp-secondary-button', url, 'Åbn link', icon('external'));
        link.target = '_blank'; link.rel = 'noopener noreferrer'; card.append(link);
      }
      registry.set(item.id, card);
    }
    return { registry, data };
  }

  function renderOverview() {
    if (activePage.key !== "home") { overviewData = undefined; overview.replaceChildren(); return; }
    const { registry, data } = buildOverviewWidgets(preferences, preview ? native.querySelector('[data-lxp-view="home"]') : source);
    if (data === overviewData) return;
    overviewData = data;
    const grid = element('div', 'lxp-dashboard-grid');
    grid.dataset.columns = preferences.dashboard.columns;
    for (const slot of preferences.dashboard.slots) {
      if (!slot.visible || (slot.id === 'clicker' && !preferences.showClicker) || !registry.has(slot.id)) continue;
      const wrapper = element('div', 'lxp-dashboard-widget', registry.get(slot.id));
      wrapper.dataset.widget = slot.id; wrapper.dataset.width = slot.width;
      grid.append(wrapper);
    }
    if (!grid.children.length) grid.append(element('p', 'lxp-empty', 'Tilføj felter under Tilpas overblik for at komme i gang.'));
    const toolbar = element('div', 'lxp-dashboard-toolbar', button('lxp-secondary-button', 'Tilpas overblik', () => openSettings('dashboard'), icon('settings'), 'Tilpas overblik'));
    overview.replaceChildren(toolbar, grid);
    if (settings.open) settingsControls?.refreshPreview();
  }

  function showDialog(dialog, focusTarget) {
    hideHints();
    lastDialogTrigger = document.activeElement;
    dialog.showModal();
    focusTarget.focus();
  }

  for (const dialog of [search, settings]) {
    dialog.addEventListener('close', () => lastDialogTrigger?.focus());
    dialog.addEventListener('cancel', (event) => { if (dialog === settings && !settingsControls?.canClose()) event.preventDefault(); });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog && (dialog !== settings || settingsControls?.canClose())) dialog.close();
    });
  }

  function openSearch() {
    if (search.open || settings.open) return;
    const input = element('input', 'lxp-search-input');
    input.type = 'search';
    input.placeholder = 'Søg efter en side…';
    input.setAttribute('aria-label', 'Søg efter en side');
    search.setAttribute('aria-label', 'Find en side');
    const results = element('ul', 'lxp-search-results');
    const entries = searchablePages();
    const status = element('p', 'lxp-search-status');
    status.setAttribute('aria-live', 'polite');
    const renderResults = () => {
      const query = normalize(input.value);
      const matching = entries.filter((entry) => normalize(`${entry.label} ${entry.lectio} ${entry.context || ''}`).includes(query));
      status.textContent = matching.length ? '' : 'Ingen sider matcher din søgning.';
      results.replaceChildren(...matching.map((entry) => {
        const result = anchor('lxp-search-result', entry.href, icon(entry.icon), element('span', 'lxp-search-copy', element('span', '', entry.label), ...(entry.context ? [element('small', '', entry.context)] : [])), icon('arrow'));
        result.addEventListener('click', () => search.close());
        return element('li', '', result);
      }));
    };
    search.onkeydown = (event) => {
      const options = Array.from(results.querySelectorAll('a'));
      const index = options.indexOf(document.activeElement);
      if (event.key === 'ArrowDown' && options.length) {
        event.preventDefault();
        options[(index + 1) % options.length].focus();
      } else if (event.key === 'ArrowUp' && index >= 0) {
        event.preventDefault();
        (options[index - 1] || input).focus();
      } else if (event.key === 'Enter' && document.activeElement === input && options.length) {
        event.preventDefault();
        options[0].click();
      }
    };
    input.addEventListener('input', renderResults);
    search.replaceChildren(element('div', 'lxp-dialog-body', element('div', 'lxp-search-field', icon('search'), input,
      button('lxp-icon-button', 'Luk søgning', () => search.close(), icon('close'))), results, status));
    renderResults();
    showDialog(search, input);
  }

  function openSettings(initialTab = 'appearance') {
    if (settings.open || search.open) return;
    settings.setAttribute('aria-label', 'Indstillinger');
    const close = button('lxp-icon-button', 'Luk indstillinger', () => { if (settingsControls.canClose()) settings.close(); }, icon('close'));
    settingsHomeScope = preview ? native.querySelector('[data-lxp-view=home]') : activePage.key === 'home' ? source : null;
    settingsHomeUrl = sourceUrl;
    settingsPreviewStatus = settingsHomeScope ? (preview ? 'Testdata fra demoens overblik' : 'Dine data fra Lectio') : 'Henter dit overblik…';
    settingsControls = globalThis.lectioPlusSettings({ ui: { element, button, icon }, getPreferences: () => preferences, onChange: savePreferences, getWidgets: (config) => {
      const widgets = buildOverviewWidgets(config, settingsHomeScope || document.createElement('div'), settingsHomeUrl);
      if (!settingsHomeScope) widgets.registry.set('messages', element('p', 'lxp-empty', settingsPreviewStatus));
      return { ...widgets, label: settingsPreviewStatus };
    }, initialTab: typeof initialTab === 'string' ? initialTab : 'appearance' });
    settingsControls.sync(preferences);
    if (!settingsHomeScope) {
      const controls = settingsControls;
      const home = links.get('home');
      void (async () => {
        try {
          if (!home) throw new Error('missing');
          const page = await loadPage(home.href);
          if (controls !== settingsControls) return;
          settingsHomeScope = page.scope; settingsHomeUrl = home.href; settingsPreviewStatus = 'Dine data fra Lectio';
        } catch {
          if (controls !== settingsControls) return;
          settingsPreviewStatus = 'Overblikket kunne ikke hentes. Åbn Overblik og prøv igen.';
        }
        controls.refreshPreview();
      })();
    }
    const classic = button('lxp-secondary-button', 'Brug klassisk Lectio', () => {
      if (!settingsControls.canClose()) return;
      settings.close();
      savePreferences({ enabled: false });
    }, icon('external'), 'Brug klassisk Lectio');
    settings.replaceChildren(element('div', 'lxp-dialog-body lxp-settings-body',
      element('div', 'lxp-card-heading', element('h2', '', 'Indstillinger'), close),
      settingsControls.node, classic));
    settings.classList.toggle('lxp-settings-visual', settingsControls.node.dataset.category === 'dashboard');
    showDialog(settings, close);
  }

  function isDark() {
    return appearance.dark(preferences, darkMode.matches);
  }

  function updateThemeButton() {
    const control = topbar.querySelector('[data-lxp-theme-toggle]');
    if (!control) return;
    control.replaceChildren(icon(isDark() ? 'sun' : 'moon'));
    control.dataset.lxpHint = isDark() ? 'Skift til lyst tema' : 'Skift til mørkt tema';
  }

  function applyPreferences() {
    if (!preferences.enabled) globalThis.lectioPlusTab?.apply('', false, sourceTitle);
    hideHints();
    setBodyState('lxp-enabled', preferences.enabled);
    appearance.apply(document.documentElement, preferences, darkMode.matches, preferences.enabled);
    settingsControls?.sync(preferences);
    root.hidden = !preferences.enabled;
    restore.hidden = !preview || preferences.enabled;
    updateThemeButton();
    requestAnimationFrame(globalThis.lectioPlusRepaintIcons);
    if (preferences.enabled) refresh();
    else {
      if (search.open) search.close();
      if (settings.open) settings.close();
      pendingNavigation = undefined;
      navigationProgress();
      pageCache.clear();
      if (source !== native) {
        location.reload();
        return;
      }
      updateViewVisibility();
      cancelHomeSources();
    }
  }

  let preferenceQueue = Promise.resolve();
  function savePreferences(changes) {
    const snapshot = structuredClone(changes);
    const save = async () => {
      const next = appearance.normalize({ ...preferences, ...snapshot });
      const values = Object.fromEntries(Object.keys(snapshot).filter((key) => key in defaults).map((key) => [key, next[key]]));
      try {
        if (storage) await storage.local.set(values);
        else if (preview) localStorage.setItem('lectioPlusPreview', JSON.stringify(next));
      } catch { return false; }
      preferences = next;
      applyPreferences();
      return true;
    };
    if (!storage) return save();
    const result = preferenceQueue.then(save);
    preferenceQueue = result.catch(() => {});
    return result;
  }

  function selectPreviewPage() {
    const page = pageInfo();
    const selected = page.view || page.key;
    for (const panel of native.querySelectorAll('[data-lxp-view]')) {
      const hidden = panel.dataset.lxpView !== selected;
      if (panel.hidden !== hidden) panel.hidden = hidden;
    }
  }

  function navigatePreview() {
    const targetId = location.hash.split('/')[1];
    const modernTarget = targetId && [...workspace.node.querySelectorAll('[data-lxp-source-id]')]
      .find((row) => row.dataset.lxpSourceId === targetId && !row.closest('[hidden]'));
    const target = modernTarget || (targetId && document.getElementById(targetId));
    document.querySelector('.lxp-preview-target')?.classList.remove('lxp-preview-target');
    if (target && !target.closest('[hidden]')) {
      target.classList.add('lxp-preview-target');
      target.scrollIntoView({ block: 'nearest' });
    } else window.scrollTo(0, 0);
  }

  function failOpen(){
    failed=true;root.hidden=true;restore.hidden=false;
    restore.textContent='Genindlæs LectioPlus+';restore.setAttribute('aria-label','Genindlæs LectioPlus+');
    document.body.classList.remove('lxp-enabled','lxp-native-hidden','lxp-native-heading','lxp-inline-native','lxp-activity-page');
    globalThis.lectioPlusNativeTheme?.flush();boot?.finish();
  }
  function refresh(transient=false){
    try{refreshContent(transient);if(failed&&preferences.enabled){failed=false;setBodyState('lxp-enabled',true);restore.hidden=true;}restorePresentation();}
    catch{failOpen();}
  }
  function refreshContent(transient = false) {
    if (!preferences.enabled) return;
    if (!preferences.showClicker && location.hash === clickerHash) history.replaceState(history.state, '', preview ? '#home' : location.pathname + location.search);
    if (preview) selectPreviewPage();
    const previousLinks = JSON.stringify([...links]);
    const previousPage = activePage;
    links = getNavigation();
    activePage = pageInfo();
    globalThis.lectioPlusTab?.apply(activePage.label, preferences.tabBranding, sourceTitle);
    if (previousPage && previousPage.key !== activePage.key) {
      hideHints();
      showNative = false;
      if (previousPage?.key === 'home') cancelHomeSources();
    }
    const navPrefs = JSON.stringify([preferences.showClicker, preferences.navigationGroups, preferences.navigation, preferences.customSidebar]);
    if (navigationPreferences !== navPrefs || previousPage?.key !== activePage.key || previousPage?.label !== activePage.label || previousPage?.parent !== activePage.parent || previousLinks !== JSON.stringify([...links])) {
      navigationPreferences = navPrefs;
      renderNavigation();
    }
    renderOverview();
    const scope = preview ? native.querySelector('[data-lxp-view]:not([hidden])') : source;
    const now = preview ? new Date(document.body.dataset.lxpPreviewDate) : new Date();
    const workflow = nativeWorkflow(activePage, sourceUrl, scope || native);
    if (transient && workspaceReady && previousPage?.key === activePage.key && !workflow && scope && !workspace.supports(scope, activePage.key)) {
      // Lectio can remove and recreate a table in separate tasks. Keep the last complete view briefly.
      workspace.node.setAttribute('aria-busy', 'true');
      if (!missingContentTimer) missingContentTimer = setTimeout(() => { missingContentTimer = undefined; refresh(); }, 750);
      return;
    }
    clearTimeout(missingContentTimer);
    missingContentTimer = undefined;
    workspace.node.removeAttribute('aria-busy');
    workspaceReady = workspace.update(workflow ? null : scope, activePage.key, lectio.today(now).date);
    updateViewVisibility();
  }

  async function start() {
    try {
      if (boot) preferences = await boot.preferences;
      else if (storage) preferences = appearance.normalize(await storage.local.get(defaults));
      else if (preview) preferences = appearance.normalize(JSON.parse(localStorage.getItem('lectioPlusPreview') || '{}'));
    } catch {
      preferences = { ...defaults };
    }
    if (!preview && history.state?.lectioPlusOriginal) {
      const { lectioPlusOriginal, ...state } = history.state;
      history.replaceState(state, '');
      showNative = true;
    }
    if (preview) selectPreviewPage();
    applyPreferences();
    boot?.onPreferences?.(settings=>{const next=appearance.normalize(settings);if(JSON.stringify(next)!==JSON.stringify(preferences)){preferences=next;applyPreferences();}});
    if (preview && location.hash.includes('/')) navigatePreview();
    await globalThis.lectioPlusNativeTheme?.ready;

    storage?.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      const next = { ...preferences };
      for (const key of Object.keys(defaults)) {
        if (changes[key]) next[key] = changes[key].newValue ?? defaults[key];
      }
      const normalized = appearance.normalize(next);
      if (JSON.stringify(normalized) === JSON.stringify(preferences)) return;
      preferences = normalized;
      applyPreferences();
    });
    darkMode.addEventListener('change', applyPreferences);
    narrow.addEventListener('change', () => setSidebar(false));
    document.addEventListener('keydown', (event) => {
      if (!preferences.enabled) return;
      if (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey) && !event.altKey && !settings.open) {
        event.preventDefault();
        openSearch();
      }
      if (event.key === 'Escape' && sidebar.classList.contains('lxp-sidebar-open')) {
        setSidebar(false);
        topbar.querySelector('.lxp-menu-button')?.focus();
      }
    });
    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      if (!sidebar.contains(event.target) && !event.target.closest('.lxp-menu-button')) setSidebar(false);
      if (preview || !preferences.enabled || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      const link = event.target.closest('.lxp a[href]');
      if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      const target = navigationTarget(link);
      if (!target) return;
      event.preventDefault();
      void navigate(target.href, target.page);
    });
    if (preview) window.addEventListener('hashchange', () => {
      if (preferences.enabled) refresh();
      else selectPreviewPage();
      navigatePreview();
    });
    if (!preview) window.addEventListener('hashchange', () => {
      if (preferences.enabled && (activePage?.key === 'clicker' || activePage?.key === 'tools' || activePage?.key === 'games' || location.hash === clickerHash || toolsHash() || gamesHash())) refresh();
    });
    if (!preview) window.addEventListener('popstate', () => {
      if (!preferences.enabled) return;
      const href = location.href;
      const url = new URL(href);
      const current = new URL(sourceUrl);
      if (url.hash && url.pathname === current.pathname && url.search === current.search) return;
      const page = pages.find(({ route }) => route.test(url.pathname.split('/').pop()));
      if (href === initialUrl) void navigate(href, page || { label: 'Lectio' }, true);
      else if (history.state?.lectioPlusNavigation && page && fastPages.has(page.key)) void navigate(href, page, true);
    });
    window.addEventListener('beforeunload', (event) => {
      if (settings.open && settingsControls?.hasUnsaved()) { event.preventDefault(); event.returnValue = ''; }
    });
    window.addEventListener('pageshow', (event) => {
      restorePresentation();
      if (event.persisted && preferences.enabled && activePage.key === 'home') {
        pageCache.clear();
        cancelHomeSources();
        renderOverview();
      }
    });
    const observer = new MutationObserver((records) => {
      const current=document.getElementById('masterContent');
      if(current&&(!root.isConnected||current!==native)){
        if(current!==native){native=current;source=current;sourceUrl=location.href;pendingNavigation=undefined;pageCache.clear();}
        if(!root.isConnected)native.before(root);
        for(const node of [search,settings,restore])if(!node.isConnected)document.body.append(node);
        applyPreferences();
        return;
      }
      if(records.some(({target})=>target===document.documentElement||target===document.body||target===root))restorePresentation();
      if(!records.some(({target})=>native.contains(target)&&!(target.nodeType===Node.ELEMENT_NODE?target:target.parentElement)?.closest('[data-lxp-owned]')))return;
      if(refreshFrame!==undefined)return;
      refreshFrame=requestAnimationFrame(()=>{refreshFrame=undefined;refresh(true);});
    });
    // The source itself (and occasionally its parent) can be replaced by Lectio.
    observer.observe(document,{childList:true,characterData:true,subtree:true,attributes:true,
      attributeFilter:['class','hidden','open','style','aria-hidden','aria-selected','aria-current','current-page','data-tooltip','href','title',...appearance.attributeNames]});

  }

  void start().catch(failOpen).finally(()=>boot?.finish());
  }
})();
