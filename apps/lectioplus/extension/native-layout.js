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
    }

    return { update };
  };
})();
