(() => {
  'use strict';
  const fail = (message) => { throw new Error(message); };
  const finite = (n) => Number.isFinite(n) ? n : fail('Resultatet er ikke et endeligt reelt tal. Kontrollér værdierne.');
  function number(text) {
    const s = String(text).trim().replace(',', '.');
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s)) fail('Skriv et tal. Brug komma eller punktum som decimaltegn, uden tusindtalsseparator.');
    const value=finite(Number(s));
    if(value===0 && /[1-9]/.test(s.split(/e/i)[0])) fail('Tallet er for lille til at kunne beregnes sikkert.');
    return value;
  }
  const positive = (n, zero = false) => (zero ? n >= 0 : n > 0) ? n : fail(zero ? 'Værdien skal være mindst 0.' : 'Værdien skal være større end 0.');
  // Parse the whole expression before evaluating it, also for graph domains.
  function compile(text, degrees = true, variable = true) {
    if (/[0-9.]\s+[0-9.]/.test(String(text))) fail('Der mangler et regnetegn mellem tallene.');
    const source=String(text).replace(/,/g,'.').replace(/π/g,'pi').replace(/[−–]/g,'-').replace(/×/g,'*').replace(/÷/g,'/').replace(/\s/g,'');
    if(!source || source.length>300) fail('Skriv et regneudtryk på højst 300 tegn.');
    const tokens=source.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[a-zA-Z]+|[()+\-*/^!%]/g)||[];
    if(tokens.join('')!==source || tokens.length>200)fail('Ukendt tegn i regneudtrykket.');
    const trig=degrees?Math.PI/180:1;
    const functions={sqrt:Math.sqrt,abs:Math.abs,ln:Math.log,log:Math.log10,exp:v=>nonzero(Math.exp(v),true),
      sin:v=>Math.sin(v*trig),cos:v=>Math.cos(v*trig),tan:v=>{if(Math.abs(Math.cos(v*trig))<1e-14)fail('Tangens er ikke defineret ved denne vinkel.');return Math.tan(v*trig)},
      asin:v=>Math.asin(v)/trig,acos:v=>Math.acos(v)/trig,atan:v=>Math.atan(v)/trig};
    let pos=0,depth=0;
    function parse(min=0){
      if(++depth>50)fail('Udtrykket er for dybt indlejret.');
      const token=tokens[pos++];let left;
      if(token==='+'||token==='-')left=['sign',token,parse(25)];
      else if(token==='('){left=parse();if(tokens[pos++]!==')')fail('Der mangler en afsluttende parentes.');}
      else if(Object.hasOwn(functions,token)){if(tokens[pos++]!=='(')fail('Sæt parentes omkring funktionens input.');left=['fn',token,parse()];if(tokens[pos++]!==')')fail('Der mangler en parentes.');}
      else if(token==='pi'||token==='e')left=['value',token==='pi'?Math.PI:Math.E];
      else if(token==='x'){if(!variable)fail('Brug Graftegner til udtryk med x.');left=['x'];}
      else if(token&&/^(\d|\.)/.test(token))left=['value',number(token)];
      else fail('Udtrykket er ufuldstændigt eller indeholder en ukendt funktion.');
      while(pos<tokens.length){
        const next=tokens[pos];
        if(next==='!'||next==='%'){if(40<min)break;pos++;left=['post',next,left];continue;}
        const implicit=next==='('||/^[a-zA-Z]/.test(next),op=implicit?'*':next,bp={'+':10,'-':10,'*':20,'/':20,'^':30}[op];
        if(bp===undefined||bp<min)break;if(!implicit)pos++;
        left=['binary',op,left,parse(op==='^'?bp:bp+1)];
      }
      depth--;return left;
    }
    const tree=parse();if(pos!==tokens.length)fail('Kontrollér parenteser og regnetegn.');
    function evaluate(node,x){
      const [kind,op,a,b]=node;
      if(kind==='value')return op;
      if(kind==='x')return finite(x);
      const v=evaluate(a,x);
      if(kind==='sign')return op==='-'?-v:v;
      if(kind==='fn')return finite(functions[op](v));
      if(kind==='post'){
        if(op==='%')return nonzero(v/100,v!==0);
        if(!Number.isInteger(v)||v<0||v>170)fail('Fakultet kræver et helt tal fra 0 til 170.');
        let result=1;for(let i=2;i<=v;i++)result*=i;return finite(result);
      }
      return arithmetic(v,evaluate(b,x),op);
    }
    return x=>evaluate(tree,x);
  }
  function nonzero(value,expected){finite(value);if(value===0&&expected)fail('Resultatet er for lille til at kunne vises pålideligt.');return value;}
  function arithmetic(a,b,op){
    finite(a);finite(b);
    if(op==='+')return finite(a+b);
    if(op==='-')return finite(a-b);
    if(op==='*')return nonzero(a*b,a!==0&&b!==0);
    if(op==='/'){if(b===0)fail('Division med nul er ikke defineret.');return nonzero(a/b,a!==0);}
    if(op==='^'){if(a===0&&b===0)fail('0 opløftet i 0 er ikke defineret i denne beregner.');return nonzero(a**b,a!==0);}
    fail('Ukendt regnetegn.');
  }
  function expression(text,x,degrees=true){return compile(text,degrees,x!==undefined)(x);}
  function classic(){
    let entry='0',stored=null,operator='',waiting=false,last=null,message='',history='',replaceEntry=false;
    let memory=null,answer=null;const records=[];
    const write=n=>{entry=String(finite(n));};
    const reset=()=>{entry='0';stored=null;operator='';waiting=false;last=null;message='';history='';replaceEntry=false;};
    function record(expression,result){answer=result;records.unshift({expression,result});if(records.length>20)records.pop();}
    function insert(value,label=''){write(value);message='';waiting=false;replaceEntry=true;last=null;if(!operator)history=label;}
    function use(value){try{insert(finite(value),'Fra historik');}catch(e){message=e.message;}return state();}
    function press(key){
      if(key==='C'){reset();return state();}
      if(key==='CE'){entry='0';waiting=false;replaceEntry=false;last=null;message='';history=operator?stored+' '+operator:'';return state();}
      if(key==='MC'){memory=null;return state();}
      if(key==='clear-history'){records.length=0;return state();}
      if(key==='MR'&&memory!==null){insert(memory,'Fra hukommelse');return state();}
      if(key==='Ans'&&answer!==null){insert(answer,'Seneste resultat');return state();}
      if(message){if(/^[0-9.,]$/.test(key))reset();else return state();}
      try {
        if(/^[0-9]$/.test(key)){if(waiting||replaceEntry){if(!operator)history='';entry=key;waiting=false;replaceEntry=false;}else if(entry.replace(/[^0-9]/g,'').length<16)entry=entry==='0'?key:entry+key;last=null;}
        else if(key==='.'||key===','){if(waiting||replaceEntry){if(!operator)history='';entry='0.';waiting=false;replaceEntry=false;}else if(!entry.includes('.')&&!/e/i.test(entry))entry+='.';last=null;}
        else if(key==='Backspace'){if(!waiting&&!/e/i.test(entry))entry=entry.length>1?entry.slice(0,-1):'0';if(entry==='-')entry='0';last=null;replaceEntry=false;}
        else if(key==='±'){write(-Number(entry));waiting=false;}
        else if(key==='%'){const value=arithmetic(Number(entry),100,'/');write((operator==='+'||operator==='-')?arithmetic(stored,value,'*'):value);waiting=false;}
        else if(key==='MS')memory=Number(entry);
        else if(key==='M+'||key==='M-')memory=arithmetic(memory??0,Number(entry),key==='M+'?'+':'-');
        else if(key==='pi')insert(Math.PI,'π');
        else if(['sqrt','square','reciprocal','abs'].includes(key)){
          const value=Number(entry);let result,label;
          if(key==='sqrt'){if(value<0)fail('Kvadratroden af et negativt tal er ikke et reelt tal.');result=Math.sqrt(value);label='√('+value+')';}
          else if(key==='square'){result=arithmetic(value,2,'^');label='('+value+')²';}
          else if(key==='reciprocal'){result=arithmetic(1,value,'/');label='1/('+value+')';}
          else {result=Math.abs(value);label='|'+value+'|';}
          insert(result);history=(operator?stored+' '+operator+' ':'')+label+(operator?'':' =');record(label,result);
        }
        else if(['+','-','*','/','^'].includes(key)){
          const value=Number(entry);
          if(operator&&!waiting){const calculation=stored+' '+operator+' '+value;stored=arithmetic(stored,value,operator);write(stored);record(calculation,stored);}else if(stored===null||!operator)stored=value;
          operator=key;waiting=true;last=null;history=String(stored)+' '+key;
        }else if(key==='='){
          const op=operator||last?.op;if(op){const right=operator?Number(entry):last.right,left=operator?stored:Number(entry);write(arithmetic(left,right,op));const calculation=left+' '+op+' '+right;history=calculation+' =';record(calculation,Number(entry));last={op,right};stored=null;operator='';waiting=true;}
        }
      }catch(e){message=e.message;}
      return state();
    }
    function state(){return {display:message?'Fejl':(waiting||replaceEntry||/e/i.test(entry)?String(Number(Number(entry).toPrecision(15))):entry).replace('.',','),value:message?null:Number(entry),history,error:message,memory,answer,records:records.map(item=>({...item}))};}
    return {press,state,use};
  }
  function values(text) {
    const parts=String(text).trim().split(/[;\n\s]+/).filter(Boolean);
    if(!parts.length||parts.length>1000)fail('Skriv 1–1000 tal adskilt med mellemrum, semikolon eller linjeskift.');
    return parts.map(number);
  }
  function statistics(numbers) {
    const a=[...numbers].sort((x,y)=>x-y),n=a.length;if(!n)fail('Der mangler data.');
    const scale=Math.max(...a.map(x=>Math.abs(finite(x))))||1,scaledMean=a[0]===a[n-1]?a[0]/scale:a.reduce((s,x)=>s+(x/scale)/n,0),mean=nonzero(scaledMean*scale,scaledMean!==0),squares=a.reduce((s,x)=>s+(x/scale-scaledMean)**2,0);
    const median=b=>b.length%2?b[(b.length-1)/2]:(Math.sign(b[b.length/2-1])===Math.sign(b[b.length/2])?b[b.length/2-1]+(b[b.length/2]-b[b.length/2-1])/2:b[b.length/2-1]/2+b[b.length/2]/2);
    const lower=a.slice(0,Math.floor(n/2)),upper=a.slice(Math.ceil(n/2));
    return {n,sum:finite(a.reduce((s,x)=>s+x,0)),mean:finite(mean),median:median(a),min:a[0],max:a.at(-1),q1:lower.length?median(lower):a[0],q3:upper.length?median(upper):a[0],populationSD:finite(Math.sqrt(squares/n)*scale),sampleSD:n>1?finite(Math.sqrt(squares/(n-1))*scale):null};
  }
  function regression(xs,ys) {
    if(xs.length!==ys.length||xs.length<2)fail('Skriv lige mange x- og y-værdier, mindst to par.');
    const mx=statistics(xs).mean,my=statistics(ys).mean;
    let xx=0,xy=0,yy=0;xs.forEach((x,i)=>{xx+=(x-mx)**2;xy+=(x-mx)*(ys[i]-my);yy+=(ys[i]-my)**2});
    if(xs.every(x=>x===xs[0])||xx===0)fail('X-værdierne må ikke alle være ens.');
    return {a:finite(xy/xx),b:finite(my-xy/xx*mx),r2:ys.every(y=>y===ys[0])||yy===0?null:Math.min(1,finite((xy/Math.sqrt(xx)/Math.sqrt(yy))**2))};
  }
  // Treat entered decimal coefficients exactly when deciding zero/sign.
  // Avoid false unique solutions caused by e.g. 0.1 * 0.6 - 0.2 * 0.3.
  function decimal(value){
    finite(value);const [mantissa,exp='0']=String(value).toLowerCase().split('e'),parts=mantissa.split('.');
    const power=Number(exp)-(parts[1]?.length||0),n=BigInt(parts.join(''));
    return power>=0?[n*10n**BigInt(power),1n]:[n,10n**BigInt(-power)];
  }
  const product=(a,b)=>[a[0]*b[0],a[1]*b[1]];
  const difference=(a,b)=>[a[0]*b[1]-b[0]*a[1],a[1]*b[1]];
  function ratio(n,d){
    if(d===0n)fail('Division med nul er ikke defineret.');
    if(n===0n)return 0;
    const sign=(n<0n)!==(d<0n)?-1:1,ns=String(n<0n?-n:n),ds=String(d<0n?-d:d);
    const lead=s=>Number(s.slice(0,16))/10**(Math.min(16,s.length)-1);
    const v=Number((sign*lead(ns)/lead(ds))+'e'+(ns.length-ds.length));
    return nonzero(v,true);
  }
  const quotient=(a,b)=>ratio(a[0]*b[1],a[1]*b[0]);
  function quadratic(a,b,c){
    const [aa,bb,cc]=[a,b,c].map(decimal);
    if(a===0){if(b===0)return {kind:c===0?'all':'none',roots:[]};return {kind:'linear',roots:[-quotient(cc,bb)]};}
    const disc=difference(product(bb,bb),product([4n,1n],product(aa,cc)));
    if(disc[0]===0n)return {kind:'double',discriminant:0,roots:[-quotient(bb,product([2n,1n],aa))]};
    const scale=Math.max(Math.abs(a),Math.abs(b),Math.abs(c));
    const divisor=product(decimal(scale),decimal(scale));
    const normalized=quotient(disc,divisor),an=a/scale,bn=b/scale,cn=c/scale;
    if(an===0||(c!==0&&cn===0))fail('Koefficienterne har for forskellig størrelse til en pålidelig løsning.');
    let discriminant;try{discriminant=ratio(disc[0],disc[1]);}catch{ /* Roots may be representable even if the discriminant is not. */ }
    if(normalized<0)return {kind:'complex',discriminant,real:finite(-bn/(2*an)),imaginary:finite(Math.sqrt(-normalized)/(2*Math.abs(an))),roots:[]};
    const q=-0.5*(bn+(bn<0?-1:1)*Math.sqrt(normalized));
    return {kind:'two',discriminant,roots:[nonzero(q/an,q!==0),nonzero(cn/q,c!==0)].sort((x,y)=>x-y)};
  }
  function system(a,b,c,d,e,f){
    const [aa,bb,cc,dd,ee,ff]=[a,b,c,d,e,f].map(decimal);
    const det=difference(product(aa,ee),product(bb,dd));
    const dx=difference(product(cc,ee),product(bb,ff)),dy=difference(product(aa,ff),product(cc,dd));
    if(det[0]===0n){
      if((a===0&&b===0&&c!==0)||(d===0&&e===0&&f!==0)||dx[0]!==0n||dy[0]!==0n)return {kind:'none'};
      return {kind:'all'};
    }
    return {kind:'one',x:quotient(dx,det),y:quotient(dy,det)};
  }
  function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a;}
  function fraction(a,b){if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||b===0)fail('Brug hele tal op til 9×10¹⁵ og en nævner forskellig fra nul.');const g=gcd(a,b),sign=b<0?-1:1;return {numerator:a/g*sign,denominator:Math.abs(b/g),decimal:a/b};}
  function binomial(n,k,p){if(!Number.isInteger(n)||!Number.isInteger(k)||n<0||n>500||k<0||k>n||p<0||p>1)fail('Brug 0 ≤ k ≤ n ≤ 500 som hele tal og 0 ≤ p ≤ 1.');let cumulative=0,exact=0;for(let j=0;j<=k;j++){let prob;if(p===0)prob=j===0?1:0;else if(p===1)prob=j===n?1:0;else{let log=0;for(let i=1;i<=j;i++)log+=Math.log(n-i+1)-Math.log(i);prob=Math.exp(log+j*Math.log(p)+(n-j)*Math.log1p(-p));}cumulative+=prob;if(j===k)exact=prob;}if(p>0&&p<1&&exact===0)fail('Sandsynligheden er positiv, men for lille til denne beregner.');return {exact,cumulative:Math.min(1,cumulative),mean:n*p,sd:Math.sqrt(n*p*(1-p))};}
  const units={
    length:{label:'Længde',values:{mm:0.001,cm:0.01,m:1,km:1000}},
    mass:{label:'Masse',values:{mg:0.000001,g:0.001,kg:1,t:1000}},
    time:{label:'Tid',values:{s:1,min:60,h:3600,døgn:86400}},
    area:{label:'Areal',values:{'mm²':0.000001,'cm²':0.0001,'m²':1,ha:10000,'km²':1000000}},
    volume:{label:'Volumen',values:{mL:0.000001,'cm³':0.000001,L:0.001,'m³':1}},
    speed:{label:'Hastighed',values:{'m/s':1,'km/t':1/3.6}},
    pressure:{label:'Tryk',values:{Pa:1,kPa:1000,bar:100000,atm:101325}},
    energy:{label:'Energi',values:{J:1,kJ:1000,Wh:3600,kWh:3600000}},
    temperature:{label:'Temperatur',values:{'°C':1,K:1,'°F':1}}
  };
  function convert(value,category,from,to){const u=units[category];if(!u||!Object.hasOwn(u.values,from)||!Object.hasOwn(u.values,to))fail('Vælg enheder af samme type.');if(category==='temperature'){finite(value);const lower={K:0,'°C':-273.15,'°F':-459.67};if(value<lower[from])fail('Temperaturen er under det absolutte nulpunkt.');const k=value===lower[from]?0:from==='K'?value:from==='°C'?value+273.15:(value-32)*5/9+273.15;if(k<0)fail('Temperaturen er under det absolutte nulpunkt.');return finite(to==='K'?k:to==='°C'?k-273.15:(k-273.15)*9/5+32);}return finite(value*u.values[from]/u.values[to]);}
  globalThis.lectioPlusMath={fail,finite,number,positive,expression,compile,classic,values,statistics,regression,quadratic,system,gcd,fraction,binomial,units,convert};
})();
