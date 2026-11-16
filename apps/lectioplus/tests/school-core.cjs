const assert=require('node:assert/strict');
for(const name of ['school-math','school-elements','school-chemistry','school-lab-core','school-writing','translation','school-catalog'])require('../extension/'+name+'.js');
const M=lectioPlusMath,C=lectioPlusChemistry;let count=0;
function ok(value,message){assert.ok(value,message);count++;console.log('PASS',message)}
const close=(a,b)=>Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b));
for(const [expression,expected,degrees] of [['2+3*4',14,true],['(2+3)*4',20,true],['2^3^2',512,true],['-2^2',-4,true],['(-2)^2',4,true],['2^-3',0.125,true],['2(3+4)',14,true],['2pi',2*Math.PI,true],['sin(30)',0.5,true],['sin(pi/2)',1,false],['log(100)',2,true],['ln(e)',1,true],['5!',120,true],['200*15%',30,true],['1,5+2,5',4,true],['1e3+2',1002,true]])ok(close(M.expression(expression,0,degrees),expected),'calculator: '+expression);
for(const expression of ['1/0','sqrt(-1)','tan(90)','window.alert(1)','constructor(1)','2**4','sin 30','(1+2','3 4','1+','10^10000','171!','(-1)!','x.y']){assert.throws(()=>M.expression(expression));count++;console.log('PASS invalid expression rejected:',expression)}
const stats=M.statistics([2,4,4,6,9]);ok(stats.mean===5&&stats.median===4&&stats.q1===3&&stats.q3===7.5,'statistics and median-of-halves quartiles');ok(close(stats.populationSD,Math.sqrt(28/5))&&close(stats.sampleSD,Math.sqrt(7)),'sample vs population deviation');
ok(M.statistics([5]).sampleSD===null,'one value does not invent sample deviation');
const reg=M.regression([1,2,3],[3,5,7]);ok(close(reg.a,2)&&close(reg.b,1)&&close(reg.r2,1),'linear regression recovers exact line');assert.throws(()=>M.regression([1,1],[2,3]));count++;
ok(M.quadratic(1,-5,6).roots.join(',')==='2,3','quadratic roots');ok(M.quadratic(0,2,-6).roots[0]===3,'degenerate quadratic becomes linear');ok(M.quadratic(0,0,0).kind==='all'&&M.quadratic(0,0,1).kind==='none','zero coefficients distinguished');ok(M.quadratic(1,0,1).imaginary===1,'complex roots represented explicitly');ok(M.system(2,1,7,1,-1,2).x===3,'two linear equations');ok(M.system(0,0,0,0,0,1).kind==='none','inconsistent zero-row system');
ok(M.fraction(-18,-24).numerator===3&&M.fraction(-18,-24).denominator===4,'fraction signs and simplification');ok(close(M.binomial(10,3,0.5).exact,120/1024),'binomial exact');ok(M.binomial(5,0,0).exact===1&&M.binomial(5,5,1).cumulative===1,'binomial probability boundaries');
ok(close(M.convert(0,'temperature','°C','K'),273.15)&&close(M.convert(32,'temperature','°F','°C'),0),'temperature conversion');ok(close(M.convert(1,'volume','L','cm³'),1000),'volume conversion');ok(close(M.convert(36,'speed','km/t','m/s'),10),'speed conversion');assert.throws(()=>M.convert(-1,'temperature','K','°C'));count++;
ok(lectioPlusElements.length===118&&new Set(lectioPlusElements.map(e=>e.symbol)).size===118,'118 unique elements');ok(lectioPlusElements[39].mass===91.222,'2024 zirconium value');ok(lectioPlusElements[42].mass===null&&lectioPlusElements[117].mass===null,'unassigned atomic weights stay null');
for(const [formula,expected] of [['H2O',18.015],['Ca(OH)2',74.092],['Al2(SO4)3',342.132],['CuSO4·5H2O',249.677],['NH4NO3',80.043]])ok(close(C.molarMass(formula).mass,expected),'molar mass '+formula);
ok(JSON.stringify(C.parse('K4[Fe(CN)6]'))===JSON.stringify({K:4,Fe:1,C:6,N:6}),'nested square brackets in formulas');ok(C.molarMass('SO₄',-2).electrons===50,'subscripts and ionic electron count');
for(const formula of ['','Na()','Mg(OH','Xx2','H0','2H2O','Fe3+','Ca]','H1000001','H2O..H2O']){assert.throws(()=>C.parse(formula));count++;}
assert.throws(()=>C.molarMass('Tc'));count++;
const iron=C.combine('13','23');ok(iron.formula==='FeCl3'&&iron.name==='jern(III)chlorid','iron(III) chloride name and formula');const ammonium=C.combine('3','31');ok(ammonium.formula==='(NH4)2SO4','polyatomic ion groups receive parentheses');
let combinations=0;for(const positive of C.ions.filter(x=>x.charge>0))for(const negative of C.ions.filter(x=>x.charge<0)){
 if(!C.compounds.some(c=>c.positive===positive.id&&c.negative===negative.id)){assert.throws(()=>C.combine(positive.id,negative.id));continue;}
 const r=C.combine(positive.id,negative.id);assert.equal(r.positiveCount*positive.charge+r.negativeCount*negative.charge,0);assert.equal(M.gcd(r.positiveCount,r.negativeCount),1);assert.ok(r.mass>0);combinations++;
}ok(combinations===50,'50 reference-backed ion pairs; all other pairs explicitly rejected');
for(const [reaction,expected] of [['H2 + O2 -> H2O','2 H2 + O2 → 2 H2O'],['Fe + O2 -> Fe2O3','4 Fe + 3 O2 → 2 Fe2O3'],['C3H8 + O2 -> CO2 + H2O','C3H8 + 5 O2 → 3 CO2 + 4 H2O'],['Al + HCl -> AlCl3 + H2','2 Al + 6 HCl → 2 AlCl3 + 3 H2']]){const r=C.balance(reaction);ok(r.equation===expected&&r.atoms.every(x=>x.left===x.right),'balance '+reaction);}
for(const reaction of ['H2 -> O2','H2 + O2 -> H2O + H2O2','Na+ + Cl- -> NaCl']){assert.throws(()=>C.balance(reaction));count++;}
const prefs={angle:'deg',steps:true};for(const tool of lectioPlusSchoolCatalog.tools.filter(x=>x.calculate)){const values=Object.fromEntries(tool.fields.map(f=>[f.id,f.type==='number'&&!(f.optional&&f.value==='')?M.number(f.value):f.value]));const result=tool.calculate(values,prefs);ok(result.rows.length>0&&result.rows.every(([,v])=>typeof v!=='number'||Number.isFinite(v)),'default calculation: '+tool.id);}
console.log('TOTAL',count,'school calculation checks, including all 462 candidate pairs');
