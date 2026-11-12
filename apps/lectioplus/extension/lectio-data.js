(() => {
  'use strict';

  const copenhagen = 'Europe/Copenhagen';
  const clock = new Intl.DateTimeFormat('en-GB', {
    timeZone: copenhagen, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });
  const dayLabel = new Intl.DateTimeFormat('da-DK', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const weekdays = /\b(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag|ma|ti|on|to|fr|lø|sø)\b/i;
  const lessonSelector = '.s2skemabrik, .s2skemabrikcontainer a[data-tooltip], [data-lxp-lesson]';
  const timePattern = /(?<!\d)([01]?\d|2[0-3]):([0-5]\d)(?!\d)/g;
  const lessonRangePattern = /(?<![\d.])([01]?\d|2[0-3])[:.]([0-5]\d)\s*(?:[-–—−]|til)\s*([01]?\d|2[0-3])[:.]([0-5]\d)(?![\d.])/i;

  function clean(value = '') {
    return value.replace(/\s+/g, ' ').trim();
  }

  function text(node) {
    return clean(node?.textContent || '');
  }

  function normalized(value) {
    return clean(value).toLocaleLowerCase('da-DK');
  }

  function dateKey(year, month, day) {
    const date = new Date(Date.UTC(+year, +month - 1, +day));
    if (+year < 2000 || +year > 2100 || date.getUTCMonth() !== +month - 1 || date.getUTCDate() !== +day) return '';
    return date.toISOString().slice(0, 10);
  }

  function dateIn(value) {
    const iso = value.match(/(?<!\d)(20\d{2})-(\d{2})-(\d{2})(?!\d)/);
    if (iso) return dateKey(...iso.slice(1));
    const danish = value.match(/\b(\d{1,2})\s*[/.]\s*(\d{1,2})\s*[-/.]\s*(20\d{2})\b/);
    return danish ? dateKey(danish[3], danish[2], danish[1]) : '';
  }

  function displayedWeek(value) {
    const week = Number(value.match(/\buge\s*(\d{1,2})\b/i)?.[1]);
    const year = Number(value.match(/\b20\d{2}\b/)?.[0]);
    if (!(week > 0 && week <= 53 && year)) return [];
    const januaryFourth = new Date(Date.UTC(year, 0, 4));
    const weekday = januaryFourth.getUTCDay() || 7;
    return Array.from({ length: 7 }, (_, day) => new Date(Date.UTC(year, 0, 5 - weekday + 7 * (week - 1) + day)).toISOString().slice(0, 10));
  }

  function today(now = new Date()) {
    const parts = Object.fromEntries(clock.formatToParts(now).map(({ type, value }) => [type, value]));
    return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
  }

  function timesIn(value) {
    return Array.from(value.matchAll(timePattern), ([, hour, minute]) => `${hour.padStart(2, '0')}:${minute}`);
  }

  function timeRange(value) {
    const times = timesIn(value);
    return { time: times.slice(0, 2).join('–'), order: times[0] || '' };
  }

  function lessonRange(value) {
    const match = value.match(lessonRangePattern);
    if (!match) return timeRange(value);
    const [, fromHour, fromMinute, toHour, toMinute] = match;
    const order = `${fromHour.padStart(2, '0')}:${fromMinute}`;
    return { order, time: `${order}–${toHour.padStart(2, '0')}:${toMinute}` };
  }

  function displayDay(date) {
    if (!date) return 'Aktiviteter uden dato';
    const label = dayLabel.format(new Date(`${date}T12:00:00Z`));
    return label[0].toLocaleUpperCase('da-DK') + label.slice(1);
  }

  function tooltipText(value) {
    if (!value) return '';
    const template = document.createElement('template');
    try {
      template.innerHTML = value.replace(/<\s*br\b[^>]*>|<\s*\/(?:div|p|li|tr)\s*>/gi, '\n');
      return template.content.textContent.trim();
    } catch {
      return value;
    }
  }

  function lessonText(lesson) {
    return lesson.getAttribute('data-tooltip') || lesson.querySelector('[data-tooltip]')?.getAttribute('data-tooltip') ||
      lesson.getAttribute('title') || '';
  }

  function statusOfLesson(lesson, tooltip) {
    if (lesson.closest('.s2cancelled') || lesson.querySelector('.s2cancelled') || /(?:^|\n)\s*aflyst(?:[!:\s]|$)/i.test(tooltip)) return 'Aflyst';
    if (lesson.closest('.s2changed') || lesson.querySelector('.s2changed') || /(?:^|\n)\s*ændret(?:[!:\s]|$)/i.test(tooltip)) return 'Ændret';
    return '';
  }

  function scheduleView(scope) {
    const nodes = [...scope.querySelectorAll(lessonSelector)]
      .filter((node) => !node.parentElement.closest(lessonSelector) && !node.closest('[hidden], [aria-hidden="true"], .s2skyggeSkemabrik'));
    const host = scope.querySelector('.s2skema, [data-lxp-schedule]') || nodes[0]?.closest('table');
    if (!host) return null;

    const weekLabel = text(scope.querySelector('.s2weekHeader')).match(/\buge\s*\d{1,2}(?:\s*[-–,]?\s*20\d{2})?/i)?.[0] || '';
    const week = displayedWeek(weekLabel);
    const scheduleDate = (value) => {
      const withoutTime = value.replace(lessonRangePattern, '');
      const exact = dateIn(withoutTime);
      if (exact) return exact;
      const partial = withoutTime.match(/\b(\d{1,2})[/.](\d{1,2})(?!\d)/);
      const suffix = partial && `-${partial[2].padStart(2, '0')}-${partial[1].padStart(2, '0')}`;
      return suffix ? week.find((date) => date.endsWith(suffix)) || '' : '';
    };
    const headers = [...host.querySelectorAll('.s2dayHeader, [data-lxp-day]')];
    const dateForHeader = (header) => scheduleDate(header.dataset.lxpDay || text(header));
    const days = new Set(headers.map(dateForHeader).filter(Boolean));
    const table = host.matches('table') ? host : host.querySelector('table');
    const columnHeaders = table && [...table.rows].find((row) => [...row.cells].every((cell) => cell.colSpan === 1) &&
      [...row.cells].filter((cell) => cell.matches('th, .s2dayHeader, [data-lxp-day]') && dateForHeader(cell)).length >= 2);
    const columnDates = columnHeaders ? [...columnHeaders.cells].map(dateForHeader) : [];
    for (const date of columnDates.filter(Boolean)) days.add(date);
    const lessons = nodes.filter((node) => host.contains(node)).map((node) => {
      const link = node.matches('a') ? node : node.querySelector('a[href], a[onclick]');
      const tooltip = tooltipText(lessonText(node) || (link && lessonText(link)));
      const lines = tooltip.split(/\r?\n/).map(clean).filter(Boolean);
      const timeLine = lines.find((line) => (weekdays.test(line) || dateIn(line)) && lessonRange(line).order) ||
        lines.find((line) => /^(tid|tidspunkt)\s*:/i.test(line) && lessonRange(line).order) ||
        lines.slice(0, 3).find((line) => lessonRangePattern.test(line)) || '';
      const dateLine = lines.find((line) => /^(dato|tidspunkt)\s*:/i.test(line) && scheduleDate(line)) ||
        lines.slice(0, 3).find((line) => weekdays.test(line) && scheduleDate(line));
      const cell = node.closest('td');
      const gridRow = cell && columnDates.length && cell.closest('table') === table && cell.parentElement.cells.length === columnDates.length &&
        [...cell.parentElement.cells].every((value) => value.colSpan === 1 && value.rowSpan === 1) ? cell.parentElement : null;
      const date = scheduleDate(node.dataset.lxpDate || '') || scheduleDate(timeLine) || scheduleDate(dateLine || '') ||
        (gridRow ? columnDates[cell.cellIndex] : '');
      if (date) days.add(date);
      const titleLabel = node.querySelector('.s2skemabrik-std-title, [data-lxp-lesson-title]');
      const title = text(titleLabel) || text(node.querySelector('.s2skemabrikcontent')) || text(link) || text(node) || 'Aktivitet';
      const fields = lines.filter((line) => /^(hold|lærer|lokale|lokaler|ressource)\s*:/i.test(line));
      const detail = fields.join(' · ');
      const room = fields.find((line) => /^lokaler?\s*:/i.test(line))?.split(':').slice(1).join(':').trim() || '';
      const subject = fields.find((line) => /^hold\s*:/i.test(line))?.split(':').slice(1).join(':').trim() || title;
      const status = statusOfLesson(node, tooltip);
      const rowTime = gridRow?.cells[0]?.matches('th') ? text(gridRow.cells[0]) : '';
      const range = lessonRange(node.dataset.lxpTime || timeLine || rowTime);
      return { node, link, title, detail, room, subject, date, status, ...range, searchable: clean(`${text(node)} ${tooltip}`) };
    });
    const gridDays = new Set([...week.slice(0, 5), ...days]);
    return { host, lessons, days: [...gridDays].sort(), confirmedDays: [...days].sort(), weekLabel };
  }

  const columns = {
    tasks: { title: /^(opgave|opgavetitel|titel)$/, due: /^(frist|afleveringsfrist|afleveres senest)$/, status: /^(status|afleveringsstatus)$/, waiting: /^afventer$/, description: /^(opgavenote|beskrivelse)$/ },
    homework: { title: /^(aktivitet|emne|titel|lektie(?:r)?)(?:\b|$)/, due: /^(til|dato|dag|tidspunkt)$/, description: /^lektie(?:r)?$/ },
    messages: { title: /^emne$/, message: /^(seneste besked|første besked|modtagere|ændret)$/, description: /^seneste besked$/, due: /^(ændret|modtaget|dato|tidspunkt)$/ }
  };

  function tableHeaders(table) {
    for (const row of table.rows) {
      if (row.cells.length > 1 && (row.parentElement.tagName === 'THEAD' || [...row.cells].some((cell) => cell.tagName === 'TH'))) {
        return [...row.cells].flatMap((cell) => [text(cell), ...Array(cell.colSpan - 1).fill('')]);
      }
    }
    return [];
  }

  function statusOfTask(status, waiting) {
    const label = normalized(status);
    if (/^(skal ikke afleveres|fritaget)\b/.test(label)) return 'exempt';
    if (/^(afleveret|rettet|afsluttet|godkendt)\b/.test(label)) return 'submitted';
    if (/^(ikke (afleveret|afl\.?)(?:\s|$)|mangler\b|åben\b)/.test(label) || normalized(waiting) === 'elev') return 'open';
    return '';
  }

  function tableView(scope, kind) {
    const expected = columns[kind];
    if (!expected) return null;
    for (const table of scope.querySelectorAll('table')) {
      if (table.closest('[hidden], [aria-hidden="true"]')) continue;
      const labels = tableHeaders(table);
      const headers = labels.map(normalized);
      const indexes = Object.fromEntries(Object.entries(expected).map(([name, pattern]) => [name, headers.findIndex((header) => pattern.test(header))]));
      if (kind === 'homework' && indexes.title === indexes.description) {
        const activity = headers.findIndex((header) => /^(aktivitet|emne|titel)\b/.test(header));
        if (activity !== -1) indexes.title = activity;
      }
      if (indexes.title === -1 || (kind === 'tasks' && indexes.due === -1) || (kind === 'messages' && indexes.message === -1)) continue;
      const subject = headers.findIndex((header) => /^(fag|hold|holdelement)$/.test(header));
      const width = headers.length;
      const rows = [...table.tBodies].flatMap((body) => [...body.rows]).filter((row) =>
        row.cells.length === width && !row.closest('[hidden], [aria-hidden="true"]') && row.style.display !== 'none' &&
        ![...row.cells].some((cell) => cell.tagName === 'TH' || cell.colSpan !== 1) && text(row.cells[indexes.title]));
      return { table, rows: rows.map((node) => {
        const titleCell = node.cells[indexes.title];
        const dueCell = node.cells[indexes.due];
        const dueText = text(dueCell);
        const dueValue = dueCell?.querySelector('time')?.getAttribute('datetime') || dueText;
        const due = dateIn(dueValue);
        const statusCell = node.cells[indexes.status];
        const status = text(statusCell);
        const waiting = text(node.cells[indexes.waiting]);
        const alreadyShown = new Set([indexes.title, indexes.due, indexes.status, indexes.description, subject]);
        const extra = labels.flatMap((label, index) => {
          const cell = node.cells[index];
          if (!label || alreadyShown.has(index) || cell.matches('[hidden], [aria-hidden="true"]') || cell.style.display === 'none') return [];
          const value = text(cell);
          return value ? [{ label, value }] : [];
        });
        return {
          node, title: text(titleCell), link: titleCell.querySelector('a[href], a[onclick]'), subject: text(node.cells[subject]),
          description: indexes.description === indexes.title ? '' : text(node.cells[indexes.description]),
          due, dueTime: timeRange(dueValue).order || '23:59', dueText, status, state: statusOfTask(status, waiting), extra
        };
      }), hasStatus: kind === 'tasks' && (indexes.status !== -1 || indexes.waiting !== -1), hasDate: indexes.due >= 0 };
    }
    return null;
  }

  globalThis.lectioPlusData = { today, displayDay, scheduleView, tableView };
})();
