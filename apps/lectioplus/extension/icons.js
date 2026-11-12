(() => {
  const paths = {
    mark: 'M4 5h6l2 3 2-3h6v13h-6l-2 2-2-2H4z M12 8v11',
    home: 'M3 10.5 12 3l9 7.5V20H15v-6H9v6H3z',
    calendar: 'M4 5h16v16H4z M8 3v4m8-4v4M4 10h16m-11 5h1m4 0h1m-6 3h1',
    file: 'M6 3h8l4 4v14H6z M14 3v5h4M9 12h6m-6 4h6',
    book: 'M3 5h5c2 0 4 1 4 3 0-2 2-3 4-3h5v14h-5c-2 0-3 1-4 2-1-1-2-2-4-2H3z M12 8v13',
    message: 'M20 5H4v12h4v4l5-4h7z M8 9h8m-8 4h5',
    chart: 'M4 4v16h16 M8 16v-4m5 4V8m5 8V5',
    user: 'M16 8a4 4 0 1 0-8 0 4 4 0 1 0 8 0 M4 20v-1c0-6 16-6 16 0v1',
    search: 'M16.5 10a6.5 6.5 0 1 0-13 0 6.5 6.5 0 1 0 13 0m-1.9 4.6L21 21',
    arrow: 'M4 12h15m-6-6 6 6-6 6',
    chevron: 'm9 5 7 7-7 7',
    left: 'm15 5-7 7 7 7',
    moon: 'M20.6 15.4A9 9 0 0 1 8.6 3.4a9 9 0 1 0 12 12z',
    sun: 'M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4m0-12.8L17 7M7 17l-1.4 1.4 M16 12a4 4 0 1 0-8 0 4 4 0 1 0 8 0',
    settings: 'M4 7h16M4 17h16M9 4v6m6 4v6',
    menu: 'M4 6h16M4 12h16M4 18h16',
    close: 'm6 6 12 12M18 6 6 18',
    clock: 'M21 12a9 9 0 1 0-18 0 9 9 0 1 0 18 0 M12 7v5l3 2',
    grid: 'M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z',
    external: 'M12 5H5v14h14v-7m-5-7h5v5m0-5-8 8',
    help: 'M21 12a9 9 0 1 0-18 0 9 9 0 1 0 18 0 M9.5 9a2.5 2.5 0 1 1 4.1 1.9c-1.1.9-1.6 1.4-1.6 2.6m0 3h.01'
  };

  function paint(canvas) {
    if (!canvas.isConnected) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, 48, 48);
    context.setTransform(2, 0, 0, 2, 0, 0);
    context.lineWidth = 1.65;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = getComputedStyle(canvas).color;
    context.stroke(new Path2D(paths[canvas.dataset.icon] || paths.grid));
    context.resetTransform();
  }

  globalThis.lectioPlusIcon = (name) => {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    canvas.className = 'lxp-icon';
    canvas.dataset.icon = name;
    canvas.setAttribute('aria-hidden', 'true');
    requestAnimationFrame(() => paint(canvas));
    return canvas;
  };
  globalThis.lectioPlusRepaintIcons = () => document.querySelectorAll('canvas.lxp-icon').forEach(paint);
})();
