const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom'),path=require('node:path');
const root=path.resolve(__dirname,'../extension'),dom=new JSDOM('<body></body>',{runScripts:'outside-only'}),w=dom.window;let checks=0;
for(const file of ['school-math','school-elements','school-chemistry','school-lab-core','school-writing','translation','school-catalog','school-visuals'])w.eval(fs.readFileSync(root+'/'+file+'.js','utf8'));
const T=w.lectioPlusSchoolCatalog.tools,C=w.lectioPlusChemistry;
function ok(value,label){assert.ok(value,label);checks++;console.log('PASS',label)}
function calculate(id,patch={}){const tool=T.find(t=>t.id===id);return tool.calculate({...Object.fromEntries(tool.fields.map(f=>[f.id,f.value])),...patch},{angle:'deg'});}
function render(id,patch={}){const r=calculate(id,patch);return w.lectioPlusSchoolVisual(r.visual);}
for(const tool of T.filter(t=>t.calculate&&t.id!=='calculator')){
 const node=render(tool.id);ok(node?.querySelector('figcaption')&&node.dataset.visual===tool.id,'visual result for '+tool.id);
 ok(!/NaN|Infinity|undefined/.test(node.outerHTML),'finite visual coordinates and labels for '+tool.id);
 if(node.querySelector('svg'))ok(node.querySelector('svg[role=img][aria-label] title'),'accessible diagram: '+tool.id);
}
const triangle=calculate('triangle',{mode:'hypotenuse',a:3,c:5});ok(triangle.rows[1][1]===4&&triangle.visual.v.b===4,'hypotenuse mode computes missing katete for both result and diagram');
const angled=calculate('triangle',{mode:'angle',a:5,angle:30});ok(Math.abs(angled.rows[2][1]-10)<1e-10,'angle mode computes hypotenuse 10 from opposite side 5 at 30 degrees');
assert.throws(()=>calculate('triangle',{mode:'hypotenuse',a:5,c:4}));checks++;assert.throws(()=>calculate('triangle',{mode:'angle',angle:90}));checks++;
const vector=calculate('vectors',{ax:3,ay:0,bx:0,by:4});ok(vector.rows[0][1]===3&&vector.rows[1][1]===4&&vector.rows[4][1]===0&&vector.rows[5][1]===90,'perpendicular vector lengths, dot product and angle');
const opposite=calculate('vectors',{ax:1,ay:1,bx:-2,by:-2});ok(opposite.rows[5][1]===180,'opposite vectors form 180 degrees');
ok(typeof calculate('vectors',{ax:0,ay:0}).rows[5][1]==='string','zero vector does not invent an angle');
for(const ref of C.compounds){const r=C.lookup(ref.formula);ok(r.formula===ref.formula&&r.name===ref.name,'reverse ion lookup '+ref.formula);}
assert.throws(()=>C.lookup('H2O'));checks++;assert.throws(()=>C.lookup('Na2Cl2'));checks++;
const ions=calculate('ions',{positive:'6',negative:'23',sampleMass:'110.978'});ok(Math.abs(ions.rows[5][1]-1)<1e-12&&Math.abs(ions.rows[7][1]-2)<1e-12,'one mole of calcium chloride gives formal one-to-two ion amounts');
ok(calculate('ions').rows.length===5,'optional empty mass does not produce fictional sample quantities');
const diagram=render('ionlookup',{formula:'CaCl2'});ok(diagram.querySelectorAll('rect').length===3,'CaCl2 illustration has one calcium and two chloride ions');
const rect=render('geometry',{shape:'rectangle',a:8,b:2}).querySelector('rect');ok(Number(rect.getAttribute('width'))/Number(rect.getAttribute('height'))===4,'rectangle preserves input aspect ratio');
const sphere=render('geometry',{shape:'sphere',a:0});ok(sphere.querySelector('circle').getAttribute('r')==='0'&&sphere.querySelector('ellipse').getAttribute('rx')==='0','zero radius does not show a nonzero sphere');
const acidity=render('ph',{type:'acid',c:0});ok(acidity.textContent.includes('pH ≈ 7'),'pH visual agrees with neutral-water result');
ok(render('percent',{mode:'change',a:100,b:200}).querySelectorAll('.lxp-visual-bar-fill')[0].style.width==='50%','percentage bars share a truthful common scale');
const curve=render('decay',{start:100,half:10,time:30});ok(curve.querySelector('path').getAttribute('d').includes('L'),'decay curve draws actual model samples');
const probability=render('probability',{n:3,k:2,p:0.5});ok(probability.querySelectorAll('rect').length===4&&probability.querySelectorAll('.lxp-probability-selected').length===1,'binomial plot represents each discrete outcome and highlights k');
const css=require('rrweb-cssom').parse(fs.readFileSync(root+'/school-tools.css','utf8'));ok(css.cssRules.length>0,'updated tool layout CSS parses');
ok(w.lectioPlusSchoolVisual({type:'calculator',v:{}})===null,'no arbitrary diagram is invented for an unstructured scientific expression');
dom.window.close();console.log('TOTAL',checks,'visual and expanded tool checks');
