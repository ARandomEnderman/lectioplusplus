(() => {
  'use strict';
  globalThis.lectioPlusSettingsExtras = ({ ui, panels, getPreferences, onChange, saveSettings, canTransfer, status }) => {
    const { element, button } = ui;
    const appearance = globalThis.lectioPlusAppearance;
    const transfer = globalThis.lectioPlusSettingsTransfer;
    const list = element('div', 'lxp-navigation-editor');
    const names = new Map(appearance.navigationItems);
    let signature, dragged = '', pending, previous, busy = false, navigationBusy = false;
    async function changeNavigation(change) {
      if (navigationBusy) return;
      navigationBusy = true; list.inert = true;
      const navigation = structuredClone(getPreferences().navigation);
      change(navigation);
      signature = undefined;
      try { await onChange({ navigation }); }
      finally { navigationBusy = false; list.inert = false; }
    }
    function move(id, target) {
      if (id === target) return;
      void changeNavigation((items) => {
        const from = items.findIndex((item) => item.id === id), to = items.findIndex((item) => item.id === target);
        if (from < 0 || to < 0) return;
        const [item] = items.splice(from, 1); items.splice(to, 0, item);
      });
    }
    panels.get('navigation').append(element('h4', '', 'Din sidebjælke'),
      element('p', 'lxp-settings-help', 'Vælg synlige menupunkter og favoritter. Flyt med pilene eller træk i navnet. Favoritter vises øverst. Menupunkter vises kun, når de findes på din Lectio-side.'), list,
      button('lxp-secondary-button', 'Gendan standardmenu', () => onChange({ navigation: appearance.defaultNavigation() }), 'Gendan standardmenu'));
    const backup = panels.get('backup');
    backup.append(element('p', 'lxp-settings-help', 'Gem tema, menu, layout og dine egne noter og links i en fil. Skema, beskeder, karakterer og andre oplysninger hentet fra Lectio kommer ikke med. Filen indeholder dine egne noter og links, så del den kun, hvis du ønsker det.'));
    const exportButton = button('lxp-secondary-button', 'Eksportér indstillinger', () => {
      if (!canTransfer() || busy) return;
      try { transfer.download(getPreferences()); status.textContent = 'Din opsætning er eksporteret.'; }
      catch { status.textContent = 'Filen kunne ikke downloades. Prøv igen.'; }
    }, 'Download opsætning');
    const file = element('input', 'lxp-setting-control'); file.type = 'file'; file.accept = '.json,application/json';
    file.setAttribute('aria-label', 'Vælg backupfil');
    const review = element('div', 'lxp-import-review'); review.hidden = true;
    const summary = element('p', '');
    const apply = button('lxp-primary-button', 'Importér den valgte opsætning', async () => {
      if (!pending || busy || !canTransfer()) return;
      busy = true; sync(getPreferences());
      const before = JSON.parse(transfer.serialize(getPreferences())).preferences;
      const saved = await saveSettings(pending);
      busy = false;
      if (saved !== false) { previous = before; pending = null; review.hidden = true; file.value = ''; }
      sync(getPreferences());
      status.textContent = saved === false ? 'Importen kunne ikke gemmes. Din opsætning er bevaret.' : 'Opsætningen er importeret. Du kan fortryde importen nedenfor.';
    }, 'Importér opsætning');
    const undo = button('lxp-secondary-button', 'Fortryd import', async () => {
      if (!previous || busy || !canTransfer()) return;
      busy = true; sync(getPreferences());
      const saved = await saveSettings(previous);
      busy = false;
      if (saved !== false) previous = null;
      sync(getPreferences());
      status.textContent = saved === false ? 'Kunne ikke gendanne opsætningen. Prøv igen.' : 'Importen er fortrudt.';
    }, 'Fortryd import');
    undo.hidden = true;
    file.addEventListener('change', async () => {
      const selected = file.files?.[0]; pending = null; review.hidden = true;
      if (!selected || busy || !canTransfer()) return;
      if (selected.size > transfer.maxBytes) { status.textContent = 'Filen er for stor. Maksimum er 8 MB.'; return; }
      try {
        const text = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsText(selected); });
        if (file.files?.[0] !== selected) return;
        pending = transfer.parse(text);
        const parts = [];
        if (pending.theme) parts.push(`Tema: ${appearance.themes.find(([id]) => id === pending.theme)?.[1] || pending.theme}`);
        if (pending.design) parts.push(`Farve: ${appearance.designs.find(([id]) => id === pending.design)?.[1] || pending.design}`);
        if (pending.dashboard) parts.push(`${pending.dashboard.custom.length} egne felter og et nyt layout`);
        if (pending.toolbox) parts.push(`${pending.toolbox.cards.length} flashcards${pending.toolbox.notes?' og en gemt note':''} samt værktøjsindstillinger`);
        if (pending.navigation) parts.push(`${pending.navigation.filter((item) => item.visible).length} synlige menupunkter`);
        summary.textContent = `${parts.join(' · ') || 'Indstillinger fra backupfil'}. De indstillinger, som filen indeholder, erstatter dine gemte valg. Download eventuelt din nuværende opsætning først.`;
        review.hidden = false; status.textContent = 'Backup læst. Gennemse opsætningen, og tryk Importér for at bruge den.';
      } catch (error) { status.textContent = error?.message || 'Filen kunne ikke læses.'; }
    });
    review.append(summary, apply);
    backup.append(exportButton, element('label', 'lxp-widget-field', 'Importér en backup', file), review, undo,
      element('p', 'lxp-settings-help', 'Gem eller annullér eventuelle layoutændringer, før du eksporterer eller importerer.'));
    function sync(preferences) {
      const next = JSON.stringify(preferences.navigation);
      if (next !== signature) {
        signature = next;
        const focus = list.contains(document.activeElement) ? document.activeElement.getAttribute('aria-label') : null;
        list.replaceChildren(...preferences.navigation.map((item, index, items) => {
          const name = names.get(item.id);
          const row = element('div', 'lxp-navigation-row'); row.dataset.menu = item.id;
          const handle = element('span', 'lxp-navigation-handle', name); handle.draggable = true;
          handle.addEventListener('dragstart', (event) => { dragged = item.id; event.dataTransfer.setData('text/plain', item.id); event.dataTransfer.effectAllowed = 'move'; });
          handle.addEventListener('dragend', () => { dragged = ''; list.querySelectorAll('.lxp-drop-active').forEach((el) => el.classList.remove('lxp-drop-active')); });
          row.addEventListener('dragover', (event) => { if (dragged) { event.preventDefault(); row.classList.add('lxp-drop-active'); } });
          row.addEventListener('dragleave', () => row.classList.remove('lxp-drop-active'));
          row.addEventListener('drop', (event) => { event.preventDefault(); const id = dragged; dragged = ''; row.classList.remove('lxp-drop-active'); if (id && event.dataTransfer.getData('text/plain') === id) move(id, item.id); });
          const visible = element('input', ''); visible.type = 'checkbox'; visible.setAttribute('aria-label', `Vis ${name} i sidebjælken`);
          const toggle = appearance.toggle(visible); toggle.sync(item.visible);
          visible.addEventListener('change', () => changeNavigation((entries) => { entries.find((entry) => entry.id === item.id).visible = visible.checked; }));
          const favorite = button('lxp-small-action', `Favorit: ${name}`, () => changeNavigation((entries) => { entries.find((entry) => entry.id === item.id).pinned = !item.pinned; }), item.pinned ? '★ Favorit' : '☆ Favorit');
          favorite.setAttribute('aria-pressed', String(item.pinned));
          const up = button('lxp-small-action', `Flyt ${name} op i menuen`, () => move(item.id, items[index - 1]?.id), '↑'); up.disabled = index === 0;
          const down = button('lxp-small-action', `Flyt ${name} ned i menuen`, () => move(item.id, items[index + 1]?.id), '↓'); down.disabled = index === items.length - 1;
          row.append(handle, toggle.node, favorite, up, down); return row;
        }));
        if (focus) [...list.querySelectorAll('[aria-label]')].find((el) => el.getAttribute('aria-label') === focus)?.focus();
      }
      exportButton.disabled = file.disabled = apply.disabled = undo.disabled = busy || !canTransfer();
      undo.hidden = !previous;
    }
    return { sync };
  };
})();
