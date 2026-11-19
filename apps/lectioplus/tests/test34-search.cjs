const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(root + '/extension/native-layout.js', 'utf8');
let checks = 0;
function ok(condition, label) { assert.ok(condition, label); checks++; console.log('PASS', label); }
const pause = () => new Promise(resolve => setTimeout(resolve, 100));
function setup(kind, html, route = 'FindSkema.aspx') {
  const dom = new JSDOM(`<form><main id="scope">${html}</main></form>`, {
    url: `https://www.lectio.dk/lectio/999999/${route}?type=${kind}`,
    runScripts: 'outside-only'
  });
  const w = dom.window, d = w.document;
  w.eval(source);
  const layout = w.lectioPlusNativeLayout(), scope = d.getElementById('scope');
  const update = () => layout.update(scope);
  update();
  const search = value => {
    const input = d.querySelector('.lxp-people-search input');
    input.value = value;
    input.dispatchEvent(new w.Event('input'));
  };
  return { dom, w, d, scope, layout, update, search };
}
function link(kind, id, name) {
  return `<a href="SkemaNy.aspx?type=${kind}&${kind === 'elev' ? 'elevid' : 'laererid'}=${id}">${name}</a>`;
}
const filtered = node => node.hasAttribute('data-lxp-person-filtered');
const list = kind => `<h1>${kind === 'elev' ? 'Elever' : 'Lærere'}</h1><nav>${link(kind, 'own', 'Mit skema')}</nav><div class="islandContent"><ul>
  <li id="anna">${link(kind, 'a', 'Anna Marie Jensen')}</li>
  <li id="soren">${link(kind, 's', 'Søren Møller')}</li>
  <li id="ase">${link(kind, 'o', 'Åse Østergaard')}</li>
  <li id="native-hidden" hidden>${link(kind, 'hidden', 'Skjult navn')}</li>
  <li id="other"><a href="FindSkema.aspx?type=stamklasse">Klasser</a></li>
  </ul></div>`;

