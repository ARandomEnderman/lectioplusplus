(() => {
  'use strict';
  const tidy = text => (text || '').replace(/\s+/g, ' ').trim();
  function nameOf(text) {
    return tidy(text).replace(/^Lærer(?:en)?\s*[-:]\s*/i, '').replace(/\s*\([\wÆØÅæøå.-]{1,10}\)\s*$/, '').trim();
  }
  const keyOf = text => nameOf(text).normalize('NFC').toLocaleLowerCase('da');
  function schoolRoot(href) {
    const page = new URL(href), path = page.pathname.match(/^\/lectio\/\d+\//i);
    return page.protocol === 'https:' && /^(www\.)?lectio\.dk$/i.test(page.hostname) && path ? new URL(path[0], page.origin) : null;
  }
  function schoolUrl(raw, base, root) {
    if (!raw) return null;
    try {
      const url = new URL(raw, base);
      if (url.origin === root.origin && !url.username && !url.password && url.pathname.toLowerCase().startsWith(root.pathname.toLowerCase())) return url;
    } catch {}
    return null;
  }
  function photoIn(scope, base, root) {
    for (const img of scope.querySelectorAll('img[src], img[data-src]')) {
      for (const attr of ['data-src','src']) {
        const url = schoolUrl(img.getAttribute(attr), base, root);
        if (url && /\/getimage\.aspx$/i.test(url.pathname) && /^[1-9]\d*$/.test(url.searchParams.get('pictureid') || url.searchParams.get('pictureId'))) return url.href;
      }
    }
    return '';
  }
  function fragment(html) {
    const t = document.createElement('template'); t.innerHTML = html; return t.content;
  }
  function teachersIn(doc, base, root) {
    const found = new Map();
    function add(id, name, card, photo) {
      name = nameOf(name);
      if (!/^\d+$/.test(id) || !name || /^(?:mit skema|skema|lærer|vælg lærer)$/i.test(name)) return;
      const prev = found.get(id);
      found.set(id, {id, name:prev?.name || name, card:prev?.card || card || 'T'+id, photo:prev?.photo || photo || ''});
    }
    for (const a of doc.querySelectorAll('a[href]')) {
      if (a.closest('nav, header, [role=navigation], .ls-master-header-container, .ls-subnav1, .ls-subnav2')) continue;
      const url = schoolUrl(a.getAttribute('href'), base, root);
      if (!url || !/\/(?:skema|skemany)\.aspx$/i.test(url.pathname) || url.searchParams.has('elevid')) continue;
      const id = url.searchParams.get('laererid') || (url.searchParams.get('type')==='laerer' && url.searchParams.get('id'));
      if (!id || (url.searchParams.has('type') && url.searchParams.get('type').toLowerCase() !== 'laerer')) continue;
      const parent = a.closest('li, td');
      const row = parent && parent.querySelectorAll('a[href]').length === 1 ? parent : a;
      const marker = a.closest('[data-lectiocontextcard],[lectiocontextcard]') || row.querySelector('[data-lectiocontextcard],[lectiocontextcard]');
      const token = marker?.getAttribute('data-lectiocontextcard') || marker?.getAttribute('lectiocontextcard') || '';
      if (token && /^S\d+$/i.test(token)) continue;
      add(id, tidy(a.textContent) || a.title, /^(?:U\d+|T\d+)$/i.test(token) ? token : '', photoIn(row, base, root));
    }
    // The advanced schedule picker uses typed teacher IDs in its native selects.
    for (const opt of doc.querySelectorAll('select option[value]')) {
      const match = opt.value.match(/^T(\d+)$/i);
      if (match) add(match[1], opt.textContent, 'T'+match[1], '');
      else if (/^\d+$/.test(opt.value)) {
        const select=opt.closest('select'),section=select.closest('section,.island');
        const label=[select.id,select.name,select.getAttribute('aria-label'),section?.querySelector('.islandHeader,h2')?.textContent].join(' ');
        if(/lærer|laerer|teacher/i.test(label))add(opt.value,opt.textContent,'T'+opt.value,'');
      }
    }
    return [...found.values()];
  }
  function distinct(roster) {
    const seen = new Map(), ambiguous = new Set();
    for (const p of roster) {
      const key = keyOf(p.name), prior = seen.get(key);
      if (prior && p.id !== prior.id) ambiguous.add(key);
      else if (!prior || !prior.photo && p.photo) seen.set(key,p);
    }
    return [...seen].filter(([key])=>!ambiguous.has(key)).map(([,p])=>p);
  }
  class AccessError extends Error {}
  async function read(url, root, signal) {
    const response = await fetch(url.href, {credentials:'same-origin',mode:'same-origin',cache:'no-store',redirect:'follow',
      signal:AbortSignal.any([signal,AbortSignal.timeout(9000)])});
    if ([401,403].includes(response.status) || response.url && (!schoolUrl(response.url, root, root) || /login|adgangsfejl/i.test(new URL(response.url).pathname))) throw new AccessError('Log ind på Lectio, og åbn Gæt læreren igen.');
    if (!response.ok) return null;
    const doc = fragment(await response.text());
    if (doc.querySelector('input[type=password]')) throw new AccessError('Log ind på Lectio, og åbn Gæt læreren igen.');
    return {doc, base:response.url || url.href};
  }
  function shuffle(items) {
    const a = [...items];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }
  function loadPhoto(url,signal) {
    // Keep the decoded node for display, so choices appear with the actual photo.
    return new Promise((resolve,reject)=>{
      signal.throwIfAborted();
      const img=new Image(),timer=setTimeout(()=>end(null),6000);
      function end(value) {
        clearTimeout(timer);signal.removeEventListener('abort',cancel);img.onload=img.onerror=null;
        if(!value)img.removeAttribute('src');
        if(signal.aborted)reject(signal.reason);else resolve(value);
      }
      function cancel(){end(null);}
      signal.addEventListener('abort',cancel,{once:true});
      img.onload=()=>end(img.naturalWidth>1 && img.naturalHeight>1 ? img : null);
      img.onerror=()=>end(null);img.alt='Læreren du skal gætte';img.className='lxp-arc-photo';img.src=url;
    });
  }
  async function portrait(p,root,signal) {
    const tried=new Set();
    async function tryPhoto(url) {
      if(!url || tried.has(url))return null;
      tried.add(url);return loadPhoto(url,signal);
    }
    let image=await tryPhoto(p.photo);if(image)return image;
    const cardUrl=new URL('contextcard/contextcard.aspx',root);cardUrl.searchParams.set('lectiocontextcard',p.card);
    const card=await read(cardUrl,root,signal);
    if(card){
      const title=[...card.doc.querySelectorAll('span,strong,h1,h2')].map(n=>tidy(n.textContent)).find(t=>/^Lærer\s*[-:]/i.test(t));
      const teacherLinks=[...card.doc.querySelectorAll('a[href]')].map(a=>schoolUrl(a.getAttribute('href'),card.base,root)).filter(u=>u?.searchParams.has('laererid'));
      // If the response explicitly describes a different person, never use its picture.
      if(title && keyOf(title)===keyOf(p.name) &&
          !teacherLinks.some(u=>u.searchParams.get('laererid')!==p.id)){
        image=await tryPhoto(photoIn(card.doc,card.base,root));if(image)return image;
      }
    }
    const url=new URL('SkemaNy.aspx',root);url.searchParams.set('type','laerer');url.searchParams.set('laererid',p.id);
    const page=await read(url,root,signal);
    if(!page)return null;
    const header=page.doc.querySelector('.ls-master-pageheader') || page.doc.querySelector('[id$="HeaderContent_MainTitle"]')?.parentElement?.parentElement;
    const title=tidy(header?.querySelector('.maintitle,[id$="HeaderContent_MainTitle"]')?.textContent);
    const caption=title.replace(/^Læreren\s+/i,'').replace(/\s+[-–].*$/,'');
    if(!header || keyOf(caption)!==keyOf(p.name))return null;
    const thumb=header.querySelector('.thumber') || header.querySelector('img[id$="picctrlthumbimage"]')?.parentElement;
    return thumb?tryPhoto(photoIn(thumb,page.base,root)):null;
  }
  async function open(signal) {
    const root=schoolRoot(location.href);
    if(!root)throw Error('Åbn Gæt læreren på din skoles Lectio-side for at spille med skolens lærere.');
    let roster=[];
    for(const path of ['FindSkema.aspx?type=laerer','FindSkemaAdv.aspx']){
      const page=await read(new URL(path,root),root,signal);
      if(page)roster=distinct([...roster,...teachersIn(page.doc,page.base,root)]);
      if(roster.length>=4)break;
    }
    if(roster.length<4)throw Error('Lectio skal vise mindst fire forskellige lærernavne på din skole, før quizzen kan starte.');
    const candidates=shuffle(roster).sort((a,b)=>Number(Boolean(b.photo))-Number(Boolean(a.photo)));
    return {
      names:roster.map(p=>p.name),
      async next(){
        // Only resolve candidates needed for this question. A retry continues with new names.
        for(let i=0;i<8 && candidates.length;i++){
          signal.throwIfAborted();
          const p=candidates[0],image=await portrait(p,root,signal);
          candidates.shift();
          if(image)return {name:p.name,image,more:Boolean(candidates.length)};
        }
        return {more:Boolean(candidates.length)};
      }
    };
  }
  globalThis.lectioPlusTeacherDirectory={open};
})();
