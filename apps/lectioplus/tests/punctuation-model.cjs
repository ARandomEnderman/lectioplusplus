const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../extension'),P=require(root+'/punctuation-core.js');
let checks=0;const ok=(value,label)=>{assert.ok(value,label);checks++;console.log('PASS',label)};
const lexical=text=>Array.from(text.matchAll(/[\p{L}\p{N}][\p{L}\p{M}\p{N}'’\-]*/gu),m=>m[0].toLowerCase());
const boundaries=text=>{const words=[...text.matchAll(/[\p{L}\p{N}][\p{L}\p{M}\p{N}'’\-]*/gu)];return new Set(words.flatMap((m,i)=>{const punctuation=text.slice(m.index+m[0].length,words[i+1]?.index??text.length).match(/[,.?!]/);return punctuation?[i+punctuation[0]]:[];}));};
function metric(pairs){let tp=0,fp=0,fn=0;for(const [actual,expected]of pairs){const a=boundaries(actual),b=boundaries(expected);for(const x of a)b.has(x)?tp++:fp++;for(const x of b)if(!a.has(x))fn++;}return{tp,fp,fn,f1:2*tp/(2*tp+fp+fn)};}
(async()=>{
 const provenance=JSON.parse(fs.readFileSync(root+'/vendor/punctuation/provenance.json'));
 for(const [file,hash]of Object.entries(provenance.files))ok(crypto.createHash('sha256').update(fs.readFileSync(root+'/vendor/punctuation/'+file)).digest('hex')===hash,'pinned asset integrity: '+file);
 const encode=P.tokenizer(JSON.parse(fs.readFileSync(root+'/vendor/punctuation/model/tokenizer.json')));
 const tokenPairs=JSON.parse(fs.readFileSync(__dirname+'/fixtures/punctuation-tokenizer.json'));
 for(const[word,expected]of tokenPairs)assert.deepEqual(encode(word),expected,word);
 ok(true,tokenPairs.length+' tokenizations agree with the reference tokenizer');
 assert.throws(()=>P.prepare('x'.repeat(12001)));checks++;
 const long=P.prepare(('temperaturkonstanten og osmoseprocessen påvirker forsøget '.repeat(180)).trim()),windows=P.windows(long,encode);
 ok(windows.every(w=>w.ids.length<=128&&w.ids[0]===2&&w.ids.at(-1)===3),'windows respect the model token limit and special tokens');
 ok(new Set(windows.flatMap(w=>w.positions.map(p=>p.index))).size===long.words.length,'long text has no dropped words at overlaps');
 const giant=P.prepare('a'.repeat(1000)+' hej');ok(P.windows(giant,encode).length===1,'very long unknown words do not stall windowing');
 const paragraphs=P.prepare('jeg læser\n\njeg skriver\nvi læser');ok(paragraphs.paragraphs.length===2,'blank lines delimit paragraphs; single line wraps stay in context');
 assert.throws(()=>P.render(P.prepare('hej'),[]));checks++;
 assert.throws(()=>P.prediction([NaN],0));checks++;
 const splitCase=P.prediction(Float32Array.from([.35,.35,.30,1e-10,1e-10,1e-10,1e-10,1e-10,1e-10,1e-10],Math.log),0);
 ok(splitCase.label==='O','case uncertainty cannot turn the more likely no-comma decision into a comma');
 const ort=await import(pathToFileURL(root+'/vendor/punctuation/ort/ort.wasm.bundle.min.mjs').href);
 ort.env.wasm.numThreads=1;ort.env.wasm.proxy=false;ort.env.wasm.wasmPaths=root+'/vendor/punctuation/ort/';
 const session=await ort.InferenceSession.create(new Uint8Array(fs.readFileSync(root+'/vendor/punctuation/model/pnc.int8.onnx')),{executionProviders:['wasm'],graphOptimizationLevel:'all'});
 const context={lectioPlusLabCore:{tools:[]}};vm.createContext(context);vm.runInContext(fs.readFileSync(root+'/school-writing.js','utf8'),context);
 const fragment=context.lectioPlusPunctuationEngine.danglingPrepositionalPhrase;
 for(const phrase of [
   'efter en lang weekend hvor jeg havde læst meget',
   'før en lang rejse som vi havde planlagt sammen',
   'under det store træ der stod i haven',
   'på en travl dag hvor jeg læste og senere lavede mad'
 ])ok(fragment(phrase.split(' ')),'recognizes a detached prepositional phrase: '+phrase);
 for(const phrase of [
   'efter en lang weekend var jeg træt',
   'efter en lang weekend hvor jeg havde læst meget gik jeg hjem',
   'efter en lang weekend hvor jeg havde læst meget skulle min søster arbejde',
   'efter en lang weekend hvor vi havde læst meget blev alt stille',
   'efter en lang weekend hvor jeg havde læst meget faldt regn over byen',
   'efter en lang weekend hvor jeg havde læst meget accelererede maskinen igen',
   'efter at vi havde spist gik jeg hjem',
   'i går hvor jeg havde fri tog vi i byen'
 ])ok(!fragment(phrase.split(' ')),'retains a possible independent sentence: '+phrase);
 const boundaryDoc=P.prepare('jeg var træt efter en lang weekend hvor jeg havde læst meget');
 const boundaryPred=boundaryDoc.words.map(()=>({label:'O',confidence:.8,markProbabilities:{O:.8,',':.1,'.':.1}}));
 boundaryPred[2]={label:'.',confidence:.65,markProbabilities:{O:.3,',':.05,'.':.65}};
 const guarded=P.guardBoundaries(boundaryDoc,boundaryPred,fragment);
 ok(guarded[2].label==='O'&&boundaryPred[2].label==='.'&&guarded[2].keepAttached,'boundary guard rejects a moderate-confidence detached phrase without mutating predictions');
 boundaryPred[2].confidence=.95;ok(P.guardBoundaries(boundaryDoc,boundaryPred,fragment)[2].label==='.', 'bounded heuristic abstains when the model strongly supports a new sentence');
 const comparative=context.lectioPlusPunctuationEngine.analyze('klokken var blevet meget mere end jeg havde regnet med').text;
 ok(comparative.includes(', end jeg')&&!comparative.includes('end. Jeg'),'legacy method also avoids splitting a comparative clause after end');
 async function infer(text,options={}){
   const doc=P.prepare(text),predictions=[];
   for(const window of P.windows(doc,encode)){
     const shape=[1,window.ids.length],inputs={input_ids:new ort.Tensor('int64',BigInt64Array.from(window.ids,BigInt),shape),attention_mask:new ort.Tensor('int64',new BigInt64Array(shape[1]).fill(1n),shape),token_type_ids:new ort.Tensor('int64',new BigInt64Array(shape[1]),shape)};
     const result=await session.run(inputs);P.merge(predictions,window,result.logits.data);
     for(const tensor of Object.values(inputs))tensor.dispose();for(const tensor of Object.values(result))tensor.dispose();
   }
   const engine=context.lectioPlusPunctuationEngine;
   return P.render(doc,P.reinforce(doc,P.guardBoundaries(doc,predictions,engine.danglingPrepositionalPhrase),engine.analyze),options);
 }
 for(const[input,expected]of [
   ['vi talte om hvad. Vi havde lavet','Vi talte om, hvad vi havde lavet.'],
   ['historien handlede, om en dreng. Der rejste ud i verden','Historien handlede om en dreng, der rejste ud i verden.'],
   ['jeg købte mere end. Jeg havde brug for','Jeg købte mere, end jeg havde brug for.'],
   ['jo længere. Vi kom ind i skoven desto mørkere blev der','Jo længere vi kom ind i skoven, desto mørkere blev der.'],
   ['hvilken bog læser du','Hvilken bog læser du?'],
   ['hvorfor ændrer farven sig når vi tilsætter syre','Hvorfor ændrer farven sig, når vi tilsætter syre?'],
   ['hvordan det virker ved jeg ikke','Hvordan det virker, ved jeg ikke.']
 ]){const result=await infer(input);assert.equal(result.text,expected,input);ok(true,'actual WASM inference: '+input);}
 const safety=[
   'vi mødes kl. 9.45 og tager 1,5 liter med',
   'jeg åbner opgave.docx og læser på https://example.test/a?x=2,5',
   'jeg sender svaret til test@example.test når jeg er færdig',
   'hun skrev "jeg er træt men jeg læser" i sin note',
   'koden er `x=1.5; y=2` og den virker',
   '```js\nconst a = 1.5;\n```\nher er min forklaring',
   'jeg læser\n\njeg skriver\nvi regner',
   'pH er 7 og iPhone bruger JavaScript',
   'kan du komme? jeg venter! husk tasken',
   'jeg læser ,men jeg er træt .',
   '<script>alert(1)</script> jeg skriver om kode',
   '   ',
   ('vi talte om hvad vi skulle lave og om hvordan vi kunne hjælpe hinanden resten af dagen ').repeat(55).trim()
 ];
 for(const text of safety){
   const result=await infer(text),doc=P.prepare(text);
   assert.deepEqual(lexical(result.text),lexical(text));
   ok(result.changes.every((c,i)=>c.start>=0&&c.end<=text.length&&(!i||result.changes[i-1].end<=c.start)),'non-overlapping edits preserve words: '+text.slice(0,45));
   for(const word of doc.words.filter(w=>w.protected))assert.ok(!result.changes.some(c=>c.start<word.end&&c.end>word.start),'protected span: '+word.raw);
   assert.equal(result.text.split('\n').length,text.split('\n').length);
 }
 const retained=await infer('jeg tror, at hun kommer. men jeg går.',{existing:'keep',capitals:false});
 ok(retained.text.includes('tror, at')&&retained.text.includes('kommer. men'),'keep mode preserves existing punctuation and casing');
 const proper=await infer('pH er 7 og iPhone bruger JavaScript');ok(proper.text.includes('pH')&&proper.text.includes('iPhone')&&proper.text.includes('JavaScript'),'technical mixed case is not rewritten');
 const corpus=JSON.parse(fs.readFileSync(__dirname+'/fixtures/punctuation-prose.json')),model=[],rules=[];let exact=0;
 for(const[input,reference]of corpus){const result=await infer(input);model.push([result.text,reference]);rules.push([context.lectioPlusPunctuationEngine.analyze(input).text,reference]);assert.deepEqual(lexical(result.text),lexical(input));assert.equal((await infer(result.text)).text,result.text,'repeat inference: '+input);if(result.text===reference)exact++;else console.log('REVIEW\n Expected:',reference,'\n Model:   ',result.text);}
 const modelScore=metric(model),ruleScore=metric(rules);
 console.log('LANGUAGE EVALUATION',JSON.stringify({texts:corpus.length,exact,oldExact:rules.filter(([actual,reference])=>actual===reference).length,model:modelScore,oldRules:ruleScore}));
 ok(exact===corpus.length&&modelScore.f1>ruleScore.f1,'all 25 prose examples match and improve on the old rules');
 for(const name of ['punctuation-regressions.json','punctuation-contrasts.json','punctuation-sentences.json']){
   const pairs=JSON.parse(fs.readFileSync(__dirname+'/fixtures/'+name));let matched=0;
   for(const[input,expected]of pairs){const result=await infer(input);assert.deepEqual(lexical(result.text),lexical(input));if(name==='punctuation-sentences.json'){assert.equal((await infer(result.text)).text,result.text,'repeat sentence correction');assert.equal(result.text.split('\n').length,input.split('\n').length,'line break preservation');}if(result.text===expected)matched++;else console.log('REVIEW',name,'\n Expected:',expected,'\n Model:   ',result.text);}
   console.log('ADDITIONAL LANGUAGE EVALUATION',name,matched+'/'+pairs.length);
   ok(matched===pairs.length,'all reference texts match: '+name);
 }
 await session.release();
 console.log('TOTAL',checks,'local punctuation model checks (language differences remain listed separately)');
})().catch(e=>{console.error(e);process.exit(1)});
