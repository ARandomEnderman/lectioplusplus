(() => {
  'use strict';

  globalThis.lectioPlusHints = () => {
    const hint = document.createElement('div');
    hint.id = 'lxp-tooltip';
    hint.className = 'lxp lxp-tooltip';
    hint.setAttribute('role', 'tooltip');
    hint.hidden = true;
    document.body.append(hint);
    let target;
    let timer;

    function hide() {
      clearTimeout(timer);
      if (target) {
        const descriptions = (target.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id && id !== hint.id);
        if (descriptions.length) target.setAttribute('aria-describedby', descriptions.join(' '));
        else target.removeAttribute('aria-describedby');
      }
      target = undefined;
      hint.hidden = true;
    }

    function show() {
      if (!target?.isConnected || !document.body.classList.contains('lxp-enabled')) return hide();
      const text = target.dataset.lxpHint;
      if (!text || !target.getClientRects().length) return hide();
      const container = target.closest('dialog[open]') || document.body;
      if (hint.parentElement !== container) container.append(hint);
      hint.textContent = text;
      hint.hidden = false;
      const anchor = target.getBoundingClientRect();
      const width = hint.offsetWidth;
      const height = hint.offsetHeight;
      const left = Math.max(8, Math.min(window.innerWidth - width - 8, anchor.left + (anchor.width - width) / 2));
      const top = anchor.bottom + height + 15 <= window.innerHeight ? anchor.bottom + 8 : Math.max(8, anchor.top - height - 8);
      hint.style.left = `${left}px`;
      hint.style.top = `${top}px`;
      if (target.getAttribute('aria-label') !== text) {
        const descriptions = new Set((target.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
        descriptions.add(hint.id);
        target.setAttribute('aria-describedby', [...descriptions].join(' '));
      }
    }

    function track(event, keyboard = false) {
      const next = event.target instanceof Element && event.target.closest('[data-lxp-hint]');
      if (!next || (!keyboard && event.pointerType === 'touch')) return;
      if (target === next && !keyboard) return;
      hide();
      target = next;
      if (keyboard) show();
      else timer = setTimeout(show, 320);
    }

    function leave(event) {
      if (target?.contains(event.target) && !(event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) hide();
    }

    document.addEventListener('pointerover', track);
    document.addEventListener('pointerout', leave);
    document.addEventListener('focusin', (event) => track(event, true));
    document.addEventListener('focusout', leave);
    document.addEventListener('pointerdown', hide);
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') hide(); });
    window.addEventListener('scroll', hide, { capture: true, passive: true });
    window.addEventListener('resize', hide, { passive: true });
    return hide;
  };
})();
