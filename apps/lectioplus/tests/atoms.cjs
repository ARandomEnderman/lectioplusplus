const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
const extension=path.resolve(__dirname,'../extension');let checks=0;
const ok=(value,label)=>{assert.ok(value,label);checks++;console.log('PASS',label)};
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const dom=new JSDOM('<body></body>',{runScripts:'outside-only',virtualConsole:vc}),w=dom.window,d=w.document;
for(const name of ['school-math','school-elements','school-chemistry','school-visuals','school-special'])w.eval(fs.readFileSync(extension+'/'+name+'.js','utf8'));
const reference=JSON.parse(fs.readFileSync(__dirname+'/atom-reference.json','utf8'));
ok(w.lectioPlusAtomData.length===118&&w.lectioPlusAtomData.every((item,i)=>JSON.stringify(item)===JSON.stringify(reference.records[i])),'all 118 element records match the dated atomic reference snapshot');
for(const [z,a,n,shells] of [[1,1,0,[1]],[1,2,1,[1]],[6,12,6,[2,4]],[6,14,8,[2,4]],[8,16,8,[2,6]],[11,23,12,[2,8,1]],[17,35,18,[2,8,7]],[24,52,28,[2,8,13,1]],[29,63,34,[2,8,18,1]],[46,106,60,[2,8,18,18]],[103,262,159,[2,8,18,32,32,8,3]],[118,294,176,[2,8,18,32,32,18,8]]]){
 const m=w.lectioPlusAtomModel(z,a);ok(m.neutrons===n&&m.protons===z&&m.electrons===z&&JSON.stringify(m.shells)===JSON.stringify(shells),'isotope and shell reference Z='+z+', A='+a);
}
let isotopeCount=0;for(const row of reference.records){assert.ok(new Set(row.isotopes).size===row.isotopes.length&&row.isotopes.includes(row.defaultIsotope));for(const a of row.isotopes){const m=w.lectioPlusAtomModel(row.z,a);assert.equal(m.protons+m.neutrons,a);assert.equal(m.electrons,m.protons);assert.ok(m.neutrons>=0);isotopeCount++;}}
ok(isotopeCount===354,'all 354 isotope choices conserve mass number and neutral charge');
assert.throws(()=>w.lectioPlusAtomModel(6,12.5));assert.throws(()=>w.lectioPlusAtomModel(6,999));assert.throws(()=>w.lectioPlusAtomModel(0,1));checks++;
for(const element of w.lectioPlusElements){
 const row=w.lectioPlusAtomData.find(x=>x.z===element.z),view=w.lectioPlusAtomView(element,row.defaultIsotope);
 assert.equal(view.querySelectorAll('svg [data-particle=electron]').length,element.z);
 assert.equal(view.querySelectorAll('svg [data-particle=proton]').length,element.z);
 assert.equal(view.querySelectorAll('svg [data-particle=neutron]').length,row.defaultIsotope-element.z);
 assert.ok(!/NaN|Infinity/.test(view.outerHTML));assert.equal(view.querySelectorAll('.lxp-atom-legend [data-particle]').length,3);
 for(const shell of view.querySelectorAll('[data-shell]'))assert.equal(shell.querySelectorAll('[data-particle=electron]').length,Number(shell.dataset.count));
}
ok(true,'all 118 diagrams have exact particle counts, shell counts, legends and finite coordinates');
const heavy=w.lectioPlusAtomView(w.lectioPlusElements[117],294);ok(heavy.querySelector('.lxp-atom-notice')&&heavy.textContent.includes('ikke i målestok')&&heavy.textContent.includes('ikke elektronernes faktiske baner'),'heavy-element predictions and schematic limits are explicit');
const E=(tag,classes='',...children)=>{const node=d.createElement(tag);node.className=classes;node.append(...children);return node};
const B=(classes,label,action,...children)=>{const node=E('button',classes,...children);node.type='button';node.setAttribute('aria-label',label);node.addEventListener('click',action);return node};
function field(parent,options){const label=E('label','',options.label),input=E(options.type==='select'?'select':'input');input.setAttribute('aria-label',options.label);if(options.options)for(const [value,text] of options.options){const opt=E('option','',text);opt.value=value;input.append(opt);}input.value=options.value||'';label.append(input);parent.append(label);return input;}
let visuals=true;
const tool=w.lectioPlusSchoolSpecial('periodic',{E,B,field,prefs:()=>({visuals}),showResult:(node,result)=>{node.replaceChildren(...result.rows.map(([label,value])=>E('p','',label+': '+value)))}});d.body.append(tool.node);
tool.node.querySelector('[data-search^="6 c "]').click();let isotope=tool.node.querySelector('[aria-label="Vælg isotop"]');
ok(isotope.value==='12'&&tool.node.querySelector('[data-count-kind=neutron]').dataset.count==='6','selecting carbon chooses a referenced isotope and updates its model');
isotope.value='14';isotope.dispatchEvent(new w.Event('change'));
ok(tool.node.querySelector('[data-count-kind=neutron]').dataset.count==='8'&&tool.node.querySelector('[data-count-kind=proton]').dataset.count==='6'&&tool.node.querySelector('[data-count-kind=electron]').dataset.count==='6','isotope selection changes neutrons without changing neutral protons or electrons');
tool.node.querySelector('[data-search^="8 o "]').click();tool.node.querySelector('[data-search^="6 c "]').click();ok(tool.node.querySelector('[aria-label="Vælg isotop"]').value==='14','chosen isotope is retained when switching elements');
visuals=false;tool.refresh();ok(!tool.node.querySelector('.lxp-atom-diagram')&&tool.node.querySelector('[data-count-kind=neutron]').dataset.count==='8','visual preference hides drawings while retaining exact counts');
visuals=true;tool.refresh();ok(tool.node.querySelector('.lxp-atom-diagram')&&tool.node.querySelectorAll('.lxp-atom-swatch').length===3,'atom view and labelled colours return when enabled');
const css=require('rrweb-cssom').parse(fs.readFileSync(extension+'/school-tools.css','utf8'));
const colors=['proton','neutron','electron'].map(kind=>[...css.cssRules].find(rule=>rule.selectorText===`.lxp-atom-view [data-particle="${kind}"]`).style.fill);
ok(new Set(colors).size===3,'protons, neutrons and electrons use three distinct fixed colours');
ok(!errors.length,'periodic-table atom interactions have no DOM errors');dom.window.close();console.log('TOTAL',checks,'atomic model and isotope checks');
