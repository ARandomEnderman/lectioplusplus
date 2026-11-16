// Pure preprocessing, WordPiece tokenization and reviewable edits for local inference.
// No network, storage, DOM access or sentence-length-based punctuation.
(() => {
  'use strict';
  const MAX_CHARS = 12000, LABELS = ['O','O|U',',',',|U','.','.|U','?','?|U','!','!|U'];
  const protectedPattern = /```[\s\S]*?(?:```|$)|`[^`\n]*`|https?:\/\/[^\s<>]+|www\.[^\s<>]+|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b[\p{L}\p{N}_-]+(?:\.[\p{L}\p{N}_-]+)*\.(?:docx?|xlsx?|pptx?|pdf|txt|csv|json|js|py|html?|zip|png|jpe?g|dk|com|org|net|edu)\b|\b\d+(?:[.,:/-]\d+)+\b|\b(?:bl\.a\.|f\.eks\.|dvs\.|osv\.|m\.m\.|m\.fl\.|ca\.|kl\.|nr\.|stk\.|dr\.|prof\.|kr\.)|"[^"\n]*"|“[^”\n]*”|»[^«\n]*«/giu;

  function prepare(text) {
    if (typeof text !== 'string' || text.length > MAX_CHARS) throw Error('Indsæt højst 12.000 tegn ad gangen.');
    const protectedRanges = [...text.matchAll(protectedPattern)].map(m => ({start:m.index,end:m.index+m[0].length,raw:m[0]}));
    const words = []; let offset=0;
    const ordinary = end => {
      for (const m of text.slice(offset,end).matchAll(/[\p{L}\p{N}][\p{L}\p{M}\p{N}'’\-]*/gu)) {
        const start=offset+m.index;
        words.push({start,end:start+m[0].length,raw:m[0],model:m[0].toLowerCase(),protected:false});
      }
    };
    for (const range of protectedRanges) {
      ordinary(range.start);
      const number=/^\d/.test(range.raw), abbreviation=/^(?:[\p{L}]+\.)+$/u.test(range.raw);
      words.push({...range,model:number?range.raw:abbreviation?range.raw.toLowerCase():'noget',protected:true,noAfter:!number});
      offset=range.end;
    }
    ordinary(text.length);
    const paragraphs=[];
    for (let i=0;i<words.length;i++) {
      // A copied line wrap is not a sentence ending. Only blank lines and
      // fenced multiline passages split inference into separate paragraphs.
      if (!i || /\n\s*\n/.test(text.slice(words[i-1].end,words[i].start)) || /\n/.test(words[i-1].raw) || (words[i].protected&&/\n/.test(words[i].raw))) paragraphs.push([]);
      paragraphs.at(-1).push(i);
    }
    return {text,words,paragraphs};
  }

  // Matches this model's BertNormalizer (case/accent sensitive) + BertPreTokenizer
  // and WordPiece. Lowercasing is applied to model inputs only, never to user text.
  function tokenizer(data) {
    if (data.model?.type !== 'WordPiece' || data.normalizer?.strip_accents !== false || data.normalizer?.lowercase !== false) throw Error('Ukendt tokenizerformat.');
    const vocab=data.model.vocab, unknown=vocab['[UNK]'], limit=data.model.max_input_chars_per_word;
    const chinese=cp=>cp>=0x4e00&&cp<=0x9fff||cp>=0x3400&&cp<=0x4dbf||cp>=0x20000&&cp<=0x2a6df||cp>=0x2a700&&cp<=0x2b73f||cp>=0x2b740&&cp<=0x2b81f||cp>=0x2b820&&cp<=0x2ceaf||cp>=0xf900&&cp<=0xfaff||cp>=0x2f800&&cp<=0x2fa1f;
    return word => {
      let cleaned='';
      for (const ch of word) {
        const cp=ch.codePointAt(0);
        if (cp===0 || cp===0xfffd || (/[\p{Cc}\p{Cf}]/u.test(ch)&&!/[\t\n\r]/.test(ch))) continue;
        cleaned += chinese(cp)?' '+ch+' ': /[\s\p{Zs}]/u.test(ch)?' ':ch;
      }
      const pieces=[];
      for (const m of cleaned.matchAll(/[\p{P}\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]|[^\s\p{P}\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]+/gu)) {
        const chars=Array.from(m[0]);
        if(chars.length>limit){pieces.push(unknown);continue;}
        const sub=[];let start=0;
        while(start<chars.length){
          let end=chars.length,id;
          for(;end>start;end--){const key=(start?'##':'')+chars.slice(start,end).join('');if(Object.hasOwn(vocab,key)){id=vocab[key];break;}}
          if(id===undefined){sub.length=0;sub.push(unknown);break;}
          sub.push(id);start=end;
        }
        pieces.push(...sub);
      }
      return pieces.length?pieces:[unknown];
    };
  }

  function windows(document, encode) {
    const result=[];
    for (const paragraph of document.paragraphs) {
      const tokens=paragraph.map(i=>encode(document.words[i].model)); let start=0;
      while(start<paragraph.length){
        const ids=[2], positions=[];let end=start;
        while(end<paragraph.length){
          const part=tokens[end].length>126?[1]:tokens[end];
          if(ids.length+part.length>127)break;
          positions.push({index:paragraph[end],token:ids.length});ids.push(...part);end++;
        }
        ids.push(3);
        positions.forEach((p,i)=>p.weight=Math.min(i+1,positions.length-i));
        result.push({ids,positions});
        if(end===paragraph.length)break;
        start=Math.max(start+1,end-12);
      }
    }
    return result;
  }

  function prediction(logits, offset) {
    const scores=Array.from(logits.slice(offset,offset+10));
    if(scores.length!==10||scores.some(n=>!Number.isFinite(n)))throw Error('Sprogmodellen returnerede et ugyldigt resultat.');
    const max=Math.max(...scores), probabilities=scores.map(n=>Math.exp(n-max)),sum=probabilities.reduce((a,b)=>a+b,0);
    // Decide punctuation independently of truecasing. Otherwise two plausible
    // case variants can split the probability of "no comma" and let an inferior
    // comma variant win. User casing is preserved except at sentence starts.
    const markProbabilities=Object.fromEntries(['O',',','.','?','!'].map((mark,i)=>[mark,(probabilities[2*i]+probabilities[2*i+1])/sum]));
    const label=Object.keys(markProbabilities).sort((a,b)=>markProbabilities[b]-markProbabilities[a])[0];
    const terminal=['.','?','!'].sort((a,b)=>markProbabilities[b]-markProbabilities[a])[0];
    return {label,confidence:markProbabilities[label],terminal,markProbabilities};
  }
  function merge(predictions, window, logits) {
    if(logits.length!==window.ids.length*10)throw Error('Forkert størrelse på sprogmodellens resultat.');
    for(const p of window.positions)if(!predictions[p.index]||p.weight>predictions[p.index].weight)predictions[p.index]={...prediction(logits,p.token*10),weight:p.weight};
  }

  function guardBoundaries(document,predictions,isDanglingPhrase){
    const result=predictions.map(p=>({...p}));
    for(const paragraph of document.paragraphs){
      // Work backwards so a later rejected boundary cannot leave the next
      // check looking at an artificially shortened phrase.
      for(let j=paragraph.length-2;j>=0;j--){
        const index=paragraph[j],p=result[index],word=document.words[index];
        if(p?.label!=='.'||p.confidence>=0.9||word.noAfter)continue;
        let end=j+1;
        while(end<paragraph.length-1&&!/[.?!]/.test(result[paragraph[end]]?.label||'O'))end++;
        const phrase=paragraph.slice(j+1,end+1).map(i=>document.words[i]);
        if(phrase.some(w=>w.protected)||!isDanglingPhrase(phrase.map(w=>w.model)))continue;
        result[index]={...p,label:'O',confidence:p.markProbabilities?.O??0,keepAttached:true,boundaryReason:'Bevar den efterfølgende sætningsdel sammen med resten; dens udsagnsled står i en relativsætning.'};
      }
    }
    return result;
  }

  // Reinforce ambiguous model decisions only when a clause rule independently
  // supports a comma. Never copy the old engine's guessed sentence boundaries.
  // Rule matches alone are insufficient: the model must also consider a comma
  // plausible. The original model confidence is retained for review marking.
  function reinforce(document,predictions,analyzeRules){
    const {text,words}=document,characters=text.split('');
    let wi=0;
    for(let i=0;i<characters.length;i++){
      while(wi<words.length&&words[wi].end<=i)wi++;
      const protectedHere=words[wi]?.protected&&words[wi].start<=i;
      if(!protectedHere&&/[,.]/.test(characters[i]))characters[i]=' ';
    }
    // Respect sentence endings recognized by the model while checking clauses.
    for(let i=0;i<words.length-1;i++)if(/[.?!]/.test(predictions[i]?.label?.[0]||'O')&&!words[i].noAfter&&words[i+1].start>words[i].end)characters[words[i].end]='.';
    const proposals=analyzeRules(characters.join(''),{capitals:false,startComma:true,modelAssist:true}).changes;
    const byEnd=new Map(words.map((word,i)=>[word.end,i])),byWord=new Map();
    for(const proposal of proposals)if(['comma','start-comma'].includes(proposal.kind)&&/^,\s*$/.test(proposal.replacement)&&byEnd.has(proposal.start))byWord.set(byEnd.get(proposal.start),proposal);
    return predictions.map((p,i)=>{
      const proposal=byWord.get(i);
      if(!proposal||p.label[0]!=='O'||(p.markProbabilities?.[',']??0)<0.25)return p;
      return {...p,label:','+(p.label.endsWith('|U')?'|U':''),confidence:p.markProbabilities[','],grammar:proposal.why};
    });
  }

  const apply=(text,changes)=>changes.reduceRight((s,c)=>s.slice(0,c.start)+c.replacement+s.slice(c.end),text);
  function render(document,predictions,options={}) {
    const {text,words,paragraphs}=document,changes=[];
    if(predictions.length!==words.length||predictions.some(p=>!p||!LABELS.includes(p.label)))throw Error('Sprogmodellen nåede ikke hele teksten. Prøv igen.');
    const add=(start,end,replacement,why,kind,confidence=1)=>{if(text.slice(start,end)!==replacement)changes.push({start,end,replacement,why,kind,confidence});};
    let uncertain=0;
    for(const paragraph of paragraphs){
      let capitalNext=true,sentenceStart=0;
      for(let j=0;j<paragraph.length;j++){
        const i=paragraph[j],word=words[i],next=words[paragraph[j+1]],p=predictions[i];
        const end=next?.start??(text.indexOf('\n',word.end)<0?text.length:text.indexOf('\n',word.end));
        const gap=text.slice(word.end,end),last=j===paragraph.length-1;
        let mark=p.label[0]==='O'?'':p.label[0],confidence=p.confidence;
        // Models trained on text windows often leave their final word unpunctuated.
        // Finish prose explicitly; preserve questions/exclamations already supplied.
        if(last&&!/[.!?]/.test(mark)){
          const sentence=paragraph.slice(sentenceStart,j+1).map(k=>words[k].model).join(' ');
          const question=/^(?:hvordan|hvorfor|hvornår|hvor) (?:er|var|bliver|blev|har|havde|kan|kunne|skal|skulle|vil|ville|må|går|gik|gør|gjorde|kommer|kom)\b|^hvem (?:er|var|har|havde|kan|skal|vil|kommer|kom)\b|^(?:hvilken|hvilket|hvilke) [\p{L}-]+ (?:er|var|har|kan|skal|vil|læser|skriver|vælger)\b|^(?:kan|kunne|vil|ville|skal|skulle|må|er|har|havde|ved|gør) (?:du|i|vi|han|hun|de|det|den|man)\b/u.test(sentence);
          mark=question?'?':(p.terminal||'.');confidence=p.markProbabilities?.[mark]??0;
        }
        const editable=!word.noAfter&&/^[\s,.]*$/.test(gap)&&!next?.noAfter;
        const keep=options.existing==='keep'&&/[,.]/.test(gap);
        let effective=gap;
        if(editable&&!keep){
          // Reuse original whitespace and line breaks; punctuation stays after the word.
          effective=mark+gap.replace(/[,.]/g,'');
          if(next&&!/\s/.test(effective))effective+=' ';
          add(word.end,end,effective,p.boundaryReason||(p.grammar?'Supplerende kommaregel: '+p.grammar:mark?'Forslag fra den lokale sprogmodel.':'Fjern et tegn, som sprogmodellen ikke finder grundlag for.'),'model-punctuation',confidence);
          if(effective!==gap&&confidence<0.8)uncertain++;
        }
        if(options.capitals!==false&&!word.protected&&!/\p{Lu}/u.test(word.raw.slice(1))){
          let first=word.raw[0];
          if(capitalNext)first=first.toLocaleUpperCase('da');
          else if(options.existing!=='keep'&&j&&/[.]/.test(text.slice(words[paragraph[j-1]].end,word.start))&&(predictions[paragraph[j-1]].keepAttached||/^(?:Jeg|Du|Han|Hun|Vi|De|Det|Den|Der|Man|Hvad|Hvor|Hvordan|Hvornår|Hvorfor|Men|Og|Eller|Da|Når|Hvis|Fordi|Som|At|Om)$/.test(word.raw)))first=first.toLocaleLowerCase('da');
          add(word.start,word.start+1,first,'Forslag til stort/lille begyndelsesbogstav.','capital');
        }
        capitalNext=/[.!?]\s*$/.test(effective);
        if(capitalNext)sentenceStart=j+1;
      }
    }
    changes.sort((a,b)=>a.start-b.start||a.end-b.end);
    return {text:apply(text,changes),changes,uncertain,limited:true,engine:'model'};
  }
  const api={MAX_CHARS,LABELS,prepare,tokenizer,windows,prediction,merge,guardBoundaries,reinforce,render,apply};
  globalThis.lectioPlusPunctuationModelCore=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
