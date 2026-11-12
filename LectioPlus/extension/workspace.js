(() => {
  'use strict';

  const pageSettings = {
    schedule: { search: 'Søg efter fag, lærer eller lokale' },
    tasks: { title: 'Opgaver', search: 'Søg efter opgave eller fag', icon: 'file', noun: 'opgaver', item: 'Opgave', date: 'Frist' },
    homework: { title: 'Lektier', search: 'Søg i lektier', icon: 'book', noun: 'lektier', item: 'Lektie', date: 'Til' },
    messages: { title: 'Beskeder', search: 'Søg i viste beskeder', icon: 'message', noun: 'beskeder', item: 'Emne', date: 'Ændret' }
  };
  const weekday = new Intl.DateTimeFormat('da-DK', { weekday: 'long', timeZone: 'UTC' });
  const shortDate = new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const accents = ['violet', 'blue', 'green', 'amber'];
  const courseAccents = [...accents, 'teal', 'plum'];

  function normal(value) {
    return value.toLocaleLowerCase('da-DK').replace(/\s+/g, ' ').trim();
  }

  function accentFor(value) {
    let number = 0;
    for (const char of value) number = (number * 31 + char.codePointAt(0)) % accents.length;
    return accents[number];
  }

  function dateAtNoon(date) {
    return new Date(`${date}T12:00:00Z`);
  }

  function findControl(scope, labels, excluded) {
    return [...scope.querySelectorAll('a[href], button, input[type="submit"], input[type="button"]')].find((control) =>
      !control.disabled && !control.closest('[hidden], [aria-hidden="true"], [aria-disabled="true"], .s2skemabrik, .s2skemabrikcontainer') &&
      !excluded?.contains(control) &&
      [control.id, control.title, control.getAttribute('aria-label'), control.value, control.textContent].some((value) => value && labels.test(value.trim())));
  }

  globalThis.lectioPlusWorkspace = ({ ui, data, narrow, safeHref, revealOriginal }) => {
    const { element, button, anchor, icon } = ui;
    const node = element('main', 'lxp-workspace');
    node.id = 'lxp-workspace';
    node.tabIndex = -1;
    node.hidden = true;
    const pageStates = new Map();
    let mounted;

    function readSource(link, className, name, ...children) {
      const href = safeHref(link);
      const raw = link?.getAttribute('href') || '';
      const week = className.includes('lxp-week-arrow');
      if (week && href && raw !== '#' && !new URL(href, location.href).hash && /\/skema\.aspx$/i.test(new URL(href, location.href).pathname)) {
        return anchor(className, href, ...children);
      }
      if (link && (link.hasAttribute('onclick') || /^javascript:/i.test(raw) || raw === '#' || link.matches('button, input'))) {
        return button(className, name, () => revealOriginal(link, week), ...children);
      }
      return href && raw !== '#' ? anchor(className, href, ...children) : element('div', className, ...children);
    }

    function select(label, values, selected) {
      const field = element('select', 'lxp-select');
      field.setAttribute('aria-label', label);
      for (const [value, text] of values) field.add(new Option(text, value));
      if (values.some(([value]) => value === selected)) field.value = selected;
      return field;
    }

    function searchField(label, value, onChange) {
      const input = element('input', 'lxp-filter-input');
      input.type = 'search';
      input.placeholder = label;
      input.setAttribute('aria-label', label);
      input.value = value || '';
      input.addEventListener('input', () => onChange(input.value));
      return element('label', 'lxp-filter-field', icon('search'), input);
    }

    function empty(iconName, title, detail) {
      return element('div', 'lxp-view-empty', element('span', 'lxp-empty-icon', icon(iconName)),
        element('h2', '', title), element('p', '', detail));
    }

    function pageHeading(title, glyph, subtitle = '') {
      const heading = element('div', 'lxp-page-heading');
      const copy = element('div', 'lxp-page-title', element('h1', '', title));
      if (subtitle) copy.append(element('p', 'lxp-page-subtitle', subtitle));
      heading.append(element('div', 'lxp-page-identity', element('span', 'lxp-page-icon', icon(glyph)), copy));
      return heading;
    }

    function lessonCard(lesson, list, courseColor) {
      const accent = lesson.status === 'Aflyst' ? 'rose' : courseColor;
      const when = lesson.time && element('span', 'lxp-event-time', lesson.time);
      const meta = list ? lesson.detail : lesson.room;
      const details = element('span', 'lxp-event-copy', element('strong', '', lesson.title));
      if (meta) details.append(element('span', 'lxp-event-meta', meta));
      const body = element('span', 'lxp-event-body', ...[when, details].filter(Boolean));
      if (lesson.status) body.append(element('span', `lxp-event-status lxp-${lesson.status === 'Aflyst' ? 'red' : 'amber'}`, lesson.status));
      const item = readSource(lesson.link, `lxp-event lxp-event-${accent}`, `Åbn ${lesson.title}`, body);
      if (lesson.node.id) item.dataset.lxpSourceId = lesson.node.id;
      if (!list && lesson.detail) {
        item.dataset.lxpHint = lesson.detail.split(' · ').join('\n');
        if (!item.matches('a, button')) item.tabIndex = 0;
      }
      return item;
    }

    function schedulePage(scope, schedule, state, today) {
      const description = schedule.days.length ? data.displayDay(schedule.days[0]) : '';
      const lastDate = schedule.days.at(-1);
      const dateRange = description && (lastDate === schedule.days[0] ? description :
        `${shortDate.format(dateAtNoon(schedule.days[0]))} – ${shortDate.format(dateAtNoon(lastDate))}`);
      const heading = pageHeading('Skema', 'calendar', [schedule.weekLabel.replace(/^u/i, 'U'), dateRange].filter(Boolean).join(' · '));
      const controls = element('div', 'lxp-work-controls');
      const stage = element('div', 'lxp-view-stage');
      const status = element('span', 'lxp-work-count');
      status.setAttribute('role', 'status');
      const mode = state.mode || (narrow.matches ? 'day' : 'week');
      state.mode = schedule.days.length ? mode : 'day';
      const day = select('Vælg dag', [['', 'Alle viste dage'], ...schedule.days.map((date) => [date, data.displayDay(date)])], state.day);
      state.day = day.value;
      const weekButton = button('lxp-segment-button', 'Ugevisning', () => changeMode('week'), 'Uge');
      const dayButton = button('lxp-segment-button', 'Dagsliste', () => changeMode('day'), 'Dagsliste');
      const jumpToday = button('lxp-work-button', 'Vis i dag', () => {
        openDay(today);
      }, 'I dag');
      const search = searchField(pageSettings.schedule.search, state.query, (value) => {
        state.query = value;
        paint();
      });
      const clear = button('lxp-clear-filters', 'Ryd skemafiltre', () => {
        state.query = '';
        state.day = '';
        day.value = '';
        search.querySelector('input').value = '';
        paint();
        search.querySelector('input').focus();
      }, 'Ryd filtre');

      const weekActions = element('div', 'lxp-week-actions');
      for (const [pattern, name, symbol] of [[/forrige uge|tilbage (en )?uge|prev(?:ious)?week/i, 'Forrige uge', 'left'],
        [/næste uge|frem (en )?uge|nextweek/i, 'Næste uge', 'chevron']]) {
        const control = findControl(scope, pattern);
        if (!control) continue;
        const action = readSource(control, 'lxp-work-button lxp-week-arrow', name, icon(symbol));
        if (action.tagName === 'DIV') continue;
        action.setAttribute('aria-label', name);
        action.dataset.lxpHint = name;
        weekActions.append(action);
      }
      if (schedule.days.includes(today)) weekActions.append(jumpToday);
      const original = button('lxp-work-button lxp-source-button', 'Åbn Lectios ugeplan', () => revealOriginal(), icon('external'), 'Lectios ugeplan');
      original.dataset.lxpHint = 'Åbn Lectios ugevælger og oprindelige skema';
      weekActions.append(original);
      heading.append(weekActions);
      if (schedule.days.length) {
        const segment = element('div', 'lxp-segment', weekButton, dayButton);
        segment.setAttribute('role', 'group');
        segment.setAttribute('aria-label', 'Skemavisning');
        controls.append(segment);
      }
      controls.append(search, day, clear, status);
      day.addEventListener('change', () => { state.day = day.value; paint(); });
      const dated = schedule.lessons.filter((lesson) => lesson.date);
      const timeSlots = [...new Set(dated.map((lesson) => lesson.order || ''))].sort((a, b) => (a || '99').localeCompare(b || '99'));
      const slots = timeSlots.length ? timeSlots : [''];
      const courses = [...new Set(schedule.lessons.map((lesson) => lesson.subject))].sort((a, b) => a.localeCompare(b, 'da'));
      const colors = new Map(courses.map((course, index) => [course, courseAccents[index % courseAccents.length]]));

      function changeMode(next) {
        state.mode = next;
        paint();
      }

      function openDay(date) {
        day.value = date;
        state.day = date;
        changeMode('day');
        day.focus();
      }

      function paint() {
        const list = state.mode === 'day';
        day.hidden = !list || !schedule.days.length;
        clear.hidden = !state.query && !(list && state.day);
        weekButton.setAttribute('aria-pressed', String(!list));
        dayButton.setAttribute('aria-pressed', String(list));
        const terms = normal(state.query || '').split(' ').filter(Boolean);
        const rows = schedule.lessons.filter((lesson) => (!list || !state.day || lesson.date === state.day) &&
          terms.every((term) => normal(lesson.searchable).includes(term)));
        status.textContent = `${rows.length} ${rows.length === 1 ? 'aktivitet' : 'aktiviteter'}`;
        const dates = list ? (state.day ? [state.day] : [...new Set(rows.map((item) => item.date))].sort()) : schedule.days;
        const board = element('div', list ? 'lxp-day-list' : 'lxp-week-board');
        if (!list) {
          board.style.setProperty('--lxp-days', String(dates.length));
          board.style.setProperty('--lxp-slots', String(slots.length));
          board.tabIndex = 0;
          board.setAttribute('aria-label', 'Ugeplan');
          const axis = element('div', 'lxp-week-axis', element('span', 'lxp-week-axis-heading', 'Tid'));
          for (const slot of slots) axis.append(element('span', 'lxp-week-time', slot || (timeSlots.length ? 'Anden tid' : '—')));
          board.append(axis);
        }
        for (const date of dates.filter(Boolean)) {
          const dayRows = rows.filter((lesson) => lesson.date === date).sort(byTime);
          const name = list ? data.displayDay(date) : weekday.format(dateAtNoon(date));
          const fields = [element('h2', '', name)];
          if (!list) fields.push(element('span', 'lxp-day-date', shortDate.format(dateAtNoon(date))));
          if (date === today) fields.push(element('span', 'lxp-day-current', 'I dag'));
          const dayTitle = list ? element('header', 'lxp-day-title', ...fields) :
            button('lxp-day-title lxp-day-open', `Vis ${data.displayDay(date).toLocaleLowerCase('da-DK')}`, () => openDay(date),
              ...fields.map((field) => field.tagName === 'H2' ? element('strong', '', field.textContent) : field), icon('chevron'));
          const column = element('section', date === today ? 'lxp-calendar-day lxp-calendar-today' : 'lxp-calendar-day', dayTitle);
          const emptyText = terms.length ? 'Ingen match' : 'Ingen viste aktiviteter';
          if (list) {
            const events = element('div', 'lxp-day-events');
            for (const lesson of dayRows) events.append(lessonCard(lesson, true, colors.get(lesson.subject)));
            if (!dayRows.length) events.append(element('p', 'lxp-day-empty', emptyText));
            column.append(events);
          } else {
            for (const [index, slot] of slots.entries()) {
              const events = element('div', 'lxp-week-slot');
              for (const lesson of dayRows.filter((item) => item.order === slot)) events.append(lessonCard(lesson, false, colors.get(lesson.subject)));
              if (!index && !dayRows.length) events.append(element('p', 'lxp-day-empty', emptyText));
              column.append(events);
            }
          }
          board.append(column);
        }
        const undated = rows.filter((lesson) => !lesson.date);
        if (list && !board.childElementCount && !undated.length) {
          stage.replaceChildren(empty('calendar', 'Ingen aktiviteter fundet', 'Vælg en anden dag eller ryd din søgning.'));
          return;
        }
        const result = [board];
        if (undated.length) result.push(element('section', 'lxp-undated', element('h2', '', 'Aktiviteter uden dato'),
          ...undated.sort(byTime).map((lesson) => lessonCard(lesson, true, colors.get(lesson.subject)))));
        stage.replaceChildren(...result);
      }

      function byTime(first, second) {
        return (first.order || '99').localeCompare(second.order || '99');
      }

      paint();
      return [heading, controls, stage];
    }

    function listPage(scope, kind, table, state) {
      const { title, search, noun, item: itemLabel, date: dateLabel, icon: pageIcon } = pageSettings[kind];
      const header = pageHeading(title, pageIcon);
      const actions = element('div', 'lxp-week-actions');
      if (kind === 'messages') {
        const compose = findControl(scope, /^(ny|skriv|opret) besked$/i, table.table);
        if (compose) {
          const action = readSource(compose, 'lxp-work-button lxp-school-login', 'Ny besked', 'Ny besked', icon('arrow'));
          if (action.matches('a, button')) actions.append(action);
        }
      }
      const nativeLabel = kind === 'messages' ? 'Lectios mapper' : 'Lectios liste';
      const original = button('lxp-work-button lxp-source-button', `Åbn ${nativeLabel}`, () => revealOriginal(), icon('external'), nativeLabel);
      original.dataset.lxpHint = 'Vis alle felter og funktioner fra Lectio';
      actions.append(original);
      header.append(actions);
      const stage = element('div', 'lxp-view-stage');
      const status = element('span', 'lxp-work-count');
      status.setAttribute('role', 'status');
      const controls = element('div', 'lxp-work-controls');
      const subjects = [...new Set(table.rows.map((row) => row.subject).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'da'));
      const subject = select('Fag eller hold', [['', 'Alle fag og hold'], ...subjects.map((value) => [value, value])], state.subject);
      state.subject = subject.value;
      const sort = select('Sortér opgaver', [['', 'Lectios rækkefølge'], ['soon', 'Tidligste frist'], ['later', 'Seneste frist']], state.sort);
      if (!table.hasStatus) state.status = '';
      const choices = [['', 'Alle'], ['open', 'Mangler'], ['submitted', 'Afleveret']];
      const tabs = element('div', 'lxp-segment');
      tabs.setAttribute('role', 'group');
      tabs.setAttribute('aria-label', 'Afleveringsstatus');
      if (table.hasStatus) {
        for (const [value, label] of choices) {
          const total = value ? table.rows.filter((row) => row.state === value).length : table.rows.length;
          const tab = button('lxp-segment-button', `${label}, ${total}`, () => { state.status = value; paint(); },
            label, element('span', 'lxp-segment-count', String(total)));
          tab.dataset.status = value;
          tabs.append(tab);
        }
        controls.append(tabs);
      }
      const searchBox = searchField(search, state.query, (value) => { state.query = value; paint(); });
      const clear = button('lxp-clear-filters', 'Ryd filtre', () => {
        state.query = state.subject = state.status = state.sort = '';
        subject.value = sort.value = '';
        searchBox.querySelector('input').value = '';
        paint();
        searchBox.querySelector('input').focus();
      }, 'Ryd filtre');
      controls.append(searchBox);
      if (subjects.length > 1) controls.append(subject);
      if (kind === 'tasks' && table.rows.some((row) => row.due)) controls.append(sort);
      controls.append(clear, status);
      subject.addEventListener('change', () => { state.subject = subject.value; paint(); });
      sort.addEventListener('change', () => { state.sort = sort.value; paint(); });

      function paint() {
        clear.hidden = !state.query && !state.subject && !state.status && !state.sort;
        const terms = normal(state.query || '').split(' ').filter(Boolean);
        const rows = table.rows.filter((row) => (!state.subject || row.subject === state.subject) &&
          (!state.status || row.state === state.status) && terms.every((term) => normal(row.node.textContent).includes(term)));
        if (state.sort) rows.sort((first, second) => {
          if (!first.due || !second.due) return Number(!first.due) - Number(!second.due);
          const compare = `${first.due}T${first.dueTime}`.localeCompare(`${second.due}T${second.dueTime}`);
          return state.sort === 'soon' ? compare : -compare;
        });
        for (const tab of tabs.children) tab.setAttribute('aria-pressed', String(tab.dataset.status === (state.status || '')));
        status.textContent = rows.length === table.rows.length ? `${rows.length} ${noun}` : `${rows.length} af ${table.rows.length} ${noun}`;
        if (!rows.length) {
          stage.replaceChildren(empty(pageIcon, table.rows.length ? 'Ingen resultater' : `Ingen ${noun} på listen`,
            table.rows.length ? 'Prøv en anden søgning eller et andet filter.' : 'Åbn Lectios værktøjer for at se flere visninger.'));
          return;
        }

        const columns = ['lxp-record', table.hasDate && 'lxp-record-date', table.hasStatus && 'lxp-record-status'].filter(Boolean).join(' ');
        const list = element('ul', 'lxp-record-list');
        const headings = [element('span', '', itemLabel)];
        if (table.hasDate) headings.push(element('span', '', dateLabel));
        if (table.hasStatus) headings.push(element('span', '', 'Status'));
        const listHeading = element('div', `${columns} lxp-record-heading`, ...headings);
        listHeading.setAttribute('aria-hidden', 'true');
        for (const row of rows) {
          const label = element('span', 'lxp-record-copy', element('strong', '', row.title));
          if (row.subject || row.description) label.append(element('span', 'lxp-record-meta', [row.subject, row.description].filter(Boolean).join(' · ')));
          const main = element('span', 'lxp-record-main', element('span', `lxp-record-icon lxp-${accentFor(row.subject || row.title)}`, icon(pageIcon)), label);
          const fields = [main];
          if (table.hasDate) {
            const due = element('span', 'lxp-record-due', row.dueText || '—');
            due.dataset.label = dateLabel;
            due.setAttribute('aria-label', `${dateLabel} ${row.dueText || 'ukendt'}`);
            fields.push(due);
          }
          if (table.hasStatus) {
            const color = { submitted: 'green', open: 'amber', exempt: 'neutral' }[row.state] || 'neutral';
            fields.push(element('span', `lxp-record-tag lxp-${color}`, row.status || (row.state === 'open' ? 'Afventer elev' : '—')));
          }
          const item = readSource(row.link, columns, `Åbn ${row.title}`, ...fields);
          item.append(element('span', 'lxp-record-arrow', ...(item.matches('a, button') ? [icon('chevron')] : [])));
          if (row.node.id) item.dataset.lxpSourceId = row.node.id;
          const entry = element('li', '', item);
          if (row.extra.length) {
            const expanded = state.expanded || (state.expanded = new WeakSet());
            const details = element('details', 'lxp-record-details');
            details.open = expanded.has(row.node);
            details.addEventListener('toggle', () => { if (details.open) expanded.add(row.node); else expanded.delete(row.node); });
            const summary = element('summary', '', 'Flere felter');
            summary.setAttribute('aria-label', `Flere felter for ${row.title}`);
            const values = element('dl', 'lxp-record-fields');
            for (const { label, value } of row.extra) values.append(element('div', '', element('dt', '', label), element('dd', '', value)));
            details.append(summary, values);
            entry.append(details);
          }
          list.append(entry);
        }
        stage.replaceChildren(element('div', 'lxp-record-panel', listHeading, list));
      }

      paint();
      return [header, controls, stage];
    }

    function schoolPage(scope) {
      if (!scope?.querySelector('#m_Content_elevUL')) return false;
      const school = scope.querySelector('.ls-master-header-institution-name')?.textContent.trim();
      const title = element('div', '', element('h1', '', 'Hovedmenu'));
      if (school) title.append(element('p', 'lxp-page-subtitle', school));
      const heading = element('div', 'lxp-page-heading', title);
      const nativeLogin = [...scope.querySelectorAll('.ls-master-header-container a[href], #m_MobilMenuNav a[href]')]
        .find((link) => normal(link.textContent) === 'log ind' && /\/login\.aspx(?:[?#]|$)/i.test(safeHref(link) || ''));
      if (nativeLogin) heading.append(readSource(nativeLogin, 'lxp-work-button lxp-school-login', 'Log ind', 'Log ind', icon('arrow')));
      const sections = [];
      for (const list of scope.querySelectorAll('ul.linklist')) {
        const panel = list.closest('.lf-island, .ls-island, .island');
        if (!panel || panel.closest('[hidden], [aria-hidden="true"]')) continue;
        const label = panel.querySelector('h2, .islandHeaderContainer')?.textContent.trim();
        const cards = [...list.querySelectorAll('a[href]')].flatMap((link) => {
          const name = link.textContent.trim();
          if (!name || !safeHref(link)) return [];
          const glyph = /skema|kalender|ændringer/i.test(name) ? 'calendar' : /elev|lærer/i.test(name) ? 'user' : 'grid';
          return [readSource(link, 'lxp-school-link', name, element('span', 'lxp-school-link-icon', icon(glyph)), name, icon('chevron'))];
        });
        if (!cards.length) continue;
        const section = element('section', 'lxp-school-section');
        if (label) section.append(element('h2', '', label));
        section.append(element('div', 'lxp-school-grid', ...cards));
        sections.push(section);
      }
      if (!sections.length) return false;
      const signature = JSON.stringify([school, nativeLogin && safeHref(nativeLogin), sections.map((section) => section.textContent),
        [...scope.querySelectorAll('ul.linklist a[href]')].map((link) => safeHref(link))]);
      if (mounted?.kind !== 'school' || mounted.signature !== signature) {
        node.replaceChildren(heading, ...sections);
        mounted = { kind: 'school', signature };
      }
      return true;
    }

    function update(scope, kind, today) {
      if (kind === 'school' && schoolPage(scope)) return true;
      const source = scope && (kind === 'schedule' ? data.scheduleView(scope) : data.tableView(scope, kind));
      const items = kind === 'schedule' ? source?.lessons : source?.rows;
      if (!source || (kind === 'schedule' && !source.days.length && !items.length)) {
        mounted = undefined;
        node.replaceChildren();
        return false;
      }
      const signature = JSON.stringify([kind, today, source.days, source.weekLabel, source.hasStatus, source.hasDate,
        items.map(({ node: sourceNode, link, ...values }) => [values, link?.getAttribute('href'), link?.getAttribute('onclick'),
          kind === 'schedule' ? '' : sourceNode.textContent])]);
      if (mounted?.kind === kind && mounted.signature === signature && mounted.items.every((item, index) => item.node === items[index].node && item.link === items[index].link)) return true;
      const state = pageStates.get(kind) || {};
      pageStates.set(kind, state);
      const focus = node.contains(document.activeElement) && document.activeElement.getAttribute('aria-label');
      node.replaceChildren(...(kind === 'schedule' ? schedulePage(scope, source, state, today) : listPage(scope, kind, source, state)));
      mounted = { kind, signature, items };
      if (focus) [...node.querySelectorAll('[aria-label]')].find((control) => control.getAttribute('aria-label') === focus)?.focus();
      return true;
    }

    function supports(scope, kind) {
      if (kind === 'home') return true;
      if (kind === 'school') return Boolean(scope.querySelector('#m_Content_elevUL a[href]'));
      if (kind === 'schedule') {
        const schedule = data.scheduleView(scope);
        return Boolean(schedule && (schedule.days.length || schedule.lessons.length));
      }
      return Boolean(data.tableView(scope, kind));
    }

    return { node, update, supports, pageHeading };
  };
})();
