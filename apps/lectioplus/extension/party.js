(() => {
  'use strict';

  // Festtilstand: a small confetti burst when a link or button is clicked. Styles live in party.css.
  // Only runs while <html> has data-lxp-party (set by appearance.js) and the system allows motion.
  const root = document.documentElement;
  const motionOk = matchMedia('(prefers-reduced-motion: no-preference)');
  const colors = ['#ff2bd6', '#ffb000', '#fff500', '#2bff88', '#2bd9ff', '#8a5cff'];
  const maxBits = 90;
  let alive = 0;

  document.addEventListener('click', (event) => {
    if (!root.hasAttribute('data-lxp-party') || !motionOk.matches || !(event.target instanceof Element)) return;
    // Not inside games: clicking fast there would bury the board in confetti.
    if (!event.target.closest('a, button, [role="button"], summary, label') || event.target.closest('.lxp-games, canvas')) return;
    const x = event.clientX, y = event.clientY;
    // Keyboard "clicks" have no pointer position.
    if (!x && !y) return;
    for (let i = 0; i < 14 && alive < maxBits; i++) {
      const bit = document.createElement('span');
      bit.className = 'lxp-party-bit';
      bit.setAttribute('aria-hidden', 'true');
      const angle = Math.random() * Math.PI * 2, distance = 40 + Math.random() * 70;
      bit.style.left = `${x - 4}px`;
      bit.style.top = `${y - 4}px`;
      bit.style.background = colors[i % colors.length];
      bit.style.setProperty('--lxp-dx', `${Math.cos(angle) * distance}px`);
      bit.style.setProperty('--lxp-dy', `${Math.sin(angle) * distance + 30}px`);
      bit.style.setProperty('--lxp-turn', `${Math.round(Math.random() * 720 - 360)}deg`);
      if (i % 3 === 0) bit.style.borderRadius = '50%';
      // A timer rather than animationend, so bits are removed even if the animation never runs.
      setTimeout(() => { bit.remove(); alive--; }, 1000);
      alive++;
      document.body.append(bit);
    }
  }, true);

  // Sparkle trail behind the cursor: at most one every 45 ms and 30 on screen, never over games.
  const sparkles = ['✨', '⭐', '💖', '🌟', '🎉', '🌈', '🦄'];
  let lastSparkle = 0, sparklesAlive = 0;
  document.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || !root.hasAttribute('data-lxp-party') || !motionOk.matches) return;
    const now = performance.now();
    if (now - lastSparkle < 45 || sparklesAlive >= 30) return;
    if (event.target instanceof Element && event.target.closest('.lxp-games, canvas, iframe')) return;
    lastSparkle = now;
    const sparkle = document.createElement('span');
    sparkle.className = 'lxp-party-sparkle';
    sparkle.setAttribute('aria-hidden', 'true');
    sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
    sparkle.style.left = `${event.clientX + 6}px`;
    sparkle.style.top = `${event.clientY + 6}px`;
    sparkle.style.setProperty('--lxp-dx', `${Math.round(Math.random() * 30 - 15)}px`);
    sparklesAlive++;
    document.body.append(sparkle);
    setTimeout(() => { sparkle.remove(); sparklesAlive--; }, 850);
  }, { passive: true });
})();
