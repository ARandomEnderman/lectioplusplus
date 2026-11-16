(() => {
  'use strict';
  if (window !== window.top || globalThis.lectioPlusTab) return;
  let originalIcons = null;
  let icon;
  let brandedTitle;
  let currentHead;
  const headObserver=new MutationObserver(records=>{if(originalIcons===null)return;if(currentHead!==document.head||records.some(record=>document.head?.contains(record.target)||record.target===document.documentElement)){ensureHead();updateIcon();}});
  const initialTitle = globalThis.lectioPlusPrivacy?.getOriginalTitle() ?? document.title;
  const themeObserver = new MutationObserver(updateIcon);

  function ensureHead(){
    if(originalIcons===null||!document.head)return;
    if(currentHead!==document.head){currentHead=document.head;originalIcons=[];}
    for(const node of document.head.querySelectorAll('link[rel~="icon"]'))if(node!==icon){
      if(!originalIcons.some(saved=>saved.node===node))originalIcons.push({node,next:node.nextSibling});node.remove();
    }
    if(!icon?.isConnected){if(!icon){icon=document.createElement('link');icon.rel='icon';icon.type='image/svg+xml';icon.sizes='any';}document.head.append(icon);}
    const title = globalThis.lectioPlusPrivacy?.displayText(brandedTitle) ?? brandedTitle;
    if(title&&document.title!==title)document.title=title;
  }

  function updateIcon() {
    if (originalIcons === null || !icon) return;
    const style = getComputedStyle(document.documentElement);
    // Use the same tokens as the sidebar logo; do not duplicate the palette.
    const color = (name, fallback) => {
      const value = style.getPropertyValue(name).trim();
      return /^#[0-9a-f]{3,8}$/i.test(value) ? value : fallback;
    };
    const background = color('--lxp-design-mark', '#5a58d0');
    const foreground = color('--lxp-on-mark', '#ffffff');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect x="4" y="4" width="120" height="120" rx="30" fill="${background}"/><path d="M32 36h20l12 12 12-12h20v52H76L64 98 52 88H32z M64 48v50" fill="none" stroke="${foreground}" stroke-width="7" stroke-linejoin="round"/></svg>`;
    const href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    if (icon.getAttribute('href') !== href) icon.setAttribute('href', href);
  }

  function apply(label, enabled, originalTitle = initialTitle) {
    if (!enabled) {
      if (originalIcons === null) return;
      themeObserver.disconnect();
      headObserver.disconnect();
      brandedTitle=undefined;
      icon?.remove();
      for (const { node, next } of originalIcons) {
        if (!node.isConnected) document.head.insertBefore(node, next?.parentNode === document.head ? next : null);
      }
      originalIcons = null;
      document.title = originalTitle;
      return;
    }
    if (!document.head) return;
    brandedTitle=label?`${label} · LectioPlus+`:'LectioPlus+';
    if (originalIcons === null) {
      currentHead=document.head;
      originalIcons = [...document.head.querySelectorAll('link[rel~="icon"]')]
        .map(node => ({ node, next: node.nextSibling }));
      originalIcons.forEach(({ node }) => node.remove());
      icon = document.createElement('link');
      icon.rel = 'icon';
      icon.type = 'image/svg+xml';
      icon.sizes = 'any';
      document.head.append(icon);
      themeObserver.observe(document.documentElement, {
        attributes: true, attributeFilter: ['data-lxp-design', 'data-lxp-mode']
      });
    }
    ensureHead();
    headObserver.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['href','rel']});
    updateIcon();
    const title = globalThis.lectioPlusPrivacy?.displayText(brandedTitle) ?? brandedTitle;
    if (document.title !== title) document.title = title;
  }

  globalThis.lectioPlusTab = { apply, refreshTitle: ensureHead };
})();
