(() => {
  'use strict';
  const catalog=[
    ['dive','Dybdegæt','🪼','Skriv et mindre oplagt svar og se, hvor dybt du kan dykke.','Skriv ét svar pr. spørgsmål. Du har 25 sekunder. Svarenes point er fastlagt i spillet. Dagens syv spørgsmål er ens for alle.'],
    ['timeline','Tidslinjen','⏳','Hvor passer begivenheden ind i historien?','Vælg en plads før, efter eller mellem de viste årstal. Se det rigtige år efter hvert svar.'],
    ['families','Fire i familie','🧩','Find fire skjulte forbindelser mellem seksten ord.','Markér fire ord, der hører sammen, og tjek gruppen. Løs alle fire grupper, inden du laver fire forskellige fejl.'],
    ['higher','Højere eller lavere','⚖️','Gæt det næste tal, og byg en serie af rigtige svar.','Sammenlign de to kort i samme enhed. Vælg højere eller lavere, og afslør det skjulte tal.'],
    ['atlas','Atlasjagten','🌐','Find landet med så få ledetråde som muligt.','Skriv landets navn. Du kan åbne to ekstra ledetråde. Du får flest point, når du gætter på den første.']
  ].map(([id,title,symbol,description,controls])=>({id,title,symbol,description,controls,category:'Quiz',live:false}));
  const ids=new Set(catalog.map(g=>g.id));
  const norm=str=>String(str??'').trim().toLocaleLowerCase('da').replace(/æ/g,'ae').replace(/ø/g,'oe').replace(/å/g,'aa').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
  function shuffle(list,rng){
    const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;
  }
  // First name is displayed. Following names are accepted translations, symbols or spellings.
  // Each row is a closed set. Points are editorial game weights, never player frequencies.
  const dives=[
    ['Nævn en af Solsystemets otte planeter.',['Jorden|Jord|Earth','Mars','Jupiter','Saturn','Venus','Neptun|Neptune','Merkur|Mercury','Uranus']],
    ['Nævn en af de seks slags brikker i skak.',['Konge|King','Dronning|Queen','Bonde|Pawn','Tårn|Rook','Springer|Hest|Knight','Løber|Bishop']],
    ['Nævn et af de ni lande, der har landegrænse med Tyskland.',['Danmark|Denmark','Frankrig|France','Polen|Poland','Østrig|Austria','Schweiz|Switzerland','Nederlandene|Holland|Netherlands','Belgien|Belgium','Tjekkiet|Czechia|Czech Republic','Luxembourg|Luxemburg']],
    ['Nævn en af de fem farver på de olympiske ringe.',['Rød|Red','Blå|Blue','Grøn|Green','Gul|Yellow','Sort|Black']],
    ['Nævn et grundstof i gruppe 18 i det periodiske system.',['Helium|He','Neon|Ne','Argon|Ar','Radon|Rn','Krypton|Kr','Xenon|Xe','Oganesson|Og']],
    ['Nævn en af de fire største måner omkring Jupiter.',['Europa','Io','Ganymedes|Ganymede','Callisto|Kallisto']],
    ['Nævn en af de fire Grand Slam-turneringer i tennis.',['Wimbledon','US Open|U.S. Open','Australian Open','French Open|Roland Garros|Franske åbne']],
    ['Nævn en af kulørerne i et almindeligt dansk kortspil.',['Hjerter|Hjerte|Hearts','Spar|Spades','Ruder|Rude|Diamonds','Klør|Kløver|Clubs']],
    ['Nævn en af de fem suveræne stater i Norden.',['Danmark|Denmark','Sverige|Sweden','Norge|Norway','Finland','Island|Iceland']],
    ['Nævn et af de fem verdenshave.',['Stillehavet|Pacific Ocean|Pacific','Atlanterhavet|Atlantic Ocean|Atlantic','Det Indiske Ocean|Indiske Ocean|Indian Ocean','Ishavet|Det Arktiske Ocean|Arktiske Ocean|Nordishavet|Arctic Ocean','Sydhavet|Det Sydlige Ocean|Sydlige Ocean|Antarktiske Ocean|Southern Ocean']],
    ['Nævn et af de syv forskellige tegn i romertal. Skriv tegnet.',['I','V','X','L','C','D','M']],
    ['Nævn et af de ni vokalbogstaver i det danske alfabet.',['A','E','I','O','U','Y','Æ','Ø','Å']],
    ['Nævn en dansk måned med præcis 30 dage.',['April','Juni','September','November']],
    ['Nævn en hovedstad i en af de fem nordiske stater.',['København|Copenhagen','Stockholm','Oslo','Helsinki|Helsingfors','Reykjavík|Reykjavik']]
  ];
  const events=[
    [1453,'Konstantinopel falder til osmannerne'],[1492,'Columbus når Caribien'],[1789,'Den Franske Revolution begynder'],
    [1849,'Danmark får sin første grundlov'],[1903,'Brødrene Wright gennemfører deres første motorflyvning'],[1912,'Titanic synker'],
    [1914,'Første Verdenskrig begynder'],[1928,'Alexander Fleming opdager penicillin'],[1945,'FN bliver oprettet'],
    [1957,'Sputnik 1 sendes i kredsløb'],[1961,'Jurij Gagarin bliver det første menneske i rummet'],[1969,'Apollo 11 lander på Månen'],
    [1989,'Berlinmuren åbnes'],[1992,'Danmark vinder EM i herrefodbold'],[2004,'De olympiske sommerlege afholdes i Athen i det nye årtusinde'],
    [2012,'Curiosity lander på Mars'],[2021,'Perseverance lander på Mars'],[2024,'Paris er vært for sommer-OL for tredje gang']
  ];
  const families=[
    ['Strygeinstrumenter','Violin','Bratsch','Cello','Kontrabas'],['Kortkulører','Hjerter','Ruder','Spar','Klør'],
    ['Pastaformer','Penne','Fusilli','Farfalle','Rigatoni'],['Nordiske hovedstæder','Oslo','Stockholm','Helsinki','Reykjavík'],
    ['Værktøj i værkstedet','Hammer','Skruetrækker','Sav','Tang'],['Planeter','Merkur','Saturn','Neptun','Uranus'],
    ['Vejrfænomener','Tåge','Hagl','Torden','Regnbue'],['Krydderier','Kanel','Kardemomme','Spidskommen','Nellike'],
    ['Skakbrikker','Løber','Springer','Bonde','Tårn'],['Svømmearter','Crawl','Rygcrawl','Brystsvømning','Butterfly'],
    ['Ting i et orkesters slagtøjsgruppe','Pauke','Triangel','Bækken','Lilletromme'],['Geometriske figurer i planen','Cirkel','Trekant','Rombe','Trapez'],
    ['Fugle ved vandet','Skarv','Hejre','Lunde','Isfugl'],['Håndboldpositioner','Fløj','Back','Stregspiller','Målvogter'],
    ['Tegn på tastaturet','Parentes','Kolon','Apostrof','Komma'],['På et skib','Agterstavn','Dæk','Køl','Ror']
  ];
  const tables=[
    {title:'Grundstoffer',unit:'i atomnummer',items:[['Brint',1],['Helium',2],['Kulstof',6],['Ilt',8],['Neon',10],['Silicium',14],['Jern',26],['Kobber',29],['Sølv',47],['Guld',79],['Bly',82],['Uran',92]]},
    {title:'Geometri',unit:'sider',items:[['Trekant',3],['Firkant',4],['Femkant',5],['Sekskant',6],['Syvkant',7],['Ottekant',8],['Nikant',9],['Tikant',10],['Tolvkant',12],['Tyvekant',20]]},
    {title:'Spillekort',unit:'point i blackjack',items:[['Toer',2],['Treer',3],['Firer',4],['Femmer',5],['Sekser',6],['Syver',7],['Otter',8],['Nier',9],['Konge',10]]},
    {title:'Måleenheder',unit:'millimeter',items:[['En mikrometer',.001],['En centimeter',10],['En tomme',25.4],['En decimeter',100],['En engelsk fod',304.8],['En yard',914.4],['En meter',1000],['En sømil',1852000]]}
  ];
  const countries=[
    ['Japan','Landet består af øer i Stillehavet.','Her finder du bjerget Fuji.','Hovedstaden er Tokyo.'],
    ['Canada|Kanada','Landet har kyst ved tre verdenshave.','Et ahornblad pryder flaget.','Hovedstaden er Ottawa.'],
    ['Brasilien|Brazil','Landet krydses af ækvator.','Portugisisk er landets officielle sprog.','Hovedstaden hedder Brasília.'],
    ['Island|Iceland','Øen ligger på to tektoniske plader.','Landets parlament hedder Altinget.','Hovedstaden er Reykjavík.'],
    ['Italien|Italy','Landet omslutter to små selvstændige stater.','Her ligger vulkanen Etna.','Hovedstaden er Rom.'],
    ['Egypten|Egypt|Ægypten','Landet ligger i to verdensdele.','Nilen løber gennem landet.','Her ligger pyramiderne ved Giza.'],
    ['Peru','Landet har en kyst ved Stillehavet.','Machu Picchu ligger her.','Hovedstaden er Lima.'],
    ['Grækenland|Greece','Landet har øer i Det Ægæiske Hav.','Antikkens Olympia ligger her.','Hovedstaden er Athen.'],
    ['Kenya','Ækvator krydser landet.','Landet har kyst ved Det Indiske Ocean og grænser til Tanzania.','Hovedstaden er Nairobi.'],
    ['Portugal','Landet har kun én landnabo.','Azorerne hører til landet.','Hovedstaden er Lissabon.'],
    ['Indien|India','Landet grænser til både Nepal og Bhutan.','Taj Mahal ligger her.','Hovedstaden er New Delhi.'],
    ['Australien|Australia','Landet ligger på den sydlige halvkugle.','Her findes vilde næbdyr.','Hovedstaden er Canberra.'],
    ['Norge|Norway','Landet har en lang kyst mod Nordatlanten.','Svalbard hører til landet.','Hovedstaden er Oslo.'],
    ['Chile','Landet har øer langt ude i Stillehavet.','Atacamaørkenen ligger her.','Hovedstaden er Santiago.'],
    ['Argentina','Landet deler øen Ildlandet med en nabo.','Her finder du bjerget Aconcagua.','Hovedstaden er Buenos Aires.'],
    ['Frankrig|France','Landets flag har tre lodrette farvefelter.','På fastlandet i Europa ligger byerne Lyon og Marseille.','Hovedstaden er Paris.']
  ];
  const display=row=>row.split('|')[0];
  const matches=(row,v)=>row.split('|').some(a=>norm(a)===norm(v));
  function today(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Copenhagen'}).format(new Date());}
  function seedFor(day){
    let n=Number(day.replace(/-/g,''))>>>0;return ()=>((n=(Math.imul(1664525,n)+1013904223)>>>0)/2**32);
  }
  function dive(s,mode,day=today()){
    s.mode=mode;s.day=day;s.rows=shuffle(dives,mode==='daily'?seedFor(day):s.rng).slice(0,7);s.deadline=s.time+25;
  }
  function init(s){
    s.round=0;s.result=null;s.log=[];s.message='';s.revision=0;
    if(s.id==='dive')dive(s,'daily');
    if(s.id==='timeline'){const rows=shuffle(events,s.rng);s.line=rows.slice(0,2).sort((a,b)=>a[0]-b[0]);s.rows=rows.slice(2,9);}
    if(s.id==='atlas'){s.rows=shuffle(countries,s.rng).slice(0,5);s.clues=1;}
    if(s.id==='higher'){const bags=shuffle(tables,s.rng);s.streak=0;s.longest=0;
      s.rows=Array.from({length:8},(_,i)=>{const table=bags[i%bags.length],pair=shuffle(table.items,s.rng).slice(0,2);return {...table,pair};});
    }
    if(s.id==='families'){s.groups=shuffle(families,s.rng).slice(0,4);s.words=shuffle(s.groups.flatMap(g=>g.slice(1)),s.rng);s.selected=[];s.solved=[];s.tried=[];}
  }
  function finishRound(s,points,text){
    s.result={points,text};s.score+=points;s.log.push(s.result);s.revision++;
  }
  function move(s,type,v){
    if(s.id==='families'){
      if(type==='pick'&&s.words.includes(v)){
        if(s.selected.includes(v))s.selected=s.selected.filter(w=>w!==v);
        else if(s.selected.length<4)s.selected.push(v);
        s.message='';s.revision++;
      }
      if(type==='mix'){s.words=shuffle(s.words,s.rng);s.revision++;}
      if(type==='check'&&s.selected.length===4){
        const key=[...s.selected].sort().join('|'),group=s.groups.find(g=>s.selected.every(w=>g.slice(1).includes(w)));
        if(group){s.solved.push(group);s.words=s.words.filter(w=>!s.selected.includes(w));s.selected=[];s.score+=100;s.message='Fundet · '+group[0];if(s.solved.length===4)s.status='won';}
        else if(s.tried.includes(key))s.message='Du har prøvet den kombination. Vælg et andet ord.';
        else{s.tried.push(key);s.message=s.groups.some(g=>s.selected.filter(w=>g.slice(1).includes(w)).length===3)?'Tæt på! Tre ord hører sammen.':'De fire ord hører til forskellige grupper.';if(s.tried.length===4)s.status='lost';}
        s.revision++;
      }
      return;
    }
    if(type==='next'&&s.result){
      if(s.round+1>=s.rows.length)s.status='won';
      else{s.round++;s.result=null;s.message='';if(s.id==='atlas')s.clues=1;if(s.id==='dive')s.deadline=s.time+25;}
      s.revision++;return;
    }
    if(s.result)return;
    const row=s.rows[s.round];
    if(s.id==='dive'){
      if(type==='free'&&s.round===0&&!s.log.length){dive(s,'free');s.revision++;return;}
      if(type==='guess'&&String(v||'').trim()){
        const index=row[1].findIndex(a=>matches(a,v));
        const points=index<0?0:20+Math.round(80*index/(row[1].length-1));
        finishRound(s,points,index<0?'Svaret blev ikke genkendt. Et muligt svar var '+display(row[1].at(-1))+'.':display(row[1][index])+' gav '+points+' point.');
      }
    }else if(s.id==='timeline'&&type==='place'&&Number.isInteger(v)&&v>=0&&v<=s.line.length){
      const pos=s.line.filter(e=>e[0]<row[0]).length;s.line.splice(pos,0,row);
      finishRound(s,pos===v?100:0,(pos===v?'Rigtigt! ':'Den rigtige placering er vist. ')+row[0]+' · '+row[1]);
    }else if(s.id==='higher'&&(type==='higher'||type==='lower')){
      const [a,b]=row.pair,correct=(b[1]>a[1])===(type==='higher');
      s.streak=correct?s.streak+1:0;s.longest=Math.max(s.longest,s.streak);
      finishRound(s,correct?100:0,(correct?'Rigtigt! ':'Denne gang var det '+(b[1]>a[1]?'højere. ':'lavere. '))+b[0]+' · '+b[1].toLocaleString('da-DK')+' '+row.unit);
    }else if(s.id==='atlas'){
      if(type==='clue'&&s.clues<3){s.clues++;s.revision++;return;}
      if(type==='skip'){finishRound(s,0,'Landet var '+display(row[0])+'.');return;}
      if(type==='guess'&&String(v||'').trim()){
        if(matches(row[0],v))finishRound(s,[0,100,65,35][s.clues],'Rigtigt! Rejsen gik til '+display(row[0])+'.');
        else if(s.clues<3){s.clues++;s.message='Prøv igen med den næste ledetråd.';s.revision++;}
        else finishRound(s,0,'Landet var '+display(row[0])+'.');
      }
    }
  }
  function tick(s){if(s.id==='dive'&&!s.result&&s.time>=s.deadline)finishRound(s,0,'Tiden gik. Et muligt svar var '+display(s.rows[s.round][1].at(-1))+'.');}
  globalThis.lectioPlusQuizGames={catalog,ids,init,move,tick,today,display};
})();
