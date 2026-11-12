(() => {
  'use strict';

  const preview = document.body.hasAttribute('data-lxp-preview');
  const schoolPath = location.pathname.match(/^\/lectio\/\d+\//i)?.[0];
  const file = location.pathname.split('/').pop().toLowerCase();
  const native = document.getElementById('masterContent');
  const boot = globalThis.lectioPlusBoot;
  if (!native || (!preview && (!schoolPath || /login|logout|logud|auth|eksam|proeve/.test(file)))) {
    boot?.finish();
    return;
  }

  const pages = [
    { key: 'home', label: 'Overblik', lectio: 'Forside', icon: 'home', route: /^forside\.aspx$/i },
    { key: 'schedule', label: 'Skema', lectio: 'Skema', icon: 'calendar', route: /^skema\.aspx$/i },
    { key: 'tasks', label: 'Opgaver', lectio: 'Opgaver', icon: 'file', route: /^(opgaver|eleveropgaver|opgaveoversigt)\.aspx$/i },
    { key: 'homework', label: 'Lektier', lectio: 'Lektier', icon: 'book', route: /^(lektier|lektieoversigt)\.aspx$/i },
    { key: 'messages', label: 'Beskeder', lectio: 'Beskeder', icon: 'message', route: /^(beskeder2?|beskedoversigt)\.aspx$/i },
    { key: 'attendance', label: 'Fravær', lectio: 'Fravær', icon: 'chart', route: /^(fravaer|subnavfravaerelev)\.aspx$/i },
    { key: 'grades', label: 'Karakterer', lectio: 'Karakterer', icon: 'chart', route: /^(karakterer|grades|grade_report)\.aspx$/i },
    { key: 'study', label: 'Studieplan', lectio: 'Studieplan', icon: 'calendar', route: /^(studieplan|studieplan2)\.aspx$/i },
    { key: 'documents', label: 'Dokumenter', lectio: 'Dokumenter', icon: 'file', route: /^(dokumenter|document)\.aspx$/i },
    { key: 'books', label: 'Bøger', lectio: 'Bøger', icon: 'book', route: /^(boeger|bogoversigt)\.aspx$/i },
    { key: 'surveys', label: 'Spørgeskemaer', lectio: 'Spørgeskema', icon: 'file', route: /^(spoergeskemaer?|questionnaire)\.aspx$/i },
    { key: 'support', label: 'SPS', lectio: 'SPS', icon: 'help', route: /^sps[\w-]*\.aspx$/i },
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
  const initialTitle = document.title;
  const fastPages = new Set(['home', 'schedule', 'tasks', 'homework', 'messages', 'school']);
  const navigationSelector = '#m_mastermenu, #m_MobilMenuNav, #mobilMereSheetMenu, nav, [role="navigation"], [role="tablist"], .ls-master-header-container, .ls-subnav-container, .ls-subnav1, .ls-subnav2, [id*="menutab" i], [class*="menutab" i]';
  const activityPage = { key: 'activity', label: 'Aktivitet', icon: 'calendar' };
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
  let refreshTimer;
  let lastDialogTrigger;
  let settingsControls;
  let nativeHeading;
  let replacedHeading;

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
    const names = new Set(pages.map((page) => normalize(page.lectio)));
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
        : title === normalize(page.lectio) && (inMenu || page.route.test(new URL(href).pathname.split('/').pop())));
      return candidate ? [[page.key, { ...page, href: candidate.href }]] : [];
    });
    const result = new Map(entries);
    if (!preview && !result.has('school')) {
      result.set('school', { ...pages.at(-1), href: `${schoolPath}default.aspx` });
    }
    return result;
  }

  function searchablePages() {
    const entries = [...links.values()];
    if (preview) return entries;
    const known = new Set(entries.flatMap((entry) => [normalize(entry.lectio), entry.href]));
    const extraLinks = source.querySelectorAll(`:is(${navigationSelector}, #m_Content_elevUL) a[href]`);
    for (const link of extraLinks) {
      const label = navigationText(link);
      const href = safeHref(link);
      if (!href || !/\p{L}/u.test(label) || /^(log ind|log ud|login|keyboard_arrow)/i.test(label) ||
          known.has(normalize(label)) || known.has(href) || /#/.test(href)) continue;
      known.add(normalize(label));
      known.add(href);
      entries.push({ href, label, lectio: label, icon: 'grid' });
    }
    return entries;
  }

  function pageInfo() {
    if (preview) return pages.find(({ key }) => `#${key}` === location.hash.split('/')[0]) || pages[0];
    const url = new URL(sourceUrl);
    const name = url.pathname.split('/').pop();
    const documentTitle = document.title.split(/\s+[-–|]\s+/);
    const feedbackPage = /^(?:elevfeedback|aktivitets?feedback)\d*\.aspx$/i.test(name) || /\belevfeedback\b/i.test(document.title);
    if (feedbackPage || /\baktivitetsforside\b/i.test(document.title) || /^(?:aktivitet|aktivitetsforside|aktivitetforside)\d*\.aspx$/i.test(name)) {
      const selectedTabs = source.querySelectorAll(':is([role="tablist"], .lectioTabToolbar, .ls-subnav2) :is([aria-selected="true"], [aria-current="page"], [aria-current="true"], [current-page], .ls-subnav-active, .selected, .sel)');
      const feedbackTab = [...selectedTabs].some((tab) => normalize(navigationText(tab)) === 'elevfeedback');
      return feedbackPage || feedbackTab ? { ...activityPage, label: 'Elevfeedback' } : activityPage;
    }
    const matching = [...links.values()].filter(({ href }) => new URL(href, url).pathname.toLowerCase() === url.pathname.toLowerCase());
    const match = pages.find(({ route }) => route.test(name)) || matching.find(({ href }) => new URL(href, url).search === url.search) ||
      (matching.length === 1 ? matching[0] : null);
    if (match) return match;
    const heading = nativeTitle(source)?.text;
    const lectioIndex = documentTitle.findIndex((part) => normalize(part) === 'lectio');
    const title = lectioIndex > 0 ? documentTitle[lectioIndex - 1].trim() : '';
    return { key: '', label: title && title.length <= 65 && !/\b(?:arrow_back|keyboard_arrow_\w+|more_vert)\b/.test(title) ? title : heading || 'Lectio' };
  }

  function nativeWorkflow(page, href, scope) {
    if (preview || !['tasks', 'homework', 'messages'].includes(page.key)) return false;
    const params = new URL(href).searchParams;
    const detailKeys = page.key === 'messages' ? /^(beskedid|messageid|threadid|conversationid)$/i : /^(opgaveid|elevopgaveid|afleveringid|absid)$/i;
    return [...params].some(([key, value]) => value && (detailKeys.test(key) ||
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
  const nativeOverview = element('section', 'lxp-native-overview');
  nativeOverview.id = 'lxp-native-overview';
  const workspace = globalThis.lectioPlusWorkspace({
    ui: { element, button, anchor, icon }, data: lectio, narrow, safeHref, revealOriginal
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
  const restore = button('lxp-restore', 'Aktivér LectioPlus+', () => savePreferences({ enabled: true }), 'Aktivér LectioPlus+');
  root.hidden = true;
  restore.hidden = true;
  root.append(skip, sidebar, topbar, navigationStatus, overview, workspace.node, nativeOverview);
  native.before(root);
  document.body.append(search, settings, restore);
  const hideHints = globalThis.lectioPlusHints();

  function updateNativeOverview(visible) {
    const page = activePage;
    const scope = preview ? native.querySelector('[data-lxp-view]:not([hidden])') : native.querySelector('#m_outerContentFrameDiv, .ls-content-container');
    const supported = visible && page && scope;
    nativeOverview.hidden = !supported;
    document.body.classList.toggle('lxp-native-heading', Boolean(supported));
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
      const label = navigationText(target.querySelector('h2, h3') || target);
      const key = normalize(label);
      if (!label || label.length > 75 || found.has(key) || target.closest('[hidden], [aria-hidden="true"]')) return [];
      found.add(key);
      return [{ target: target.querySelector('h2, h3') || target, label }];
    }).slice(0, 8);
    const signature = JSON.stringify([page.key, label, context, sections.map(({ label }) => label)]);
    if (nativeHeading?.signature === signature && sections.every(({ target }, index) => nativeHeading.sections[index]?.target === target)) return;
    nativeHeading = { signature, sections };
    nativeOverview.replaceChildren(workspace.pageHeading(label, page.icon || 'grid', context));
    if (page.key === 'profile') {
      nativeOverview.append(button('lxp-secondary-button lxp-profile-settings', 'Designindstillinger', openSettings, icon('settings'), 'Designindstillinger'));
    }
    if (sections.length < 2) return;
    const shortcuts = element('nav', 'lxp-native-links', element('span', '', 'På siden'));
    shortcuts.setAttribute('aria-label', 'På siden');
    for (const { target, label } of sections) {
      shortcuts.append(button('lxp-native-jump', `Gå til ${label}`, () => {
        if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: 'start' });
      }, label));
    }
    nativeOverview.append(shortcuts);
  }

  function updateViewVisibility() {
    const enabled = preferences.enabled;
    const home = activePage?.key === 'home';
    const enhanced = enabled && !showNative && (home || workspaceReady);
    overview.hidden = !enhanced || !home;
    workspace.node.hidden = !enhanced || home;
    document.body.classList.toggle('lxp-native-hidden', enhanced || (enabled && source !== native));
    document.body.classList.toggle('lxp-inline-native', enabled && !showNative && !enhanced && links.has('home') && links.has('schedule'));
    document.body.classList.toggle('lxp-activity-page', enabled && source === native && activePage?.key === 'activity');
    updateNativeOverview(enabled && !enhanced && source === native);
    const originalButton = topbar.querySelector('[data-lxp-original]');
    if (originalButton) {
      const label = showNative ? 'Tilbage til LectioPlus+' : 'Lectios værktøjer';
      originalButton.setAttribute('aria-expanded', String(showNative));
      originalButton.setAttribute('aria-label', label);
      originalButton.dataset.lxpHint = showNative ? 'Vis siden i LectioPlus+ igen' : 'Åbn de oprindelige formularer og værktøjer';
      originalButton.lastElementChild.textContent = label;
    }
    skip.href = enhanced ? (home ? '#lxp-overview' : '#lxp-workspace') : !nativeOverview.hidden ? '#lxp-native-overview' :
      (document.getElementById('m_outerContentFrameDiv') ? '#m_outerContentFrameDiv' : '#masterContent');
  }

  function revealOriginal(control, keepWorkspace = false) {
    hideHints();
    pendingNavigation = undefined;
    navigationProgress();
    if (source !== native) {
      history.replaceState({ ...history.state, lectioPlusOriginal: true }, '');
      location.reload();
      return;
    }
    if (keepWorkspace && control?.isConnected) {
      const script = control.getAttribute('onclick') || control.getAttribute('href') || '';
      if (/^(?:javascript:\s*)?(?:return\s+)?(?:__doPostBack|WebForm_DoPostBackWithOptions)\s*\(/i.test(script.trim())) {
        control.click();
        return;
      }
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
      if (!scope?.querySelector('#aspnetForm')) throw new Error('Lectio content was not found.');
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
      document.title = result.title || `${page.label} – Lectio`;
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
    for (const [label, keys] of [
      ['Skole', ['home', 'schedule', 'tasks', 'homework', 'messages']],
      ['Elev', ['attendance', 'grades', 'study', 'documents', 'books', 'surveys', 'support', 'profile', 'school']]
    ]) {
      const group = keys.map((key) => links.get(key)).filter(Boolean);
      if (!group.length) continue;
      navigation.append(element('div', 'lxp-nav-heading', label));
      for (const entry of group) {
        const link = anchor('lxp-nav-link', entry.href, icon(entry.icon), element('span', '', entry.label));
        if (entry.key === activePage.key) link.setAttribute('aria-current', 'page');
        link.addEventListener('click', () => setSidebar(false));
        navigation.append(link);
      }
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
    topbar.replaceChildren(
      element('div', 'lxp-topbar-label', menu, element('span', 'lxp-breadcrumb', 'Lectio', icon('chevron')),
        element('span', 'lxp-current-page', activePage.label)),
      element('div', 'lxp-topbar-actions', searchButton, originalButton, themeButton, settingsButton)
    );
    setSidebar(false);
    updateThemeButton();
  }

  function readableText(node) {
    return (node?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function findPanel(pattern) {
    const titles = source.querySelectorAll('h2, h3, h4, legend, .islandHeaderContainer, .islandHeader, .islandTitle, .ls-island-header, .ls-island-title');
    for (const title of titles) {
      if (title.closest('[data-lxp-owned]') || !pattern.test(normalize(title.textContent))) continue;
      const panel = title.closest('.lf-island, .island, .ls-island, section, fieldset, [data-front-panel]') || title.parentElement;
      if (panel.querySelector('a[href], a[onclick]')) return panel;
    }
    return null;
  }

  function panelItems(panel, key) {
    if (!panel) return [];
    const items = [];
    const visited = new Set();
    for (const link of panel.querySelectorAll('a[href], a[onclick]')) {
      const direct = safeHref(link);
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
        if (preferences.enabled && activePage.key === 'home' && homeSources.get(key) === source) renderOverview();
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

  function renderOverview() {
    if (activePage.key !== 'home') {
      overviewData = undefined;
      overview.replaceChildren();
      return;
    }
    const now = preview ? new Date(document.body.dataset.lxpPreviewDate) : new Date();
    const today = lectio.today(now);
    const frontSchedule = panelItems(findPanel(/^(?:(dagens (skema|lektioner)|skema i dag)\b|i dag$)/), 'schedule');
    const frontTasks = panelItems(findPanel(/^(kommende (opgaver|afleveringer)|næste afleveringer)\b/), 'tasks');
    const scheduleSource = frontSchedule.length ? undefined : homeSource('schedule', today);
    const taskSource = frontTasks.length ? undefined : homeSource('tasks', today);
    const schedule = scheduleSource?.items || frontSchedule;
    const tasks = taskSource?.items || frontTasks;
    const messages = panelItems(findPanel(/^ulæste beskeder\b/), 'messages');
    const generalTasks = tasks.length || taskSource?.items || taskSource?.pending ? [] : panelItems(findPanel(/^(afleveringer|opgaver)\b/), 'tasks');
    const date = lectio.displayDay(today.date);
    const data = JSON.stringify([date, schedule, tasks, messages, generalTasks, scheduleSource?.pending, Boolean(scheduleSource?.items),
      taskSource?.pending, Boolean(taskSource?.items), [...links]]);
    if (data === overviewData) return;
    overviewData = data;
    const hero = element('div', 'lxp-hero', element('div', 'lxp-hero-art'),
      element('div', 'lxp-hero-copy', element('div', 'lxp-hero-date', icon('calendar'), date),
        element('h1', '', 'Dit overblik')));
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
    const clicker = anchor('lxp-clicker-link', 'https://clicker.strafe-mc.com/#/clicker',
      element('span', 'lxp-clicker-name', 'Strafe', element('span', '', 'Clicker')),
      clickerArtwork, icon('external'));
    clicker.target = '_blank';
    clicker.rel = 'noopener noreferrer';
    clicker.setAttribute('aria-label', 'Strafe Clicker (åbner i en ny fane)');
    overview.replaceChildren(hero, summaries, details, clicker);
  }

  function showDialog(dialog, focusTarget) {
    hideHints();
    lastDialogTrigger = document.activeElement;
    dialog.showModal();
    focusTarget.focus();
  }

  for (const dialog of [search, settings]) {
    dialog.addEventListener('close', () => lastDialogTrigger?.focus());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
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
      const matching = entries.filter((entry) => normalize(`${entry.label} ${entry.lectio}`).includes(query));
      status.textContent = matching.length ? '' : 'Ingen sider matcher din søgning.';
      results.replaceChildren(...matching.map((entry) => {
        const result = anchor('lxp-search-result', entry.href, icon(entry.icon), element('span', '', entry.label), icon('arrow'));
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

  function openSettings() {
    if (settings.open || search.open) return;
    settings.setAttribute('aria-label', 'Indstillinger');
    const close = button('lxp-icon-button', 'Luk indstillinger', () => settings.close(), icon('close'));
    settingsControls = appearance.controls(savePreferences);
    settingsControls.sync(preferences);
    const classic = button('lxp-secondary-button', 'Brug klassisk Lectio', () => {
      settings.close();
      savePreferences({ enabled: false });
    }, icon('external'), 'Brug klassisk Lectio');
    settings.replaceChildren(element('div', 'lxp-dialog-body lxp-settings-body',
      element('div', 'lxp-card-heading', element('h2', '', 'Indstillinger'), close),
      settingsControls.node, classic));
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
    hideHints();
    document.body.classList.toggle('lxp-enabled', preferences.enabled);
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

  async function savePreferences(changes) {
    preferences = appearance.normalize({ ...preferences, ...changes });
    const reload = source !== native && !preferences.enabled;
    if (!reload) applyPreferences();
    try {
      if (storage) await storage.local.set(changes);
      else if (preview) localStorage.setItem('lectioPlusPreview', JSON.stringify(preferences));
    } catch {
      // The active tab still works if the browser prevents persistent storage.
    }
    if (reload) applyPreferences();
  }

  function selectPreviewPage() {
    const selected = pageInfo().key;
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

  function refresh() {
    if (!preferences.enabled) return;
    if (preview) selectPreviewPage();
    const previousLinks = JSON.stringify([...links]);
    const previousPage = activePage;
    links = getNavigation();
    activePage = pageInfo();
    if (previousPage && previousPage.key !== activePage.key) {
      hideHints();
      showNative = false;
      if (previousPage?.key === 'home') cancelHomeSources();
    }
    if (previousPage?.key !== activePage.key || previousPage?.label !== activePage.label || previousLinks !== JSON.stringify([...links])) {
      renderNavigation();
    }
    renderOverview();
    const scope = preview ? native.querySelector('[data-lxp-view]:not([hidden])') : source;
    const now = preview ? new Date(document.body.dataset.lxpPreviewDate) : new Date();
    workspaceReady = workspace.update(nativeWorkflow(activePage, sourceUrl, scope || native) ? null : scope, activePage.key, lectio.today(now).date);
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
    if (preview && location.hash.includes('/')) navigatePreview();

    storage?.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      const next = { ...preferences };
      for (const key of Object.keys(defaults)) {
        if (changes[key]) next[key] = changes[key].newValue ?? defaults[key];
      }
      const normalized = appearance.normalize(next);
      if (Object.keys(defaults).every((key) => normalized[key] === preferences[key])) return;
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
    window.addEventListener('pageshow', (event) => {
      if (event.persisted && preferences.enabled && activePage.key === 'home') {
        pageCache.clear();
        cancelHomeSources();
        renderOverview();
      }
    });
    const observer = new MutationObserver((records) => {
      if (records.every(({ target }) => (target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement)
        ?.closest('[data-lxp-owned]'))) return;
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(refresh, 80);
    });
    observer.observe(native, { childList: true, characterData: true, subtree: true, attributes: true,
      attributeFilter: ['class', 'hidden', 'open', 'style', 'aria-hidden', 'aria-selected', 'aria-current', 'current-page', 'data-tooltip', 'href', 'title'] });
  }

  void start().catch(() => {
    root.hidden = true;
    document.body.classList.remove('lxp-enabled', 'lxp-native-hidden', 'lxp-native-heading', 'lxp-inline-native', 'lxp-activity-page');
    appearance.apply(document.documentElement, defaults, darkMode.matches, false);
  }).finally(() => boot?.finish());
})();
