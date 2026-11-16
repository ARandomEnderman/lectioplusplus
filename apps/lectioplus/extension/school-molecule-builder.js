(() => {
  'use strict';
  // Explicit atom/bond graphs: PubChem PUG REST, CIDs below, retrieved 2026-11-16.
  // Coordinates are drawing positions, never calculated equilibrium geometries.
  const catalog = [{"cid":962,"name":"Vand","atoms":[["O",300.0,195.5,0],["H",353.69,164.5,0],["H",246.31,164.5,0]],"bonds":[[0,1,1],[0,2,1]]},{"cid":783,"name":"Brint","atoms":[["H",250.0,180.0,0],["H",350.0,180.0,0]],"bonds":[[0,1,1]]},{"cid":977,"name":"Ilt","atoms":[["O",250.0,180.0,0],["O",350.0,180.0,0]],"bonds":[[0,1,2]]},{"cid":947,"name":"Kvælstof","atoms":[["N",250.0,180.0,0],["N",350.0,180.0,0]],"bonds":[[0,1,3]]},{"cid":222,"name":"Ammoniak","atoms":[["N",300.0,164.5,0],["H",353.69,133.5,0],["H",246.31,133.5,0],["H",300.0,226.5,0]],"bonds":[[0,1,1],[0,2,1],[0,3,1]]},{"cid":297,"name":"Metan","atoms":[["C",300.0,180.0,0],["H",353.69,149.0,0],["H",246.31,211.0,0],["H",269.0,126.31,0],["H",331.0,233.69,0]],"bonds":[[0,1,1],[0,2,1],[0,3,1],[0,4,1]]},{"cid":280,"name":"Kuldioxid","atoms":[["O",386.61,130.0,0],["O",213.39,230.0,0],["C",300.0,180.0,0]],"bonds":[[0,2,2],[1,2,2]]},{"cid":313,"name":"Hydrogenchlorid","atoms":[["Cl",250.0,180.0,0],["H",350.0,180.0,0]],"bonds":[[0,1,1]]},{"cid":6324,"name":"Ethan","atoms":[["C",250.0,180.0,0],["C",350.0,180.0,0],["H",250.0,118.0,0],["H",188.0,180.0,0],["H",250.0,242.0,0],["H",350.0,242.0,0],["H",412.0,180.0,0],["H",350.0,118.0,0]],"bonds":[[0,1,1],[0,2,1],[0,3,1],[0,4,1],[1,5,1],[1,6,1],[1,7,1]]},{"cid":6325,"name":"Ethen","atoms":[["C",250.0,180.0,0],["C",350.0,180.0,0],["H",219.0,126.31,0],["H",219.0,233.69,0],["H",381.0,233.69,0],["H",381.0,126.31,0]],"bonds":[[0,1,2],[0,2,1],[0,3,1],[1,4,1],[1,5,1]]},{"cid":6326,"name":"Ethyn","atoms":[["C",256.7,205.0,0],["C",343.31,155.0,0],["H",203.0,236.0,0],["H",397.0,124.0,0]],"bonds":[[0,1,3],[0,2,1],[1,3,1]]},{"cid":887,"name":"Methanol","atoms":[["O",256.7,230.0,0],["C",343.31,180.0,0],["H",374.31,233.69,0],["H",397.0,149.0,0],["H",312.31,126.31,0],["H",203.0,199.0,0]],"bonds":[[0,1,1],[0,5,1],[1,2,1],[1,3,1],[1,4,1]]},{"cid":702,"name":"Ethanol","atoms":[["O",386.61,158.1,0],["C",300.0,208.1,0],["C",213.39,158.1,0],["H",260.14,255.59,0],["H",339.86,255.59,0],["H",244.4,104.41,0],["H",159.71,127.1,0],["H",182.39,211.79,0],["H",440.3,189.1,0]],"bonds":[[0,1,1],[0,8,1],[1,2,1],[1,3,1],[1,4,1],[2,5,1],[2,6,1],[2,7,1]]},{"cid":8254,"name":"Dimethylether","atoms":[["O",300.0,230.0,0],["C",386.61,180.0,0],["C",213.39,180.0,0],["H",417.6,233.69,0],["H",440.3,149.0,0],["H",355.61,126.31,0],["H",244.4,126.31,0],["H",159.71,149.0,0],["H",182.39,233.69,0]],"bonds":[[0,1,1],[0,2,1],[1,3,1],[1,4,1],[1,5,1],[2,6,1],[2,7,1],[2,8,1]]},{"cid":784,"name":"Hydrogenperoxid","atoms":[["O",256.7,205.0,0],["O",343.31,155.0,0],["H",203.0,174.0,0],["H",397.0,186.0,0]],"bonds":[[0,1,1],[0,2,1],[1,3,1]]}];
  const valence={H:1,C:4,N:3,O:2,Cl:1},colors={H:'#e5e7eb',C:'#475569',N:'#386cf4',O:'#dc384b',Cl:'#408322'};
  const clone=g=>({atoms:g.atoms.map(a=>a.slice()),bonds:g.bonds.map(b=>b.slice())});
  function validate(value){
    if(!value||!Array.isArray(value.atoms)||!Array.isArray(value.bonds)||value.atoms.length>24||value.bonds.length>48)throw Error('Byggeren understøtter højst 24 atomer og 48 bindinger.');
    const graph=clone(value),used=Array(graph.atoms.length).fill(0),pairs=new Set();
    for(const a of graph.atoms)if(a.length!==4||!Object.hasOwn(valence,a[0])||!a.slice(1).every(Number.isFinite)||a[1]<20||a[1]>580||a[2]<20||a[2]>340||Math.abs(a[3])>150)throw Error('Ugyldigt atom eller placering.');
    for(const b of graph.bonds){const [i,j,o]=b;if(b.length!==3||!Number.isInteger(i)||!Number.isInteger(j)||i<0||j<0||i>=used.length||j>=used.length||i===j||![1,2,3].includes(o))throw Error('Ugyldig binding.');const key=[i,j].sort((a,b)=>a-b).join(':');if(pairs.has(key))throw Error('To atomer må kun have én binding med valgt bindingsorden.');pairs.add(key);used[i]+=o;used[j]+=o;}
    if(used.some((n,i)=>n>valence[graph.atoms[i][0]]))throw Error('For mange bindinger: H og Cl kan have 1, O 2, N 3 og C 4 i denne model.');
    return graph;
  }
  function formula(g){const counts={};for(const [s] of g.atoms)counts[s]=(counts[s]||0)+1;const symbols=Object.keys(counts).sort();if(counts.C){symbols.splice(symbols.indexOf('C'),1);if(counts.H)symbols.splice(symbols.indexOf('H'),1);symbols.unshift(...(counts.H?['C','H']:['C']));}return symbols.map(s=>s+(counts[s]>1?counts[s]:'')).join('');}
  function matrix(g){const m=g.atoms.map(()=>Array(g.atoms.length).fill(0));for(const [a,b,o] of g.bonds)m[a][b]=m[b][a]=o;return m;}
  function sameStructure(a,b){
    if(a.atoms.length!==b.atoms.length||a.bonds.length!==b.bonds.length||formula(a)!==formula(b))return false;
    const am=matrix(a),bm=matrix(b),sig=(g,m,i)=>g.atoms[i][0]+'|'+m[i].map((o,j)=>o?g.atoms[j][0]+o:'').filter(Boolean).sort().join(','),bs=b.atoms.map((_,i)=>sig(b,bm,i)),options=a.atoms.map((_,i)=>bs.flatMap((s,j)=>s===sig(a,am,i)?[j]:[]));
    if(options.some(x=>!x.length))return false;
    const order=options.map((_,i)=>i).sort((i,j)=>options[i].length-options[j].length),mapping=Array(a.atoms.length).fill(-1),taken=new Set();
    function visit(k){if(k===order.length)return true;const i=order[k];for(const j of options[i]){if(taken.has(j)||mapping.some((v,u)=>v>=0&&am[i][u]!==bm[j][v]))continue;mapping[i]=j;taken.add(j);if(visit(k+1))return true;taken.delete(j);mapping[i]=-1;}return false;}
    return visit(0);
  }
  function analyze(value){
    const g=validate(value),f=formula(g),used=Array(g.atoms.length).fill(0);for(const [a,b,o] of g.bonds){used[a]+=o;used[b]+=o;}
    const missing=used.map((n,i)=>valence[g.atoms[i][0]]-n),seen=new Set();if(g.atoms.length){const queue=[0];while(queue.length){const i=queue.pop();if(seen.has(i))continue;seen.add(i);for(const [a,b] of g.bonds){if(a===i&&!seen.has(b))queue.push(b);if(b===i&&!seen.has(a))queue.push(a);}}}
    const connected=g.atoms.length>0&&seen.size===g.atoms.length,record=connected&&!missing.some(Boolean)?catalog.find(c=>sameStructure(g,c)):undefined;
    return {formula:f,displayFormula:({222:'NH3',313:'HCl'})[record?.cid]||f,missing,connected,record:record?{name:record.name,cid:record.cid}:null,status:!g.atoms.length?'empty':!connected?'disconnected':missing.some(Boolean)?'incomplete':record?'known':'unknown'};
  }
  function bond(value,a,b,order){const g=validate(value),i=g.bonds.findIndex(x=>x[0]===a&&x[1]===b||x[0]===b&&x[1]===a);if(i>=0)g.bonds.splice(i,1);if(order)g.bonds.push([a,b,order]);return validate(g);}
  function removeAtom(value,index){const g=validate(value);if(!Number.isInteger(index)||!g.atoms[index])throw Error('Vælg et atom.');g.atoms.splice(index,1);g.bonds=g.bonds.filter(([a,b])=>a!==index&&b!==index).map(([a,b,o])=>[a>index?a-1:a,b>index?b-1:b,o]);return g;}
  function fillHydrogens(value){const g=validate(value),missing=analyze(g).missing;if(g.atoms.length+missing.reduce((a,b)=>a+b,0)>24)throw Error('Der er ikke plads til alle H-atomer. Maksimum er 24 atomer.');
    for(let i=0;i<missing.length;i++)for(let k=0;k<missing[i];k++){const angle=2*Math.PI*k/Math.max(missing[i],3)+i*1.1,atom=g.atoms[i];g.bonds.push([i,g.atoms.length,1]);g.atoms.push(['H',Math.max(20,Math.min(580,atom[1]+65*Math.cos(angle))),Math.max(20,Math.min(340,atom[2]+65*Math.sin(angle))),atom[3]]);}return validate(g);
  }
  globalThis.lectioPlusMoleculeBuilder={catalog:catalog.map(clone),references:catalog.map(({cid,name})=>({cid,name})),validate,analyze,formula,sameStructure,bond,removeAtom,fillHydrogens};
  const NS='http://www.w3.org/2000/svg',S=(tag,attrs={},text)=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;};
  globalThis.lectioPlusMoleculeWorkshop=(c,h)=>{
    const {E,B,field,prefs}=c,{node,inputs,output,status,select,action,range,calculate,help,link}=h,L=globalThis.lectioPlusLabCore,M=globalThis.lectioPlusMath;
    let graph={atoms:[],bonds:[]},selected=-1,history=[],pointer=null,suppressClick=false;
    const mode=select('molecule-mode','Visning',[['models','Se modeller'],['builder','Byg selv']]),modelWrap=E('div','lxp-molecule-model-select');inputs.append(modelWrap);
    const molecule=select('molecule','Molekyle',L.molecules.map(x=>[x.id,x.name]),'water',modelWrap),rx=range('rotation-x','Lodret rotation',20,-180,180,1,draw),ry=range('rotation-y','Vandret rotation',25,-180,180,1,draw),zoom=range('zoom','Zoom',100,50,150,1,draw);
    const workshop=E('section','lxp-molecule-workshop');workshop.hidden=true;inputs.after(workshop);
    const stored=E('input');stored.type='hidden';stored.dataset.field='builder-structure';stored.setAttribute('aria-label','Gemt molekylestruktur');inputs.append(stored);
    const toolbar=E('div','lxp-molecule-toolbar'),palette=E('div','lxp-molecule-palette'),stage=S('svg',{viewBox:'0 0 600 360',class:'lxp-molecule-stage',role:'group','aria-label':'Byggefelt til atomer og bindinger'}),stageWrap=E('div','lxp-molecule-stage-wrap'),details=E('div','lxp-molecule-controls');stageWrap.append(stage);
    const ghost=E('span','lxp-atom-drag-ghost');ghost.hidden=true;ghost.setAttribute('aria-hidden','true');workshop.append(ghost);
    const nameBox=E('section','lxp-molecule-identity'),nameLabel=E('span','lxp-molecule-identity-label','Molekylets navn'),nameValue=E('strong','lxp-molecule-name'),formulaValue=E('span','lxp-molecule-identity-formula'),nameHelp=E('p','lxp-settings-help');nameBox.setAttribute('role','status');nameBox.setAttribute('aria-live','polite');nameBox.setAttribute('aria-atomic','true');nameBox.append(nameLabel,nameValue,formulaValue,nameHelp);let identitySignature='';
    workshop.append(E('h3','','Byg dit molekyle'),E('p','lxp-settings-help','Træk atomer ind i byggefeltet, eller tryk på dem for at tilføje. Vælg Forbind, og tryk på to atomer. Navnet opdateres automatisk.'),palette,toolbar,nameBox,stageWrap,details);
    const interaction=select('builder-action','Handling',[['move','Flyt og vælg'],['bond','Forbind atomer']],'move',toolbar),order=select('builder-order','Binding',[['1','Enkeltbinding'],['2','Dobbeltbinding'],['3','Tripelbinding']],'1',toolbar);
    const example=select('builder-example','Eksempel',catalog.map(x=>[String(x.cid),x.name]),'962',toolbar);
    const atomSelect=select('builder-atom','Valgt atom',[['-1','Vælg et atom']],'-1',details);atomSelect.removeAttribute('data-field');
    const depth=field(details,{id:'builder-depth',label:'Dybde for valgt atom',type:'range',value:'0'});depth.type='range';depth.min='-150';depth.max='150';depth.step='10';depth.removeAttribute('data-field');
    const partner=select('builder-partner','Forbind med',[['-1','Vælg et atom']],'-1',details);partner.removeAttribute('data-field');
    function sync(){stored.value=JSON.stringify(graph);}
    function commit(next){const valid=validate(next);history.push(clone(graph));if(history.length>40)history.shift();graph=valid;sync();draw();}
    function run(fn){try{status.textContent='';fn();}catch(e){status.textContent=e.message;}}
    function setBond(a,b){if(a<0||b<0)throw Error('Vælg to atomer.');commit(bond(graph,a,b,Number(order.value)));status.textContent='Bindingen er opdateret.';}
    function choose(i){if(interaction.value==='bond'&&selected>=0&&selected!==i){run(()=>setBond(selected,i));selected=-1;}else selected=i;draw();}
    function add(symbol,x=300,y=180,auto=false){const next=clone(graph);if(next.atoms.length>=24)throw Error('Maksimum er 24 atomer.');const index=next.atoms.length;next.atoms.push([symbol,x,y,0]);selected=index;
      let linked=false;if(auto){const remaining=analyze(graph).missing,candidates=graph.atoms.map((a,i)=>({i,d:Math.hypot(a[1]-x,a[2]-y)})).filter(q=>q.d<80&&remaining[q.i]>0).sort((a,b)=>a.d-b.d);if(candidates.length){next.bonds.push([candidates[0].i,index,1]);linked=true;}}
      commit(next);status.textContent=symbol+' tilføjet'+(linked?' med enkeltbinding til nærmeste atom.':'.');
    }
    for(const symbol of Object.keys(valence)){const b=B('lxp-atom-palette-button','Tilføj '+symbol,()=>{if(suppressClick){suppressClick=false;return;}run(()=>add(symbol,180+((graph.atoms.length*73)%240),110+((graph.atoms.length*47)%140)));},symbol);b.style.setProperty('--atom-color',colors[symbol]);b.dataset.symbol=symbol;palette.append(b);}
    action('Indlæs eksempel',()=>{selected=-1;commit(catalog.find(x=>String(x.cid)===example.value));status.textContent='Eksemplet er indlæst. Du kan ændre atomer og bindinger.';},toolbar);
    action('Forbind valgte atomer',()=>setBond(selected,Number(partner.value)),details);
    action('Fjern valgt binding',()=>{if(selected<0||Number(partner.value)<0)throw Error('Vælg to atomer.');commit(bond(graph,selected,Number(partner.value),0));},details);
    action('Slet valgt atom',()=>{const next=removeAtom(graph,selected);selected=-1;commit(next);},details);
    action('Tilføj manglende H',()=>commit(fillHydrogens(graph)),toolbar);
    const undo=action('Fortryd ændring',()=>{if(history.length){graph=history.pop();selected=-1;sync();draw();}},toolbar);
    action('Ryd byggefelt',()=>{selected=-1;commit({atoms:[],bonds:[]});},toolbar);
    action('Nulstil rotation',()=>{rx.value='20';ry.value='25';zoom.value='100';draw()});
    atomSelect.addEventListener('change',()=>{selected=Number(atomSelect.value);draw()});
    depth.addEventListener('change',()=>run(()=>{if(selected<0)return;const next=clone(graph);next.atoms[selected][3]=Number(depth.value);commit(next);}));
    interaction.addEventListener('change',()=>{selected=-1;draw()});
    const point=e=>{const r=stage.getBoundingClientRect();return {x:(e.clientX-r.left)*600/r.width,y:(e.clientY-r.top)*360/r.height,inside:r.width>0&&r.height>0&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom};};
    const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
    workshop.addEventListener('pointerdown',e=>{if(e.button!==0)return;const b=e.target.closest('[data-symbol]'),atom=e.target.closest('[data-atom]');if(b){pointer={kind:'add',symbol:b.dataset.symbol,x:e.clientX,y:e.clientY,moved:false};}else if(atom){const i=Number(atom.dataset.atom);if(interaction.value==='bond'){choose(i);e.preventDefault();return;}selected=i;pointer={kind:'move',i,before:clone(graph),x:e.clientX,y:e.clientY,moved:false};draw();}else return;workshop.setPointerCapture?.(e.pointerId);});
    workshop.addEventListener('pointermove',e=>{if(!pointer)return;if(Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>4)pointer.moved=true;const p=point(e);stage.classList.toggle('lxp-drop-active',p.inside);if(pointer.kind==='add'&&pointer.moved){ghost.hidden=false;ghost.textContent=pointer.symbol;ghost.style.background=colors[pointer.symbol];ghost.style.color=pointer.symbol==='H'?'#111827':'white';ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';}if(pointer.kind==='move'&&pointer.moved&&p.inside){graph.atoms[pointer.i][1]=clamp(p.x,20,580);graph.atoms[pointer.i][2]=clamp(p.y,20,340);draw();}});
    workshop.addEventListener('pointerup',e=>{if(!pointer)return;const drag=pointer;pointer=null;ghost.hidden=true;stage.classList.remove('lxp-drop-active');const p=point(e);if(drag.kind==='add'&&drag.moved){suppressClick=true;setTimeout(()=>{suppressClick=false},0);if(p.inside)run(()=>add(drag.symbol,clamp(p.x,20,580),clamp(p.y,20,340),true));}else if(drag.kind==='move'&&drag.moved){history.push(drag.before);if(history.length>40)history.shift();sync();draw();}workshop.releasePointerCapture?.(e.pointerId);});
    for(const type of ['pointercancel','lostpointercapture'])workshop.addEventListener(type,()=>{if(pointer?.kind==='move'){graph=pointer.before;sync();draw();}pointer=null;ghost.hidden=true;stage.classList.remove('lxp-drop-active');});
    stage.addEventListener('keydown',e=>{const atom=e.target.closest('[data-atom]');if(!atom)return;const i=Number(atom.dataset.atom);if(['Enter',' '].includes(e.key)){e.preventDefault();choose(i);}else if(e.key==='Delete'){e.preventDefault();run(()=>{selected=-1;commit(removeAtom(graph,i));});}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();run(()=>{const next=clone(graph);next.atoms[i][1]=clamp(next.atoms[i][1]+(e.key==='ArrowLeft'?-10:e.key==='ArrowRight'?10:0),20,580);next.atoms[i][2]=clamp(next.atoms[i][2]+(e.key==='ArrowUp'?-10:e.key==='ArrowDown'?10:0),20,340);selected=i;commit(next);});}});
    stored.addEventListener('change',()=>{run(()=>{if(stored.value.length>12000)throw Error('Strukturen er for stor.');const next=validate(JSON.parse(stored.value));selected=-1;commit(next);});sync();});
    mode.addEventListener('change',()=>{status.textContent='';draw()});molecule.addEventListener('change',draw);
    function lines(svg,points,bonds,scale=1,cx=0,cy=0){for(const [a,b,n] of bonds){const p=points[a],q=points[b],dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy)||1;for(let j=0;j<n;j++){const offset=(j-(n-1)/2)*7;svg.append(S('line',{x1:cx+p.x*scale-dy/len*offset,y1:cy+p.y*scale+dx/len*offset,x2:cx+q.x*scale-dy/len*offset,y2:cy+q.y*scale+dx/len*offset,stroke:'var(--lxp-muted)','stroke-width':4}));}}}
    function draw(){calculate(()=>{
      const building=mode.value==='builder';node.classList.toggle('lxp-molecule-builder-active',building);workshop.hidden=!building;modelWrap.hidden=building;undo.disabled=!history.length;
      const info=analyze(graph),record=building?{name:info.record?.name||({empty:'Begynd med et atom',disconnected:'Flere adskilte dele',incomplete:'Strukturen er ikke færdig',unknown:'Ukendt struktur'}[info.status]),geometry:'Din 3D-skitse · placeringerne er dine egne.',atoms:graph.atoms.map(([s,x,y,z])=>[s,(x-300)/100,(y-180)/100,z/100]),bonds:graph.bonds}:L.molecules.find(x=>x.id===molecule.value);
      if(!record)throw Error('Vælg et gyldigt molekyle.');
      if(building){
        const signature=JSON.stringify([info.status,info.displayFormula,info.record?.name,info.missing]);
        if(signature!==identitySignature){
          identitySignature=signature;nameBox.dataset.state=info.status;
          nameValue.textContent=info.record?.name||({empty:'Intet molekyle endnu',disconnected:'Forbind atomerne',incomplete:'Mangler bindinger eller H-atomer',unknown:'Navnet findes ikke i kataloget'}[info.status]);
          formulaValue.textContent=info.formula?'Formel: '+info.displayFormula:'';
          nameHelp.textContent=info.status==='known'?'Navnet er fundet ud fra dine atomer og bindinger.':info.status==='incomplete'?'Tilføj bindinger, eller tryk Tilføj manglende H. Navnet vises automatisk, når strukturen genkendes.':info.status==='disconnected'?'Atomerne skal hænge sammen med bindinger for at blive genkendt som ét molekyle.':info.status==='unknown'?'Der er 15 kendte molekyler i kataloget. En ukendt struktur får ikke et gættet navn.':'Træk et atom ind, eller vælg et eksempel.';
        }
      }

      const ax=M.number(rx.value)*Math.PI/180,ay=M.number(ry.value)*Math.PI/180,scale=L.bounded(zoom.value,50,150)*(building?.7:1.1),points=record.atoms.map(([symbol,x,y,z])=>{const yy=y*Math.cos(ax)-z*Math.sin(ax),zz=y*Math.sin(ax)+z*Math.cos(ax);return {symbol,x:x*Math.cos(ay)+zz*Math.sin(ay),y:yy,z:-x*Math.sin(ay)+zz*Math.cos(ay)};});
      const s=S('svg',{viewBox:'0 0 560 400',class:'lxp-molecule',role:'img','aria-label':record.name+' drejelig model'});lines(s,points,record.bonds,scale,280,200);
      for(const p of points.slice().sort((a,b)=>a.z-b.z)){const x=280+p.x*scale,y=200+p.y*scale;s.append(S('circle',{cx:x,cy:y,r:p.symbol==='H'?17:25,fill:colors[p.symbol],stroke:'var(--lxp-text)','stroke-width':1}),S('text',{x,y:y+5,'text-anchor':'middle',fill:p.symbol==='H'?'#111827':'#ffffff','font-size':16},p.symbol));}
      for(const input of [rx,ry,zoom])input.closest('.lxp-lab-slider').querySelector('input[type=range]').value=input.value;
      output.replaceChildren(E('h3','',record.name),E('p','',record.geometry));output.dataset.error=building&&info.status!=='known'?'true':'false';
      if(building){output.append(E('p','lxp-molecule-formula',info.formula?'Formel: '+info.displayFormula:'Ingen atomer endnu'));
        const messages={empty:'Tilføj atomer fra paletten.',disconnected:'Forbind delene, før de kan genkendes som ét molekyle.',incomplete:'Der mangler '+info.missing.reduce((a,b)=>a+b,0)+' bindingsender i denne simple model. Tilføj bindinger eller manglende H.',unknown:'Denne struktur findes ikke i de 15 kontrollerede eksempler. Der gættes ikke et navn.',known:'Genkendt ud fra både grundstoffer og bindinger.'};output.append(E('p','lxp-settings-help',messages[info.status]));
        if(info.record){const a=E('a','lxp-text-link','Se '+info.record.name+' på PubChem');a.href='https://pubchem.ncbi.nlm.nih.gov/compound/'+info.record.cid;a.target='_blank';a.rel='noopener noreferrer';output.append(a);}
      }
      output.append(...(prefs().visuals?[s]:[E('p','lxp-settings-help','Illustrationer er slået fra.')]),E('p','lxp-settings-help','H: lys · C: grå · N: blå · O: rød · Cl: grøn. Farverne viser grundstoffer. 1, 2 eller 3 streger viser enkelt-, dobbelt- eller tripelbindinger.'));
      if(building){const focus=stage.contains(document.activeElement)?document.activeElement.dataset.atom:null;stage.replaceChildren();lines(stage,graph.atoms.map(([,x,y])=>({x,y})),graph.bonds);graph.atoms.forEach(([symbol,x,y],i)=>{const g=S('g',{'data-atom':i,tabindex:0,role:'button','aria-label':symbol+' atom '+(i+1),'aria-pressed':String(selected===i),class:'lxp-builder-atom'});g.append(S('circle',{cx:x,cy:y,r:21,fill:colors[symbol],stroke:selected===i?'var(--lxp-accent)':'var(--lxp-text)','stroke-width':selected===i?5:1}),S('text',{x,y:y+5,'text-anchor':'middle',fill:symbol==='H'?'#111827':'#ffffff','font-size':15},symbol),S('text',{x,y:y+36,'text-anchor':'middle',fill:'var(--lxp-muted)','font-size':12},String(i+1)));stage.append(g);});if(focus!==null)stage.querySelector('[data-atom="'+focus+'"]')?.focus();if(!graph.atoms.length)stage.append(S('text',{x:300,y:180,'text-anchor':'middle',fill:'var(--lxp-muted)','font-size':17},'Træk et atom herind'));
        const other=partner.value,options=[new Option('Vælg et atom','-1'),...graph.atoms.map(([s],i)=>new Option(s+' · atom '+(i+1),String(i)))];atomSelect.replaceChildren(...options);atomSelect.value=String(selected);partner.replaceChildren(...options.map(o=>o.cloneNode(true)));partner.value=graph.atoms[Number(other)]?other:'-1';depth.disabled=selected<0;depth.value=selected<0?'0':String(graph.atoms[selected][3]);
      }
    });}
    let rotation;
    output.addEventListener('pointerdown',e=>{if(e.target.closest('svg')){rotation={x:e.clientX,y:e.clientY,rx:Number(rx.value),ry:Number(ry.value)};output.setPointerCapture?.(e.pointerId)}});
    output.addEventListener('pointermove',e=>{if(rotation){rx.value=String(clamp(rotation.rx+(e.clientY-rotation.y)*.6,-180,180));ry.value=String(clamp(rotation.ry+(e.clientX-rotation.x)*.6,-180,180));draw();}});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])output.addEventListener(type,()=>{rotation=null});
    sync();draw();help('Byggeren bruger en enkel model for neutrale molekyler: H/Cl 1, O 2, N 3 og C 4 bindinger. Alle H-atomer skal vises. Den beregner ikke stabilitet, ladninger, radikaler eller den fysiske 3D-geometri. Brug dybdeskyderen til din egen skitse og Gem denne opsætning for at gemme den.');link('Kilde: bindinger og Lewis-strukturer','https://openstax.org/books/chemistry-2e/pages/7-3-lewis-symbols-and-structures');return {node,refresh:draw};
  };
})();
