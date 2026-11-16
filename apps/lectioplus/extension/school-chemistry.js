(() => {
  'use strict';
  const {fail,gcd,finite} = globalThis.lectioPlusMath;
  const elements = new Map(globalThis.lectioPlusElements.map(item=>[item.symbol,item]));
  const ions = [
    ['Li',1,'lithium'],['Na',1,'natrium'],['K',1,'kalium'],['NH4',1,'ammonium'],['Ag',1,'sølv'],
    ['Mg',2,'magnesium'],['Ca',2,'calcium'],['Sr',2,'strontium'],['Ba',2,'barium'],['Zn',2,'zink'],
    ['Cu',1,'kobber(I)'],['Cu',2,'kobber(II)'],['Fe',2,'jern(II)'],['Fe',3,'jern(III)'],['Al',3,'aluminium'],
    ['Cr',3,'chrom(III)'],['Sn',2,'tin(II)'],['Sn',4,'tin(IV)'],['Pb',2,'bly(II)'],['Mn',2,'mangan(II)'],['Ni',2,'nikkel(II)'],['Co',2,'cobalt(II)'],
    ['F',-1,'fluorid'],['Cl',-1,'chlorid'],['Br',-1,'bromid'],['I',-1,'iodid'],['OH',-1,'hydroxid'],['O',-2,'oxid'],['S',-2,'sulfid'],
    ['NO3',-1,'nitrat'],['NO2',-1,'nitrit'],['SO4',-2,'sulfat'],['SO3',-2,'sulfit'],['CO3',-2,'carbonat'],['HCO3',-1,'hydrogencarbonat'],
    ['PO4',-3,'phosphat'],['HPO4',-2,'hydrogenphosphat'],['H2PO4',-1,'dihydrogenphosphat'],['CH3COO',-1,'acetat'],['MnO4',-1,'permanganat'],['CN',-1,'cyanid'],['CrO4',-2,'chromat'],['Cr2O7',-2,'dichromat']
  ].map(([formula,charge,name],index)=>({id:String(index),formula,charge,name}));
  // Name/formula pairs checked against NIH PubChem; provenance is in tests/compound-reference.json.
  // Membership does not assert solubility, stability in water, or reaction feasibility.
  const compounds=[
  {
    "positive": "1",
    "negative": "23",
    "formula": "NaCl",
    "name": "natriumchlorid",
    "cid": 5234
  },
  {
    "positive": "2",
    "negative": "23",
    "formula": "KCl",
    "name": "kaliumchlorid",
    "cid": 4873
  },
  {
    "positive": "6",
    "negative": "23",
    "formula": "CaCl2",
    "name": "calciumchlorid",
    "cid": 5284359
  },
  {
    "positive": "5",
    "negative": "23",
    "formula": "MgCl2",
    "name": "magnesiumchlorid",
    "cid": 5360315
  },
  {
    "positive": "12",
    "negative": "23",
    "formula": "FeCl2",
    "name": "jern(II)chlorid",
    "cid": 24458
  },
  {
    "positive": "13",
    "negative": "23",
    "formula": "FeCl3",
    "name": "jern(III)chlorid",
    "cid": 24380
  },
  {
    "positive": "11",
    "negative": "23",
    "formula": "CuCl2",
    "name": "kobber(II)chlorid",
    "cid": 24014
  },
  {
    "positive": "3",
    "negative": "23",
    "formula": "NH4Cl",
    "name": "ammoniumchlorid",
    "cid": 25517
  },
  {
    "positive": "4",
    "negative": "29",
    "formula": "AgNO3",
    "name": "sølvnitrat",
    "cid": 24470
  },
  {
    "positive": "1",
    "negative": "29",
    "formula": "NaNO3",
    "name": "natriumnitrat",
    "cid": 24268
  },
  {
    "positive": "2",
    "negative": "29",
    "formula": "KNO3",
    "name": "kaliumnitrat",
    "cid": 24434
  },
  {
    "positive": "6",
    "negative": "29",
    "formula": "Ca(NO3)2",
    "name": "calciumnitrat",
    "cid": 24963
  },
  {
    "positive": "5",
    "negative": "29",
    "formula": "Mg(NO3)2",
    "name": "magnesiumnitrat",
    "cid": 25212
  },
  {
    "positive": "3",
    "negative": "29",
    "formula": "NH4NO3",
    "name": "ammoniumnitrat",
    "cid": 22985
  },
  {
    "positive": "1",
    "negative": "31",
    "formula": "Na2SO4",
    "name": "natriumsulfat",
    "cid": 24436
  },
  {
    "positive": "2",
    "negative": "31",
    "formula": "K2SO4",
    "name": "kaliumsulfat",
    "cid": 24507
  },
  {
    "positive": "6",
    "negative": "31",
    "formula": "CaSO4",
    "name": "calciumsulfat",
    "cid": 24497
  },
  {
    "positive": "5",
    "negative": "31",
    "formula": "MgSO4",
    "name": "magnesiumsulfat",
    "cid": 24083
  },
  {
    "positive": "11",
    "negative": "31",
    "formula": "CuSO4",
    "name": "kobber(II)sulfat",
    "cid": 24462
  },
  {
    "positive": "3",
    "negative": "31",
    "formula": "(NH4)2SO4",
    "name": "ammoniumsulfat",
    "cid": 6097028
  },
  {
    "positive": "14",
    "negative": "31",
    "formula": "Al2(SO4)3",
    "name": "aluminiumsulfat",
    "cid": 24850
  },
  {
    "positive": "12",
    "negative": "31",
    "formula": "FeSO4",
    "name": "jern(II)sulfat",
    "cid": 24393
  },
  {
    "positive": "13",
    "negative": "31",
    "formula": "Fe2(SO4)3",
    "name": "jern(III)sulfat",
    "cid": 24826
  },
  {
    "positive": "8",
    "negative": "31",
    "formula": "BaSO4",
    "name": "bariumsulfat",
    "cid": 24414
  },
  {
    "positive": "1",
    "negative": "26",
    "formula": "NaOH",
    "name": "natriumhydroxid",
    "cid": 14798
  },
  {
    "positive": "2",
    "negative": "26",
    "formula": "KOH",
    "name": "kaliumhydroxid",
    "cid": 14797
  },
  {
    "positive": "6",
    "negative": "26",
    "formula": "Ca(OH)2",
    "name": "calciumhydroxid",
    "cid": 6093208
  },
  {
    "positive": "5",
    "negative": "26",
    "formula": "Mg(OH)2",
    "name": "magnesiumhydroxid",
    "cid": 73981
  },
  {
    "positive": "14",
    "negative": "26",
    "formula": "Al(OH)3",
    "name": "aluminiumhydroxid",
    "cid": 10176082
  },
  {
    "positive": "11",
    "negative": "26",
    "formula": "Cu(OH)2",
    "name": "kobber(II)hydroxid",
    "cid": 164826
  },
  {
    "positive": "9",
    "negative": "26",
    "formula": "Zn(OH)2",
    "name": "zinkhydroxid",
    "cid": 9812759
  },
  {
    "positive": "1",
    "negative": "33",
    "formula": "Na2CO3",
    "name": "natriumcarbonat",
    "cid": 10340
  },
  {
    "positive": "2",
    "negative": "33",
    "formula": "K2CO3",
    "name": "kaliumcarbonat",
    "cid": 11430
  },
  {
    "positive": "6",
    "negative": "33",
    "formula": "CaCO3",
    "name": "calciumcarbonat",
    "cid": 10112
  },
  {
    "positive": "5",
    "negative": "33",
    "formula": "MgCO3",
    "name": "magnesiumcarbonat",
    "cid": 11029
  },
  {
    "positive": "1",
    "negative": "34",
    "formula": "NaHCO3",
    "name": "natriumhydrogencarbonat",
    "cid": 516892
  },
  {
    "positive": "2",
    "negative": "34",
    "formula": "KHCO3",
    "name": "kaliumhydrogencarbonat",
    "cid": 516893
  },
  {
    "positive": "1",
    "negative": "35",
    "formula": "Na3PO4",
    "name": "natriumphosphat",
    "cid": 24243
  },
  {
    "positive": "2",
    "negative": "35",
    "formula": "K3PO4",
    "name": "kaliumphosphat",
    "cid": 62657
  },
  {
    "positive": "6",
    "negative": "35",
    "formula": "Ca3(PO4)2",
    "name": "calciumphosphat",
    "cid": 24456
  },
  {
    "positive": "3",
    "negative": "37",
    "formula": "NH4H2PO4",
    "name": "ammoniumdihydrogenphosphat",
    "cid": 24402
  },
  {
    "positive": "3",
    "negative": "36",
    "formula": "(NH4)2HPO4",
    "name": "ammoniumhydrogenphosphat",
    "cid": 24540
  },
  {
    "positive": "1",
    "negative": "36",
    "formula": "Na2HPO4",
    "name": "natriumhydrogenphosphat",
    "cid": 24203
  },
  {
    "positive": "1",
    "negative": "37",
    "formula": "NaH2PO4",
    "name": "natriumdihydrogenphosphat",
    "cid": 23672064
  },
  {
    "positive": "9",
    "negative": "27",
    "formula": "ZnO",
    "name": "zinkoxid",
    "cid": 3007857
  },
  {
    "positive": "13",
    "negative": "27",
    "formula": "Fe2O3",
    "name": "jern(III)oxid",
    "cid": 518696
  },
  {
    "positive": "11",
    "negative": "27",
    "formula": "CuO",
    "name": "kobber(II)oxid",
    "cid": 164827
  },
  {
    "positive": "10",
    "negative": "27",
    "formula": "Cu2O",
    "name": "kobber(I)oxid",
    "cid": 18346908
  },
  {
    "positive": "5",
    "negative": "27",
    "formula": "MgO",
    "name": "magnesiumoxid",
    "cid": 14792
  },
  {
    "positive": "6",
    "negative": "27",
    "formula": "CaO",
    "name": "calciumoxid",
    "cid": 14778
  }
];
  function parse(input) {
    const source=String(input).trim().replace(/[₀-₉]/g,c=>String('₀₁₂₃₄₅₆₇₈₉'.indexOf(c)));
    if(/\s/.test(source))fail('Skriv én formel uden mellemrum. Afstem reaktioner i reaktionsværktøjet.');
    if(source.includes('.'))fail('Brug midterprik · til krystalvand; atomantal kan ikke være decimaltal.');
    if(!source||source.length>250)fail('Skriv en kemisk formel på højst 250 tegn.');
    const total={};
    const add=(to,from,mult=1)=>{for(const [symbol,count] of Object.entries(from)){to[symbol]=(to[symbol]||0)+count*mult;if(to[symbol]>1000000)fail('Formlen indeholder for mange atomer.');}};
    const parts=source.split(/[·•.]/);
    parts.forEach((part,index)=>{
      if(!part)fail('Der mangler en formel mellem prikkerne.');
      let multiplier=1;
      const coefficient=part.match(/^([1-9]\d*)/);
      if(coefficient){if(index===0)fail('Skriv én formelenhed uden koefficient foran. Brug fx H2O.');multiplier=Number(coefficient[1]);part=part.slice(coefficient[1].length);}
      let pos=0;
      function count(){const match=part.slice(pos).match(/^\d+/);if(!match)return 1;pos+=match[0].length;const n=Number(match[0]);if(match[0].startsWith('0')||!Number.isSafeInteger(n)||n<1||n>1000000)fail('Atomantal skal være et positivt helt tal.');return n;}
      function group(end='',depth=0){if(depth>16)fail('For mange indlejrede parenteser.');const result={};let entries=0;
        while(pos<part.length&&part[pos]!==end){
          const ch=part[pos];
          if(ch==='('||ch==='['){pos++;const nested=group(ch==='('?')':']',depth+1);add(result,nested,count());entries++;}
          else {const symbol=part.slice(pos).match(/^[A-Z][a-z]?/)?.[0];if(!symbol||!elements.has(symbol))fail('Ukendt grundstof eller tegn. Brug store/små bogstaver korrekt og angiv ladning i det separate felt.');pos+=symbol.length;add(result,{[symbol]:count()});entries++;}
        }
        if(!entries)fail('En parentes eller formeldel er tom.');
        if(end&&part[pos++]!==end)fail('Parenteserne passer ikke sammen.');return result;
      }
      add(total,group(),multiplier);if(pos!==part.length)fail('Formlen er ikke gyldig.');
    });
    return total;
  }
  function molarMass(formula,charge=0){if(!Number.isInteger(charge)||Math.abs(charge)>20)fail('Ladningen skal være et helt tal mellem −20 og 20.');const atoms=parse(formula);let mass=0,protons=0,count=0;const breakdown=[];
    for(const [symbol,n] of Object.entries(atoms)){const e=elements.get(symbol);if(e.mass===null)fail(`${symbol} har ingen standardatomvægt i tabellen. Vælg en bestemt isotop i en anden beregner.`);mass+=e.mass*n;protons+=e.z*n;count+=n;breakdown.push({symbol,n,mass:e.mass,contribution:e.mass*n});}
    if(protons-charge<0)fail('Ladningen giver et negativt antal elektroner.');
    return {mass:finite(mass),atoms,count,protons,electrons:protons-charge,breakdown};
  }
  function combine(positive,negative){const a=ions.find(i=>i.id===positive),b=ions.find(i=>i.id===negative);if(!a||!b||a.charge<=0||b.charge>=0)fail('Vælg en positiv og en negativ ion.');const reference=compounds.find(c=>c.positive===positive&&c.negative===negative);if(!reference)fail('Denne ionkombination findes ikke i værktøjets kontrollerede udvalg. Ladningsbalance alene beviser ikke, at et stof findes.');const divisor=gcd(a.charge,-b.charge),na=-b.charge/divisor,nb=a.charge/divisor;
    const formula=reference.formula;return {formula,name:reference.name,reference:'https://pubchem.ncbi.nlm.nih.gov/compound/'+reference.cid,positiveCount:na,negativeCount:nb,positive:a,negative:b,...molarMass(formula)};
  }
  function lookup(formula){
    const key=atoms=>JSON.stringify(Object.entries(atoms).sort(([a],[b])=>a.localeCompare(b))),requested=key(parse(formula));
    const record=compounds.find(c=>key(parse(c.formula))===requested);
    if(!record)fail('Formlen findes ikke i udvalget på 50 kontrollerede forbindelser. Brug en formel uden krystalvand og i det mindste ionforhold.');
    return combine(record.positive,record.negative);
  }
  // Exact rational elimination: balancing must not rely on rounded decimal coefficients.
  const bgcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
  const F=(n,d=1n)=>{if(d===0n)fail('Kan ikke afstemme reaktionen.');const g=bgcd(n,d)||1n;return [n/g*(d<0n?-1n:1n),d/g*(d<0n?-1n:1n)];};
  const sub=(a,b)=>F(a[0]*b[1]-b[0]*a[1],a[1]*b[1]),mul=(a,b)=>F(a[0]*b[0],a[1]*b[1]),div=(a,b)=>F(a[0]*b[1],a[1]*b[0]);
  function balance(input){if(String(input).length>500)fail('Reaktionen er for lang.');const sides=String(input).split(/->|→|=/);if(sides.length!==2)fail('Skriv reaktanter -> produkter.');const left=sides[0].split('+').map(x=>x.trim()),right=sides[1].split('+').map(x=>x.trim()),all=[...left,...right];if(!left.length||!right.length||all.length>12||all.some(x=>!x))fail('Brug 2–12 stoffer uden koefficienter.');
    const formulas=all.map(parse),symbols=[...new Set(formulas.flatMap(Object.keys))];if(symbols.length>20)fail('For mange grundstoffer.');
    const matrix=symbols.map(symbol=>formulas.map((formula,i)=>F(BigInt((formula[symbol]||0)*(i<left.length?1:-1)))));
    const pivots=[];let row=0;
    for(let col=0;col<all.length&&row<matrix.length;col++){const found=matrix.findIndex((r,i)=>i>=row&&r[col][0]!==0n);if(found<0)continue;[matrix[row],matrix[found]]=[matrix[found],matrix[row]];const pivot=matrix[row][col];matrix[row]=matrix[row].map(v=>div(v,pivot));for(let r=0;r<matrix.length;r++){if(r===row)continue;const factor=matrix[r][col];matrix[r]=matrix[r].map((v,c)=>sub(v,mul(factor,matrix[row][c])));}pivots.push(col);row++;}
    const free=all.map((_,i)=>i).filter(i=>!pivots.includes(i));if(free.length!==1)fail(free.length?'Reaktionen har flere uafhængige løsninger. Del den op eller vælg andre stoffer.':'Reaktionen kan ikke afstemmes med de angivne stoffer.');
    const solution=all.map(()=>F(0n));solution[free[0]]=F(1n);
    for(let r=pivots.length-1;r>=0;r--){let value=F(0n);for(let c=pivots[r]+1;c<all.length;c++)value=sub(value,mul(matrix[r][c],solution[c]));solution[pivots[r]]=value;}
    let lcm=1n;for(const [,d] of solution)lcm=lcm/bgcd(lcm,d)*d;
    let integers=solution.map(([n,d])=>n*(lcm/d));if(integers.every(n=>n<0n))integers=integers.map(n=>-n);
    if(integers.some(n=>n<=0n))fail('Alle stoffer skal have positive koefficienter. Kontrollér reaktanter og produkter.');
    const divisor=integers.reduce(bgcd);integers=integers.map(n=>n/divisor);if(integers.some(n=>n>1000000n))fail('Koefficienterne er for store.');
    const coefficients=integers.map(Number),text=all.map((formula,i)=>(coefficients[i]===1?'':coefficients[i]+' ')+formula);
    return {equation:text.slice(0,left.length).join(' + ')+' → '+text.slice(left.length).join(' + '),coefficients,left,right,atoms:symbols.map(symbol=>({symbol,left:formulas.slice(0,left.length).reduce((s,f,i)=>s+(f[symbol]||0)*coefficients[i],0),right:formulas.slice(left.length).reduce((s,f,i)=>s+(f[symbol]||0)*coefficients[i+left.length],0)}))};
  }
  globalThis.lectioPlusChemistry={elements,ions,compounds,parse,molarMass,combine,lookup,balance};
})();
