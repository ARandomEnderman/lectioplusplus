(() => {
  'use strict';
  globalThis.lectioPlusSettings = ({ ui, getPreferences: getSavedPreferences, onChange, getWidgets, initialTab = 'appearance' }) => {
    const { element, button, icon } = ui;
    const appearance = globalThis.lectioPlusAppearance;
    const node = element('div', 'lxp-custom-settings');
    const tabs = element('div', 'lxp-settings-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Indstillingskategorier');
    const content = element('div', 'lxp-settings-content');
    const status = element('p', 'lxp-settings-status', 'Indstillinger gemmes på denne enhed.');
    status.setAttribute('role', 'status');
    const fields = new Map();
    const toggles = new Map();
    const panels = new Map();
    const buttons = new Map();
    let layoutSignature;
    let editId = '';
    let draft = structuredClone(getSavedPreferences().dashboard);
    let baseline = JSON.stringify(draft);
    const history = [], future = [];
    let saving = false;
    const getPreferences = () => ({ ...getSavedPreferences(), dashboard: draft });
    const dirty = () => JSON.stringify(draft) !== baseline;
    const conflict = () => JSON.stringify(getSavedPreferences().dashboard) !== baseline;
    const api = { node, sync, hasUnsaved: () => dirty() || saving, refreshPreview() { layoutSignature = undefined; sync(getSavedPreferences()); }, canClose() {
      if (saving || dirty()) { activate('dashboard'); status.textContent = saving ? 'Vent, mens layoutet gemmes.' : 'Du har ændringer i layoutet. Vælg Gem layout eller Annullér ændringer, før du lukker.'; return false; }
      return true;
    } };
    const categories = [['appearance', 'Udseende'], ['schedule', 'Skema'], ['navigation', 'Menuer'], ['dashboard', 'Overblik'], ['pages', 'Sider og tabeller'], ['profiles', 'Profiler'], ['backup', 'Backup']];

    async function commit(changes) {
      if (changes.dashboard) {
        if (saving) return false;
        const next = appearance.normalize({ ...getPreferences(), dashboard: changes.dashboard }).dashboard;
        if (JSON.stringify(next) === JSON.stringify(draft)) return true;
        history.push(structuredClone(draft)); if (history.length > 50) history.shift(); future.length = 0;
        draft = next; sync(getSavedPreferences());
        status.textContent = 'Layout ændret i forhåndsvisningen. Vælg Gem layout, når du er klar.';
        return true;
      }
      const [key, value] = Object.entries(changes)[0] || [];
      const label = fields.get(key)?.getAttribute('aria-label') || (key === 'hideProfilePhoto' ? 'Skjul mit profilbillede' : key === 'anonymizeName' ? 'Vis mit navn som Anonym' : '');
      const feedback = label && typeof value === 'boolean' ? `${label}: ${value ? 'Til' : 'Fra'}.` : key === 'dashboard' ? 'Overblik opdateret.' : 'Visning opdateret.';
      status.textContent = feedback;
      const saved = await onChange(changes);
      if (saved === false) sync(getSavedPreferences());
      status.textContent = saved === false ? 'Kunne ikke gemme ændringen. Prøv igen.' : `${feedback} Gemt på denne enhed.`;
    }

    for (const [key, label] of categories) {
      const panel = element('section', 'lxp-settings-panel', element('h3', '', label));
      panel.id = `lxp-settings-panel-${key}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `lxp-settings-tab-${key}`);
      panels.set(key, panel);
      content.append(panel);
      const tab = button('lxp-settings-tab', label, () => activate(key), label);
      tab.id = `lxp-settings-tab-${key}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel.id);
      buttons.set(key, tab);
      tabs.append(tab);
    }
    const profileLink=element('a','lxp-secondary-button','Åbn profiler');profileLink.href='#lxp-tools/profiles';profileLink.addEventListener('click',event=>{if(!api.canClose()){event.preventDefault();return;}node.closest('dialog')?.close();});panels.get('profiles').append(element('p','lxp-settings-help','Gem din nuværende visning, eller brug profiler til skoledag og lektielæsning.'),profileLink);
    function activate(key) {
      node.dataset.category = key;
      node.closest('dialog')?.classList.toggle('lxp-settings-visual', key === 'dashboard');
      for (const [name, panel] of panels) {
        panel.hidden = name !== key;
        buttons.get(name).setAttribute('aria-selected', String(name === key));
        buttons.get(name).tabIndex = name === key ? 0 : -1;
      }
    }
    tabs.addEventListener('keydown', (event) => {
      const all = [...buttons.values()];
      const current = all.indexOf(document.activeElement);
      if (current < 0) return;
      const next = ['ArrowRight', 'ArrowDown'].includes(event.key) ? (current + 1) % all.length :
        ['ArrowLeft', 'ArrowUp'].includes(event.key) ? (current + all.length - 1) % all.length : event.key === 'Home' ? 0 : event.key === 'End' ? all.length - 1 : -1;
      if (next < 0) return;
      event.preventDefault();
      all[next].click();
      all[next].focus();
    });

    function field(panel, key, label, choices, description = '') {
      const input = element(choices ? 'select' : 'input', 'lxp-setting-control');
      input.setAttribute('aria-label', label);
      if (choices) for (const [value, text] of choices) input.append(new Option(text, value));
      else input.type = 'checkbox';
      const toggle = choices ? null : appearance.toggle(input);
      if (toggle) toggles.set(key, toggle);
      input.addEventListener('change', () => commit({ [key]: choices ? input.value : input.checked }));
      const copy = element('span', 'lxp-setting-copy', element('strong', '', label));
      if (description) copy.append(element('small', '', description));
      panels.get(panel).append(element('label', 'lxp-setting-row', copy, toggle?.node || input));
      fields.set(key, input);
    }
    const look = appearance.controls(commit);
    panels.get('appearance').append(look.node);
    field('appearance', 'font', 'Skrifttype', [['system', 'Systemets skrifttype'], ['arial', 'Arial']]);
    field('appearance', 'contentWidth', 'Indholdets bredde', [['normal', 'Centreret'], ['wide', 'Udnyt bredden']]);
    field('appearance', 'tabBranding', 'Tilpas fanens navn og ikon', null);
    field('appearance', 'reducedMotion', 'Færre animationer', null);
    field('schedule', 'scheduleSize', 'Skemaets størrelse', [['60', 'Kompakt'], ['76', 'Normal størrelse'], ['92', 'Mere plads']]);
    field('schedule', 'scheduleView', 'Standardvisning', [['auto', 'Uge på computer, dag på mobil'], ['week', 'Uge'], ['day', 'Dagsliste']]);
    field('schedule', 'showBreaks', 'Vis pauser mellem lektioner', null, 'Tidsrummene bevares også, når markeringen er skjult.');
    field('schedule', 'colorLessons', 'Forskellige farver til fagene', null);
    field('schedule', 'showLessonRoom', 'Vis lokale i ugeplanen', null, 'Oplysningerne er altid med i detaljerne.');
    field('navigation', 'showClicker', 'Vis Strafe Clicker', null, 'Skjuler både menupunkt, banner og spil, når den er slået fra.');
    field('navigation', 'navigationDensity', 'Afstand i sidebjælken', [['comfortable', 'Normal'], ['compact', 'Kompakt']]);
    field('navigation', 'navigationGroups', 'Ekstra menuer', [['collapsed', 'Saml under Flere menuer'], ['expanded', 'Hold Flere menuer åben'], ['flat', 'Vis alle direkte']]);
    field('pages', 'tableDensity', 'Afstand i tabeller og formularer', [['comfortable', 'Normal'], ['compact', 'Kompakt']]);
    field('pages', 'sectionShortcuts', 'Genveje til afsnit på lange sider', null);
    panels.get('pages').append(element('p', 'lxp-settings-help', 'Undermenuer og Lectios formularer bevares. Indstillingerne ændrer visningen, ikke dine skoleoplysninger.'));

    const dashboardPanel = panels.get('dashboard');
    const title = element('input', 'lxp-setting-control');
    title.type = 'text'; title.maxLength = 80; title.setAttribute('aria-label', 'Overskrift på overblik');
    title.addEventListener('change', () => dashboardChange((dashboard) => { dashboard.title = title.value; }));
    const columns = element('select', 'lxp-setting-control');
    columns.setAttribute('aria-label', 'Kolonner på overblik');
    for (const [value, label] of [['one', '1 kolonne'], ['two', '2 kolonner'], ['three', '3 kolonner']]) columns.append(new Option(label, value));
    columns.addEventListener('change', () => dashboardChange((dashboard) => { dashboard.columns = columns.value; }));
    dashboardPanel.append(element('label', 'lxp-setting-row', 'Overskrift', title), element('label', 'lxp-setting-row', 'Opdeling', columns),
      element('p', 'lxp-settings-help', 'Træk felter fra listen til venstre ind på dit overblik. Flyt dem rundt, og se placeringen med det samme. Du kan også bruge knapperne.'));
    const board = element('div', 'lxp-layout-editor');
    board.setAttribute('aria-label', 'Placering af felter på overblikket');
    const available = element('select', 'lxp-setting-control');
    available.setAttribute('aria-label', 'Vælg skjult felt');
    const add = button('lxp-secondary-button', 'Tilføj valgt felt', () => {
      if (available.value) dashboardChange((dashboard) => { dashboard.slots.find((slot) => slot.id === available.value).visible = true; });
    }, 'Tilføj felt');
    const palette = element('div', 'lxp-widget-palette');
    const library = element('aside', 'lxp-builder-library', element('h4', '', 'Dine felter'),
      element('p', 'lxp-settings-help', 'Træk et felt ind, eller tryk på +.'), palette);
    const canvas = element('section', 'lxp-builder-canvas',
      element('div', 'lxp-builder-caption', element('strong', '', 'Dit overblik'), element('span', 'lxp-preview-source', 'Henter dit overblik…')), board);
    const end = element('div', 'lxp-drop-end', icon('grid'), element('strong', '', 'Slip et felt her'), element('span', '', 'Tilføj nederst på dit overblik'));
    end.setAttribute('aria-label', 'Tilføj felt nederst');
    const devices = element('div', 'lxp-builder-devices');
    for (const [device, label] of [['desktop', 'Computer'], ['mobile', 'Mobil']]) {
      const toggle = button('lxp-small-action', `Vis layout på ${label.toLowerCase()}`, () => {
        canvas.dataset.device = device;
        for (const control of devices.children) control.setAttribute('aria-pressed', String(control.dataset.device === device));
      }, label);
      toggle.dataset.device = device;
      toggle.setAttribute('aria-pressed', String(device === 'desktop'));
      devices.append(toggle);
    }
    canvas.querySelector('.lxp-builder-caption').append(devices);
    canvas.dataset.device = 'desktop';
    canvas.append(end, element('p', 'lxp-settings-help', 'Samme felter som på overblikket. Links er slået fra her, så du kan flytte felterne sikkert.'));
    dashboardPanel.append(element('div', 'lxp-builder', library, canvas));
    // Keep a select alternative for keyboard users and narrow screens.
    library.append(element('details', 'lxp-builder-alternative', element('summary', '', 'Vælg fra liste'), element('div', 'lxp-widget-add', available, add)));
    let draggingId = '';
    function draggable(control, id) {
      control.draggable = true;
      control.addEventListener('dragstart', (event) => {
        draggingId = id;
        event.dataTransfer.setData('text/plain', id);
        event.dataTransfer.effectAllowed = 'move';
        canvas.classList.add('lxp-dragging');
      });
      control.addEventListener('dragend', clearDrag);
    }
    function clearDrag() {
      draggingId = '';
      canvas.classList.remove('lxp-dragging');
      for (const target of canvas.querySelectorAll('.lxp-drop-active')) target.classList.remove('lxp-drop-active');
    }
    function place(id, target) {
      const prefs = getPreferences();
      if (!prefs.dashboard.slots.some((slot) => slot.id === id) || (id === 'clicker' && !prefs.showClicker) || id === target) return;
      dashboardChange((dashboard) => {
        const from = dashboard.slots.findIndex((slot) => slot.id === id);
        const [slot] = dashboard.slots.splice(from, 1);
        slot.visible = true;
        const to = dashboard.slots.findIndex((item) => item.id === target);
        dashboard.slots.splice(to < 0 ? dashboard.slots.length : to, 0, slot);
      });
    }
    function dropTarget(target, id) {
      target.addEventListener('dragover', (event) => {
        if (!draggingId) return;
        event.preventDefault(); event.stopPropagation();
        event.dataTransfer.dropEffect = 'move';
        target.classList.add('lxp-drop-active');
      });
      target.addEventListener('dragleave', (event) => { if (!target.contains(event.relatedTarget)) target.classList.remove('lxp-drop-active'); });
      target.addEventListener('drop', (event) => {
        event.preventDefault(); event.stopPropagation();
        const dragged = draggingId;
        clearDrag();
        if (dragged && event.dataTransfer.getData('text/plain') === dragged) place(dragged, id);
      });
    }
    dropTarget(end, null);

    const own = element('fieldset', 'lxp-own-widget', element('legend', '', 'Dit eget felt'));
    const kind = element('select', 'lxp-setting-control');
    kind.setAttribute('aria-label', 'Felttype');
    kind.append(new Option('Note', 'note'), new Option('Link', 'link'));
    const ownTitle = element('input', 'lxp-setting-control');
    ownTitle.type = 'text'; ownTitle.maxLength = 60; ownTitle.setAttribute('aria-label', 'Feltets titel');
    const ownText = element('textarea', 'lxp-setting-control');
    ownText.rows = 3; ownText.maxLength = 1000; ownText.setAttribute('aria-label', 'Feltets tekst');
    const url = element('input', 'lxp-setting-control');
    url.type = 'url'; url.maxLength = 2000; url.placeholder = 'https://…'; url.setAttribute('aria-label', 'Feltets link');
    const urlRow = element('label', 'lxp-widget-field', 'Link', url);
    urlRow.hidden = true;
    kind.addEventListener('change', () => { urlRow.hidden = kind.value !== 'link'; });
    function resetEditor() { editId = ''; ownTitle.value = ownText.value = url.value = ''; kind.value = 'note'; urlRow.hidden = true; saveOwn.textContent = 'Tilføj mit felt'; }
    const saveOwn = button('lxp-secondary-button', 'Gem eget felt', () => {
      const label = ownTitle.value.trim();
      if (!label) { status.textContent = 'Giv feltet en titel.'; ownTitle.focus(); return; }
      const safeUrl = appearance.safeUrl(url.value.trim());
      if (kind.value === 'link' && !safeUrl) { status.textContent = 'Skriv et gyldigt link, der begynder med https:// eller http://.'; url.focus(); return; }
      if (!editId && getPreferences().dashboard.custom.length >= 12) { status.textContent = 'Du kan have op til 12 egne felter.'; return; }
      const id = editId || `custom-${crypto.randomUUID()}`;
      dashboardChange((dashboard) => {
        const item = { id, type: kind.value, title: label, text: ownText.value, url: kind.value === 'link' ? safeUrl : '' };
        const index = dashboard.custom.findIndex((entry) => entry.id === id);
        if (index >= 0) dashboard.custom[index] = item;
        else { dashboard.custom.push(item); dashboard.slots.push({ id, width: 'half', visible: true }); }
      });
      resetEditor();
    }, 'Tilføj mit felt');
    own.append(element('label', 'lxp-widget-field', 'Type', kind), element('label', 'lxp-widget-field', 'Titel', ownTitle),
      element('label', 'lxp-widget-field', 'Tekst', ownText), urlRow,
      element('div', 'lxp-widget-actions', saveOwn, button('lxp-secondary-button', 'Ryd felteditor', resetEditor, 'Nyt felt')));
    library.append(own);
    dashboardPanel.append(button('lxp-secondary-button', 'Gendan standardlayout', () => {
      const current = getPreferences().dashboard;
      commit({ dashboard: { ...appearance.defaultDashboard(), custom: current.custom,
        slots: [...appearance.defaultDashboard().slots, ...current.slots.filter((slot) => slot.id.startsWith('custom-')).map((slot) => ({ ...slot, visible: false }))] } });
      status.textContent = 'Standardlayout gendannet. Dine egne felter findes stadig i feltlisten.';
    }, 'Gendan standardlayout'), element('p', 'lxp-settings-help', 'Egne felter gemmes lokalt i browseren. Standardlayoutet kan gendannes uden at slette dem.'));

    function dashboardChange(change) {
      const dashboard = structuredClone(getPreferences().dashboard);
      change(dashboard);
      void commit({ dashboard });
    }
    function move(id, target) {
      dashboardChange((dashboard) => {
        const from = dashboard.slots.findIndex((slot) => slot.id === id);
        const to = dashboard.slots.findIndex((slot) => slot.id === target);
        if (from < 0 || to < 0 || from === to) return;
        const [slot] = dashboard.slots.splice(from, 1);
        dashboard.slots.splice(to, 0, slot);
      });
    }
    function labelFor(id, dashboard) { return appearance.widgets.find(([key]) => key === id)?.[1] || dashboard.custom.find((item) => item.id === id)?.title || 'Felt'; }
    let previewWidgets;
    function widgetPreview(id, dashboard) {
      const preview = element('div', 'lxp-widget-preview');
      preview.setAttribute('aria-label', `Forhåndsvisning af ${labelFor(id, dashboard)}`);
      const widget = previewWidgets?.registry.get(id);
      if (widget) {
        // Only our own rendered cards are used, never cloned Lectio forms or scripts.
        for (const link of [...widget.querySelectorAll('a'), ...(widget.matches('a') ? [widget] : [])]) {
          link.removeAttribute('href'); link.removeAttribute('target'); link.removeAttribute('tabindex');
        }
        for (const item of [widget, ...widget.querySelectorAll('[id]')]) item.removeAttribute('id');
        widget.inert = true;
        preview.append(widget);
      } else preview.append(element('p', 'lxp-empty', 'Forhåndsvisningen er ikke tilgængelig.'));
      return preview;
    }
    function drawDashboard(preferences) {
      previewWidgets = getWidgets?.(preferences);
      canvas.querySelector('.lxp-preview-source').textContent = previewWidgets?.label || 'Forhåndsvisningen er ikke tilgængelig';
      const dashboard = preferences.dashboard;
      const visible = dashboard.slots.filter((slot) => slot.visible && (slot.id !== 'clicker' || preferences.showClicker));
      board.dataset.columns = dashboard.columns;
      board.replaceChildren(...visible.map((slot, index) => {
        const label = labelFor(slot.id, dashboard);
        const handle = button('lxp-widget-handle', `Flyt ${label}`, () => {}, icon('grid'), label);
        draggable(handle, slot.id);
        const tile = element('div', 'lxp-widget-slot', handle, widgetPreview(slot.id, dashboard));
        tile.dataset.width = slot.width;
        tile.dataset.widget = slot.id;
        dropTarget(tile, slot.id);
        const up = button('lxp-small-action', `Flyt ${label} tidligere`, () => move(slot.id, visible[index - 1]?.id), '↑');
        const down = button('lxp-small-action', `Flyt ${label} senere`, () => move(slot.id, visible[index + 1]?.id), '↓');
        up.disabled = index === 0; down.disabled = index === visible.length - 1;
        const width = element('select', 'lxp-setting-control');
        width.setAttribute('aria-label', `Bredde på ${label}`);
        width.append(new Option('Én kolonne', 'half'), new Option('Hele rækken', 'full'));
        width.value = slot.width;
        width.addEventListener('change', () => dashboardChange((next) => { next.slots.find((item) => item.id === slot.id).width = width.value; }));
        const hide = button('lxp-small-action', `Skjul ${label}`, () => dashboardChange((next) => { next.slots.find((item) => item.id === slot.id).visible = false; }), 'Skjul');
        tile.append(element('div', 'lxp-widget-actions', up, down, width, hide));
        const custom = dashboard.custom.find((item) => item.id === slot.id);
        if (custom) tile.append(element('div', 'lxp-widget-actions',
          button('lxp-small-action', `Rediger ${label}`, () => { editId = custom.id; kind.value = custom.type; ownTitle.value = custom.title; ownText.value = custom.text; url.value = custom.url; urlRow.hidden = custom.type !== 'link'; saveOwn.textContent = 'Gem ændringer'; ownTitle.focus(); }, 'Rediger'),
          button('lxp-small-action', `Fjern ${label}`, () => {
            dashboardChange((next) => { next.custom = next.custom.filter((item) => item.id !== slot.id); next.slots = next.slots.filter((item) => item.id !== slot.id); });
            if (editId === custom.id) resetEditor();
          }, 'Fjern')));
        return tile;
      }));
      if (!visible.length) board.append(element('p', 'lxp-settings-help', 'Dit overblik er tomt. Træk et felt ind fra listen, eller brug +.'));
      available.replaceChildren(new Option('Vælg et skjult felt…', ''), ...dashboard.slots.filter((slot) => !slot.visible && (slot.id !== 'clicker' || preferences.showClicker))
        .map((slot) => new Option(labelFor(slot.id, dashboard), slot.id)));
      add.disabled = available.options.length < 2;
      palette.replaceChildren(...dashboard.slots.filter((slot) => slot.id !== 'clicker' || preferences.showClicker).map((slot) => {
        const label = labelFor(slot.id, dashboard);
        const entry = element('div', 'lxp-palette-item');
        entry.dataset.widget = slot.id;
        entry.dataset.visible = String(slot.visible);
        const glyph = { hero: 'home', summary: 'chart', schedule: 'calendar', tasks: 'file', messages: 'message', shortcuts: 'grid', clicker: 'game' }[slot.id] || 'file';
        entry.append(icon(glyph), element('span', '', element('strong', '', label), element('small', '', slot.visible ? 'Vist på overblikket' : 'Skjult – træk ind for at vise')));
        const addField = button('lxp-small-action', `Tilføj ${label}`, () => place(slot.id, null), slot.visible ? '✓' : '+');
        addField.disabled = slot.visible;
        draggable(entry, slot.id);
        entry.append(addField);
        return entry;
      }));
    }

    const undoLayout = button('lxp-secondary-button', 'Fortryd layoutændring', () => {
      if (!history.length || saving) return;
      future.push(structuredClone(draft)); draft = history.pop(); sync(getSavedPreferences());
      status.textContent = 'Layoutændring fortrudt.';
    }, 'Fortryd');
    const redoLayout = button('lxp-secondary-button', 'Gentag layoutændring', () => {
      if (!future.length || saving) return;
      history.push(structuredClone(draft)); draft = future.pop(); sync(getSavedPreferences());
      status.textContent = 'Layoutændring gentaget.';
    }, 'Gentag');
    const saveLayout = button('lxp-primary-button', 'Gem layout', async () => {
      if (saving || !dirty()) return;
      if (conflict()) { status.textContent = 'Layoutet er ændret i en anden fane. Annullér denne kladde for at hente det gemte layout.'; return; }
      saving = true; sync(getSavedPreferences());
      const saved = await onChange({ dashboard: structuredClone(draft) });
      saving = false;
      if (saved !== false) { baseline = JSON.stringify(draft); history.length = future.length = 0; }
      sync(getSavedPreferences());
      status.textContent = saved === false ? 'Layoutet kunne ikke gemmes. Din kladde er bevaret; prøv igen.' : 'Dit layout er gemt.';
    }, 'Gem layout');
    const cancelLayout = button('lxp-secondary-button', 'Annullér layoutændringer', () => {
      if (saving) return;
      draft = structuredClone(getSavedPreferences().dashboard); baseline = JSON.stringify(draft);
      history.length = future.length = 0; resetEditor(); sync(getSavedPreferences());
      status.textContent = 'Ændringer annulleret. Det gemte layout er gendannet.';
    }, 'Annullér ændringer');
    const draftStatus = element('span', 'lxp-draft-status');
    dashboardPanel.prepend(element('div', 'lxp-layout-toolbar', draftStatus, undoLayout, redoLayout, cancelLayout, saveLayout));
    const customSidebar = globalThis.lectioPlusCustomSidebar?.({ui,panel:panels.get('navigation'),getPreferences:getSavedPreferences,onChange:commit,status});
    const extras = globalThis.lectioPlusSettingsExtras({ ui, panels, getPreferences: getSavedPreferences, onChange: commit, saveSettings: onChange,
      canTransfer: () => !dirty() && !saving, status });
    node.append(tabs, content, status);
    activate(panels.has(initialTab) ? initialTab : 'appearance');
    function sync(saved) {
      if (!dirty() && !saving) {
        if (baseline !== JSON.stringify(saved.dashboard)) history.length = future.length = 0;
        draft = structuredClone(saved.dashboard); baseline = JSON.stringify(draft);
      }
      const preferences = { ...saved, dashboard: draft };
      look.sync(preferences);
      for (const [key, input] of fields) { if (input.type === 'checkbox') toggles.get(key).sync(preferences[key]); else input.value = preferences[key]; }
      title.value = preferences.dashboard.title;
      columns.value = preferences.dashboard.columns;
      undoLayout.disabled = saving || !history.length; redoLayout.disabled = saving || !future.length;
      saveLayout.disabled = saving || !dirty(); cancelLayout.disabled = saving || !dirty();
      draftStatus.textContent = saving ? 'Gemmer…' : dirty() ? (conflict() ? 'Ændret i en anden fane' : 'Ikke gemt') : 'Layout gemt';
      board.inert = library.inert = saving;
      title.disabled = columns.disabled = saving;
      extras.sync(preferences);
      customSidebar?.sync(preferences);
      const signature = JSON.stringify([preferences.dashboard, preferences.showClicker]);
      if (layoutSignature !== signature) {
        const focused = board.contains(document.activeElement) ? document.activeElement.getAttribute('aria-label') : null;
        layoutSignature = signature;
        drawDashboard(preferences);
        if (focused) ([...board.querySelectorAll('[aria-label]')].find((control) => control.getAttribute('aria-label') === focused) || available).focus();
      }
    }
    return api;
  };
})();
