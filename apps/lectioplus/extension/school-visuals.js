(() => {
  'use strict';
  const M=globalThis.lectioPlusMath,C=globalThis.lectioPlusChemistry;
  const sub=s=>String(s).replace(/\d/g,d=>'₀₁₂₃₄₅₆₇₈₉'[d]);
  const short=n=>Math.abs(n)>=1e6||(n!==0&&Math.abs(n)<1e-4)?n.toExponential(3).replace('.',','):Number(n.toPrecision(5)).toLocaleString('da-DK',{maximumSignificantDigits:5});
  function html(tag,cls,text){const e=document.createElement(tag);e.className=cls||'';if(text!==undefined)e.textContent=text;return e;}
  function svg(tag,attrs={},text){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value] of Object.entries(attrs)){if(typeof value==='number'&&!Number.isFinite(value))throw Error('Figurens interval er for stort.');e.setAttribute(key,value);}if(text!==undefined)e.textContent=text;return e;}
  function picture(label){const s=svg('svg',{viewBox:'0 0 440 250',role:'img','aria-label':label,class:'lxp-result-diagram'});s.append(svg('title',{},label));return s;}
  function caption(node,text){node.append(html('figcaption','',text));return node;}
  function label(s,x,y,text,anchor='middle'){s.append(svg('text',{x,y,'text-anchor':anchor,class:'lxp-diagram-label'},text));}
  function line(s,x1,y1,x2,y2,cls='lxp-diagram-line'){s.append(svg('line',{x1,y1,x2,y2,class:cls}));}
  function arrow(s,x1,y1,x2,y2,cls='lxp-diagram-line'){
    if(x1===x2&&y1===y2)return;line(s,x1,y1,x2,y2,cls);const angle=Math.atan2(y2-y1,x2-x1),r=8;
    line(s,x2,y2,x2-r*Math.cos(angle-.45),y2-r*Math.sin(angle-.45),cls);line(s,x2,y2,x2-r*Math.cos(angle+.45),y2-r*Math.sin(angle+.45),cls);
  }
  function bounds(values){let lo=Math.min(...values),hi=Math.max(...values);if(!Number.isFinite(lo)||!Number.isFinite(hi))throw Error('Figuren kan ikke tegnes med disse værdier.');if(lo===hi){const pad=Math.abs(lo)*.1||1;lo-=pad;hi+=pad;}else{const pad=(hi-lo)*.08;lo-=pad;hi+=pad;}M.finite(hi-lo);return [lo,hi];}
  function plot(series,xLabel,yLabel,scatter=false){
    const s=picture(yLabel+' som funktion af '+xLabel),points=series.flatMap(x=>x.points).filter(p=>p.every(Number.isFinite));
    if(!points.length)throw Error('Ingen endelige punkter i figuren.');
    const [xmin,xmax]=bounds(points.map(p=>p[0])),[ymin,ymax]=bounds(points.map(p=>p[1]));
    const px=x=>56+(x-xmin)/(xmax-xmin)*350,py=y=>204-(y-ymin)/(ymax-ymin)*170;
    for(let i=0;i<=4;i++){const x=xmin+(xmax-xmin)*i/4,y=ymin+(ymax-ymin)*i/4;line(s,56,py(y),406,py(y),'lxp-diagram-grid');if(i%2===0){label(s,px(x),223,short(x));label(s,49,py(y)+4,short(y),'end');}}
    if(xmin<=0&&xmax>=0)line(s,px(0),34,px(0),204,'lxp-diagram-axis');if(ymin<=0&&ymax>=0)line(s,56,py(0),406,py(0),'lxp-diagram-axis');
    label(s,232,246,xLabel);label(s,56,17,yLabel,'start');
    series.forEach((item,index)=>{
      const cls=index?'lxp-diagram-secondary':'lxp-diagram-line';let path='',move=true;
      for(const p of item.points){if(!p.every(Number.isFinite)){move=true;continue;}path+=(move?' M':' L')+px(p[0]).toFixed(3)+' '+py(p[1]).toFixed(3);move=false;}
      if(!scatter&&!item.scatter)s.append(svg('path',{d:path,fill:'none',class:cls}));
      const dots=scatter||item.scatter?item.points:[item.points[0],item.points.at(-1)];
      for(const p of dots)if(p?.every(Number.isFinite))s.append(svg('circle',{cx:px(p[0]),cy:py(p[1]),r:3,class:index?'lxp-diagram-dot-secondary':'lxp-diagram-dot'}));
    });return s;
  }
  function bars(entries,unit=''){
    const host=html('div','lxp-visual-bars'),max=Math.max(...entries.map(([,v])=>Math.abs(v)))||1;
    for(const [name,value] of entries){M.finite(value);const row=html('div','lxp-visual-bar-row'),head=html('div','lxp-visual-bar-heading');head.append(html('span','',name),html('strong','',short(value)+(unit?' '+unit:'')));const track=html('div','lxp-visual-bar-track'),fill=html('span','lxp-visual-bar-fill');fill.style.width=(Math.abs(value)/max*100)+'%';fill.dataset.negative=String(value<0);track.append(fill);row.append(head,track);host.append(row);}return host;
  }
  function flow(entries){const node=html('div','lxp-visual-flow');entries.forEach(([name,value],i)=>{if(i)node.append(html('span','lxp-flow-arrow','→'));const card=html('div','lxp-flow-card');card.append(html('small','',name),html('strong','',value));node.append(card);});return node;}
  function geometry(type,v){
    const s=picture('Geometrisk figur med indtastede mål'),r=v.a,h=v.b||0;
    if(type==='triangle'){const scale=160/Math.max(r,h),w=r*scale,height=h*scale,x=220-w/2,y=204;s.append(svg('path',{d:`M${x} ${y} L${x+w} ${y} L${x} ${y-height} Z`,class:'lxp-diagram-shape'}));line(s,x+12,y,x+12,y-12);line(s,x,y-12,x+12,y-12);label(s,x+w/2,y+24,'a = '+short(r));label(s,x-12,y-height/2,'b = '+short(h),'end');label(s,x+w*.6+12,y-height*.55,'c = '+short(Math.hypot(r,h)),'start');}
    else if(type==='rectangle'||type==='triangle-area'){
      const scale=165/(Math.max(r,h)||1),w=r*scale,height=h*scale,x=220-w/2,y=204;
      if(type==='rectangle')s.append(svg('rect',{x,y:y-height,width:w,height,class:'lxp-diagram-shape'}));
      else {s.append(svg('path',{d:`M${x} ${y} L${x+w} ${y} L${x+w*.35} ${y-height} Z`,class:'lxp-diagram-shape'}));line(s,x+w*.35,y,x+w*.35,y-height,'lxp-diagram-dashed');}
      label(s,220,y+24,(type==='rectangle'?'Bredde':'Grundlinje')+' = '+short(r));label(s,x+w+10,y-height/2,'h = '+short(h),'start');
    }else if(type==='cylinder'){
      const scale=145/(Math.max(2*r,h)||1),rx=r*scale,height=h*scale,x=220,y=195,ry=rx*.27;
      s.append(svg('path',{d:`M${x-rx} ${y-height} L${x-rx} ${y} A${rx} ${ry} 0 0 0 ${x+rx} ${y} L${x+rx} ${y-height}`,class:'lxp-diagram-shape'}),svg('ellipse',{cx:x,cy:y-height,rx,ry,class:'lxp-diagram-shape'}));line(s,x,y-height,x+rx,y-height);label(s,x,y-height-ry-12,'r = '+short(r));label(s,x+rx+12,y-height/2,'h = '+short(h),'start');
    }else{
      s.append(svg('circle',{cx:220,cy:126,r:r===0?0:80,class:'lxp-diagram-shape'}));if(type==='sphere')s.append(svg('ellipse',{cx:220,cy:126,rx:r===0?0:80,ry:r===0?0:25,class:'lxp-diagram-dashed'}));line(s,220,126,r===0?220:300,126);label(s,260,113,'r = '+short(r));
    }return s;
  }
  globalThis.lectioPlusSchoolVisual=(visual)=>{
    if(!visual)return null;const {type,v={},rows=[]}=visual,figure=html('figure','lxp-tool-visual');figure.dataset.visual=type;
    const add=(node,note)=>{figure.append(node);return caption(figure,note);};
    if(type==='geometry')return add(geometry(v.shape==='triangle'?'triangle-area':v.shape,v),'Figur med mål. 3D-figurer vises som en skitse; brug de angivne tal.');
    if(type==='triangle')return add(geometry('triangle',v),'Ret vinkel mellem a og b. Figurens to kateter tegnes i samme skala.');
    if(type==='ions'||type==='ionlookup'){
      const compound=C.combine(v.positive,v.negative),s=picture('Ioner i '+compound.name);
      for(const [ion,count,x,color] of [[compound.positive,compound.positiveCount,115,'lxp-diagram-shape'],[compound.negative,compound.negativeCount,325,'lxp-diagram-shape-secondary']]){
        for(let i=0;i<count;i++){const y=65+i*55;s.append(svg('rect',{x:x-65,y:y-19,width:130,height:39,rx:12,class:color}));label(s,x,y+5,sub(ion.formula)+' '+Math.abs(ion.charge)+(ion.charge>0?'+':'−'));}
      }
      label(s,220,115,'+');label(s,220,232,sub(compound.formula));return add(s,'Forholdet mellem ionerne i en formelenhed. Dette er ikke en molekyle- eller krystalstrukturmodel.');
    }
    if(type==='molar'){
      const r=C.molarMass(v.formula,v.charge);return add(bars(r.breakdown.map(a=>[a.symbol+' × '+a.n,a.contribution]),'g/mol'),'Hvert grundstofs bidrag til molarmassen. Bjælkerne har en fælles skala.');
    }
    if(type==='moles'||type==='concentration'){
      const mass=C.molarMass(v.formula).mass,m=type==='concentration'?v.mass:v.mode==='mass'?v.value:v.value*mass,n=m/mass;
      const entries=[['Masse',short(m)+' g'],['Stofmængde',short(n)+' mol']];if(type==='concentration')entries.push(['Koncentration',short(n/v.volume)+' mol/L']);else entries.push(['Formelenheder',short(n*6.02214076e23)]);
      return add(flow(entries),'Divider massen med molarmassen '+short(mass)+' g/mol.'+(type==='concentration'?' Divider derefter med hele opløsningens volumen.':' Gang stofmængden med Avogadros konstant.'));
    }
    if(type==='balance'){
      const result=C.balance(v.reaction);return add(bars(result.atoms.map(a=>[a.symbol+': '+a.left+' før = '+a.right+' efter',a.left])),'Samme antal atomer af hvert grundstof på begge sider. Figuren viser atombevarelse, ikke en forudsigelse af reaktionen.');
    }
    if(type==='dilution'){
      const s=picture('Stamopløsning og slutvolumen'),ratio=v.c2/v.c1,v1=ratio*v.v2;
      for(const [x,fill,name,value] of [[90,ratio,'Stamopløsning',v1],[285,1,'Fyld op til',v.v2]]){s.append(svg('rect',{x,y:45,width:70,height:145,rx:4,class:'lxp-beaker'}),svg('rect',{x:x+2,y:188-140*fill,width:66,height:140*fill,class:'lxp-diagram-liquid'}));label(s,x+35,211,name);label(s,x+35,234,short(value)+' mL');}arrow(s,180,115,255,115);return add(s,'Skematisk volumensammenligning. Fyld op til slutvolumen; tilsæt ikke blot en beregnet mængde vand.');
    }
    if(type==='ph'){
      const ph=rows[0][1],s=picture('pH-skala med beregnet pH');for(let i=0;i<14;i++)s.append(svg('rect',{x:36+i*26,y:90,width:26,height:30,class:i<7?'lxp-ph-acid':'lxp-ph-base'}));
      const x=36+ph/14*364;arrow(s,x,50,x,85);label(s,x,35,'pH ≈ '+short(ph));label(s,36,147,'0');label(s,218,147,'7');label(s,400,147,'14');label(s,100,190,'Sur');label(s,218,190,'Neutral');label(s,335,190,'Basisk');return add(s,'Idealiseret pH ved 25 °C. pH-skalaen er logaritmisk; ét trin svarer til en faktor 10 i hydrogenionaktivitet.');
    }
    if(type==='interest'||type==='decay'||type==='motion'){
      const end=type==='interest'?v.periods:type==='decay'?v.time:v.t,count=end===0?0:100,points=[];
      for(let i=0;i<=count;i++){const x=count?end*i/count:0,y=type==='interest'?v.start*(1+v.rate/100)**x:type==='decay'?v.start*0.5**(x/v.half):v.v0*x+.5*v.a*x*x;if(Number.isFinite(y))points.push([x,y]);}
      return add(plot([{points}],type==='interest'?'Perioder':'Tid'+(type==='motion'?' (s)':''),type==='motion'?'Forskydning (m)':'Mængde / værdi'),type==='motion'?'Kurven følger konstant acceleration. Den viser forskydning, ikke samlet tilbagelagt strækning.':'Kurven viser den valgte matematiske model mellem start og sluttid.');
    }
    if(type==='quadratic'){
      const r=M.quadratic(v.a,v.b,v.c),roots=r.roots||[],center=v.a?-v.b/(2*v.a):roots[0]||0,radius=Math.max(2,...roots.map(x=>Math.abs(x-center)*1.4));
      const points=Array.from({length:121},(_,i)=>{const x=center-radius+2*radius*i/120;return [x,v.a*x*x+v.b*x+v.c];});
      return add(plot([{points},{points:roots.map(x=>[x,0]),scatter:true}],'x','ax² + bx + c'),'Reelle rødder markeres på x-aksen. Grafen er et numerisk udsnit; alle løsninger står i resultatet.');
    }
    if(type==='system'){
      const r=M.system(v.a,v.b,v.c,v.d,v.e,v.f),centerX=r.kind==='one'?r.x:0,centerY=r.kind==='one'?r.y:0,series=[];
      for(const [a,b,c] of [[v.a,v.b,v.c],[v.d,v.e,v.f]]){if(b!==0){const points=[centerX-5,centerX+5].map(x=>[x,(c-a*x)/b]);series.push({points});}else if(a!==0)series.push({points:[[c/a,centerY-5],[c/a,centerY+5]]});}
      if(!series.length)return add(flow([['Første ligning','0 = '+short(v.c)],['Anden ligning','0 = '+short(v.f)]]),'Nulrækkerne beskriver ingen bestemt linje.');
      return add(plot(series,'x','y'),'De to ligninger vises i hver sin farve. Sammenfaldende linjer ligger oven på hinanden.');
    }
    if(type==='regression'){
      const xs=M.values(v.xs),ys=M.values(v.ys),r=M.regression(xs,ys),min=Math.min(...xs),max=Math.max(...xs);
      return add(plot([{points:[[min,r.a*min+r.b],[max,r.a*max+r.b]]},{points:xs.map((x,i)=>[x,ys[i]]),scatter:true}],'x','y'),'Punkter: dine observationer. Linje: mindste kvadraters tilpasning.');
    }
    if(type==='statistics')return add(plot([{points:M.values(v.data).sort((a,b)=>a-b).map((y,i)=>[i+1,y]),scatter:true}],'Observation (sorteret)','Værdi',true),'Alle indtastede observationer er vist, sorteret efter størrelse. Rækkefølgen er ikke en tidsakse.');
    if(type==='percent'){
      const entries=v.mode==='change'?[['Før',v.a],['Efter',v.b]]:v.mode==='new'?[['Før',v.a],['Efter',v.a*(1+v.b/100)]]:[['Hele tallet',v.a],['Procentdelen',v.a*v.b/100]];
      return add(bars(entries),'Bjælkelængderne viser størrelser på samme skala. Minus vises med fortegn og mønster.');
    }
    if(type==='fractions'){
      const r=M.fraction(v.a,v.b),s=picture('Brøk på tallinjen'),value=r.decimal,max=Math.max(1,Math.abs(value)),x=220+value/max*160;
      line(s,50,130,390,130,'lxp-diagram-axis');label(s,220,160,'0');label(s,60,160,short(-max));label(s,380,160,short(max));s.append(svg('circle',{cx:x,cy:130,r:7,class:'lxp-diagram-dot'}));label(s,x,100,r.numerator+' / '+r.denominator);return add(s,'Den forkortede brøk markeret på en tallinje.');
    }
    if(type==='probability'){
      const s=picture('Binomialfordeling'),logs=[0];for(let i=1;i<=v.n;i++)logs[i]=logs[i-1]+Math.log(i);
      const probabilities=Array.from({length:v.n+1},(_,k)=>v.p===0?(k===0?1:0):v.p===1?(k===v.n?1:0):Math.exp(logs[v.n]-logs[k]-logs[v.n-k]+k*Math.log(v.p)+(v.n-k)*Math.log1p(-v.p))),max=Math.max(...probabilities)||1,width=350/probabilities.length;
      probabilities.forEach((p,k)=>s.append(svg('rect',{x:55+k*width,y:205-p/max*160,width:Math.max(.1,width*.8),height:p/max*160,class:k===v.k?'lxp-probability-selected':'lxp-probability-bar'})));
      label(s,45,49,short(max*100)+'%','end');label(s,55,228,'0');label(s,405,228,String(v.n));label(s,230,249,'Antal succeser');return add(s,'Sandsynlighed for hvert helt antal succeser. Den fremhævede søjle er k = '+v.k+'. Meget små søjler kan være usynlige.');
    }
    if(type==='force'){
      const s=picture(v.mode==='pressure'?'Tryk fra en vinkelret kraft':'Nettokraft på en genstand');s.append(svg('rect',{x:160,y:105,width:120,height:70,rx:8,class:'lxp-diagram-shape'}));
      if(v.mode==='pressure'){line(s,110,180,330,180,'lxp-diagram-axis');if(v.force!==0)arrow(s,220,40,220,100);label(s,220,25,'F⊥ = '+short(v.force)+' N');label(s,220,211,'A = '+short(v.area)+' m²');}
      else {label(s,220,145,'m = '+short(v.m)+' kg');const force=v.m*v.a;if(force!==0)arrow(s,force>=0?285:155,140,force>=0?395:45,140);label(s,220,70,'ΣF = '+short(force)+' N');}
      return add(s,'Skematisk illustration. Pilens længde er ikke en kraftskala.');
    }
    if(type==='energy')return add(bars(rows.map(([name,value])=>[name,value]),'J'),'Energi med fælles nulniveau og skala. Negativ potentiel energi er mulig ved h < 0.');
    if(type==='ohm'){
      const s=picture('Skematisk modstandskreds');s.append(svg('path',{d:'M90 75 H175 M265 75 H350 V185 H90 V127 M90 112 V75',class:'lxp-diagram-line',fill:'none'}),svg('rect',{x:175,y:60,width:90,height:30,class:'lxp-diagram-shape'}));line(s,70,112,110,112);line(s,79,127,101,127);label(s,220,40,'R = '+short(v.r)+' Ω');label(s,90,221,'U = '+short(v.u)+' V');label(s,300,221,'I = '+short(v.u/v.r)+' A');return add(s,'En ohmsk modstand med konstant spænding. Tegningen er skematisk.');
    }
    if(type==='waves'){
      const s=picture('To bølgelængder'),lambda=v.speed/v.frequency;let path='';for(let i=0;i<=200;i++){const x=40+i*1.8,y=125-55*Math.sin(i/200*4*Math.PI);path+=(i?' L':'M')+x+' '+y;}line(s,40,125,400,125,'lxp-diagram-axis');s.append(svg('path',{d:path,fill:'none',class:'lxp-diagram-line'}));label(s,40,220,'0');label(s,220,220,short(lambda)+' m');label(s,400,220,short(2*lambda)+' m');label(s,220,30,'λ = '+short(lambda)+' m');return add(s,'To bølgelængder langs afstandsaksen. Udsvingets højde er illustrativ; der er ikke indtastet en amplitude.');
    }
    if(type==='gas')return add(flow([['n, T og V',short(v.n)+' mol · '+short(v.t+273.15)+' K · '+short(v.v)+' L'],['p = nRT/V',short(rows[0][1])+' Pa']]),'pV = nRT. Beregnet ved volumen '+short(v.v)+' L.');
    if(type==='vectors'){
      const s=picture('To vektorer fra origo'),range=Math.max(Math.abs(v.ax),Math.abs(v.ay),Math.abs(v.bx),Math.abs(v.by),1),scale=85/range;
      line(s,25,125,415,125,'lxp-diagram-axis');line(s,220,25,220,225,'lxp-diagram-axis');
      arrow(s,220,125,220+v.ax*scale,125-v.ay*scale);arrow(s,220,125,220+v.bx*scale,125-v.by*scale,'lxp-diagram-secondary');label(s,220+v.ax*scale+12,125-v.ay*scale-10,'a');label(s,220+v.bx*scale+12,125-v.by*scale+18,'b');label(s,410,145,'x');label(s,235,25,'y');
      return add(s,'Vektorerne er tegnet fra samme origo med samme skala på begge akser.');
    }
    if(type==='units')return add(flow([['Fra',short(v.value)+' '+v.from],['Til',short(v.result)+' '+v.to]]),'Samme størrelse skrevet i to forskellige enheder.');
    if(type==='planner'){
      const grid=html('div','lxp-plan-grid');rows.forEach(([day,work])=>{const card=html('div','lxp-plan-day');card.append(html('small','',day),html('strong','',work));grid.append(card);});return add(grid,'Din fordeling dag for dag. Planen følger antal studiedage, ikke kalenderdatoer.');
    }
    return null;
  };

  globalThis.lectioPlusAtomModel=(z,a,charge=0)=>{
    const reference=globalThis.lectioPlusAtomData.find(item=>item.z===z);
    if(!reference||!Number.isInteger(a)||!reference.isotopes.includes(a))throw Error('Vælg en isotop fra listen.');
    if(reference.shells.reduce((sum,n)=>sum+n,0)!==z)throw Error('Elektronfordelingen kunne ikke valideres.');
    const ion=charge?globalThis.lectioPlusLabCore?.ions.find(i=>i.symbol===reference.symbol&&i.charge===charge):null;
    if(charge&&!ion)throw Error('Denne ion er ikke i det kontrollerede udvalg.');
    return {z,a,charge,protons:z,neutrons:a-z,electrons:z-charge,symbol:reference.symbol,shells:[...(ion?.shells||reference.shells)],configuration:ion?'Skaller: '+ion.shells.join(', '):reference.configuration,predicted:reference.predicted};
  };
  globalThis.lectioPlusAtomView=(element,a,visuals=true,charge=0)=>{
    const model=globalThis.lectioPlusAtomModel(element.z,a,charge),host=html('section','lxp-atom-view');
    const heading=html('h3','',`${element.symbol}-${a} · ${charge?'ion '+Math.abs(charge)+(charge>0?'+':'−'):'neutralt atom'}`);
    const legend=html('div','lxp-atom-legend');
    for(const [kind,symbol,name,amount,meaning] of [['proton','+','Protoner',model.protons,'Rød · positiv ladning (+1)'],['neutron','0','Neutroner',model.neutrons,'Grøn · ingen ladning (0)'],['electron','−','Elektroner',model.electrons,'Blå · negativ ladning (−1)']]){
      const card=html('div','lxp-atom-particle-stat'),swatch=html('span','lxp-atom-swatch',symbol);swatch.dataset.particle=kind;swatch.setAttribute('aria-hidden','true');
      card.dataset.countKind=kind;card.dataset.count=String(amount);card.append(swatch,html('strong','',amount+' '+name.toLowerCase()),html('span','',meaning));legend.append(card);
    }
    host.append(heading,legend);
    if(visuals){
      const figures=html('div','lxp-atom-figures'),figure=html('figure','lxp-atom-shells'),nucleusFigure=html('figure','lxp-atom-nucleus');
      const atom=svg('svg',{viewBox:'0 0 440 420',role:'img','aria-label':`${element.symbol}-${a}: ${model.protons} protoner, ${model.neutrons} neutroner og ${model.electrons} elektroner`,class:'lxp-atom-diagram'});
      atom.append(svg('title',{},'Forenklet skalmodel af '+element.name));
      model.shells.forEach((count,index)=>{
        const radius=model.shells.length===1?125:76+index*110/(model.shells.length-1);
        const shell=svg('g',{'data-shell':index+1,'data-count':count});shell.append(svg('circle',{cx:220,cy:205,r:radius,class:'lxp-atom-orbit'}));
        for(let i=0;i<count;i++){
          const angle=-Math.PI/2+2*Math.PI*i/count+(index%2?.12:0),cx=220+radius*Math.cos(angle),cy=205+radius*Math.sin(angle);
          const dot=svg('circle',{cx,cy,r:6,'data-particle':'electron'});dot.append(svg('title',{},'Elektron · skal '+(index+1)));shell.append(dot,svg('text',{x:cx,y:cy+3,'text-anchor':'middle',class:'lxp-atom-charge'},'−'));
        }
        atom.append(shell);
      });
      atom.append(svg('circle',{cx:220,cy:205,r:52,class:'lxp-atom-core'}),svg('text',{x:220,y:194,'text-anchor':'middle',class:'lxp-atom-core-label'},model.protons+' p⁺'),svg('text',{x:220,y:216,'text-anchor':'middle',class:'lxp-atom-core-label'},model.neutrons+' n⁰'));
      figure.append(atom);caption(figure,'Skallerne viser elektronfordelingen i '+(charge?'ionen':'det neutrale atom')+'. Cirklerne er en undervisningsmodel, ikke elektronernes faktiske baner.');
      const nucleus=svg('svg',{viewBox:'0 0 220 220',role:'img','aria-label':`Forstørret atomkerne: ${model.protons} protoner og ${model.neutrons} neutroner`,class:'lxp-nucleus-diagram'});
      const radius=Math.min(16,76/Math.sqrt(a));
      for(let i=0;i<a;i++){
        const distance=a===1?0:85*Math.sqrt((i+.5)/a),angle=i*Math.PI*(3-Math.sqrt(5)),cx=110+distance*Math.cos(angle),cy=110+distance*Math.sin(angle);
        const proton=Math.floor((i+1)*model.protons/a)>Math.floor(i*model.protons/a),kind=proton?'proton':'neutron';
        const dot=svg('circle',{cx,cy,r:radius,'data-particle':kind});dot.append(svg('title',{},proton?'Proton (+1)':'Neutron (0)'));nucleus.append(dot);
        if(a<=50)nucleus.append(svg('text',{x:cx,y:cy+Math.min(4,radius/3),'text-anchor':'middle','font-size':Math.min(13,radius*1.25),class:'lxp-nucleus-charge'},proton?'+':'0'));
      }
      nucleusFigure.append(html('h4','','Atomkernen · forstørret'),nucleus);caption(nucleusFigure,'Hver rød prik er en proton, og hver grøn prik er en neutron. Placeringen er skematisk.');
      figures.append(figure,nucleusFigure);host.append(figures);
    }else host.append(html('p','lxp-settings-help','Atomtegningen er slået fra under Vis illustrationer af beregninger. Tallene vises stadig.'));
    const shells=html('div','lxp-atom-shell-counts');model.shells.forEach((n,index)=>shells.append(html('span','',`${'KLMNOPQ'[index]}-skal: ${n} e⁻`)));host.append(shells);
    host.append(html('p','lxp-atom-equation',`Massetal A = ${a} = ${model.protons} protoner + ${model.neutrons} neutroner. Atomnummer Z = ${model.z}.`),html('p','lxp-settings-help','Elektronkonfiguration: '+model.configuration));
    if(model.predicted)host.append(html('p','lxp-atom-notice','Elektronfordelingen for dette meget tunge grundstof er teoretisk/forudsagt.'));
    host.append(html('p','lxp-settings-help','Partiklernes størrelse og afstande er ikke i målestok. Isotoper har samme antal protoner, men forskelligt antal neutroner. Isotopudvalget er begrænset og siger ikke, om en isotop er stabil.'));
    return host;
  };
})();
