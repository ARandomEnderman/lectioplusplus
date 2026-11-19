(() => {
  'use strict';
  const appearance = globalThis.lectioPlusAppearance;
  const maxBytes = 8000000;
  function serialize(preferences) {
    const { enabled, ...settings } = appearance.normalize(preferences);
    const text=JSON.stringify({ format: 'LectioPlus+', version: 1, preferences: settings }, null, 2);
    if(new Blob([text]).size>maxBytes)throw new Error('Backup er større end 8 MB. Forkort eller fjern store egne felter først.');
    return text;
  }
  function parse(text) {
    if (typeof text !== 'string' || new Blob([text]).size > maxBytes) throw new Error('Filen er for stor. Maksimum er 8 MB.');
    let file;
    try { file = JSON.parse(text); } catch { throw new Error('Filen indeholder ikke gyldig JSON.'); }
    if (file?.format !== 'LectioPlus+' || file.version !== 1 || !file.preferences || typeof file.preferences !== 'object' || Array.isArray(file.preferences)) throw new Error('Vælg en LectioPlus+-backup i version 1.');
    const source = file.preferences;
    if (Object.keys(source).some((key) => key === 'enabled' || !Object.hasOwn(appearance.defaults, key))) throw new Error('Backupfilen indeholder ukendte indstillinger.');
    if (!Object.keys(source).length) throw new Error('Backupfilen er tom.');
    const normalized = appearance.normalize(source);
    for (const key of Object.keys(source)) {
      if (key === 'dashboard' || key === 'navigation' || key === 'toolbox' || key === 'customSidebar' || key === 'games') continue;
      if (normalized[key] !== source[key]) throw new Error('Backupfilen indeholder ugyldige indstillinger.');
    }
    // Reject lossy imports instead of silently dropping notes, IDs or unsafe URLs.
    function equal(a, b) {
      if (a === b) return true;
      if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
      const keys = Object.keys(a);
      return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]));
    }
    if (source.navigation !== undefined) {
      if(!Array.isArray(source.navigation))throw new Error('Menuopsætningen indeholder ugyldige felter.');
      const supplied=new Set(source.navigation.map(item=>item?.id));
      if(!equal(source.navigation,normalized.navigation.filter(item=>supplied.has(item.id))))throw new Error('Menuopsætningen indeholder ugyldige felter.');
    }
    if(source.games!==undefined&&!equal(source.games,normalized.games))throw new Error('Spilindstillingerne indeholder ugyldige felter.');
    if(source.customSidebar!==undefined&&!equal(source.customSidebar,normalized.customSidebar))throw new Error('Egne faner indeholder ugyldige links eller felter.');
    if(source.dashboard!==undefined&&!equal(source.dashboard,normalized.dashboard))throw new Error('Layoutet indeholder ugyldige felter, links eller menupunkter.');
    if(source.toolbox!==undefined){
      if(!source.toolbox||typeof source.toolbox!=='object'||Array.isArray(source.toolbox))throw new Error('Værktøjsindstillingerne er ugyldige.');
      // Older backups need defaults for newly introduced options. Only the explicitly
      // removed AI favorite/recent entry is migrated; unknown fields remain errors.
      const previous={...source.toolbox};
      if(previous.lastTool==='ai')previous.lastTool='';
      if(Array.isArray(previous.favorites))previous.favorites=previous.favorites.filter(id=>id!=='ai');
      for(const key of Object.keys(previous)){
        // Earlier backups have fewer editor options. Validate each supplied option,
        // then keep the defaults for newly added workspace dimensions.
        if(key==='code'&&previous.code&&typeof previous.code==='object'&&!Array.isArray(previous.code)){
          for(const option of Object.keys(previous.code))if(!Object.hasOwn(normalized.toolbox.code,option)||!equal(previous.code[option],normalized.toolbox.code[option]))throw new Error('Editorindstillingerne indeholder ugyldige felter.');
        }else if(!Object.hasOwn(normalized.toolbox,key)||!equal(previous[key],normalized.toolbox[key]))throw new Error('Værktøjsindstillingerne indeholder ugyldige felter.');
      }
    }
    return Object.fromEntries(Object.keys(source).map((key) => [key, normalized[key]]));
  }
  function download(preferences) {
    const url = URL.createObjectURL(new Blob([serialize(preferences)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'LectioPlus-opsætning.json';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  globalThis.lectioPlusSettingsTransfer = { serialize, parse, download, maxBytes };
})();
