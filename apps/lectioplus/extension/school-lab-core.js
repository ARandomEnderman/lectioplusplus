(() => {
  'use strict';
  const M=globalThis.lectioPlusMath,C=globalThis.lectioPlusChemistry;
  const bounded=(value,min,max)=>{const n=M.number(value);if(n<min||n>max)M.fail(`Brug en værdi mellem ${min} og ${max}.`);return n;};
  const tools=[
    ['ionmodel','chemistry','Atom og ion','Se elektronerne før og efter dannelse af en ion.'],
    ['atomcompare','chemistry','Sammenlign atomer','To grundstoffer eller isotoper med forskelle fremhævet.'],
    ['formulas','study','Formelsamling','Søg formler, symboler, enheder og gennemregnede eksempler.'],
    ['interactive','math','Interaktive figurer','Undersøg parabler, trekanter og vektorer med skydere.'],
    ['stoichiometry','chemistry','Reaktionsmængder','Begrænsende reaktant, overskud og teoretisk udbytte.'],
    ['worksheet','study','Mit beregningsark','Saml resultater, figurer og egne kommentarer.'],
    ['molecules','chemistry','Molekyler i 3D','Byg med atomer og bindinger, genkend 15 molekyler, og drej din model.'],
    ['report','study','Forsøgsrapport','Skriv rapport, indtast målinger og lav graf og statistik.'],
    ['precision','math','Præcision og usikkerhed','Betydende cifre, videnskabelig notation og standardusikkerhed.'],
    ['circuits','physics','Byg et kredsløb','Serie- og parallelmodstande med strøm og spænding på diagrammet.'],
    ['simulation','math','Sandsynlighedsforsøg','Simulér mønt- og terningekast og sammenlign med teorien.'],
    ['board','study','Min opgavetavle','Egne opgaver, delmål og tidsestimater i tre kolonner.'],
    ['glossary','study','Faglig ordliste','Danske og engelske begreber med forklaringer og eksempler.'],
    ['profiles','study','Mine profiler','Skift mellem gemte layouts og visningsindstillinger.']
  ].map(([id,category,title,description])=>({id,category,title,description,special:true}));
  // Controlled main-group ions with closed-shell configurations. No arbitrary charge prediction.
  const ions=[['Li',1,[2]],['Na',1,[2,8]],['K',1,[2,8,8]],['Mg',2,[2,8]],['Ca',2,[2,8,8]],['Al',3,[2,8]],['F',-1,[2,8]],['Cl',-1,[2,8,8]],['O',-2,[2,8]],['S',-2,[2,8,8]]].map(([symbol,charge,shells])=>({symbol,charge,shells}));
  function ion(symbol){const record=ions.find(x=>x.symbol===symbol);if(!record)M.fail('Vælg en af de kontrollerede ioner.');const e=C.elements.get(symbol);return {...record,z:e.z,electrons:e.z-record.charge};}
  function reaction(expression,amounts,unit='g',yieldPercent=100){
    if(!['g','mol'].includes(unit))M.fail('Vælg gram eller mol.');const r=C.balance(expression),yieldRate=bounded(yieldPercent,0,100)/100;
    if(amounts.length!==r.left.length)M.fail('Angiv én mængde for hver reaktant.');
    const masses=[...r.left,...r.right].map(x=>C.molarMass(x).mass);
    const moles=amounts.map((v,i)=>bounded(v,0,1e12)/(unit==='g'?masses[i]:1));
    const possible=moles.map((n,i)=>n/r.coefficients[i]),extent=Math.min(...possible);
    const limiting=r.left.filter((_,i)=>Math.abs(possible[i]-extent)<=Math.max(Number.MIN_VALUE,Math.abs(possible[i]),Math.abs(extent))*1e-10);
    const remaining=r.left.map((formula,i)=>({formula,mol:Math.max(0,moles[i]-r.coefficients[i]*extent),mass:Math.max(0,moles[i]-r.coefficients[i]*extent)*masses[i]}));
    const products=r.right.map((formula,i)=>{const mol=extent*r.coefficients[i+r.left.length],mass=mol*masses[i+r.left.length];return {formula,mol,mass,expected:mass*yieldRate};});
    [...remaining,...products].forEach(row=>Object.values(row).filter(v=>typeof v==='number').forEach(M.finite));
    return {...r,limiting,remaining,products,extent};
  }
  function circuit(mode,voltage,values){
    if(!['series','parallel'].includes(mode))M.fail('Vælg serie eller parallel.');const u=bounded(voltage,0,1e6);
    if(!Array.isArray(values)||!values.length||values.length>8)M.fail('Brug 1–8 modstande.');const rs=values.map(x=>bounded(x,1e-6,1e12));
    const resistance=mode==='series'?rs.reduce((a,b)=>a+b,0):1/rs.reduce((s,r)=>s+1/r,0),current=u/resistance;
    return {resistance,current,power:u*current,branches:rs.map(r=>({r,u:mode==='series'?current*r:u,i:mode==='series'?current:u/r}))};
  }
  function uncertainty(op,a,ua,b,ub){a=M.number(a);b=M.number(b);ua=bounded(ua,0,1e12);ub=bounded(ub,0,1e12);let value,u;
    if(op==='add'||op==='subtract'){value=op==='add'?a+b:a-b;u=Math.hypot(ua,ub);}
    else if(op==='multiply'){if(a===0&&b===0&&ua>0&&ub>0)M.fail('Førsteordensmodellen er utilstrækkelig, når begge værdier er nul og usikre.');value=a*b;u=Math.hypot(b*ua,a*ub);}
    else if(op==='divide'){if(b===0)M.fail('Nævneren må ikke være nul.');value=a/b;u=Math.hypot(ua/b,a*ub/(b*b));}
    else M.fail('Vælg en regneart.');return {value:M.finite(value),u:M.finite(u)};
  }
  function significant(raw,digits){
    const n=M.number(raw),d=bounded(digits,1,12);if(!Number.isInteger(d))M.fail('Antal cifre skal være et helt tal.');
    const source=String(raw).trim().replace(',','.').toLowerCase(),negative=source.startsWith('-')&&n!==0;
    const [coefficient,power='0']=source.replace(/^[+-]/,'').split('e'),[whole,fraction='']=coefficient.split('.'),all=whole+fraction,first=all.search(/[1-9]/);
    let exponent=first<0?0:Number(power)+whole.length-first-1,kept;
    if(first<0)kept='0'.repeat(d);else {const significant=all.slice(first).padEnd(d+1,'0');kept=(BigInt(significant.slice(0,d))+(significant[d]>='5'?1n:0n)).toString();if(kept.length>d){exponent++;kept=kept.slice(0,d);}kept=kept.padStart(d,'0');}
    const sign=negative?'-':'',scientific=sign+kept[0]+(d>1?'.'+kept.slice(1):'')+'e'+(exponent>=0?'+':'')+exponent;
    const rounded=exponent>=d||exponent< -6?scientific:sign+(exponent<0?'0.'+'0'.repeat(-exponent-1)+kept:kept.slice(0,exponent+1)+(exponent+1<d?'.'+kept.slice(exponent+1):''));
    return {rounded,scientific};
  }
  function simulate(kind,count,rng=Math.random){if(!['coin','dice'].includes(kind))M.fail('Vælg mønt eller terning.');const n=bounded(count,1,100000);if(!Number.isInteger(n))M.fail('Antal kast skal være et helt tal.');const bins=Array(kind==='coin'?2:6).fill(0);for(let i=0;i<n;i++){const value=rng();if(value<0||value>=1||!Number.isFinite(value))M.fail('Ugyldigt tilfældigt tal.');bins[Math.floor(value*bins.length)]++;}return {n,bins,expected:n/bins.length};}
  function review(previous,grade,now=Date.now()){if(!['again','hard','easy'].includes(grade))M.fail('Vælg en vurdering.');const old=Math.max(1,Number(previous?.interval)||1),interval=grade==='again'?0:grade==='hard'?Math.min(365,Math.max(1,Math.round(old*1.2))):Math.min(365,Math.max(3,Math.round(old*2.5)));return {interval:String(interval),due:new Date(now+(interval?interval*86400000:600000)).toISOString(),seen:String(Math.min(999999,(Number(previous?.seen)||0)+1)),grade};}
  const profileKeys=['theme','design','density','hideProfilePhoto','anonymizeName','showClicker','reducedMotion','contentWidth','font','navigationDensity','navigationGroups','tableDensity','sectionShortcuts','scheduleSize','scheduleView','showBreaks','colorLessons','showLessonRoom','dashboard','navigation'];
  function profileSnapshot(p){const normalized=globalThis.lectioPlusAppearance.normalize(p);return Object.fromEntries(profileKeys.map(key=>[key,normalized[key]]));}
  const formulas=[
    ['Matematik','Andengradsligning','x = (−b ± √(b²−4ac))/(2a)','a, b, c: koefficienter; a ≠ 0. Reelle rødder kræver d ≥ 0.','x²−5x+6=0 → x=2 eller x=3.','quadratic'],
    ['Matematik','Pythagoras','c² = a² + b²','a og b: kateter; c: hypotenuse. Samme længdeenhed. Kun retvinklede trekanter.','a=3 cm, b=4 cm → c=5 cm.','triangle'],
    ['Matematik','Lineær funktion','y = ax + b','a: hældning (y-enhed/x-enhed); b: skæring med y-aksen.','a=2, b=1, x=3 → y=7.','graph'],
    ['Matematik','Eksponentiel vækst','Kₙ = K₀(1+r)ⁿ','r: relativ ændring pr. periode, fx 0,05 for 5 %. n: perioder.','1000 · 1,05² = 1102,5.','interest'],
    ['Matematik','Vektorlængde','|a| = √(aₓ²+aᵧ²)','Koordinater skal bruge samme enhed.','a=(3,4) → |a|=5.','vectors'],
    ['Matematik','Binomialfordeling','P(X=k) = n!/(k!(n−k)!) · pᵏ(1−p)ⁿ⁻ᵏ','n: forsøg; k: succeser; p: sandsynlighed. Uafhængige forsøg og konstant p.','n=2, k=1, p=0,5 → P=0,5.','probability'],
    ['Kemi','Stofmængde','n = m/M','n: mol; m: g; M: g/mol.','18,015 g vand / 18,015 g/mol = 1 mol.','moles'],
    ['Kemi','Koncentration','c = n/V','c: mol/L; n: mol; V: hele opløsningens volumen i L.','0,1 mol / 0,5 L = 0,2 mol/L.','concentration'],
    ['Kemi','Fortynding','c₁V₁ = c₂V₂','Samme enheder på begge sider; stofmængden bevares.','1 mol/L · 10 mL = 0,1 mol/L · 100 mL.','dilution'],
    ['Fysik','Nettokraft','ΣF = ma','F: N; m: kg; a: m/s².','2 kg · 3 m/s² = 6 N.','force'],
    ['Fysik','Kinetisk energi','Eₖ = ½mv²','E: J; m: kg; v: m/s.','2 kg og 3 m/s → 9 J.','energy'],
    ['Fysik','Ohms lov','U = RI','U: V; R: Ω; I: A. Ohmsk modstand.','6 Ω · 2 A = 12 V.','ohm'],
    ['Fysik','Bølge','λ = v/f','λ: m; v: m/s; f: Hz.','340 m/s / 170 Hz = 2 m.','waves'],
    ['Fysik','Idealgas','pV = nRT','p: Pa; V: m³; n: mol; T: K; R≈8,31446 J/(mol·K). Idealiseret gas.','1 mol ved 300 K og 0,025 m³ → p≈99774 Pa.','gas']
  ];
  const glossary=[
    ['Mol','Mole','Enhed for stofmængde. 1 mol indeholder præcis 6,02214076 × 10²³ enheder.','1 mol vand er 1 mol vandmolekyler.','moles'],
    ['Isotop','Isotope','Atomer af samme grundstof med forskellige antal neutroner.','C-12 og C-14 har begge 6 protoner.','atomcompare'],
    ['Ion','Ion','Et atom eller en atomgruppe med elektrisk nettoladning.','Na⁺ har én elektron mindre end neutralt Na.','ionmodel'],
    ['Molarmasse','Molar mass','Masse pr. stofmængde, ofte i g/mol.','Vand har molarmasse omtrent 18,015 g/mol.','molar'],
    ['Begrænsende reaktant','Limiting reactant','Den reaktant, der først er opbrugt ved det valgte reaktionsforhold.','I 2 H₂ + O₂ → 2 H₂O kræves 2 mol H₂ pr. mol O₂.','stoichiometry'],
    ['Hældning','Slope','Ændring i y divideret med ændring i x for en ret linje.','y=2x+1 har hældningen 2.','graph'],
    ['Standardafvigelse','Standard deviation','Mål for observationernes spredning omkring gennemsnittet.','Ens observationer har standardafvigelse 0.','statistics'],
    ['Standardusikkerhed','Standard uncertainty','Måleusikkerhed udtrykt som en standardafvigelse. Den er ikke en sikker fejlgrænse.','u=0,1 cm beskriver usikkerheden, ikke en kendt målefejl.','precision'],
    ['Median','Median','Den midterste værdi i sorterede data; ved lige antal gennemsnittet af de to midterste.','1, 3, 9 har median 3.','statistics'],
    ['Modstand','Resistance','For en ohmsk komponent forholdet mellem spænding og strøm. Enhed Ω.','12 V / 2 A = 6 Ω.','circuits'],
    ['Sandsynlighed','Probability','Tal fra 0 til 1, der beskriver hvor sandsynlig en hændelse er i en model.','En fair mønt har P(krone)=0,5.','simulation'],
    ['Vektor','Vector','En matematisk størrelse med komponenter, som kan repræsentere retning og størrelse.','Vektoren (3,4) har længde 5.','vectors']
  ];
  const theta=104.5*Math.PI/360;
  const molecules=[
    {id:'water',name:'Vand · H₂O',geometry:'Vinklet · H–O–H ≈ 104,5°',atoms:[['O',0,0,0],['H',Math.sin(theta),Math.cos(theta),0],['H',-Math.sin(theta),Math.cos(theta),0]],bonds:[[0,1,1],[0,2,1]]},
    {id:'carbon',name:'Kuldioxid · CO₂',geometry:'Lineær · O–C–O = 180°',atoms:[['C',0,0,0],['O',-1.2,0,0],['O',1.2,0,0]],bonds:[[0,1,2],[0,2,2]]},
    {id:'methane',name:'Metan · CH₄',geometry:'Tetraedrisk · H–C–H ≈ 109,47°',atoms:[['C',0,0,0],...[[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]].map(p=>['H',...p.map(x=>x/Math.sqrt(3))])],bonds:[[0,1,1],[0,2,1],[0,3,1],[0,4,1]]}
  ];
  globalThis.lectioPlusLabCore={tools,ions,ion,reaction,circuit,uncertainty,significant,simulate,review,profileSnapshot,formulas,glossary,molecules,bounded};
})();
