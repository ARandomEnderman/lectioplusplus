(() => {
  'use strict';
  const X=globalThis.lectioPlusExpanded,M=globalThis.lectioPlusMath;
  const special=[
    ['formula-rewrite','math','Algebra','Formelomskriver','Vælg en formel og den størrelse, du vil finde.'],
    ['probability-tree','math','Sandsynlighed','Byg et sandsynlighedstræ','Tilføj grene, kontrollér summer, og beregn stier.'],
    ['atom-builder','chemistry','Atomer og bindinger','Byg et atom','Træk protoner, neutroner og elektroner ind, og se grundstofnavnet.'],
    ['lewis','chemistry','Atomer og bindinger','Lewis og elektronpar','Placér bindinger og frie elektronpar i udvalgte molekyler.'],
    ['orbitals','chemistry','Atomer og bindinger','Orbitaler og elektroner','Se elektronkonfiguration og orbitalbokse for de første 20 grundstoffer.'],
    ['organic','chemistry','Organisk kemi','Organiske stofgrupper','Undersøg og øv funktionelle grupper i strukturformler.'],
    ['cells','biology','Celler og processer','Undersøg cellen','Klik på organeller i en plante- eller dyrecelle.'],
    ['references','language','Skrivning og kilder','Kildehenvisninger','Byg litteraturliste og henvisninger ud fra egne kilder.'],
    ['outline','language','Skrivning og kilder','Visuel opgavebygger','Skriv og flyt afsnit, og saml din opgave.'],
    ['quotations','language','Skrivning og kilder','Citatbank','Gem citat, kilde, sidetal og egne kommentarer hver for sig.'],
    ['analysis','language','Dansk','Dansk analyse','Arbejdsskabeloner til novelle, digt, tale og reklame.'],
    ['english-tenses','language','Sprogøvelser','Engelske tider','Tidslinjer, eksempler og øvelser i engelske tider.'],
    ['german-cases','language','Sprogøvelser','Tysk kasus','Undersøg sætningsled og bestemte artikler i fire kasus.'],
    ['vocabulary','language','Sprogøvelser','Gloseværksted','Skriv svar, match ord og udfyld huller med egne gloser.'],
    ['text-diff','language','Skrivning og kilder','Sammenlign tekster','Fremhæv ord, der er tilføjet eller fjernet.'],
    ['code-workshop','programming','Kodeværksted','Kodeværksted','Skriv og kør Python, JavaScript, HTML/CSS og SQL. 125 Python-opgaver og fri kode.'],
    ['flowchart','programming','Planlæg og forstå','Flowchart','Byg og flyt handlinger, betingelser og forbindelser.'],
    ['regex','programming','Tekst og data','Regex-værksted','Test mønstre med fremhævede match og en stopknap.'],
    ['sql','programming','Tekst og data','SQL-øvelser','Kør SQLite-forespørgsler i en lokal øvelsesdatabase.'],
    ['submission-check','study','Opgaver og eksamen','Afleveringstjek','Lav faglige tjeklister med egne afleveringskrav.'],
    ['exam-practice','study','Opgaver og eksamen','Eksamensøvelse','Træk egne spørgsmål med forberedelsestid og skjulte stikord.'],
    ['presentation-timer','study','Opgaver og eksamen','Fremlæggelsestimer','Planlæg afsnit og følg tiden under din fremlæggelse.'],
    ['topic-progress','study','Overblik og repetition','Mit emneoverblik','Vurder emner og forbind dem med egne noter og værktøjer.'],
    ['mistake-book','study','Overblik og repetition','Min fejlbog','Gem fejl, forklaringer og øvelser til næste gang.'],
    ['mindmap','study','Overblik og repetition','Mindmap','Flyt begreber og forbind dem med navngivne pile.'],
    ['timeline','study','Overblik og repetition','Tidslinje','Placér begivenheder og kilder på parallelle tidslinjer.'],
    ['ocr','study','Import og eksport','Tekst fra billeder','Læs dansk og engelsk tekst fra et billede lokalt.'],
    ['data-import','study','Import og eksport','Importér målinger','Åbn CSV eller indsæt en tabel, og vælg dine kolonner.'],
    ['tool-flow','study','Import og eksport','Forbind værktøjer','Flyt værdier mellem molarmasse, stofmængde, koncentration og gasvolumen.'],
    ['rich-notes','study','Noter og ark','Faglige noter','Navngivne noter med afsnit, tabeller, formler og figurer.'],
    ['tool-guide','study','Kom i gang','Find det rette værktøj','Vælg din opgave og se nødvendige oplysninger og relevante værktøjer.']
  ];
  for(const [id,category,group,title,description]of special)X.tools.push({id,category,group,title,description,special:true,expanded:true,guide:'Vælg en aktivitet og følg felterne. Dine egne tekster kan gemmes lokalt og tages med i backup.'});
  X.lewis=[
    {formula:'H2O',name:'Vand',atoms:['O','H','H'],bonds:[[0,1,1],[0,2,1]],pairs:[2,0,0],valence:[6,1,1]},
    {formula:'CO2',name:'Carbondioxid',atoms:['C','O','O'],bonds:[[0,1,2],[0,2,2]],pairs:[0,2,2],valence:[4,6,6]},
    {formula:'NH3',name:'Ammoniak',atoms:['N','H','H','H'],bonds:[[0,1,1],[0,2,1],[0,3,1]],pairs:[1,0,0,0],valence:[5,1,1,1]},
    {formula:'CH4',name:'Metan',atoms:['C','H','H','H','H'],bonds:[[0,1,1],[0,2,1],[0,3,1],[0,4,1]],pairs:[0,0,0,0,0],valence:[4,1,1,1,1]},
    {formula:'N2',name:'Dinitrogen',atoms:['N','N'],bonds:[[0,1,3]],pairs:[1,1],valence:[5,5]},
    {formula:'O2',name:'Dioxygen (Lewis-model)',atoms:['O','O'],bonds:[[0,1,2]],pairs:[2,2],valence:[6,6]}
  ];
  X.organic=[
    ['Ethanol','CH₃–CH₂–OH','–OH','Alkohol','En hydroxylgruppe på et mættet carbonatom.'],
    ['Ethansyre','CH₃–C(=O)–OH','–C(=O)–OH','Carboxylsyre','Carboxylgruppen indeholder både C=O og OH på samme carbonatom.'],
    ['Ethanal','CH₃–C(=O)–H','–C(=O)–H','Aldehyd','Carbonylgruppens carbon er bundet til mindst ét H.'],
    ['Propanon','CH₃–C(=O)–CH₃','–C(=O)–','Keton','Carbonylgruppen er bundet til carbon på begge sider.'],
    ['Ethylethanoat','CH₃–C(=O)–O–CH₂–CH₃','–C(=O)–O–','Ester','En carboxylsyrederivatgruppe med O bundet videre til carbon.'],
    ['Ethen','CH₂=CH₂','C=C','Alken','En carbon–carbon-dobbeltbinding.'],
    ['Ethyn','HC≡CH','C≡C','Alkyn','En carbon–carbon-tripeltbinding.'],
    ['Ethylamin','CH₃–CH₂–NH₂','–NH₂','Amin','Her en primær amin, hvor N er bundet til én carbonholdig gruppe.'],
    ['Dimethylether','CH₃–O–CH₃','–O–','Ether','Oxygen mellem to carbonholdige grupper.'],
    ['Ethanamid','CH₃–C(=O)–NH₂','–C(=O)–NH₂','Amid','Nitrogen direkte bundet til carbonylgruppens carbon.']
  ];
  X.organelles=[['Cellemembran','Afgrænser cellen og regulerer transport ind og ud.',true,true],['Cellekerne','Rummer størstedelen af cellens DNA.',true,true],['Mitokondrie','Bidrager til ATP-produktion ved aerob respiration.',true,true],['Ribosom','Sammensætter proteiner ud fra mRNA.',true,true],['Ru ER','Membransystem med ribosomer; involveret i dannelse og transport af visse proteiner.',true,true],['Golgiapparat','Modificerer, sorterer og pakker proteiner og lipider.',true,true],['Cellevæg','Støttende lag uden for membranen; planter har især cellulose.',true,false],['Kloroplast','Her foregår fotosyntese i fotosyntetiske planteceller.',true,false],['Central vakuole','Stor væskefyldt struktur med betydning for bl.a. turgor og oplagring.',true,false],['Lysosom','Nedbryder materiale i cellen; her vist i en typisk dyrecelle.',false,true]];
  X.tenses=[
    ['Present simple','I study every day.','Vaner, gentagelser og generelle forhold.','every day','She ___ to school every day.',['walks','is walking','walked'],'walks'],
    ['Present continuous','I am studying now.','En aktivitet i gang omkring nu.','now','Listen! They ___ outside.',['play','are playing','played'],'are playing'],
    ['Past simple','I studied yesterday.','En afsluttet begivenhed på et bestemt tidspunkt i fortiden.','yesterday','We ___ the experiment yesterday.',['finish','have finished','finished'],'finished'],
    ['Past continuous','I was studying when you called.','En igangværende handling på et tidspunkt i fortiden.','at that moment','I ___ when the phone rang.',['was sleeping','sleep','have slept'],'was sleeping'],
    ['Present perfect','I have finished my homework.','En fortidig handling med forbindelse til nutiden.','already / yet','She has already ___ her report.',['write','wrote','written'],'written'],
    ['Past perfect','I had left before the lesson started.','Noget, der skete før et andet tidspunkt i fortiden.','before then','They had ___ before we arrived.',['leave','left','leaving'],'left'],
    ['Future with will','I will help you.','Fx en beslutning, et tilbud eller en forudsigelse.','later','I think it ___ tomorrow.',['rains','will rain','rained'],'will rain']
  ];
  X.cases={Nominativ:['der','die','das','die'],Akkusativ:['den','die','das','die'],Dativ:['dem','der','dem','den'],Genitiv:['des','der','des','der']};
  X.analysis={Novelle:[['Fortæller','Hvem fortæller, og hvad ved fortælleren?'],['Personer','Undersøg handlinger, relationer og udvikling.'],['Miljø','Hvilken betydning har sted, tid og sociale forhold?'],['Komposition','Hvordan er begyndelse, vendepunkt og slutning bygget op?'],['Sprog','Find konkrete citater, og forklar deres virkning.'],['Tema og fortolkning','Saml observationerne til en begrundet fortolkning.']],Digt:[['Stemme','Hvem taler i digtet?'],['Form','Undersøg strofer, rytme, rim og gentagelser.'],['Billedsprog','Find billeder, og undersøg deres betydning.'],['Modsætninger','Hvilke kontraster driver teksten?'],['Fortolkning','Underbyg din læsning med ord og linjer.']],Tale:[['Situation','Afsender, modtagere, anledning og formål.'],['Argumentation','Påstande, belæg, hjemler og modargumenter.'],['Appelformer','Undersøg etos, logos og patos med eksempler.'],['Virkemidler','Gentagelser, modsætninger, spørgsmål og billeder.'],['Vurdering','Hvordan passer virkemidlerne til situationen?']],Reklame:[['Afsender og målgruppe','Hvem vil påvirke hvem?'],['Budskab','Hvad skal modtageren tænke eller gøre?'],['Billede og tekst','Undersøg samspillet mellem visuelle og sproglige valg.'],['Appel og argumenter','Hvilke behov, følelser og begrundelser bruges?'],['Vurdering','Begrund din vurdering af reklamens virkning.']]};
  function logic(source){const s=String(source).toUpperCase().replace(/\s+/g,''),tokens=s.match(/AND|OR|NOT|[A-E01()]/g)||[];if(tokens.join('')!==s||tokens.length>100)throw Error('Brug A–E, 0, 1, AND, OR, NOT og parenteser.');const vars=[...new Set(tokens.filter(x=>/^[A-E]$/.test(x)))].sort();let pos=0;function atom(){const t=tokens[pos++];if(t==='NOT')return ['not',atom()];if(t==='('){const r=or();if(tokens[pos++]!==')')throw Error('Der mangler en parentes.');return r;}if(/^[A-E01]$/.test(t||''))return ['value',t];throw Error('Ufuldstændigt logisk udtryk.');}function and(){let n=atom();while(tokens[pos]==='AND'){pos++;n=['and',n,atom()];}return n;}function or(){let n=and();while(tokens[pos]==='OR'){pos++;n=['or',n,and()];}return n;}const tree=or();if(pos!==tokens.length)throw Error('Kontrollér det logiske udtryk.');const evaluate=(node,v)=>node[0]==='value'?(node[1]==='1'?true:node[1]==='0'?false:v[node[1]]):node[0]==='not'?!evaluate(node[1],v):node[0]==='and'?evaluate(node[1],v)&&evaluate(node[2],v):evaluate(node[1],v)||evaluate(node[2],v);return {vars,tree,evaluate};}
  X.add('logic','programming','Planlæg og forstå','Logik og sandhedstabeller','Undersøg AND, OR og NOT med op til fem variable.',[X.txt('expression','Logisk udtryk','A AND (B OR NOT C)')],v=>{const r=logic(v.expression),body=[];for(let i=0;i<2**r.vars.length;i++){const state=Object.fromEntries(r.vars.map((k,j)=>[k,Boolean(i&(1<<(r.vars.length-j-1)))]));body.push([...r.vars.map(k=>Number(state[k])),Number(r.evaluate(r.tree,state))]);}return X.rows([['Antal kombinationer',body.length]],['NOT udføres før AND, som udføres før OR. Parenteser ændrer rækkefølgen.'],{table:{head:[...r.vars,'Resultat'],body},logic:r.tree});});
  X.add('number-bases','programming','Tekst og data','Binære tal og hexadecimal','Omregn heltal, og undersøg deres bits.',[X.txt('value','Heltal i det valgte talsystem','42'),X.select('base','Fra talsystem',[['10','Decimal'],['2','Binær'],['16','Hexadecimal']])],v=>{const allowed={2:/^[01]+$/,10:/^\d+$/,16:/^[0-9a-f]+$/i};if(!allowed[v.base].test(v.value)||v.value.length>256)throw Error('Skriv et positivt heltal eller 0 uden præfiks.');const n=BigInt((v.base==='2'?'0b':v.base==='16'?'0x':'')+v.value);if(n>=2n**256n)throw Error('Højst 256 bits.');return X.rows([['Decimal',n.toString()],['Binær',n.toString(2)],['Hexadecimal',n.toString(16).toUpperCase()]],['Hver binær position repræsenterer en potens af 2.','Hvert hexadecimalt ciffer svarer til fire bits.'],{bits:n.toString(2)});});
  function csv(source,delimiter=';'){if(source.length>100000)throw Error('Højst 100.000 tegn.');const records=[];let row=[],cell='',quote=false,closed=false;for(let i=0;i<source.length;i++){const ch=source[i];if(quote){if(ch==='"'){if(source[i+1]==='"'){cell+='"';i++;}else{quote=false;closed=true;}}else cell+=ch;}else if(ch==='"'&&!cell&&!closed)quote=true;else if(ch===delimiter||ch==='\n'||ch==='\r'){row.push(cell);cell='';closed=false;if(ch!==delimiter){records.push(row);row=[];if(ch==='\r'&&source[i+1]==='\n')i++;}}else{if(closed&&!/\s/.test(ch))throw Error('Uventet tekst efter afsluttende anførselstegn.');cell+=ch;}if(records.length>2000||row.length>40)throw Error('Højst 2.000 rækker og 40 kolonner.');}if(quote)throw Error('Et citeret felt mangler afsluttende anførselstegn.');if(cell||row.length)records.push([...row,cell]);return records.filter(row=>row.some(s=>s.trim()));}
  function diff(before,after){const a=before.match(/\s+|\S+/g)||[],b=after.match(/\s+|\S+/g)||[];if(a.length>1000||b.length>1000)throw Error('Sammenlign højst cirka 500 ord ad gangen.');const dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);const out=[];let i=0,j=0;while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){out.push(['same',a[i++]]);j++;}else if(j<b.length&&(i===a.length||dp[i][j+1]>=dp[i+1][j]))out.push(['add',b[j++]]);else out.push(['remove',a[i++]]);}return out;}
  Object.assign(X,{logic,csv,diff});
})();
