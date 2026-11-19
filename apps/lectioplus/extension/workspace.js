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

  globalThis.lectioPlusWorkspace = ({ ui, data, narrow, safeHref, revealOriginal, getPreferences = () => globalThis.lectioPlusAppearance.defaults, onPreferences = () => {}, getSourceUrl = () => location.href }) => {
    const { element, button, anchor, icon } = ui;
    const node = element('main', 'lxp-workspace');
    node.id = 'lxp-workspace';
    node.tabIndex = -1;

    // The "now" line in the week view: placed with the same top-% maths as the lessons, moved every 30 s.
    function markNow(root = node) {
      const preview = document.body.hasAttribute('data-lxp-preview');
      const { date, time } = data.today(preview ? new Date(document.body.dataset.lxpPreviewDate) : new Date());
      const minute = Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
      for (const board of root.querySelectorAll('.lxp-week-board')) {
        const first = Number(board.dataset.lxpFirst), duration = Number(board.dataset.lxpDuration);
        const timelines = [...board.querySelectorAll('.lxp-day-timeline')];
        const visible = minute >= first && minute <= first + duration && timelines.some((timeline) => timeline.dataset.lxpDate === date);
        const top = `${(minute - first) / duration * 100}%`;
        for (const marker of board.querySelectorAll('.lxp-now-line, .lxp-now-time')) {
          marker.hidden = !visible;
          marker.style.top = top;
        }
        const label = board.querySelector('.lxp-now-time');
        if (label) label.textContent = time;
      }
    }
    setInterval(() => markNow(), 30000);
    node.hidden = true;
    const pageStates = new Map();
    let mounted;

    function readSource(link, className, name, ...children) {
      const href = safeHref(link);
      const raw = link?.getAttribute('href') || '';
      const week = className.includes('lxp-week-arrow');
      if (week && href && raw !== '#' && !new URL(href, location.href).hash && /\/(?:skema|skemany)\.aspx$/i.test(new URL(href, location.href).pathname)) {
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
      const accent = lesson.status === 'Aflyst' ? 'rose' : getPreferences().colorLessons ? courseColor : 'blue';
      const when = lesson.time && element('span', 'lxp-event-time', lesson.time);
      const meta = list ? lesson.detail : getPreferences().showLessonRoom ? lesson.room : '';
      const details = element('span', 'lxp-event-copy', element('strong', '', lesson.title));
      if (meta) details.append(element('span', 'lxp-event-meta', meta));
      const body = element('span', 'lxp-event-body', ...[when, details].filter(Boolean));
      if (lesson.hasContent) {
        const marker = element('span', 'lxp-event-content', icon('file'), element('span', '', 'Indhold'));
        marker.setAttribute('aria-hidden', 'true');
        body.append(marker);
      }
      if (lesson.status) body.append(element('span', `lxp-event-status lxp-${lesson.status === 'Aflyst' ? 'red' : 'amber'}`, lesson.status));
      const item = readSource(lesson.link, `lxp-event lxp-event-${accent}`, `Åbn ${lesson.title}`, body);
      if (lesson.node.id) item.dataset.lxpSourceId = lesson.node.id;
      item.classList.toggle('lxp-event-with-content', lesson.hasContent);
      if (!list || lesson.hasContent) {
        const description = [lesson.title, lesson.time, lesson.detail, lesson.status, lesson.hasContent && 'Tekst eller materiale til lektionen'].filter(Boolean).join(' · ');
        item.setAttribute('aria-label', description);
        item.dataset.lxpHint = description.split(' · ').join('\n');
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
      const prefs = getPreferences();
      if (state.defaultView !== prefs.scheduleView) { state.mode = undefined; state.defaultView = prefs.scheduleView; }
      const mode = state.mode || (prefs.scheduleView === 'auto' ? (narrow.matches ? 'day' : 'week') : prefs.scheduleView);
      state.mode = schedule.days.length ? mode : 'day';
      if (state.day === undefined && narrow.matches) state.day = schedule.days.includes(today) ? today : schedule.days[0] || '';
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

      const weekActions=element('nav','lxp-week-actions');weekActions.setAttribute('aria-label','Skift uge');
      const preview=document.body.hasAttribute('data-lxp-preview'),base=getSourceUrl(),current=data.weekAt(schedule.days[0]||today),thisWeek=data.weekAt(today);
      function previewWeek(date){state.previewWeek=data.weekAt(date).monday;state.day='';mounted=undefined;update(scope,'schedule',today);}
      function weekLink(date,name,...children){
        if(!data.weekAt(date))return null;
        const href=preview?'#schedule':data.weekHref(base,date);
        if(!href)return null;
        const link=anchor('lxp-work-button lxp-week-navigation',href,...children);link.setAttribute('aria-label',name);link.dataset.lxpHint=name;
        if(preview)link.addEventListener('click',event=>{event.preventDefault();previewWeek(date);});
        return link;
      }
      if(current){
        for(const [offset,name,symbol] of [[-7,'Forrige uge','left'],[7,'Næste uge','chevron']]){
          const date=data.shiftDate(current.monday,offset);let link=weekLink(date,name,icon(symbol));
          if(!link){const control=findControl(scope,offset<0?/forrige uge|tilbage (en )?uge|prev(?:ious)?week/i:/næste uge|frem (en )?uge|nextweek/i);if(control)link=readSource(control,'lxp-work-button lxp-week-arrow',name,icon(symbol));}
          if(link&&link.tagName!=='DIV'){link.classList.add('lxp-week-arrow');link.setAttribute('aria-label',name);weekActions.append(link);}
        }
        const currentLink=weekLink(thisWeek.monday,'Denne uge','Denne uge');if(currentLink)weekActions.append(currentLink);
        const picker=element('input','lxp-select lxp-week-picker');picker.type='week';picker.value=current.value;picker.setAttribute('aria-label','Vælg uge');picker.min='2000-W01';picker.max=data.weekAt('2099-12-28').value;
        const pickerLabel=element('label','lxp-week-picker-label',element('span','','Vælg uge'),picker);
        const go=anchor('lxp-work-button',preview?'#schedule':data.weekHref(base,current.monday),'Vis uge');go.setAttribute('aria-label','Vis valgt uge');
        function setWeek(){const date=data.weekDate(picker.value);go.setAttribute('aria-disabled',String(!date));if(date&&!preview)go.href=data.weekHref(base,date);else if(!date)go.removeAttribute('href');}
        picker.addEventListener('input',setWeek);picker.addEventListener('change',setWeek);
        picker.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();go.click();}});
        go.addEventListener('click',event=>{const date=data.weekDate(picker.value);if(!date){event.preventDefault();picker.reportValidity();return;}if(preview){event.preventDefault();previewWeek(date);}});
        if(preview||data.weekHref(base,current.monday))weekActions.append(pickerLabel,go);
      }
      if(schedule.days.includes(today))weekActions.append(jumpToday);
      const original=button('lxp-work-button lxp-source-button','Åbn Lectios ugeplan',()=>revealOriginal(),icon('external'),'Lectios ugeplan');original.dataset.lxpHint='Åbn Lectios ugevælger og oprindelige skema';weekActions.append(original);
      heading.append(weekActions);
      if(preview&&state.previewWeek)heading.querySelector('.lxp-page-subtitle').append(' · Demo: eksempelaktiviteter gentages');
      if (schedule.days.length) {
        const segment = element('div', 'lxp-segment', weekButton, dayButton);
        segment.setAttribute('role', 'group');
        segment.setAttribute('aria-label', 'Skemavisning');
        controls.append(segment);
      }
      const size = select('Skemaets størrelse', [['60', 'Kompakt'], ['76', 'Normal størrelse'], ['92', 'Mere plads']], getPreferences().scheduleSize);
      size.addEventListener('change', () => { onPreferences({ scheduleSize: size.value }); });
      controls.append(search, day, size, clear, status);
      day.addEventListener('change', () => { state.day = day.value; paint(); });
      // One continuous clock shared by all days. Different starts must not create empty rows.
      const timed = (lesson) => lesson.start !== null && lesson.end !== null && lesson.end - lesson.start <= 12 * 60;
      const dated = schedule.lessons.filter((lesson) => lesson.date && timed(lesson));
      const firstMinute = dated.length ? Math.floor(Math.min(...dated.map((lesson) => lesson.start)) / 60) * 60 : 8 * 60;
      const lastMinute = dated.length ? Math.ceil(Math.max(...dated.map((lesson) => Math.max(lesson.end, lesson.start + 30))) / 60) * 60 : 16 * 60;
      const duration = Math.max(60, lastMinute - firstMinute);
      const clockLabel = (minute) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;

      // Overlapping activities share the width of their connected group, never cover each other.
      function positions(lessons) {
        const groups = [];
        for (const lesson of lessons.filter(timed).sort((a, b) => a.start - b.start || b.end - a.end)) {
          const visualEnd = Math.max(lesson.end, lesson.start + 30);
          let group = groups.at(-1);
          if (!group || lesson.start >= group.end) {
            group = { end: visualEnd, items: [], lanes: [] };
            groups.push(group);
          }
          let lane = group.lanes.findIndex((end) => end <= lesson.start);
          if (lane < 0) lane = group.lanes.length;
          group.lanes[lane] = visualEnd;
          group.end = Math.max(group.end, visualEnd);
          group.items.push({ lesson, lane, visualEnd });
        }
        return groups.flatMap((group) => group.items.map((item) => ({ ...item, lanes: group.lanes.length })));
      }
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
        size.hidden = list;
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
          board.style.setProperty('--lxp-hours', String(duration / 60));
          board.style.setProperty('--lxp-hour-height', `${size.value}px`);
          board.tabIndex = 0;
          board.setAttribute('aria-label', 'Ugeplan');
          const axis = element('div', 'lxp-week-axis', element('span', 'lxp-week-axis-heading', 'Tid'));
          const times = element('div', 'lxp-time-axis');
          for (let minute = firstMinute; minute < firstMinute + duration; minute += 60) {
            const tick = element('span', 'lxp-week-time', clockLabel(minute));
            tick.style.top = `${(minute - firstMinute) / duration * 100}%`;
            times.append(tick);
          }
          board.dataset.lxpFirst = String(firstMinute);
          board.dataset.lxpDuration = String(duration);
          const nowTime = element('span', 'lxp-now-time');
          nowTime.hidden = true;
          nowTime.setAttribute('aria-hidden', 'true');
          times.append(nowTime);
          axis.append(times);
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
            const events = element('div', 'lxp-day-timeline');
            events.dataset.lxpDate = date;
            const nowLine = element('div', 'lxp-now-line');
            nowLine.hidden = true;
            nowLine.setAttribute('aria-hidden', 'true');
            events.append(nowLine);
            // Short gaps are shown in their actual place; filtering must never create fake breaks.
            const occupied = dated.filter((lesson) => lesson.date === date).sort((a, b) => a.start - b.start);
            let previousEnd = null;
            for (const lesson of occupied) {
              if (getPreferences().showBreaks && previousEnd !== null && lesson.start - previousEnd >= 10 && lesson.start - previousEnd <= 30) {
                const gap = element('div', 'lxp-schedule-break', 'Pause');
                const range = `${clockLabel(previousEnd)}–${clockLabel(lesson.start)}`;
                gap.setAttribute('aria-label', `Pause ${range}`);
                gap.title = `Pause · ${range}`;
                gap.style.top = `${(previousEnd - firstMinute) / duration * 100}%`;
                gap.style.height = `${(lesson.start - previousEnd) / duration * 100}%`;
                events.append(gap);
              }
              previousEnd = Math.max(previousEnd ?? 0, lesson.end, lesson.start + 30);
            }
            for (const { lesson, lane, lanes, visualEnd } of positions(dayRows)) {
              const card = lessonCard(lesson, false, colors.get(lesson.subject));
              card.style.top = `${(lesson.start - firstMinute) / duration * 100}%`;
              card.style.height = `calc(${(visualEnd - lesson.start) / duration * 100}% - 3px)`;
              card.style.insetInlineStart = `calc(${lane / lanes * 100}% + 3px)`;
              card.style.width = `calc(${100 / lanes}% - 6px)`;
              card.classList.toggle('lxp-event-short', lesson.end - lesson.start < 60);
              card.classList.toggle('lxp-event-tiny', lesson.end - lesson.start < 35);
              events.append(card);
            }
            if (!dayRows.length) events.append(element('p', 'lxp-day-empty', emptyText));
            column.append(events);
          }
          board.append(column);
        }
        const undated = rows.filter((lesson) => !lesson.date);
        if (list && !board.childElementCount && !undated.length) {
          stage.replaceChildren(empty('calendar', 'Ingen aktiviteter fundet', 'Vælg en anden dag eller ryd din søgning.'));
          return;
        }
        const result = [board];
        const other = !list && rows.filter((lesson) => lesson.date && !timed(lesson));
        if (other?.length) result.push(element('section', 'lxp-undated', element('h2', '', 'Andre aktiviteter'),
          ...other.map((lesson) => element('div', 'lxp-other-activity',
            element('span', 'lxp-other-date', data.displayDay(lesson.date)), lessonCard(lesson, true, colors.get(lesson.subject))))));
        if (undated.length) result.push(element('section', 'lxp-undated', element('h2', '', 'Aktiviteter uden dato'),
          ...undated.sort(byTime).map((lesson) => lessonCard(lesson, true, colors.get(lesson.subject)))));
        stage.replaceChildren(...result);
        markNow(stage); // stage may not be attached to the page yet on first render
      }

      function byTime(first, second) {
        return (first.order || '99').localeCompare(second.order || '99');
      }

      paint();
      const contentLegend = element('p', 'lxp-schedule-content-legend', icon('file'), 'Indhold: Tekst, lektier eller materiale. Åbn lektionen for at læse det.');
      contentLegend.hidden = !schedule.lessons.some(lesson => lesson.hasContent);
      return [heading, controls, contentLegend, stage];
    }

    function homeworkEntry(row) {
      const entry = element('li', 'lxp-homework-card');
      if (row.node.id) entry.dataset.lxpSourceId = row.node.id;
      const header = element('div', 'lxp-homework-header',
        element('div', 'lxp-homework-subject', element('span', `lxp-record-icon lxp-${accentFor(row.subject || row.title)}`, icon('book')),
          element('h2', '', row.subject || 'Lektier')));
      if (row.dueText) {
        const date = element(row.due ? 'time' : 'span', 'lxp-homework-date', icon('calendar'), row.dueText);
        if (row.due) date.dateTime = row.due;
        date.setAttribute('aria-label', 'Til ' + row.dueText);
        header.append(date);
      }
      entry.append(header);
      if (row.activityTitle) entry.append(readSource(row.link, 'lxp-homework-activity', 'Åbn ' + row.activityTitle,
        element('strong', '', row.activityTitle), ...(row.link ? [icon('chevron')] : [])));
      const content = element('div', 'lxp-homework-content');
      let needsOriginal = false;
      const allowed = new Set(['P','DIV','BR','UL','OL','LI','STRONG','B','EM','I','U','S','SUB','SUP','BLOCKQUOTE','PRE','CODE']);
      function copy(source, target) {
        if (source.nodeType === Node.TEXT_NODE) { target.append(document.createTextNode(source.textContent)); return; }
        if (source.nodeType !== Node.ELEMENT_NODE || source.matches(data.iconSelector + ', script, style, template, [hidden], [aria-hidden="true"]') || source.style.display === 'none') return;
        if (source.tagName === 'A') {
          const label = data.readableText(source) || source.getAttribute('title') || 'Åbn materiale';
          const raw = source.getAttribute('href') || '';
          if (source.hasAttribute('onclick') || /^javascript:(?:__doPostBack|WebForm_DoPostBackWithOptions)\(/i.test(raw)) {
            target.append(button('lxp-homework-link', label, () => revealOriginal(source, true), label));
          } else if (document.body.hasAttribute('data-lxp-preview') && raw.startsWith('#')) {
            target.append(anchor('lxp-homework-link', raw, label));
          } else {
            let url;
            try { url = new URL(raw, getSourceUrl()); } catch { /* Keep an invalid link's readable label. */ }
            if (raw && url && ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) {
              const link = anchor('lxp-homework-link', url.href, label);
              if (url.origin !== location.origin || source.target === '_blank') { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
              target.append(link);
            } else { target.append(label); if (raw) needsOriginal = true; }
          }
          return;
        }
        if (/^(IMG|IFRAME|VIDEO|AUDIO|OBJECT|EMBED|INPUT|SELECT|TEXTAREA|BUTTON|CANVAS|SVG|MATH|TABLE)$/.test(source.tagName)) {
          needsOriginal = true;
          if (source.tagName === 'IMG' && source.getAttribute('alt')) target.append(element('p', 'lxp-homework-media', source.getAttribute('alt')));
          return;
        }
        const tag = /^H[1-6]$/.test(source.tagName) ? 'h3' : allowed.has(source.tagName) ? source.tagName.toLowerCase() : null;
        const child = tag ? element(tag) : target;
        if (tag) target.append(child);
        for (const node of source.childNodes) copy(node, child);
      }
      if (row.contentCell) for (const child of row.contentCell.childNodes) copy(child, content);
      else content.textContent = row.description || row.title;
      entry.append(content);
      if (needsOriginal) entry.append(button('lxp-work-button lxp-homework-original', 'Åbn lektiens indlejrede indhold i Lectio',
        () => revealOriginal(row.contentCell), icon('external'), 'Vis billeder og indlejret indhold i Lectio'));
      if (row.extra.length) {
        const fields = element('dl', 'lxp-record-fields');
        for (const { label, value } of row.extra) fields.append(element('div', '', element('dt', '', label), element('dd', '', value)));
        entry.append(element('details', 'lxp-homework-extra', element('summary', '', 'Flere oplysninger'), fields));
      }
      return entry;
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
      const sort = select(kind === 'homework' ? 'Sortér lektier' : 'Sortér opgaver', [['', 'Lectios rækkefølge'],
        ['soon', kind === 'homework' ? 'Tidligste dato' : 'Tidligste frist'], ['later', kind === 'homework' ? 'Seneste dato' : 'Seneste frist']], state.sort);
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
      if (['tasks','homework'].includes(kind) && table.rows.some((row) => row.due)) controls.append(sort);
      controls.append(clear, status);
      subject.addEventListener('change', () => { state.subject = subject.value; paint(); });
      sort.addEventListener('change', () => { state.sort = sort.value; paint(); });

      function paint() {
        clear.hidden = !state.query && !state.subject && !state.status && !state.sort;
        const terms = normal(state.query || '').split(' ').filter(Boolean);
        const rows = table.rows.filter((row) => (!state.subject || row.subject === state.subject) &&
          (!state.status || row.state === state.status) && terms.every((term) => normal([row.subject,row.dueText,row.node.textContent].join(' ')).includes(term)));
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

        if (kind === 'homework') {
          stage.replaceChildren(element('ul', 'lxp-homework-list', ...rows.map(homeworkEntry)));
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
      node.classList.toggle('lxp-schedule-workspace', kind === 'schedule');
      node.classList.toggle('lxp-homework-workspace', kind === 'homework');
      if (kind === 'school' && schoolPage(scope)) return true;
      let source = scope && (kind === 'schedule' ? data.scheduleView(scope,getSourceUrl()) : data.tableView(scope, kind));
      const state=pageStates.get(kind)||{};pageStates.set(kind,state);
      if(kind==='schedule'&&source?.days.length&&state.previewWeek&&document.body.hasAttribute('data-lxp-preview')){
        const monday=data.weekAt(source.days[0]).monday,delta=Math.round((dateAtNoon(state.previewWeek)-dateAtNoon(monday))/86400000),week=data.weekAt(state.previewWeek);
        source={...source,days:source.days.map(date=>data.shiftDate(date,delta)),weekLabel:`Uge ${week.week} – ${week.year}`,lessons:source.lessons.map(lesson=>({...lesson,date:lesson.date?data.shiftDate(lesson.date,delta):''}))};
      }
      const items = kind === 'schedule' ? source?.lessons : source?.rows;
      if (!source || (kind === 'schedule' && !source.days.length && !items.length)) {
        mounted = undefined;
        node.replaceChildren();
        return false;
      }
      const signature = JSON.stringify([kind,kind==='schedule'?getSourceUrl():null, kind === 'schedule' ? [getPreferences().scheduleSize, getPreferences().scheduleView, getPreferences().showBreaks, getPreferences().colorLessons, getPreferences().showLessonRoom] : null, today, source.days, source.weekLabel, source.hasStatus, source.hasDate,
        items.map(({ node: sourceNode, link, contentCell, ...values }) => [values, link?.getAttribute('href'), link?.getAttribute('onclick'),
          kind === 'schedule' ? '' : sourceNode.textContent, kind === 'homework' ? contentCell?.innerHTML : ''])]);
      if (mounted?.kind === kind && mounted.signature === signature && mounted.items.every((item, index) => item.node === items[index].node && item.link === items[index].link)) return true;
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
        const schedule = data.scheduleView(scope,getSourceUrl());
        return Boolean(schedule && (schedule.days.length || schedule.lessons.length));
      }
      return Boolean(data.tableView(scope, kind));
    }

    return { node, update, supports, pageHeading, invalidate(){mounted=undefined;} };
  };
})();
