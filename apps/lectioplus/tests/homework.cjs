const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const extension=path.resolve(__dirname,'../extension');let checks=0;
const ok=(value,label)=>{assert.ok(value,label);checks++;console.log('PASS',label)};
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));
const dom=new JSDOM(`<!doctype html><html><body><div class="lxp" id="view"></div><main id="source"><table><thead><tr><th>Dato</th><th>Hold</th><th>Aktivitet</th><th>Lektier</th><th>Lokale</th></tr></thead><tbody>
<tr id="first"><td rowspan="2"><time datetime="2026-11-16">Mandag 16/11</time></td><td rowspan="2">Fag Demo</td><td><a href="/lectio/999999/aktivitet.aspx?absid=fake1">Vækstmodeller</a></td><td><p>Læs <strong>side 34–40</strong>.</p><p>Medbring dine spørgsmål.</p><ol><li>Forklar modellen.</li><li>Regn eksemplet.</li></ol><p><a id="file" href="/lectio/999999/dokument.aspx?id=fake">Noter</a> og <a href="https://example.test/materiale">Ekstern kilde</a></p><a id="postback" href="#" onclick="return false">Åbn filmenu</a><img alt="Diagram i materialet" src="/fixture.png"></td><td>A1</td></tr>
<tr id="second"><td><a href="/lectio/999999/aktivitet.aspx?absid=fake2">Forberedelse</a></td><td><p>En anden lektie med samme fag og dato.</p><a href="javascript:alert(1)">Ugyldigt link</a><a href="https://name:password@example.test/">Ugyldig adresse</a><script>window.shouldNotRun=true</script></td><td>A2</td></tr>
<tr id="third"><td><time datetime="2026-11-17">Tirsdag 17/11</time></td><td>Andet fag</td><td>Repetition</td><td>Langt ord: ${'matematik'.repeat(35)}</td><td>B1</td></tr>
</tbody></table></main></body></html>`,{url:'https://www.lectio.dk/lectio/999999/Material_Lektieoversigt.aspx',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
const w=dom.window,d=w.document;w.structuredClone=structuredClone;
for(const name of ['appearance','privacy','icons','lectio-data','workspace'])w.eval(fs.readFileSync(extension+'/'+name+'.js','utf8'));
const element=(tag,classes='',...children)=>{const node=d.createElement(tag);node.className=classes;node.append(...children);return node};
const button=(classes,label,action,...children)=>{const node=element('button',classes,...children);node.type='button';node.setAttribute('aria-label',label);node.addEventListener('click',action);return node};
const anchor=(classes,href,...children)=>{const node=element('a',classes,...children);node.href=href;return node};
const delegated=[];
const workspace=w.lectioPlusWorkspace({ui:{element,button,anchor,icon:w.lectioPlusIcon},data:w.lectioPlusData,narrow:{matches:false},safeHref:link=>{try{const url=new URL(link.getAttribute('href'),w.location.href);return url.origin===w.location.origin?url.href:null}catch{return null}},revealOriginal:(...args)=>delegated.push(args)});
d.getElementById('view').append(workspace.node);const source=d.getElementById('source');
let model=w.lectioPlusData.tableView(source,'homework');
ok(model.rows.length===3,'homework retains all rows with shared date and subject cells');
ok(model.rows[1].subject==='Fag Demo'&&model.rows[1].due==='2026-11-16','rowspans inherit the correct subject and date');
ok(model.rows[0].activityTitle==='Vækstmodeller'&&model.rows[0].contentCell.tagName==='TD','activity heading is separate from homework body');
workspace.update(source,'homework','2026-11-16');
const stage=workspace.node;let cards=stage.querySelectorAll('.lxp-homework-card');
ok(cards.length===3&&stage.classList.contains('lxp-homework-workspace'),'homework has its own card layout');
ok(cards[0].querySelector('h2').textContent==='Fag Demo'&&cards[0].querySelector('time').dateTime==='2026-11-16','subject and date have separate readable fields');
ok(cards[0].querySelectorAll('.lxp-homework-content p:not(.lxp-homework-media)').length===3&&cards[0].querySelectorAll('ol li').length===2,'paragraphs and numbered preparation steps remain separate');
ok(cards[0].querySelector('.lxp-homework-activity').href.includes('absid=fake1'),'activity link keeps the original target');
ok(cards[0].querySelector('a.lxp-homework-link').href.endsWith('dokument.aspx?id=fake'),'material link remains individually usable');
const external=cards[0].querySelector('a[href="https://example.test/materiale"]');ok(external.target==='_blank'&&external.rel==='noopener noreferrer','external material opens safely in its own tab');
cards[0].querySelector('button.lxp-homework-link').click();ok(delegated[0][0]===d.getElementById('postback')&&delegated[0][1]===true,'Lectio file-menu action delegates to the real control');
ok(!cards[0].querySelector('img')&&cards[0].textContent.includes('Diagram i materialet')&&cards[0].querySelector('.lxp-homework-original'),'embedded content has an explicit original-view action');
ok(cards[1].textContent.includes('Ugyldigt link')&&!cards[1].querySelector('a[href^="javascript:"],a[href*="name:password"],script,[onclick]')&&!w.shouldNotRun,'unsafe addresses and source scripts are never cloned into homework cards');
ok(cards[0].querySelector('details dd').textContent==='A1','additional source columns remain accessible');
const search=stage.querySelector('[aria-label="Søg i lektier"]');search.value='fag demo';search.dispatchEvent(new w.Event('input'));
ok(stage.querySelectorAll('.lxp-homework-card').length===2,'search includes inherited subject cells');
stage.querySelector('[aria-label="Ryd filtre"]').click();const sort=stage.querySelector('[aria-label="Sortér lektier"]');sort.value='later';sort.dispatchEvent(new w.Event('change'));
ok(stage.querySelector('.lxp-homework-card h2').textContent==='Andet fag','homework can sort by actual dates');
d.getElementById('file').href='/lectio/999999/dokument.aspx?id=updated';workspace.update(source,'homework','2026-11-16');
ok(stage.querySelector('a[href$="id=updated"]'),'material target changes update without stale links');
const simple=d.createElement('section');simple.innerHTML='<table><thead><tr><th>Fag</th><th>Lektie</th><th>Til</th></tr></thead><tbody><tr><td>Fiktivt fag</td><td><p>Læs kapitel 2.</p><p>Skriv noter.</p></td><td>Fredag</td></tr></tbody></table>';workspace.update(simple,'homework','2026-11-16');
ok(stage.querySelector('h2').textContent==='Fiktivt fag'&&stage.querySelectorAll('.lxp-homework-content p').length===2&&!stage.querySelector('.lxp-homework-activity'),'simple homework does not turn the full description into a giant heading');
// Reproduce ligature text leaking into lesson labels using fictional data only.
const activity=source.querySelector('#first td:nth-child(3) a');
activity.innerHTML='<span class="ls-fonticon">sms</span><span class="ls-fonticon">bookmark</span>1. modul – Fiktivt fag';
const material=d.getElementById('file');material.innerHTML='<i class="material-icons">bookmark</i>Materiale om sms og bookmark';
const body=source.querySelector('#first td:nth-child(4)');body.insertAdjacentHTML('beforeend','<p><i class="material-symbols-outlined">sms</i>Læs om sms og bookmark.</p>');
const originalMarkup=source.innerHTML;
model=w.lectioPlusData.tableView(source,'homework');
ok(model.rows[0].activityTitle==='1. modul – Fiktivt fag','icon ligatures are excluded from activity titles');
ok(model.rows[0].title==='1. modul – Fiktivt fag','title used for search excludes icon ligatures');
workspace.update(source,'homework','2026-11-16');
const repaired=stage.querySelector('[data-lxp-source-id="first"]');
ok(repaired.querySelector('.lxp-homework-activity strong').textContent==='1. modul – Fiktivt fag','rendered homework title has no smsbookmark prefix');
ok(!/(?:sms|bookmark)/.test(repaired.querySelector('.lxp-homework-activity').getAttribute('aria-label')||repaired.querySelector('.lxp-homework-activity').textContent),'accessible activity label excludes glyph names');
ok(repaired.querySelector('a[href$="id=updated"]').textContent==='Materiale om sms og bookmark','link labels remove icons while preserving actual words');
ok(repaired.querySelector('.lxp-homework-content').textContent.includes('Læs om sms og bookmark.')&&!repaired.querySelector('.lxp-homework-content').textContent.includes('smsLæs'),'body omits icon nodes but retains literal text');
ok(source.innerHTML===originalMarkup,'icon cleanup does not mutate original Lectio nodes or actions');
for(const cls of ['ls-fonticon','material-icons','material-icons-outlined','material-icons-round','material-icons-sharp','material-icons-two-tone','material-symbols-outlined','material-symbols-rounded','material-symbols-sharp']){
 const label=d.createElement('span');label.innerHTML='<span class="'+cls+'">bookmark</span>Læs <strong>kapitel</strong> om smsbookmark';
 ok(w.lectioPlusData.readableText(label)==='Læs kapitel om smsbookmark','icon font family is omitted without string replacement: '+cls);
}
const hidden=d.createElement('span');hidden.innerHTML='<span hidden>bookmark</span><span aria-hidden="true">sms</span>Aktivitet';
ok(w.lectioPlusData.readableText(hidden)==='Aktivitet','hidden decorative text stays out of labels');
activity.querySelector('.ls-fonticon').textContent='chat';workspace.update(source,'homework','2026-11-16');
ok(stage.querySelector('[data-lxp-source-id="first"] .lxp-homework-activity strong').textContent==='1. modul – Fiktivt fag','dynamic icon updates do not reintroduce glyph text');
const css=require('rrweb-cssom').parse(fs.readFileSync(extension+'/workspace.css','utf8'));
ok([...css.cssRules].some(rule=>rule.selectorText==='.lxp-homework-content'&&rule.style['overflow-wrap']==='anywhere'),'long strings wrap inside homework content');
ok(!errors.length,'homework parsing and interactions have no runtime errors');
dom.window.close();console.log('TOTAL',checks,'homework layout and content checks');
