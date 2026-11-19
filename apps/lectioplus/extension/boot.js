(() => {
  'use strict';

  function start() {
    if (globalThis.lectioPlusBoot) return;
    const root = document.documentElement;
    const appearance = globalThis.lectioPlusAppearance;
    const embedded = window !== window.top;
    const schoolPicker = !embedded && ['/', '/lectio/login_list.aspx'].includes(location.pathname.toLowerCase());
    const lectioPath = path => /^\/lectio\/\d+\//i.test(path) && !/login|logout|logud|auth|eksam|proeve/i.test(path.split('/').pop());
    let parentRoot;
    if (embedded && /^about:(?:blank|srcdoc)(?:#.*)?$/.test(location.href)) {
      try {
        let ancestor = window.parent;
        while (/^about:(?:blank|srcdoc)(?:#.*)?$/.test(ancestor.location.href) && ancestor !== ancestor.parent) ancestor = ancestor.parent;
        if (lectioPath(ancestor.location.pathname)) parentRoot = ancestor.document.documentElement;
      } catch { /* Cross-origin parents cannot supply an inherited theme. */ }
    }
    if (!root || !appearance || !(schoolPicker || lectioPath(location.pathname) || parentRoot)) return;

    const systemDark = matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add('lxp-starting');
    const initial = parentRoot?.dataset.lxpMode ? { ...appearance.defaults, theme: parentRoot.dataset.lxpMode, design: parentRoot.dataset.lxpDesign } : appearance.defaults;
    appearance.apply(root, appearance.normalize(initial), systemDark);
    let released = false;
    let readyTimeout;
    // A slow HTML response must not expose the old page after an arbitrary 1.4 s.
    // Fail open if initialization breaks, including when DOMContentLoaded never arrives.
    const hardTimeout = setTimeout(finish, 15000);
    function afterDOM() {
      if (!released) readyTimeout = setTimeout(finish, schoolPicker ? 10000 : 4000);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', afterDOM, { once: true });
    else afterDOM();

    function finish() {
      if (released) return;
      released = true;
      clearTimeout(hardTimeout);
      clearTimeout(readyTimeout);
      document.removeEventListener('DOMContentLoaded', afterDOM);
      root.classList.remove('lxp-starting');
      if (!document.body?.matches('.lxp-enabled, .lxp-school-enabled') && !globalThis.lectioPlusNativeTheme?.applied) {
        appearance.apply(root, appearance.defaults, systemDark, false);
      }
    }

    const listeners=new Set();let latest=appearance.defaults,readFinished=false,readTimer;
    const read=Promise.resolve().then(()=>(globalThis.browser?.storage ?? globalThis.chrome?.storage)?.local?.get(appearance.defaults))
      .then(appearance.normalize,()=>appearance.defaults).then(settings=>{
        readFinished=true;clearTimeout(readTimer);latest=settings;
        if(!released)appearance.apply(root,settings,systemDark,settings.enabled);
        if(!settings.enabled)finish();
        for(const listener of listeners)listener(settings);
        return settings;
      });
    // A hung extension-storage read must not block every renderer indefinitely.
    // A delayed real result still reaches all renderers, including enabled:false.
    const fallback=new Promise(resolve=>{readTimer=setTimeout(()=>resolve(latest),1500);});
    const preferences=Promise.race([read,fallback]);
    globalThis.lectioPlusBoot={preferences,finish,onPreferences(listener){listeners.add(listener);if(readFinished)listener(latest);return ()=>listeners.delete(listener);}};

  }

  if (document.documentElement) start();
  else {
    // Some document_start injections arrive before the parser creates <html>.
    const observer = new MutationObserver(() => {
      if (!document.documentElement) return;
      observer.disconnect();
      start();
    });
    observer.observe(document, { childList: true });
  }
})();
