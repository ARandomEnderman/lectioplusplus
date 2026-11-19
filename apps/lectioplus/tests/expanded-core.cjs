const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const dir=path.resolve(__dirname,'../extension');for(const f of ['school-math','school-elements','school-chemistry','school-expanded-core','school-expanded-science','school-expanded-data'])vm.runInThisContext(fs.readFileSync(dir+'/'+f+'.js','utf8'));
const X=lectioPlusExpanded,C=lectioPlusChemistry;let checks=0;
function close(actual,expected,tol=1e-8){assert.ok(Math.abs(actual-expected)<=tol*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);checks++;}
function calc(id,data={}){const t=X.tools.find(t=>t.id===id);return t.calculate({...Object.fromEntries(t.fields.map(f=>[f.id,f.value])),...data});}
for(const t of X.tools.filter(t=>t.calculate)){const r=calc(t.id);assert.ok(r.rows.length);checks++;for(const f of t.fields.filter(f=>f.type==='number')){assert.throws(()=>calc(t.id,{[f.id]:''}));assert.throws(()=>calc(t.id,{[f.id]:'NaN'}));checks+=2;}}
for (const [a, x, expected] of [[2,4,48], [-1,4,0.75], [0,1,3], ['0,5',4,6]]) {
  const result = calc('power-function', {a,x});
  close(result.rows[1][1], expected);
  close(result.plot[1].points[0][1], expected);
}
for (const [x1,y1,x2,y2,a,b] of [[2,12,4,48,2,3],[4,2,2,4,-1,8],[2,7,5,7,0,7],[1,3,4,6,0.5,3]]) {
  const result = calc('power-two-points', {x1,y1,x2,y2});
  close(result.rows[0][1], a);
  close(result.rows[1][1], b);
  for (const [x,y] of result.table.body) close(y, b*x**a);
}
for (const invalid of [{x1:4}, {x1:0}, {y1:-2}, {y2:0}]) {
  assert.throws(() => calc('power-two-points', invalid));
  checks++;
}
close(calc('projectile',{v:10,angle:45,g:10}).rows[1][1],10);
close(calc('forces',{forces:'10; 0\n10; 180',mass:2}).rows[2][1],0);
close(calc('energy-bars',{m:2,start:10,height:5,heat:0,g:10}).rows[0][1],100);
close(X.network('S(100,P(200,300))'),220);close(X.network('P(S(10,20),30)'),15);assert.throws(()=>X.network('S(10,0)'));checks++;
close(calc('normal',{mean:0,sd:1,lo:-1,hi:1}).rows[0][1],68.2689492,1e-6);
for(const mode of ['SSS','SAS','ASA']){const t=X.triangle({mode,a:3,b:4,c:5,angle:60,angleB:60});close(t.A+t.B+t.C,180);assert.ok(t.area>0);checks++;}
const reg=X.regression([1,2,3,4],[2,4,8,16],'exp');close(reg.a,1);close(reg.b,Math.log(2));close(reg.r2,1);assert.throws(()=>X.regression([1,2],[-1,3],'exp'));checks++;
close(calc('integral',{coeff:'1; 0',a:0,b:2}).rows[1][1],2);close(calc('integral',{coeff:'1; 0',a:-1,b:1}).rows[2][1],1,1e-6);close(calc('differentiate',{coeff:'2; 3; 4',x:2}).rows[3][1],11);
close(X.acidPH(0,1.8e-5),7);close(X.strongPH(0),7);close(X.strongPH(.1),1);close(X.strongPH(-.1),13);
close(calc('acid-buffer',{mode:'buffer',c:.1,salt:.1,k:1e-5}).rows[0][1],5,3e-5);
close(calc('titration',{mode:'strong',ca:.1,va:25,cb:.1,vb:25}).rows[0][1],7);
const eq=calc('equilibrium',{a:1,b:1,c:0,k:10}).rows;close(eq[3][1]/eq[1][1]/eq[2][1],10);
const mixed=calc('mix-solutions',{c1:.1,v1:100,c2:.5,v2:200});close(mixed.rows[1][1],1.1/3);
const mass=calc('mass-composition',{formula:'H2O',mass:18.015});close(mass.table.body.reduce((s,r)=>s+r[3],0),100);close(mass.table.body.reduce((s,r)=>s+r[4],0),18.015);
assert.equal(calc('molecular-formula',{formula:'CH2O',molar:180.156}).rows[2][1],'C6H12O6');checks++;
close(calc('oxidation',{formula:'KMnO4',charge:0,unknown:'Mn',known:'K=1\nO=-2'}).rows[0][1],7);
close(calc('ppm',{solute:2,total:1000}).rows[2][1],2);
close(calc('enzymes',{vmax:100,km:2,s:2}).rows[0][1],50);
function atoms(side){const result={charge:0};for(const [species,n]of Object.entries(side)){const [f,q]=species.split('^');if(q){const m=q.match(/^(\d*)([+-])$/);result.charge+=n*(Number(m[1]||1))*(m[2]==='+'?1:-1);}if(f==='e')continue;for(const [s,k]of Object.entries(C.parse(f)))result[s]=(result[s]||0)+n*k;}return result;}
for(const r of X.reductions)for(const o of X.oxidations)for(const medium of ['acid','base']){if(r.id==='iron'&&o.id==='iron'){assert.throws(()=>X.redox({reduction:r.id,oxidation:o.id,medium}));checks++;continue;}const result=X.redox({reduction:r.id,oxidation:o.id,medium}),left=atoms(result.balance.left),right=atoms(result.balance.right);for(const k of new Set([...Object.keys(left),...Object.keys(right)]))close(left[k]||0,right[k]||0);}
assert.equal(Object.keys(X.codons).length,64);assert.equal(X.translateDNA('ATGGCTTTTTAA').protein,'MAF');assert.equal(X.translateDNA('TACCGAAAAATT','template').protein,'MAF');assert.equal(X.translateDNA('A','coding',2).remainder,0);checks+=4;
const cross=calc('genetics',{p1:'Aa',p2:'Aa'});assert.deepEqual(cross.rows.slice(0,3).map(r=>r[1]),[25,50,25]);checks++;
for(const m of X.lewis){const electrons=m.bonds.reduce((s,b)=>s+2*b[2],0)+2*m.pairs.reduce((a,b)=>a+b,0);close(electrons,m.valence.reduce((a,b)=>a+b,0));m.atoms.forEach((_,i)=>close(m.valence[i]-m.pairs[i]*2-m.bonds.reduce((s,[a,b,n])=>s+((a===i||b===i)?n:0),0),0));}
const logic=X.logic('A AND NOT B');assert.equal(logic.evaluate(logic.tree,{A:true,B:false}),true);assert.equal(logic.evaluate(logic.tree,{A:true,B:true}),false);assert.throws(()=>X.logic('A AND (B'));checks+=3;
assert.deepEqual(X.csv('x;y\n"a;b";"a""b"',';'),[['x','y'],['a;b','a"b']]);assert.throws(()=>X.csv('"uafsluttet',';'));checks+=2;
const bits=calc('number-bases',{value:'FF',base:'16'});assert.equal(bits.rows[0][1],'255');assert.equal(bits.rows[1][1],'11111111');checks+=2;
console.log('TOTAL',checks,'expanded calculation and data checks');
