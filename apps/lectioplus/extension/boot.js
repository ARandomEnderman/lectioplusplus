(() => {
  'use strict';

  const path = location.pathname;
  const root = document.documentElement;
  if (window !== window.top || !root || !/^\/lectio\/\d+\//i.test(path) || /login|logout|logud|auth|eksam|proeve/i.test(path.split('/').pop())) return;

  const appearance = globalThis.lectioPlusAppearance;
  const systemDark = matchMedia('(prefers-color-scheme: dark)').matches;
  root.classList.add('lxp-starting');
  appearance.apply(root, appearance.defaults, systemDark);
  let released = false;
  const timeout = setTimeout(finish, 1400);

  function finish() {
    released = true;
    clearTimeout(timeout);
    root.classList.remove('lxp-starting');
    if (!document.body?.classList.contains('lxp-enabled') && !root.hasAttribute('data-lxp-native-theme')) {
      appearance.apply(root, appearance.defaults, systemDark, false);
    }
  }

  const preferences = Promise.resolve().then(() => globalThis.chrome?.storage?.local?.get(appearance.defaults))
    .then(appearance.normalize, () => appearance.defaults)
    .then((settings) => {
      if (!released) appearance.apply(root, settings, systemDark, settings.enabled);
      if (!settings.enabled) finish();
      return settings;
    });

  globalThis.lectioPlusBoot = { preferences, finish };
})();
