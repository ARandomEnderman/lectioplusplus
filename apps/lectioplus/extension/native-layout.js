(() => {
  'use strict';

  // Classify original controls without replacing them: Lectio keeps its form state and listeners.
  globalThis.lectioPlusNativeLayout = () => {
    let scope;
    const tagged = new Set();
    const scrollHosts = new Map();
    const excluded = '.s2skema, [data-lxp-schedule], .ls-paper, .ls-paper-section-content, article, [contenteditable], [role="tree"], .ls-texteditor-container';
    const tableTypes = {
      data: '.ls-table-base, .ls-std-table-default',
      form: '.ls-std-table-inputlist, .ls-table-layout1, .ls-table-layout2'
    };
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(refreshScroll) : null;
    const queries = new Map();
    const filteredPeople = new Set();
    let peopleSearch;
    let people = [];
    const searchText = value => value.normalize('NFD').replace(/\p{M}/gu, '')
      .toLocaleLowerCase('da-DK').replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/\s+/g, ' ').trim();

    function peopleKind() {
      if (!scope) return '';
      const view = scope.dataset.lxpView;
      if (document.body.hasAttribute('data-lxp-preview')) {
        return view === 'school/students' ? 'elev' : view === 'school/teachers' ? 'laerer' : '';
      }
      const url = new URL(location.href);
      return /\/FindSkema\.aspx$/i.test(url.pathname) && /^(elev|laerer)$/i.test(url.searchParams.get('type'))
        ? url.searchParams.get('type').toLowerCase() : '';
    }

    function personKey(link, kind) {
      if (link.closest('nav, [role="navigation"], .ls-subnav1, .ls-subnav2, .ls-master-header-container, [data-lxp-owned]')) return '';
      if (document.body.hasAttribute('data-lxp-preview')) return link.dataset.lxpDemoPerson || '';
      try {
        const url = new URL(link.getAttribute('href'), location.href);
        if (url.origin !== location.origin || !/\/(?:skema|skemany)\.aspx$/i.test(url.pathname)) return '';
        return url.searchParams.get(kind === 'elev' ? 'elevid' : 'laererid') || '';
      } catch { return ''; }
    }

    function collectPeople(kind) {
      const links = [...scope.querySelectorAll('a[href]')].filter(link => personKey(link, kind));
      const entries = new Map();
      for (const link of links) {
        // Tables can contain either one person per row or a grid of separate lists.
        // Hide a complete row/item only when it belongs to this single person.
        const key = personKey(link, kind);
        let node = link;
        for (const selector of ['li', 'tr', 'td', '.buttonlink']) {
          const candidate = link.closest(selector);
          if (!candidate || !scope.contains(candidate) || candidate.querySelector('table')) continue;
          const keys = new Set([...candidate.querySelectorAll('a[href]')].map(a => personKey(a, kind)).filter(Boolean));
          if (keys.size === 1 && keys.has(key)) { node = candidate; break; }
        }
        if (node.closest('[hidden], [aria-hidden="true"]') || node.style.display === 'none') continue;
        entries.set(node, searchText(node.textContent || ''));
      }
      return [...entries].map(([node, text]) => ({ node, text }));
    }

    function filterPeople() {
      if (!peopleSearch) return;
      const { input, status, clearButton, kind } = peopleSearch;
      const query = searchText(input.value);
      const words = query ? query.split(' ') : [];
      queries.set(kind, input.value);
      let shown = 0;
      for (const { node, text } of people) {
        const hide = !words.every(word => text.includes(word));
        if (hide) {
          if (!node.hasAttribute('data-lxp-person-filtered')) node.setAttribute('data-lxp-person-filtered', '');
          filteredPeople.add(node);
        } else {
          node.removeAttribute('data-lxp-person-filtered');
          filteredPeople.delete(node);
          shown++;
        }
      }
      const plural = kind === 'elev' ? 'elever' : 'lærere';
      const message = !people.length ? `Ingen ${plural} indlæst på denne side.`
        : !shown ? `Ingen ${plural} matcher din søgning.` : `Viser ${shown} af ${people.length} ${plural}`;
      if (status.textContent !== message) status.textContent = message;
      clearButton.disabled = !input.value;
    }

    function clearPeopleSearch() {
      peopleSearch?.node.remove();
      for (const node of filteredPeople) node.removeAttribute('data-lxp-person-filtered');
      filteredPeople.clear();
      peopleSearch = undefined;
      people = [];
    }

    function updatePeopleSearch() {
      const kind = peopleKind();
      if (peopleSearch?.kind !== kind) clearPeopleSearch();
      if (!kind) return;
      people = collectPeople(kind);
      const currentNodes = new Set(people.map(person => person.node));
      for (const node of filteredPeople) if (!currentNodes.has(node)) {
        node.removeAttribute('data-lxp-person-filtered');
        filteredPeople.delete(node);
      }
      if (!peopleSearch) {
        const node = document.createElement('div');
        node.className = 'lxp-people-search';
        node.dataset.lxpOwned = '';
        node.setAttribute('role', 'search');
        const label = document.createElement('label');
        const caption = document.createElement('span');
        caption.textContent = kind === 'elev' ? 'Søg efter elevnavn' : 'Søg efter lærernavn';
        const input = document.createElement('input');
        input.type = 'search';
        input.placeholder = 'Skriv fornavn eller efternavn…';
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.value = queries.get(kind) || '';
        input.setAttribute('aria-label', caption.textContent);
        label.append(caption, input);
        const clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.textContent = 'Ryd søgning';
        const status = document.createElement('p');
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        status.setAttribute('aria-atomic', 'true');
        const hint = document.createElement('p');
        hint.className = 'lxp-people-search-hint';
        hint.textContent = 'Søg blandt navnene på denne side.';
        node.append(label, clearButton, status, hint);
        peopleSearch = { node, input, status, clearButton, kind };
        const reset = () => { input.value = ''; filterPeople(); input.focus(); };
        input.addEventListener('input', filterPeople);
        input.addEventListener('search', filterPeople);
        input.addEventListener('keydown', event => {
          // This field lives inside Lectio's ASP.NET form and must not submit it.
          if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); }
          if (event.key === 'Escape' && input.value) { event.preventDefault(); event.stopPropagation(); reset(); }
        });
        clearButton.addEventListener('click', reset);
      }
      if (!scope.contains(peopleSearch.node)) {
        const host = people[0]?.node.closest('.islandContent, .ls-island-content') || scope.querySelector('.ls-content-container') || scope;
        host.prepend(peopleSearch.node);
      }
      filterPeople();
    }

    function restoreHost(host, saved) {
      for (const [name, value] of Object.entries(saved)) {
        if (value === null) host.removeAttribute(name);
        else host.setAttribute(name, value);
      }
    }

    function refreshScroll() {
      for (const [host, saved] of scrollHosts) {
        if (host.scrollWidth > host.clientWidth + 2) {
          host.dataset.lxpScrollRegion = '';
          if (saved.tabindex === null) host.tabIndex = 0;
          if (saved.role === null) host.setAttribute('role', 'region');
          if (saved['aria-label'] === null) host.setAttribute('aria-label', 'Tabel – rul vandret for at se alle kolonner');
        } else restoreHost(host, saved);
      }
    }

    function clear() {
      clearPeopleSearch();
      observer?.disconnect();
      for (const node of tagged) node.removeAttribute('data-lxp-table');
      for (const [host, saved] of scrollHosts) restoreHost(host, saved);
      tagged.clear();
      scrollHosts.clear();
    }

    function update(nextScope) {
      if (scope !== nextScope) {
        clear();
        scope = nextScope;
      }
      if (!scope) return;
      // Refresh after AJAX replaces a table. Do not leave detached controls in observers.
      for (const table of tagged) if (!scope.contains(table)) tagged.delete(table);
      for (const [host, saved] of scrollHosts) if (!scope.contains(host)) {
        restoreHost(host, saved);
        observer?.unobserve(host);
        scrollHosts.delete(host);
      }
      for (const table of scope.querySelectorAll('table')) {
        if (table.closest(excluded) || table.querySelector('table')) continue;
        const header = [...table.rows].find((row) => [...row.cells].filter((cell) => cell.tagName === 'TH' && cell.colSpan === 1).length >= 2);
        const type = table.matches('.ls-std-table-inputlist') ? 'form' : header || table.matches(tableTypes.data) ? 'data' : table.matches(tableTypes.form) ? 'form' : '';
        if (!type) continue;
        table.dataset.lxpTable = type;
        tagged.add(table);
        const host = table.parentElement;
        // Reuse a dedicated container; never wrap or move the server's table.
        if (type === 'data' && host !== scope && host.children.length === 1 && !host.matches('td, th, form, body') && !scrollHosts.has(host)) {
          const saved = Object.fromEntries(['tabindex', 'role', 'aria-label', 'data-lxp-scroll-region'].map((name) => [name, host.getAttribute(name)]));
          scrollHosts.set(host, saved);
          observer?.observe(host);
        }
      }
      refreshScroll();
      updatePeopleSearch();
    }

    return { update };
  };
})();
