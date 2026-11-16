(() => {
  'use strict';
  if (globalThis.lectioPlusPrivacy) return;
  const preview = () => document.body?.hasAttribute('data-lxp-preview');
  const eligible = path => /^\/lectio\/\d+\//i.test(path) && !/login|logout|logud|auth|eksam|proeve/i.test(path.split('/').pop());
  let parentApi, parentUrl;
  try {
    if (window !== window.top && /^about:(blank|srcdoc)/.test(location.href)) {
      let ancestor = window.parent;
      while (/^about:(blank|srcdoc)/.test(ancestor.location.href) && ancestor !== ancestor.parent) ancestor = ancestor.parent;
      if (eligible(ancestor.location.pathname)) { parentUrl = ancestor.location.href; parentApi = ancestor.lectioPlusPrivacy; }
    }
  } catch { /* The extension handles each matching Lectio frame independently. */ }
  if (!eligible(location.pathname) && !parentUrl && !preview() && location.protocol !== 'file:') return;

  const maskSelector = '[data-lxp-name-mask]';
  const excluded = 'script,style,noscript,template,textarea,input,select,option,svg,math,canvas,[contenteditable]:not([contenteditable="false"])';
  const blocks = 'p,div,li,td,th,h1,h2,h3,h4,h5,h6,a,button,label,legend,figcaption,caption,dt,dd,section,article,header,footer,nav,main,aside,body';
  const attributeKeys = ['title', 'aria-label', 'alt'];
  let name = '', pattern, requested = false, queued = false, running = false;
  let originalTitle, maskedTitle, titleNode;
  const observer = new MutationObserver(queue);
  const active = () => document.documentElement?.hasAttribute('data-lxp-anonymize-name');
  const photos = () => document.documentElement?.hasAttribute('data-lxp-hide-profile-photo');
  const read = node => (node?.textContent || '').replace(/\s+/g, ' ').trim();
  const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function identify(value) {
    value = (value || '').normalize('NFC').replace(/\s+/g, ' ').trim();
    if (name || value === 'Anonym' || value.length < 5 || value.length > 160 ||
        !/^[\p{L}\p{M}.'’\-]+(?: [\p{L}\p{M}.'’\-]+){1,9}$/u.test(value)) return;
    name = value;
    pattern = new RegExp(`(?<![\\p{L}\\p{M}’'\\-])${value.split(' ').map(escape).join('\\s+')}(?![\\p{L}\\p{M}’'\\-])`, 'giu');
    queue();
  }
  function displayText(value) {
    return typeof value === 'string' && active() && pattern ? value.replace(pattern, 'Anonym') : value;
  }
  function discover(scope) {
    const heading = scope.querySelector('[id$="_HeaderContent_MainTitle"], .ls-identity-container .maintitle, .ls-master-pageheader .maintitle, #MainTitle');
    const match = read(heading).match(/^(?:Eleven|Læreren)\s+(.+?)(?:,|\s+[-–]\s+|$)/i);
    if (match) identify(match[1]);
  }
  function identity() {
    if (name || !active()) return;
    if (preview()) { identify(read(document.querySelector('[data-lxp-demo-identity]'))); return; }
    if (parentApi?.getName()) { identify(parentApi.getName()); return; }
    const current = new URL(parentUrl || location.href);
    const base = current.pathname.match(/^\/lectio\/\d+\//i)?.[0];
    if (!base) return;
    // Only the personal home page establishes identity. A classmate's schedule
    // header must never be mistaken for the logged-in student's full name.
    const nav = document.querySelector('#m_mastermenu, .ls-master-header-container, nav');
    let ownUrl = new URL(`${base}forside.aspx`, current);
    for (const a of nav?.querySelectorAll('a[href]') || []) {
      try {
        const url = new URL(a.getAttribute('href'), current);
        if (url.origin === current.origin && url.pathname.toLowerCase() === `${base}forside.aspx`.toLowerCase()) { ownUrl = url; break; }
      } catch { /* Ignore non-URL menu actions. */ }
    }
    const isOwnHome = current.pathname.toLowerCase() === `${base}forside.aspx`.toLowerCase() &&
      (!current.searchParams.has('elevid') && !current.searchParams.has('laererid') ||
        ['elevid', 'laererid'].some(key => ownUrl.searchParams.has(key) && ownUrl.searchParams.get(key) === current.searchParams.get(key)));
    if (isOwnHome) discover(document);
    if (name || requested || document.readyState === 'loading' || typeof fetch !== 'function') return;
    requested = true;
    // Read the same personal page as the Forside menu, once per document. No
    // identity, photo, response or ID is written to extension storage/backups.
    fetch(ownUrl.href, { credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000) })
      .then(async response => {
        if (!response.ok || response.url && new URL(response.url).origin !== current.origin) return;
        const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
        if (!doc.querySelector('input[type="password"]')) discover(doc);
      }).catch(() => { /* Leave unknown names unchanged; do not guess an identity. */ });
  }

  function restoreMasks() {
    for (const span of document.querySelectorAll(maskSelector)) span.replaceWith(...span.childNodes);
  }
  function maskNames() {
    if (!active() || !pattern || !document.body) { restoreMasks(); return; }
    const groups = new Map();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue || node.parentElement?.closest(excluded)) continue;
      const block = node.parentElement.closest(blocks) || document.body;
      if (!groups.has(block)) groups.set(block, []);
      groups.get(block).push(node);
    }
    for (const nodes of groups.values()) {
      const text = nodes.map(n => n.nodeValue).join('');
      const matches = [...text.matchAll(pattern)];
      // Compare complete text runs, including the originals inside masks. A
      // changed fragment must not leave the rest of an unrelated name hidden.
      const expected = [], existing = new Map();
      let offset = 0;
      for (const n of nodes) {
        const end = offset + n.nodeValue.length;
        const span = n.parentElement.closest(maskSelector);
        if (span) {
          if (existing.has(span)) existing.get(span).end = end;
          else existing.set(span, {start: offset, end, first: span.dataset.lxpNameMask === 'first'});
        }
        for (const m of matches) if (m.index < end && m.index + m[0].length > offset) {
          expected.push({start: Math.max(offset, m.index), end: Math.min(end, m.index + m[0].length), first: m.index >= offset});
        }
        offset = end;
      }
      if (JSON.stringify([...existing.values()]) === JSON.stringify(expected)) continue;
      for (const span of existing.keys()) span.replaceWith(...span.childNodes);
      if (!matches.length) continue;
      let start = 0;
      for (const node of nodes) {
        const value = node.nodeValue, end = start + value.length;
        const ranges = matches.filter(m => m.index < end && m.index + m[0].length > start);
        if (ranges.length) {
          const fragment = document.createDocumentFragment();
          const fontSize = getComputedStyle(node.parentElement).fontSize || '16px';
          let cursor = 0;
          for (const match of ranges) {
            const from = Math.max(0, match.index - start), to = Math.min(value.length, match.index + match[0].length - start);
            fragment.append(value.slice(cursor, from));
            const span = document.createElement('span');
            const first = match.index >= start;
            span.dataset.lxpNameMask = first ? 'first' : 'rest';
            span.style.setProperty('--lxp-private-font-size', fontSize);
            span.textContent = value.slice(from, to);
            if (first) { span.setAttribute('role', 'img'); span.setAttribute('aria-label', 'Anonym'); }
            else span.setAttribute('aria-hidden', 'true');
            fragment.append(span); cursor = to;
          }
          fragment.append(value.slice(cursor));
          node.replaceWith(fragment);
        }
        start = end;
      }
    }
  }
  function maskAttributes() {
    // DOM metadata follows cloned native cards, so disabling the display option
    // can also restore their labels. It is never written to extension storage.
    for (const node of document.querySelectorAll('[title], [aria-label], img[alt], [data-lxp-name-attributes]')) {
      if (node.matches(maskSelector)) continue;
      let saved = {};
      try { saved = JSON.parse(node.getAttribute('data-lxp-name-attributes') || '{}') || {}; } catch { /* No valid original labels. */ }
      const nextState = {};
      for (const key of attributeKeys) {
        const current = node.getAttribute(key);
        if (current === null) continue;
        const state = saved[key];
        const original = Array.isArray(state) && typeof state[0] === 'string' && current === state[1] ? state[0] : current;
        const masked = displayText(original);
        if (masked !== current) node.setAttribute(key, masked);
        if (masked !== original) nextState[key] = [original, masked];
      }
      if (Object.keys(nextState).length) {
        const encoded = JSON.stringify(nextState);
        if (node.getAttribute('data-lxp-name-attributes') !== encoded) node.setAttribute('data-lxp-name-attributes', encoded);
      } else node.removeAttribute('data-lxp-name-attributes');
    }
  }
  function maskTitle() {
    globalThis.lectioPlusTab?.refreshTitle();
    const current = document.title;
    if (document.querySelector('title') !== titleNode || current !== maskedTitle) originalTitle = current;
    titleNode = document.querySelector('title');
    maskedTitle = displayText(originalTitle);
    if (maskedTitle !== current && typeof maskedTitle === 'string') document.title = maskedTitle;
  }
  const isPersonUrl = value => /getimage\.aspx[^\s"')>]*[?&](?:amp;)?pictureid=/i.test(value || '');
  function maskPhotos() {
    const targets = new Map();
    if (photos()) for (const node of document.querySelectorAll('img, picture, [style*="url" i]')) {
      if (node.matches('img, picture')) {
        const image = node.matches('img') ? node : node.querySelector('img');
        const urls = [image?.getAttribute('src'), image?.getAttribute('srcset'), image?.getAttribute('data-src'),
          ...[...node.querySelectorAll('source')].map(source => source.getAttribute('srcset'))].join(' ');
        if (isPersonUrl(urls)) targets.set(node, 'image');
      } else if (isPersonUrl(node.style.backgroundImage)) targets.set(node, 'background');
    }
    for (const node of document.querySelectorAll('[data-lxp-person-photo]')) {
      if (!targets.has(node)) node.removeAttribute('data-lxp-person-photo');
    }
    for (const [node, kind] of targets) if (node.dataset.lxpPersonPhoto !== kind) node.dataset.lxpPersonPhoto = kind;
  }
  function watch() {
    observer.observe(document, { subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ['title', 'aria-label', 'alt', 'src', 'srcset', 'data-src', 'style', 'data-lxp-anonymize-name', 'data-lxp-hide-profile-photo'] });
  }
  function flush() {
    queued = false;
    if (running || !globalThis.document?.documentElement) return;
    running = true; observer.disconnect();
    try { identity(); maskNames(); maskAttributes(); maskTitle(); maskPhotos(); }
    finally { running = false; watch(); }
  }
  function queue() {
    if (!queued) { queued = true; queueMicrotask(flush); }
  }
  globalThis.lectioPlusPrivacy = { displayText, flush, getName: () => name,
    getOriginalTitle: () => document.title === maskedTitle ? originalTitle : document.title };
  watch(); queue();
  document.addEventListener('DOMContentLoaded', queue, { once: true });
})();