(async () => {
  for (const kind of ['elev', 'laerer']) {
    const e = setup(kind, list(kind));
    const { w, d } = e;
    const input = d.querySelector('.lxp-people-search input');
    ok(input && !input.name && input.autocomplete === 'off', kind + ': local unnamed search field');
    ok(d.querySelector('[role=status]').textContent.startsWith('Viser 3 af 3'), kind + ': counts only available people');
    e.search('  JENSEN anna  ');
    ok(!filtered(d.getElementById('anna')) && filtered(d.getElementById('soren')), kind + ': case, spaces and unordered name parts');
    ok(!filtered(d.getElementById('other')) && !filtered(d.querySelector('nav a')), kind + ': navigation preserved');
    e.search('søren');
    ok(!filtered(d.getElementById('soren')) && filtered(d.getElementById('anna')), kind + ': Danish name');
    e.search('soren moll');
    ok(!filtered(d.getElementById('soren')) && filtered(d.getElementById('ase')), kind + ': partial and accent-tolerant name');
    e.search('A\u030ase');
    ok(!filtered(d.getElementById('ase')) && filtered(d.getElementById('anna')), kind + ': decomposed Unicode name');
    e.search('zzzz');
    ok(d.querySelector('[role=status]').textContent.includes('matcher din søgning'), kind + ': no-results message');
    const enter = new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    input.dispatchEvent(enter);
    ok(enter.defaultPrevented, kind + ': Enter cannot submit Lectio form');
    input.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    ok(input.value === '' && !d.querySelector('[data-lxp-person-filtered]'), kind + ': Escape restores all matches');
    e.search('anna');
    let clicks = 0;
    const original = d.querySelector('#anna a');
    original.addEventListener('click', event => { event.preventDefault(); clicks++; });
    original.click();
    ok(clicks === 1 && original.getAttribute('href').includes('id=a'), kind + ': original links and handlers preserved');
    e.update(); e.update();
    ok(d.querySelectorAll('.lxp-people-search').length === 1 && d.querySelector('.lxp-people-search input') === input && input.value === 'anna', kind + ': refresh retains field, focus target and query');
    d.querySelector('ul').insertAdjacentHTML('beforeend', `<li id="new">${link(kind, 'new', 'Anna Holm')}</li>`);
    e.update();
    ok(!filtered(d.getElementById('new')) && d.querySelector('[role=status]').textContent.startsWith('Viser 2 af 4'), kind + ': new AJAX rows use active search');
    const old = d.getElementById('soren'); old.remove(); e.update();
    ok(!filtered(old), kind + ': detached rows restored');
    d.querySelector('.lxp-people-search button').click();
    ok(input.value === '' && d.activeElement === input && d.getElementById('native-hidden').hidden, kind + ': clear restores focus and preserves native hiding');
    e.search('none'); e.layout.update(null);
    ok(!d.querySelector('.lxp-people-search, [data-lxp-person-filtered]'), kind + ': disable restores original content');
    e.dom.window.close();
  }
  const table = setup('elev', `<table><tr><th>Navn</th><th>Klasse</th></tr><tr id="a"><td>${link('elev', 'a', 'Anna Jensen')}</td><td>1.a</td></tr><tr id="b"><td>${link('elev', 'b', 'Bo Holm')}</td><td>2.b</td></tr></table>`);
  table.search('anna');
  ok(!filtered(table.d.getElementById('a')) && filtered(table.d.getElementById('b')) && !filtered(table.d.querySelector('th').parentElement), 'table: filter entire person row, preserve headers');
  table.dom.window.close();
  const grid = setup('laerer', `<table><tr id="grid"><td><ul><li id="a">${link('laerer', 'a', 'Anna Jensen')}</li></ul></td><td><ul><li id="b">${link('laerer', 'b', 'Bo Holm')}</li></ul></td></tr></table>`);
  grid.search('anna');
  ok(!filtered(grid.d.getElementById('grid')) && filtered(grid.d.getElementById('b')) && !filtered(grid.d.getElementById('a')), 'multi-column lists do not hide matching neighbours');
  grid.dom.window.close();
  const bare = setup('elev', `<div>${link('elev', 'a', 'Anna Jensen')}<br>${link('elev', 'b', 'Bo Holm')}</div>`);
  bare.search('anna');
  ok([...bare.d.querySelectorAll('a')].filter(filtered).length === 1, 'bare person links are supported');
  bare.dom.window.close();
  for (const [kind, route] of [['stamklasse', 'FindSkema.aspx'], ['elev', 'SkemaNy.aspx'], ['elev', 'login.aspx']]) {
    const e = setup(kind, list('elev'), route);
    ok(!e.d.querySelector('.lxp-people-search'), `unrelated route untouched: ${route}/${kind}`);
    e.dom.window.close();
  }

  const errors = [], vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(fs.readFileSync(root + '/preview/index.html', 'utf8'), {
    url: 'https://example.test/preview/index.html#school/students', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc
  });
  const w = dom.window, d = w.document;
  w.structuredClone = structuredClone;
  w.matchMedia = () => ({ matches: false, addEventListener() {} });
  w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {};
  w.HTMLCanvasElement.prototype.getContext = () => null;
  for (const tag of d.querySelectorAll('script[src]')) {
    w.eval(fs.readFileSync(path.resolve(root, 'preview', tag.getAttribute('src')), 'utf8'));
  }
  await pause();
  let input = d.querySelector('.lxp-people-search input');
  ok(input && input.getAttribute('aria-label') === 'Søg efter elevnavn', 'preview shell integrates student search');
  input.value = 'mikkel'; input.dispatchEvent(new w.Event('input'));
  await pause();
  ok(d.querySelector('.lxp-people-search [role=status]').textContent === 'Viser 1 af 6 elever', 'shell observer leaves active filtering intact');
  w.location.hash = '#school/teachers'; await pause();
  input = d.querySelector('.lxp-people-search input');
  ok(input.getAttribute('aria-label') === 'Søg efter lærernavn' && input.value === '', 'teacher search uses its own query');
  input.value = 'soren'; input.dispatchEvent(new w.Event('input'));
  ok(d.querySelector('.lxp-people-search [role=status]').textContent === 'Viser 1 af 6 lærere', 'preview teacher filtering');
  w.location.hash = '#school/students'; await pause();
  ok(d.querySelector('.lxp-people-search input').value === 'mikkel' && d.querySelectorAll('.lxp-people-search').length === 1, 'return navigation preserves student query without duplicate controls');
  w.location.hash = '#school'; await pause();
  ok(!d.querySelector('.lxp-people-search, [data-lxp-person-filtered]'), 'main menu restored after leaving people directory');
  ok(errors.length === 0, 'no runtime errors: ' + errors.join(', '));
  dom.window.close();
  console.log('TOTAL', checks, 'people-search checks');
})().catch(error => { console.error(error); process.exit(1); });
