(() => {
  'use strict';

  const appearance = globalThis.lectioPlusAppearance;
  const root = document.documentElement;
  let body = document.body;
  const embedded = window !== window.top;
  const blankDocument = /^about:(?:blank|srcdoc)(?:#.*)?$/;
  const storage = globalThis.chrome?.storage;
  const system = matchMedia('(prefers-color-scheme: dark)');

  function lectioPath(path) {
    return /^\/lectio\/\d+\//i.test(path) && !/login|logout|logud|auth|eksam|proeve/i.test(path.split('/').pop());
  }

  let parentRoot;
  if (embedded) {
    try {
      let ancestor = window.parent;
      while (blankDocument.test(ancestor.location.href) && ancestor !== ancestor.parent) ancestor = ancestor.parent;
      if (lectioPath(ancestor.location.pathname)) parentRoot = ancestor.document.documentElement;
    } catch {
      // A cross-origin Lectio frame can still use the saved theme.
    }
  }
  if (!root || !body || !(lectioPath(location.pathname) || (blankDocument.test(location.href) && parentRoot))) return;

  const elements = 'div, section, article, main, aside, header, footer, nav, dialog, form, fieldset, legend, details, summary, ul, ol, li, dl, dt, dd, table, thead, tbody, tfoot, tr, th, td, h1, h2, h3, h4, h5, h6, p, a, label, span, input, select, option, textarea, output, button, [role]';
  const excluded = '.lxp, script, style, svg, canvas, [contenteditable]:not([contenteditable="false"])';
  const surfaceAttribute = 'data-lxp-native-surface';
  const inkAttribute = 'data-lxp-native-ink';
  const menuBranch = '[role="menu"], [role="menuitem"], [role="tablist"], [aria-haspopup], [popover], .lec-context-menu, .lec-context-menu li, .ui-menu, .ui-menu-item, .ls-subnav1, .ls-subnav2';
  const pending = new Set();
  let preferences = appearance.defaults;
  let frame;

  function color(value) {
    const match = value.match(/^rgba?\(\s*(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)(?:[\s,\/]+([\d.]+))?\s*\)$/i);
    if (match) return { rgb: match.slice(1, 4).map(Number), alpha: Number(match[4] ?? 1) };

    const oklch = value.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+(-?[\d.]+|none)(?:deg)?(?:\s*\/\s*([\d.]+)(%?))?\s*\)$/i);
    if (!oklch) return null;
    // Convert Lectio's OKLCH values to sRGB for the contrast and status checks.
    const lightness = Number(oklch[1]) / (oklch[2] ? 100 : 1);
    const chroma = Number(oklch[3]);
    const hue = (oklch[4] === 'none' ? 0 : Number(oklch[4])) * Math.PI / 180;
    const a = chroma * Math.cos(hue);
    const b = chroma * Math.sin(hue);
    const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (lightness - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    const linear = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
    const rgb = linear.map((channel) => 255 * Math.min(1, Math.max(0,
      channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055)));
    return { rgb, alpha: Number(oklch[5] ?? 1) / (oklch[6] ? 100 : 1) };
  }

  function luminance(rgb) {
    const weights = [0.2126, 0.7152, 0.0722];
    return rgb.reduce((total, value, index) => {
      const channel = value / 255;
      return total + weights[index] * (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    }, 0);
  }

  function tone(rgb) {
    const [red, green, blue] = rgb;
    if (Math.max(...rgb) - Math.min(...rgb) < 24) return '';
    if (red >= green - 12 && red > blue + 24 && green > blue + 18) return 'warning';
    if (red > green + 18 && red > blue + 12) return 'danger';
    if (green > red + 14 && green > blue + 8) return 'success';
    return 'info';
  }

  function surface(style) {
    const background = color(style.backgroundColor);
    const image = style.backgroundImage || '';
    if (/gradient\(/i.test(image) && !/url\(/i.test(image)) {
      const stops = [...image.matchAll(/(?:rgba?|oklch)\([^()]*\)/gi)].map(([value]) => color(value));
      if (stops.some((stop) => stop && stop.alpha >= 0.5 && luminance(stop.rgb) > 0.48)) return 'gradient';
    }
    if (!background || background.alpha < 0.55) return '';
    const lightness = luminance(background.rgb);
    if (lightness < 0.35) return '';
    return tone(background.rgb) || (lightness > 0.84 ? 'surface' : 'subtle');
  }

  function ink(node, style) {
    const foreground = color(style.color);
    if (!foreground || foreground.alpha < 0.6 || luminance(foreground.rgb) >= 0.30) return '';
    if (node.matches('a[href], [role="link"]')) return 'link';
    const category = tone(foreground.rgb);
    return category && category !== 'info' ? category : 'text';
  }

  function scan() {
    frame = undefined;
    if (root.dataset.lxpMode !== 'dark' || !root.hasAttribute('data-lxp-native-theme')) {
      pending.clear();
      return;
    }
    const roots = [...pending].filter((node) => node.isConnected && !node.closest(excluded));
    pending.clear();
    const nodes = new Set();
    for (const node of roots) {
      if (node !== body && node.matches(elements)) nodes.add(node);
      for (const child of node.querySelectorAll(elements)) if (!child.closest(excluded)) nodes.add(child);
    }
    for (const node of nodes) {
      node.removeAttribute(surfaceAttribute);
      node.removeAttribute(inkAttribute);
    }
    const changes = [];
    for (const node of nodes) {
      const style = getComputedStyle(node);
      const background = surface(style);
      const foreground = ink(node, style);
      if (background || foreground) changes.push({ node, background, foreground });
    }
    for (const { node, background, foreground } of changes) {
      if (background) node.setAttribute(surfaceAttribute, background);
      if (foreground) node.setAttribute(inkAttribute, foreground);
    }
  }

  function queue(node = body) {
    if (root.dataset.lxpMode !== 'dark' || !root.hasAttribute('data-lxp-native-theme') || node.closest(excluded)) return;
    if (node === body || pending.size >= 32) {
      pending.clear();
      pending.add(body);
    } else if (![...pending].some((existing) => existing.contains(node))) {
      pending.add(node);
    }
    if (frame === undefined) frame = requestAnimationFrame(scan);
  }

  function flush() {
    if (frame !== undefined) cancelAnimationFrame(frame);
    scan();
  }

  function queueMenu(event) {
    const branch = event.target instanceof Element && event.target.closest(menuBranch);
    if (branch && !(event.relatedTarget instanceof Node && branch.contains(event.relatedTarget))) queue(branch);
  }

  function apply() {
    if (embedded || !body.classList.contains('lxp-enabled')) {
      const inherited = parentRoot?.dataset.lxpMode;
      appearance.apply(root, inherited ? { ...preferences, theme: inherited } : preferences, system.matches, preferences.enabled);
    }
    if (root.hasAttribute('data-lxp-native-theme') !== preferences.enabled) root.toggleAttribute('data-lxp-native-theme', preferences.enabled);
    queue();
    flush();
    api.applied = preferences.enabled;
  }

  async function start() {
    try {
      const boot = globalThis.lectioPlusBoot;
      preferences = appearance.normalize(boot ? await boot.preferences : await storage?.local.get(appearance.defaults));
    } catch {
      preferences = appearance.defaults;
    }
    apply();
    globalThis.lectioPlusBoot?.onPreferences?.(settings=>{preferences=appearance.normalize(settings);apply();});
    const observer = new MutationObserver((records) => {
      if(document.body&&body!==document.body){body=document.body;apply();}
      for (const record of records) {
        if (record.type === 'attributes') queue(record.target);
        else for (const node of record.addedNodes) if (node.nodeType === Node.ELEMENT_NODE) queue(node);
      }
      // Mutation observers run before paint: style new menus in this batch, not a later frame.
      flush();
    });
    observer.observe(document, { subtree: true, childList: true, attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'open', 'aria-hidden', 'aria-selected', 'aria-current', 'aria-expanded', 'current-page'] });
    new MutationObserver(() => {
      if (root.hasAttribute('data-lxp-native-theme') !== preferences.enabled) apply();
      else queue();
    }).observe(root, { attributes: true, attributeFilter: ['data-lxp-mode', 'data-lxp-design', 'data-lxp-native-theme'] });
    if (parentRoot) new MutationObserver(apply).observe(parentRoot, { attributes: true, attributeFilter: ['data-lxp-mode'] });
    for (const type of ['pointerover', 'pointerout', 'focusin', 'focusout']) document.addEventListener(type, queueMenu);
    document.addEventListener('toggle', queueMenu, true);
    system.addEventListener('change', apply);
    window.addEventListener('load', () => queue(), { once: true });
    window.addEventListener('resize', () => queue(), { passive: true });
    storage?.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      const next = { ...preferences };
      for (const key of Object.keys(appearance.defaults)) {
        if (changes[key]) next[key] = changes[key].newValue;
      }
      preferences = appearance.normalize(next);
      apply();
    });
  }

  const api = globalThis.lectioPlusNativeTheme = { applied: false, flush, ready: null };
  api.ready = start().catch(() => { /* Keep original controls usable if theming fails. */ })
    .finally(() => { if (embedded) globalThis.lectioPlusBoot?.finish(); });
})();
