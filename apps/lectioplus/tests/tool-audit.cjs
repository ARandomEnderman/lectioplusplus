// Independent numerical examples, source snapshots, invalid domains and UI-engine boundaries.
const assert=require('node:assert/strict');
for(const file of ['school-math','school-elements','school-chemistry','school-lab-core','school-writing','translation','school-catalog'])require('../extension/'+file+'.js');
const M=lectioPlusMath,C=lectioPlusChemistry,T=lectioPlusSchoolCatalog.tools;let checks=0;
function ok(test,label){assert.ok(test,label);checks++;console.log('PASS',label)}
const near=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<=2e-10*Math.max(Math.abs(b),1e-100);
function run(id,changes={}){const t=T.find(t=>t.id===id);return t.calculate({...Object.fromEntries(t.fields.map(f=>[f.id,f.value])),...changes},{angle:'deg'});}
function numbers(id,inputs,expected){const rows=run(id,inputs).rows.filter(([,v])=>typeof v==='number').map(([,v])=>v);ok(rows.length===expected.length&&rows.every((v,i)=>near(v,expected[i])),id+' independent result '+JSON.stringify(inputs));}
for(const [id,inputs,expected] of [
 ['calculator',{expression:'(12+8)/5'},[4]],['quadratic',{a:1,b:-3,c:-10},[-2,5]],['quadratic',{a:1,b:-2,c:5},[1,2]],['system',{a:3,b:2,c:16,d:1,e:-1,f:2},[4,2]],
 ['fractions',{a:100,b:-250},[-0.4]],['percent',{mode:'part',a:240,b:12.5},[30]],['percent',{mode:'new',a:240,b:-12.5},[210]],['percent',{mode:'change',a:80,b:100},[25]],
 ['interest',{start:200,rate:10,periods:2},[242,42]],['interest',{start:200,rate:-100,periods:0},[200,0]],
 ['statistics',{data:'1;2;3;4'},[4,10,2.5,2.5,1,4,1.5,3.5,1.118033988749895,1.290994448735806]],['regression',{xs:'1;2;3',ys:'2;4;4'},[1,4/3,0.75]],
 ['probability',{n:3,k:2,p:0.5},[37.5,87.5,1.5,0.8660254037844386]],
 ['geometry',{shape:'circle',a:2,b:''},[12.566370614359172,12.566370614359172]],['geometry',{shape:'rectangle',a:3,b:7},[21,20]],['geometry',{shape:'triangle',a:10,b:6},[30]],['geometry',{shape:'cylinder',a:2,b:5},[62.83185307179586,87.96459430051421]],['geometry',{shape:'sphere',a:3,b:'ignored'},[113.09733552923255,113.09733552923255]],['triangle',{a:3,b:4},[3,4,5,6,36.86989764584402,53.13010235415598]],
 ['molar',{formula:'SO4',charge:-2},[96.056,5,48,50]],['moles',{formula:'H2O',mode:'mass',value:36.03},[18.015,2,36.03,1.204428152e24]],['moles',{formula:'H2O',mode:'moles',value:2},[18.015,2,36.03,1.204428152e24]],['concentration',{formula:'NaCl',mass:5.844,volume:2},[0.1,0.05,2.922]],['dilution',{c1:2,c2:0.1,v2:250},[12.5,250,237.5]],
 ['ph',{type:'acid',c:0},[7,7,1e-7]],['ph',{type:'acid',c:0.001},[2.9999999956570553,11.000000004342944,0.00100000001]],['ph',{type:'base',c:0.001},[11.000000004342944,2.9999999956570553,9.9999999e-12]],
 ['motion',{v0:10,a:-2,t:5},[0,25]],['force',{mode:'force',m:4,a:-3},[-12]],['force',{mode:'pressure',force:100,area:0.2,m:'',a:''},[500]],['energy',{m:2,v:3,h:5,g:10},[9,100,109]],['ohm',{u:230,r:46,t:2},[5,1150,2.3]],['waves',{speed:340,frequency:170},[2,1/170]],['gas',{n:1,t:0,v:22.41396954501414},[101325,1.01325]],['decay',{start:80,half:5,time:15},[10,12.5]]
])numbers(id,inputs,expected);
for(const [id,input] of [['calculator',{expression:'x+1'}],['percent',{mode:'change',a:0}],['percent',{mode:'change',a:-5}],['interest',{rate:-101}],['interest',{periods:-1}],['probability',{n:4,k:5}],['probability',{p:1.1}],['geometry',{shape:'unknown'}],['geometry',{a:-1}],['triangle',{a:0}],['molar',{charge:0.5}],['moles',{value:-1}],['concentration',{volume:0}],['dilution',{c2:2,c1:1}],['ph',{c:0.2}],['ph',{type:'weak'}],['motion',{t:-1}],['force',{mode:'pressure',area:0}],['energy',{m:-1}],['ohm',{r:0}],['waves',{frequency:0}],['gas',{t:-273.15}],['decay',{half:0}]]){assert.throws(()=>run(id,input));checks++;}
// Every generic numeric/select field reaches the same validation path used in the UI.
for(const t of T.filter(t=>t.calculate))for(const f of (t.fieldsFor?.(Object.fromEntries(t.fields.map(f=>[f.id,f.value])))||t.fields).filter(f=>!f.hidden)){if(f.type==='number'){assert.throws(()=>run(t.id,{[f.id]:'NaN'}));checks++;}if(f.type==='select'){assert.throws(()=>run(t.id,{[f.id]:'unknown'}));checks++;}}
for(const text of ['sqrt(-1)^0','(1/0)^0','0^0','1e-999','1e-250*1e-250']){assert.throws(()=>M.expression(text));checks++;}
assert.throws(()=>M.compile('sqrt(-x)+unknown(1)'));checks++;
ok(M.compile('sqrt(x)')(4)===2,'graph compiles once and evaluates valid domain');
ok(M.system(0.1,0.2,0.3,0.3,0.6,0.9).kind==='all','decimal proportional equations do not invent huge roots');
ok(M.system(0.1,0.2,0.3,0.3,0.6,1).kind==='none','decimal inconsistent equations identified');
for(const scale of [1e150,1e-150])ok(M.quadratic(scale,-5*scale,6*scale).roots.every((r,i)=>near(r,[2,3][i])),'quadratic survives coefficient scale '+scale);
ok(M.regression([1,2,3],[4,4,4]).r2===null,'constant response has no invented R²');
ok(M.convert(-459.67,'temperature','°F','K')===0,'Fahrenheit absolute zero is accepted exactly');
for(const [category,from,to,value,expected] of [['length','km','cm',2,200000],['mass','t','g',2,2000000],['time','døgn','min',2,2880],['area','ha','m²',2,20000],['volume','m³','mL',2,2000000],['speed','m/s','km/t',10,36],['pressure','atm','Pa',1,101325],['energy','kWh','J',1,3600000],['temperature','°C','°F',100,212]])ok(near(M.convert(value,category,from,to),expected),'unit reference '+category);
for(const [keys,expected] of [['2+3*4=','20'],['200+10%=','220'],['200-10%=','180'],['200*10%=','20'],['200/10%=','2000'],['2+3===','11'],['0,1+0,2=','0,3'],['2+-3=','-1']]){const calc=M.classic();for(const key of keys)calc.press(key);ok(calc.state().display===expected,'classic calculator '+keys);}
const calc=M.classic();'8/0='.split('').forEach(k=>calc.press(k));ok(!!calc.state().error,'classic division by zero is an error');calc.press('C');calc.press('9');calc.press('±');ok(calc.state().display==='-9','classic clear and sign recover after error');
const tiny=M.statistics([1e-200,1e-200]);ok(tiny.mean===1e-200&&tiny.median===1e-200,'tiny statistics retain mean and median');const huge=M.statistics([-1e200,1e200]);ok(huge.mean===0&&huge.populationSD===1e200,'scaled statistics avoid false overflow');const fresh=M.classic();'2+3=7'.split('').forEach(k=>fresh.press(k));ok(fresh.state().history===''&&fresh.state().display==='7','new entry clears previous equation history');
ok(M.statistics([4,4,4,4,4,4]).populationSD===0&&M.regression([1,2,3,4,5,6],[4,4,4,4,4,4]).r2===null,'constant datasets remain constant despite floating-point summation');
const weights=require('./atomic-weight-reference.json').records;ok(weights.length===118,'primary atomic-weight snapshot has all 118 rows');
for(const r of weights){const e=lectioPlusElements.find(e=>e.z===r.z);ok(e.symbol===r.symbol&&e.mass===r.mass,'CIAAW atomic weight '+r.symbol);}
ok(new Set(lectioPlusElements.map(e=>e.row+','+e.column)).size===118,'periodic cells do not overlap');
const canonical=f=>JSON.stringify(Object.entries(C.parse(f)).sort(([a],[b])=>a.localeCompare(b)));
for(const r of require('./compound-reference.json').records){const c=C.combine(r.positive,r.negative);ok(canonical(c.formula)===canonical(r.MolecularFormula)&&c.reference.endsWith('/'+r.CID),'PubChem compound formula '+r.query);}
for(const [a,b,name,formula] of [['13','23','jern(III)chlorid','FeCl3'],['12','23','jern(II)chlorid','FeCl2'],['3','31','ammoniumsulfat','(NH4)2SO4'],['6','35','calciumphosphat','Ca3(PO4)2'],['3','37','ammoniumdihydrogenphosphat','NH4H2PO4'],['3','36','ammoniumhydrogenphosphat','(NH4)2HPO4'],['1','34','natriumhydrogencarbonat','NaHCO3'],['10','27','kobber(I)oxid','Cu2O']]){const c=C.combine(a,b);ok(c.name===name&&c.formula===formula,'Danish name and oxidation state '+name);}
for(const [a,b] of [['3','27'],['4','26'],['13','33'],['10','29']]){assert.throws(()=>C.combine(a,b));checks++;}
for(const input of ['C1.5H3','H02','H2 O','Na Cl']){assert.throws(()=>C.parse(input));checks++;}
for(const [reaction,expected] of [['C2H6 + O2 -> CO2 + H2O',[2,7,4,6]],['Ca(OH)2 + HCl -> CaCl2 + H2O',[1,2,1,2]],['Na3PO4 + MgCl2 -> Mg3(PO4)2 + NaCl',[2,3,1,6]]])ok(JSON.stringify(C.balance(reaction).coefficients)===JSON.stringify(expected),'reaction reference '+reaction);
ok(!T.some(t=>t.id==='ai')&&T.some(t=>t.id==='basic')&&T.length===54,'53 local tools plus online translator including classic calculator; no AI');
console.log('TOTAL',checks,'independent audit checks');
