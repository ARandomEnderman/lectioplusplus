(() => {
  'use strict';
  const uid=()=>globalThis.lectioPlusLab.uid();
  // Local Danish punctuation assistance. This is a bounded clause heuristic,
  // not a full grammatical parser; ambiguous constructions remain reviewable.
  const finite = new Set(`er var bliver blev har havde kan kunne skal skulle vil ville må måtte bør burde ved vidste tror troede synes syntes mener mente håber håbede siger sagde fortæller fortalte spørger spurgte svarer svarede tænker tænkte forstår forstod ønsker ønskede ved kommer kom går gik løber løb står stod sidder sad ligger lå laver lavede gør gjorde tager tog giver gav får fik ser så hører hørte læser læste skriver skrev lærer lærte arbejder arbejdede prøver prøvede hjælper hjalp finder fandt bruger brugte spiser spiste drikker drak sover sov vågner vågnede leger legede spiller spillede taler talte snakker snakkede møder mødte kører kørte cykler cyklede køber købte sælger solgte rejser rejste besøger besøgte åbner åbnede lukker lukkede starter startede begynder begyndte slutter sluttede stopper stoppede fortsætter fortsatte venter ventede bliver blev regner regnede sner sneede skinner skinnede blæser blæste lyser lyste virker virkede fungerer fungerede passer passede mangler manglede husker huskede glemmer glemte glæder glædede føler følte henter hentede sender sendte ringer ringede betaler betalte tæller talte regner beregner beregnede viser viste hedder hed kender kendte elsker elskede holder holdt hader hadede vælger valgte svømmer svømmede træner trænede forklarer forklarede undersøger undersøgte indeholder indeholdt handler handlede betyder betød består bestod gælder gjaldt sker skete ender endte gemmer gemte ændrer ændrede sidder sad beder bad beslutter besluttede ankommer ankom når nåede hjælper hjalp mødtes ses findes syntes føles lykkes plejer plejede tør turde smiler smilede griner grinede græder græd falder faldt stiger steg dækker dækkede vender vendte rydder ryddede vasker vaskede hedder løser løste afleverer afleverede diskuterer diskuterede forklarer forklarer planlægger planlagde opdager opdagede nød nyder glædes savner savnede slapper slappede`.split(/\s+/));
  for(const word of 'kigger kiggede tørrer tørrede synger sang pakker pakkede børster børstede dufter duftede sætter satte taler talte lytter lyttede skynder skyndte opdager opdagede åbner åbnede lukker lukkede forbereder forberedte mangler manglede smager smagte rydder ryddede samler samlede blander blandede hælder hældte indeholder indeholdt forventer forventede undersøger undersøgte spekulerer spekulerede modtager modtog fortæller fortalte gennemgår gennemgik cykler cyklede hører hørte følges koster kostede rækker rakte'.split(' '))finite.add(word);
  const infinitives=new Set('være blive have kunne skulle ville vide tro mene håbe sige fortælle spørge svare tænke forstå ønske komme gå løbe stå sidde ligge lave gøre tage give få se høre læse skrive lære arbejde prøve hjælpe finde bruge spise drikke sove vågne lege spille tale snakke møde køre cykle købe sælge rejse besøge åbne lukke starte begynde slutte stoppe fortsætte vente regne sne skinne blæse lyse virke fungere passe mangle huske glemme glæde føle hente sende ringe betale tælle beregne vise hedde kende elske holde hade vælge svømme træne forklare undersøge indeholde handle betyde bestå gælde ske ende gemme ændre bede beslutte ankomme nå smile grine græde falde stige dække vende rydde vaske løse aflevere diskutere planlægge opdage nyde savne slappe synge pakke børste dufte sætte lytte skynde forberede samle blande hælde modtage gennemgå koste række'.split(' '));
  const whWords=new Set('hvem hvad hvilken hvilket hvilke hvor hvordan hvorfor hvornår'.split(' '));
  const frontWords=new Set('hvis når da selvom mens fordi inden indtil før efter eftersom'.split(' '));
  const subjects = new Set('jeg du han hun vi i de den det man der alle ingen nogen'.split(' '));
  const adverbs = new Set('ikke aldrig altid ofte også bare nok godt gerne lige faktisk allerede stadig måske sikkert normalt virkelig næsten snart selv selvfølgelig helst endelig desværre jo vist endnu egentlig langsomt hurtigt først netop bagefter senere sammen bedst begge helt meget'.split(' '));
  const joins = new Set('og eller men for så samt thi'.split(' '));
  const subordinates = new Set('at fordi hvis når da selvom mens inden indtil eftersom dersom hvor hvordan hvorfor hvornår hvem hvad hvilken hvilket hvilke før efter om end'.split(' '));
  const reports = new Set('tror troede synes syntes mener mente håber håbede ved vidste siger sagde fortæller fortalte tænker tænkte ønsker ønskede føler følte'.split(' '));
  const prepositions = new Set('i på til fra med uden ved over under efter før for gennem mellem mod hos af om'.split(' '));
  const transitions = ['derefter','bagefter','senere','pludselig','derfor','alligevel','imens','samtidig','til sidst','næste dag','i morgen','om aftenen','om morgenen'];

  function punctuation(text, options = {}) {
    if(typeof text!=='string'||text.length>12000)throw Error('Indsæt højst 12.000 tegn ad gangen.');
    const startComma=options.startComma!==false, capitals=options.capitals!==false;
    const changes=[], protectedRanges=[];
    // Do not split decimals, clock times, abbreviations, links, email, code,
    // or quoted passages. Keep all matching and editing offsets in UTF-16.
    const protectedPattern=/```[\s\S]*?```|`[^`\n]*`|https?:\/\/[^\s<>]+|www\.[^\s<>]+|\b[\p{L}\p{N}_-]+(?:\.[\p{L}\p{N}_-]+)*\.(?:docx?|xlsx?|pptx?|pdf|txt|csv|json|js|py|html?|zip|png|jpe?g|dk|com|org|net|edu)\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b\d+(?:[.,:/-]\d+)+\b|\b(?:bl\.a\.|f\.eks\.|dvs\.|osv\.|m\.m\.|m\.fl\.|ca\.|kl\.|nr\.|stk\.|dr\.|prof\.|kr\.)|\b(?:pH|dB)\b|"[^"\n]*"|“[^”\n]*”|»[^«\n]*«/giu;
    for(const m of text.matchAll(protectedPattern))protectedRanges.push([m.index,m.index+m[0].length]);
    const protectedAt=(a,b=a+1)=>protectedRanges.some(([x,y])=>a<y&&b>x);
    function add(start,end,replacement,why,kind,priority=1){
      if(text.slice(start,end)===replacement||protectedAt(start,Math.max(end,start+1)))return;
      const overlaps=changes.filter(c=>start<c.end&&end>c.start||start===c.start);
      if(overlaps.some(c=>c.priority>=priority))return;
      for(const c of overlaps)changes.splice(changes.indexOf(c),1);
      changes.push({start,end,replacement,why,kind,priority});
    }
    const tokens=[...text.matchAll(/[\p{L}][\p{L}\p{M}'’\-]*/gu)].map(m=>({word:m[0].toLocaleLowerCase('da'),raw:m[0],start:m.index,end:m.index+m[0].length}));
    const gap=(a,b)=>text.slice(tokens[a]?.end??0,tokens[b]?.start??text.length);
    const plain=(a,b)=>/^\s*$/.test(gap(a,b))&&!/\n\s*\n/.test(gap(a,b));
    const visible=i=>i>=0&&i<tokens.length&&!protectedAt(tokens[i].start,tokens[i].end);
    const verb=i=>visible(i)&&finite.has(tokens[i].word);
    function subjectVerb(i,nominal=false,depth=0){
      if(!visible(i))return null;
      const word=tokens[i].word,determiner=/^(?:en|et|den|det|de|min|mit|mine|din|dit|dine|hans|hendes|vores|deres|nogle|mange|alle|ingen|begge|disse|denne)$/;
      function afterSubject(j){let end=j;while(end<j+5&&visible(end)&&plain(end-1,end)&&adverbs.has(tokens[end].word))end++;return verb(end)&&plain(end-1,end)?{subject:i,verb:end}:null;}
      if(subjects.has(word)){const found=afterSubject(i+1);if(found)return found;}
      if(!nominal||finite.has(word)||infinitives.has(word)||adverbs.has(word)||prepositions.has(word)||joins.has(word)||subordinates.has(word))return null;
      // A noun subject can include a determiner/adjectives and then adverbs.
      // Infinitives are not noun subjects: "at regne senere så ...".
      function joined(j){if(depth>=3||!['og','eller'].includes(tokens[j]?.word))return null;const right=subjectVerb(j+1,true,depth+1);return right?{subject:i,verb:right.verb,joins:[j,...(right.joins||[])]}:null;}
      if(!determiner.test(word))return afterSubject(i+1)||joined(i+1);
      for(let j=i+1;j<i+6&&visible(j)&&plain(j-1,j);j++){
        if(verb(j))return {subject:i,verb:j};
        if(adverbs.has(tokens[j].word)){const found=afterSubject(j);if(found)return found;}
        if(joins.has(tokens[j].word))return joined(j);
        if(prepositions.has(tokens[j].word)||subordinates.has(tokens[j].word)||subjects.has(tokens[j].word))break;
      }
      return null;
    }
    function clauseAt(i){
      const word=tokens[i]?.word;if(!visible(i)||!subordinates.has(word)&&!['som','der'].includes(word))return null;
      if(['som','der'].includes(word)){
        if(whWords.has(tokens[i-1]?.word))return null;
        return verb(i+1)&&plain(i,i+1)?{subject:i,verb:i+1}:subjectVerb(i+1,true);
      }
      const direct=subjectVerb(i+1,true);if(direct)return direct;
      if(whWords.has(word)){
        if(verb(i+1)&&plain(i,i+1))return {subject:i,verb:i+1};
        // E.g. "hvilken bog hun læser" or "hvem af os der kommer".
        for(let j=i+1;j<=i+6&&visible(j)&&plain(j-1,j);j++){
          if(verb(j)||joins.has(tokens[j].word)||subordinates.has(tokens[j].word))break;
          if(subjects.has(tokens[j].word)){const found=subjectVerb(j);if(found)return found;}
        }
      }
      return null;
    }
    function inverted(i){return verb(i)&&visible(i+1)&&plain(i,i+1)&&subjects.has(tokens[i+1].word)?{verb:i,subject:i+1}:null;}
    function transitionAt(i){
      for(const phrase of transitions){const words=phrase.split(' ');if(words.every((word,k)=>tokens[i+k]?.word===word&&(k===0||plain(i+k-1,i+k)))&&inverted(i+words.length))return words.length;}
      return 0;
    }
    const bounds=[];let beginning=0;
    for(let i=0;i<tokens.length;i++){
      const raw=gap(i-1,i),offset=tokens[i-1]?.end??0;
      if(i&&(/\n/.test(raw)||[...raw.matchAll(/[.!?;]/g)].some(m=>!protectedAt(offset+m.index))))beginning=i;
      bounds[i]=beginning;
    }
    const hasVerb=(a,b)=>tokens.slice(a,b).some((_,k)=>verb(a+k));
    function commaBefore(i,why,kind='comma'){
      if(i<1||!visible(i)||!plain(i-1,i))return;
      add(tokens[i-1].end,tokens[i].start,', ',why,kind,2);
    }
    const starts=new Set([0]), clauseEnds=new Set(), attachedSubjects=new Set(), clauses=new Map(),compoundJoins=new Set();
    for(let i=0;i<tokens.length;i++)if(i===bounds[i]||reports.has(tokens[i-1]?.word))for(const j of subjectVerb(i,true)?.joins||[])compoundJoins.add(j);
    for(let i=0;i<tokens.length;i++){
      const clause=clauseAt(i);if(!clause)continue;
      const prev=tokens[i-1]?.word;
      if(['som','der'].includes(tokens[i].word)&&(attachedSubjects.has(i)||i===bounds[i]||finite.has(prev)||prepositions.has(prev)||joins.has(prev)||subordinates.has(prev)))continue;
      clauses.set(i,clause);for(const j of clause.joins||[])compoundJoins.add(j);for(let j=i+1;j<=clause.verb;j++)attachedSubjects.add(j);
    }
    const omittedRelative=i=>{
      if(!subjectVerb(i)||i<=bounds[i]||attachedSubjects.has(i))return false;
      const previous=tokens[i-1].word;
      if(['det','den','dem','alt','noget'].includes(previous))return true;
      if(finite.has(previous)||infinitives.has(previous)||adverbs.has(previous)||prepositions.has(previous))return false;
      if(i===bounds[i]+1&&/(?:en|et|ene|erne)$/.test(previous)&&!subjects.has(previous)&&!subordinates.has(previous))return true;
      for(let j=i-2;j>=Math.max(bounds[i],i-4);j--){
        if(/^(?:den|det|de|en|et|min|mit|mine|din|dit|dine|vores|deres)$/.test(tokens[j].word))return true;
        if(verb(j)||prepositions.has(tokens[j].word)||joins.has(tokens[j].word)||subordinates.has(tokens[j].word))break;
      }
      return false;
    };
    for(let i=0;i<tokens.length;i++)if(omittedRelative(i)){const clause=subjectVerb(i);clauses.set(i,{...clause,omitted:true});attachedSubjects.add(i);}

    // Fronted dependent clauses: "Når jeg kommer hjem, laver jeg mad".
    for(let i=0;i<tokens.length;i++){
      if(i!==bounds[i]||!frontWords.has(tokens[i].word))continue;
      const first=clauses.get(i);if(!first)continue;
      for(let j=first.verb+1;j<tokens.length&&bounds[j]===i;j++){
        const next=tokens[j].word==='så'?j+1:j;
        if(!attachedSubjects.has(next)&&inverted(next)&&!joins.has(tokens[j-1]?.word)&&!subordinates.has(tokens[j-1]?.word)&&!reports.has(tokens[j-1]?.word)){
          commaBefore(j,'Komma efter den indledende ledsætning.');clauseEnds.add(j);break;
        }
      }
    }
    for(let i=0;i<tokens.length;i++){
      if(!visible(i))continue;
      const word=tokens[i].word,previous=tokens[i-1]?.word,begin=bounds[i],left=hasVerb(begin,i);
      if(joins.has(word)&&!compoundJoins.has(i)&&left&&i>begin){
        const right=subjectVerb(i+1,true)||transitionAt(i+1)||clauses.get(i+1);
        if(right)commaBefore(i,'Komma mellem sætninger med hvert sit grundled og udsagnsled.');
      }
      const clause=clauses.get(i),relative=['som','der'].includes(word)||clause?.omitted;
      if(clause&&i>begin&&plain(i-1,i)&&!joins.has(previous)){
        let start=i;
        // These short connectors belong to the subordinate clause as a whole.
        if(word==='at'&&['uden','efter','før'].includes(previous))start=i-1;
        if(word==='om'&&previous==='selv'||word==='om'&&previous==='som')start=i-1;
        if(startComma&&(left||relative))commaBefore(start,clause.omitted?'Startkomma ved en ledsætning med udeladt som.':'Startkomma foran en genkendt ledsætning.','start-comma');
      }
      if(clause&&(relative||(i===begin&&(word==='at'||whWords.has(word))))){
        for(let j=clause.verb+1;j<tokens.length&&bounds[j]===begin;j++){
          if(joins.has(tokens[j].word)||subordinates.has(tokens[j].word))break;
          if(verb(j)){
            if(!reports.has(tokens[clause.verb].word)&&!attachedSubjects.has(j)&&!['at'].includes(tokens[j-1]?.word)){
              commaBefore(j,'Slutkomma efter en indskudt ledsætning.');clauseEnds.add(j);
            }
            break;
          }
        }
      }
      if(attachedSubjects.has(i)||clauses.has(i)||!left||i===begin||!plain(i-1,i)||clauseEnds.has(i)||joins.has(previous)||subordinates.has(previous)||['som','der','det','den','dem'].includes(previous))continue;
      if(frontWords.has(tokens[begin]?.word)&&![...clauseEnds].some(j=>j>begin&&j<i))continue;
      if(prepositions.has(previous)&&!reports.has(previous))continue;
      let last=i-1;while(last>=begin&&adverbs.has(tokens[last].word))last--;
      if(reports.has(tokens[last]?.word)){if(startComma&&subjectVerb(i,true))commaBefore(i,'Startkomma ved en genkendt ledsætning uden indledende at.','start-comma');continue;}
      // Deliberately restrict unmarked sentence breaks to a repeated explicit
      // subject or a discourse transition followed by inverted word order.
      const independent=subjects.has(word)&&subjectVerb(i),transition=transitionAt(i);
      if(!independent&&!transition)continue;
      if(independent&&i>0&&verb(i-1))continue;
      // Never detach the subject from a just-detected inverted clause.
      if((i>1&&transitionAt(i-2))||(i>0&&inverted(i-1)))continue;
      add(tokens[i-1].end,tokens[i].start,'. ','Punktum ved en mulig ny helsætning. Kontrollér sætningsdelingen.','period',3);
      starts.add(i);
    }
    // Existing sentence punctuation and paragraph starts also control capitals.
    for(let i=0;i<tokens.length;i++)if(bounds[i]===i)starts.add(i);
    if(capitals)for(const i of starts){const token=tokens[i];if(token&&visible(i)&&/^\p{Ll}/u.test(token.raw))add(token.start,token.start+1,token.raw[0].toLocaleUpperCase('da'),'Stort begyndelsesbogstav ved en sætningsstart.','capital',4);}
    // Normalize ordinary prose punctuation without touching protected notation.
    for(const m of text.matchAll(/[^\S\r\n]+([,.;:!?])/g))add(m.index,m.index+m[0].length,m[1]+(/\p{L}/u.test(text[m.index+m[0].length]||'')?' ':''),'Ret mellemrum omkring tegnet.','spacing');
    for(const m of text.matchAll(/([,.;:!?])(?=[\p{L}])/gu))add(m.index,m.index+1,m[1]+' ','Mellemrum efter tegnet.','spacing');
    // End complete-looking paragraphs, but leave headings, lists and greetings.
    let offset=0;
    for(const line of text.split(/\n/)){
      const trimmed=line.trimEnd(),end=offset+trimmed.length;
      const ts=tokens.filter(t=>t.start>=offset&&t.end<=end),first=ts[0]?.word;
      const hasSentence=ts.length>=2&&ts.some(t=>finite.has(t.word));
      if(hasSentence&&!/^\s*(?:[-*•]|\d+[.)])\s/.test(line)&&!/^\s*(?:kære|venlig hilsen|med venlig hilsen)\b/i.test(line)&&/[\p{L}\p{N}]$/u.test(trimmed)&&!protectedAt(end-1)){
        const lastStart=[...starts].filter(i=>tokens[i]?.start>=offset&&tokens[i]?.end<=end).at(-1);
        const start=lastStart===undefined?tokens.indexOf(ts[0]):lastStart;
        const firstVerb=[1,2,3,4,5,6].map(n=>start+n).find(i=>verb(i));
        const subjectBefore=firstVerb!==undefined&&tokens.slice(start+1,firstVerb).some(t=>subjects.has(t.word));
        const question=(whWords.has(tokens[start]?.word)&&!subjectBefore&&(firstVerb===start+1||firstVerb!==undefined&&inverted(firstVerb)))||(!subordinates.has(tokens[start]?.word)&&Boolean(inverted(start)));
        add(end,end,question?'?':'.',question?'Sluttegn ved et muligt spørgsmål.':'Punktum ved slutningen af afsnittet.','ending',2);
      }
      offset+=line.length+1;
    }
    changes.sort((a,b)=>a.start-b.start||a.end-b.end);
    return {text:applyPunctuation(text,changes),changes,limited:changes.length===0&&Boolean(text.trim())};
  }
  function applyPunctuation(text,changes){for(const c of [...changes].sort((a,b)=>b.start-a.start||b.end-a.end))text=text.slice(0,c.start)+c.replacement+text.slice(c.end);return text;}
  const suggestions=(text,options)=>punctuation(text,options).changes;
  // A bounded veto for a particular kind of detached phrase, not a general
  // grammatical parser. A finite verb inside a relative clause does not make
  // "efter en lang weekend, hvor jeg havde ..." an independent sentence.
  function danglingPrepositionalPhrase(words){
    if(!Array.isArray(words)||words.length<5||!prepositions.has(words[0]))return false;
    const relative=words.findIndex((word,i)=>i>=2&&i<=12&&['hvor','som','der'].includes(word));
    if(relative<0||words.slice(1,relative).some(word=>finite.has(word)))return false;
    const firstVerb=words.findIndex((word,i)=>i>relative&&finite.has(word));
    if(firstVerb<0)return false;
    for(let i=firstVerb+1;i<words.length-1;i++){
      const word=words[i],next=words[i+1];
      // A plausible main-clause inversion is enough to retain the boundary,
      // including unfamiliar inflected verbs; uncertainty must not join it.
      if(!finite.has(word)&&!/(?:er|ede|te|de)$/.test(word))continue;
      let previous=i-1;while(previous>relative&&adverbs.has(words[previous]))previous--;
      if(joins.has(words[previous])||subordinates.has(words[previous])||subjects.has(words[previous]))continue;
      if(finite.has(word)||subjects.has(next)||/^(?:alt|alting|intet|noget|begge|flere|mange|min|mit|mine|din|dit|dine|vores|deres|hans|hendes)$/.test(next)||(!finite.has(next)&&!infinitives.has(next)&&/(?:en|et|ene|erne)$/.test(next)))return false;
    }
    return true;
  }
  globalThis.lectioPlusPunctuationEngine={analyze:punctuation,apply:applyPunctuation,danglingPrepositionalPhrase};
  globalThis.lectioPlusPunctuation=suggestions;
  // The dedicated worker has no workspace catalog and uses only the pure engine
  // above. No UI, notes or storage are initialized in that context.
  if(!globalThis.lectioPlusLabCore)return;
  globalThis.lectioPlusLabCore.tools.push({id:'punctuation',category:'language',title:'Komma og punktum',description:'Indsæt kommaer, punktummer og store begyndelsesbogstaver med ét klik.',special:true});
  globalThis.lectioPlusSchoolWriting=(id,c)=>{
    if(!['punctuation','notes'].includes(id))return null;
    const {E,B,field,prefs,save,error}=c,node=E('section','lxp-writing'),status=E('p','lxp-tool-notice');status.setAttribute('role','status');
    const text=(id,label,value='',type='text',maxLength=12000)=>field(node,{id,label,value,type,maxLength});
    let pending=false,onBusy=()=>{};
    function button(label,fn){const b=B('lxp-secondary-button',label,async()=>{if(b.disabled||pending)return;pending=true;b.disabled=true;onBusy(true);try{await fn();}catch(e){if(e.name!=='AbortError')status.textContent=e.message;}finally{pending=false;onBusy(false);b.disabled=false;}},label);node.append(b);return b;}
    if(id==='punctuation'){
      const intro=E('p','lxp-settings-help','Den danske sprogmodel foreslår tegn ud fra ordene omkring dem. Tryk Ret komma og punktum, og sammenlign resultatet med din tekst. Ord tilføjes eller fjernes ikke.');
      const options=E('div','lxp-lab-inputs'),method=field(options,{id:'punctuation-method',label:'Metode',type:'select',options:[['model','Dansk sprogmodel · lokal'],['rules','Enkle regler · begrænset']],value:'model'});
      const existing=field(options,{id:'existing-punctuation',label:'Eksisterende tegn',type:'select',options:[['replace','Vurder kommaer og punktummer på ny'],['keep','Bevar mine eksisterende tegn']],value:'replace'});
      const style=field(options,{id:'comma-style',label:'Nye startkommaer',type:'select',options:[['with','Med startkomma'],['without','Uden startkomma']],value:'with'});
      const capital=field(options,{id:'capital-style',label:'Store begyndelsesbogstaver',type:'select',options:[['yes','Ret ved sætningsstart'],['no','Bevar mine bogstaver']],value:'yes'});
      const methodHelp=E('p','lxp-settings-help');
      const showMethod=()=>{const model=method.value==='model';style.closest('label').hidden=model;existing.closest('label').hidden=!model;methodHelp.textContent=model?'Modellen bruger overvejende startkomma, men garanterer ikke konsekvent kommatering. Den kan også overse tegn eller foreslå forkerte rettelser. Gennemlæs resultatet.':'De enkle regler er den tidligere, begrænsede metode. De kan ikke forstå alle sætninger og fjerner ikke eksisterende kommaer.';if(model&&location.protocol==='file:')methodHelp.textContent+=' HTML-demoen kan ikke køre modellen. Prøv den i den installerede udvidelse; se START_HER.txt.';};
      showMethod();node.append(intro,options,methodHelp);
      const source=text('text','Tekst til tegnsætning','','textarea'),preview=text('preview','Forhåndsvisning – kan redigeres','','textarea');source.rows=10;preview.rows=10;
      source.placeholder='jeg er træt men jeg skal lave lektier bagefter vil jeg slappe af';preview.placeholder='Den rettede tekst vises her.';
      const panes=E('div','lxp-writing-panes');panes.append(source.closest('label'),preview.closest('label'));node.append(panes);
      const list=E('div','lxp-punctuation-list'),details=E('details','lxp-punctuation-details',E('summary','','Se og vælg ændringer'),list),actions=E('div','lxp-tool-actions');
      let original='',items=[],before=null,ready=false,controller=null,generation=0;
      function update(){preview.value=applyPunctuation(original,items.filter(x=>x.input.checked));ready=true;copy.disabled=false;}
      async function analyze(automatic){
        if(!source.value.trim())throw Error('Skriv eller indsæt en tekst først.');
        const revision=++generation;controller=new AbortController();original=source.value;ready=false;copy.disabled=true;preview.value='';items=[];list.replaceChildren();
        const started=Date.now();let progressText='Opretter forbindelse til den lokale sprogmodel',elapsed=null,result;
        const showProgress=()=>{if(revision===generation&&!controller.signal.aborted)status.textContent=progressText+' · '+Math.floor((Date.now()-started)/1000)+' s. Din tekst bliver på computeren.';};
        const progress=update=>{
          if(update.phase==='connecting')progressText='Opretter forbindelse til den lokale sprogmodel';
          else if(update.phase==='worker')progressText='Starter den lokale tekstbehandling';
          else if(update.phase==='loading')progressText=({tokenizer:'Indlæser orddeling',model:'Indlæser den lokale modelfil',runtime:'Starter den lokale beregningsmotor'})[update.step]||'Indlæser den lokale sprogmodel';
          else if(update.phase==='working')progressText='Gennemgår teksten lokalt · '+Math.round(100*update.done/update.total)+' %';
          showProgress();
        };
        try{
          if(method.value==='model'){
            showProgress();elapsed=setInterval(showProgress,1000);
            result=await globalThis.lectioPlusLocalPunctuation.analyze(original,{existing:existing.value,capitals:capital.value==='yes'},progress,controller.signal);
          }else result=punctuation(original,{startComma:style.value==='with',capitals:capital.value==='yes'});
        }finally{clearInterval(elapsed);}
        if(revision!==generation||controller.signal.aborted)return;
        if(!node.isConnected){status.textContent='Teksten er ikke indsat, fordi du skiftede værktøj. Tryk Ret komma og punktum igen.';return;}
        for(const item of result.changes){
          const input=E('input');input.type='checkbox';input.checked=automatic;input.setAttribute('aria-label','Vælg forslag '+(items.length+1));
          const uncertain=item.confidence!==undefined&&item.confidence<0.8;
          const label=E('label','lxp-punctuation-suggestion',input,E('span','',(uncertain?'Tjek ekstra · ':'')+item.why),E('code','',original.slice(Math.max(0,item.start-24),item.start)+'['+original.slice(item.start,item.end)+' → '+(item.replacement||'fjernes')+']'+original.slice(item.end,item.end+24)));
          label.dataset.uncertain=String(uncertain);
          input.addEventListener('change',update);list.append(label);items.push({...item,input});
        }
        update();details.open=!automatic;
        status.textContent=automatic?`${items.length} ændring(er) indsat i forslaget. Gennemlæs især ledsætninger og nye punktummer, før du kopierer.`:`${items.length} forslag. Vælg de ændringer, du vil bruge.`;
        if(result.uncertain)status.textContent+=' '+result.uncertain+' af forslagene er markeret til ekstra kontrol.';
        if(!items.length)status.textContent='Ingen ændringer foreslået. Det er ikke en garanti for korrekt tegnsætning.';
      }
      const automatic=button('Ret komma og punktum',()=>analyze(true));automatic.className='lxp-primary-button';
      const manual=button('Find forslag',()=>analyze(false));actions.append(automatic,manual);
      const cancel=B('lxp-secondary-button','Stop tegnsætning',()=>{generation++;controller?.abort();ready=false;copy.disabled=true;status.textContent='Behandlingen er stoppet. Din oprindelige tekst er bevaret.';},'Stop');cancel.disabled=true;actions.append(cancel);
      const copy=button('Kopiér rettet tekst',async()=>{if(!ready)throw Error('Ret teksten først.');try{await navigator.clipboard.writeText(preview.value);status.textContent='Den rettede tekst er kopieret.';}catch{preview.focus();preview.select();status.textContent='Den rettede tekst er markeret. Tryk Ctrl+C eller ⌘C.';}});copy.disabled=true;actions.append(copy);
      const apply=button('Brug den viste tekst',()=>{if(!ready)throw Error('Ret teksten eller find forslag først.');before=source.value;source.value=preview.value;original=source.value;items=[];list.replaceChildren();details.open=false;status.textContent='Den rettede version er sat ind i tekstfeltet. Du kan fortryde.';});
      const undo=button('Fortryd indsættelse',()=>{if(before===null)return;source.value=before;preview.value=before;original=before;before=null;items=[];list.replaceChildren();ready=true;copy.disabled=false;status.textContent='Den oprindelige tekst er gendannet.';});actions.append(apply,undo);
      onBusy=value=>{node.setAttribute('aria-busy',String(value));cancel.disabled=!value;automatic.disabled=manual.disabled=apply.disabled=undo.disabled=value;preview.readOnly=value;copy.disabled=value||!ready;};
      const stale=()=>{generation++;controller?.abort();items=[];original='';list.replaceChildren();preview.value='';ready=false;copy.disabled=true;status.textContent='Tekst eller valg ændret. Tryk Ret komma og punktum igen.';};
      for(const input of [source,style,capital,existing])input.addEventListener(input===source?'input':'change',stale);
      method.addEventListener('change',()=>{showMethod();stale();});
      preview.addEventListener('input',()=>{if(pending)return;ready=true;copy.disabled=false;items=[];list.replaceChildren();status.textContent='Din manuelle rettelse er klar til at kopiere.';});
      node.append(actions,status,details,E('p','lxp-settings-help','Sprogmodellen følger med udvidelsen og kræver hverken login, API-nøgle eller internet. Teksten gemmes ikke automatisk. Dansk prosa er målet; citater, links, kode og tal beskyttes, og eksisterende spørgsmålstegn/udråbstegn bevares. Det er forslag til tegnsætning, ikke en fuld grammatikkontrol.'));
      for(const [label,url] of [['Kommaregler','https://sproget.dk/typiske-problemer/komma/'],['Punktum og sætningsgrænser','https://sproget.dk/typiske-problemer/punktum/']]){const a=E('a','lxp-text-link',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';node.append(a);}
      return {node};
    }
    const filter=text('subject-filter','Filtrér noter efter fag'),select=field(node,{id:'note',label:'Vælg note',type:'select',options:[['legacy','Min oprindelige note']],value:'legacy'}),title=text('title','Notens titel','Min oprindelige note','text',80),subject=text('subject','Notens fag','','text',80),note=text('notes','Mine egne noter',prefs().notes,'textarea',20000);note.rows=14;
    select.dataset.lxpUserContent='';let selected='legacy',base=prefs().notes,dirty=false,removed=null;
    onBusy=value=>{
      node.setAttribute('aria-busy', String(value));
      for(const control of node.querySelectorAll('button, input, select, textarea'))control.disabled=value;
      title.disabled=subject.disabled=value||selected==='legacy';
    };
    const records=()=>prefs().lab.notebooks;
    const current=()=>selected==='legacy'?{title:'Min oprindelige note',subject:'',text:prefs().notes}:records().find(n=>n.id===selected);
    function choices(){const q=filter.value.toLocaleLowerCase('da-DK');select.replaceChildren(new Option('Min oprindelige note','legacy'));for(const item of records())if(!q||item.subject.toLocaleLowerCase('da-DK').includes(q)||item.id===selected)select.append(new Option((item.subject?item.subject+' · ':'')+item.title,item.id));select.value=selected;}
    function load(){const item=current();if(!item){selected='legacy';return load();}title.value=item.title;subject.value=item.subject;note.value=item.text;note.maxLength=selected==='legacy'?20000:12000;title.disabled=subject.disabled=selected==='legacy';base=selected==='legacy'?item.text:JSON.stringify(item);dirty=false;choices();}
    for(const input of [note,title,subject])input.addEventListener('input',()=>{dirty=true;status.textContent='Ikke gemt endnu.';});filter.addEventListener('input',choices);
    select.addEventListener('change',()=>{if(pending){select.value=selected;status.textContent='Vent, mens notehandlingen bliver færdig.';return;}if(dirty){select.value=selected;status.textContent='Gem eller kassér ændringer, før du skifter note.';return;}selected=select.value;load();});
    button('Ny note',async()=>{if(dirty)throw Error('Gem eller kassér den åbne note først.');if(records().length>=40)throw Error('Du kan have 40 navngivne noter.');const item={id:uid(),title:'Ny note',subject:'',text:''};if(await save(p=>{if(p.lab.notebooks.length>=40)throw Error('Du kan have 40 navngivne noter.');return {lab:{...p.lab,notebooks:[...p.lab.notebooks,item]}};})!==false){selected=item.id;load();title.focus();title.select();}});
    button('Gem note',async()=>{const item=current(),now=selected==='legacy'?item?.text:JSON.stringify(item);if(dirty&&now!==base)throw Error('Noten er ændret i en anden fane. Kopiér dine ændringer før genindlæsning.');const target=selected,snapshot={title:title.value.trim(),subject:subject.value.trim(),text:note.value};if(!snapshot.title)throw Error('Giv noten en titel.');const expected=base;const saved=await save(p=>{
      const latest=target==='legacy'?p.notes:p.lab.notebooks.find(n=>n.id===target);
      if(target!=='legacy'&&!latest)throw Error('Noten blev slettet i en anden fane. Kopiér din tekst, før du indlæser igen.');
      if((target==='legacy'?latest:JSON.stringify(latest))!==expected)throw Error('Noten er ændret i en anden fane. Kopiér dine ændringer før genindlæsning.');
      return target==='legacy'?{notes:snapshot.text}:{lab:{...p.lab,notebooks:p.lab.notebooks.map(n=>n.id===target?{...n,...snapshot}:n)}};
    });if(saved!==false){base=target==='legacy'?snapshot.text:JSON.stringify({...item,...snapshot});dirty=note.value!==snapshot.text||title.value.trim()!==snapshot.title||subject.value.trim()!==snapshot.subject;status.textContent=dirty?'Den tidligere tekst er gemt. Dine nye ændringer er ikke gemt endnu.':'Noten er gemt.';choices();}});
    button('Kassér ugemte ændringer',()=>{load();status.textContent='Den gemte version er indlæst.';});
    button('Slet valgt note',async()=>{if(selected==='legacy')throw Error('Den oprindelige note bevares. Du kan rydde teksten og gemme.');if(dirty)throw Error('Gem eller kassér ændringer først.');const item=structuredClone(current()),target=selected;if(await save(p=>{const latest=p.lab.notebooks.find(n=>n.id===target);if(JSON.stringify(latest)!==JSON.stringify(item))throw Error('Noten er ændret i en anden fane. Indlæs den igen før sletning.');return {lab:{...p.lab,notebooks:p.lab.notebooks.filter(n=>n.id!==target)}};})!==false){removed=item;selected='legacy';load();}});
    button('Fortryd slettet note',async()=>{if(!removed)return;if(dirty)throw Error('Gem eller kassér ændringer først.');if(records().length>=40)throw Error('Der er ikke plads til flere noter.');const item=removed;if(await save(p=>{if(p.lab.notebooks.length>=40)throw Error('Der er ikke plads til flere noter.');if(p.lab.notebooks.some(n=>n.id===item.id))throw Error('Noten er allerede gendannet.');return {lab:{...p.lab,notebooks:[...p.lab.notebooks,item]}};})!==false){removed=null;selected=item.id;load();}});
    node.append(status,E('p','lxp-settings-help','Navngiv dine egne noter og skriv et valgfrit fag. Op til 40 noter à 12.000 tegn gemmes lokalt og kommer med i backup. Den oprindelige note bevares. Gem før genindlæsning.'));load();return {node,refresh(){if(pending)return;if(!dirty){const now=current();if(!now||(selected==='legacy'?now.text:JSON.stringify(now))!==base)load();}choices();}};
  };
})();
