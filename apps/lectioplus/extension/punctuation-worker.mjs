import * as ort from './vendor/punctuation/ort/ort.wasm.bundle.min.mjs';
import './punctuation-core.js';
import './school-writing.js';

const core=globalThis.lectioPlusPunctuationModelCore;
let runtime=null,busy=false;
class ModelLoadError extends Error {}
async function load(report){
  if(!runtime)runtime=(async()=>{
    ort.env.wasm.numThreads=1;
    ort.env.wasm.proxy=false;
    ort.env.wasm.wasmPaths=new URL('./vendor/punctuation/ort/',import.meta.url).href;
    const root=new URL('./vendor/punctuation/model/',import.meta.url);
    const read=async(file,kind)=>{
      report({phase:'loading',step:kind});
      try{
        const response=await fetch(new URL(file,root));
        if(!response.ok)throw Error('asset');
        return kind==='tokenizer'?await response.json():new Uint8Array(await response.arrayBuffer());
      }catch{throw new ModelLoadError('Modelfilen '+file+' kunne ikke indlæses. Kopiér hele extension-mappen inklusive vendor, og genindlæs udvidelsen og Lectio-fanen.');}
    };
    let encode;try{encode=core.tokenizer(await read('tokenizer.json','tokenizer'));}catch(error){if(error instanceof ModelLoadError)throw error;throw new ModelLoadError('Sprogmodellens orddeling kunne ikke læses. Kopiér hele vendor-mappen fra testpakken igen.');}
    const weights=await read('pnc.int8.onnx','model');
    report({phase:'loading',step:'runtime'});
    let session;
    try{session=await ort.InferenceSession.create(weights,{executionProviders:['wasm'],graphOptimizationLevel:'all'});}
    catch{throw new ModelLoadError('Browseren kunne ikke starte den lokale beregningsmotor (WebAssembly). Kontrollér, at vendor/punctuation/ort er kopieret med, og genindlæs udvidelsen og Lectio-fanen.');}
    return {session,encode};
  })().catch(error=>{runtime=null;throw error;});
  return runtime;
}
self.onmessage=async({data})=>{
  if(!data||data.type!=='analyze'||!Number.isSafeInteger(data.id)||busy)return;
  const id=data.id;busy=true;
  try{
    const document=core.prepare(data.text);
    if(!document.words.length){self.postMessage({id,type:'result',result:{text:data.text,changes:[],uncertain:0,engine:'model'}});return;}
    self.postMessage({id,type:'progress',phase:'loading'});
    const {session,encode}=await load(progress=>self.postMessage({id,type:'progress',...progress})),windows=core.windows(document,encode),predictions=[];
    for(let i=0;i<windows.length;i++){
      const window=windows[i],shape=[1,window.ids.length];
      const inputs={input_ids:new ort.Tensor('int64',BigInt64Array.from(window.ids,BigInt),shape),attention_mask:new ort.Tensor('int64',new BigInt64Array(shape[1]).fill(1n),shape),token_type_ids:new ort.Tensor('int64',new BigInt64Array(shape[1]),shape)};
      const result=await session.run(inputs);
      try{core.merge(predictions,window,result.logits.data);}finally{for(const tensor of Object.values(inputs))tensor.dispose();for(const tensor of Object.values(result))tensor.dispose();}
      self.postMessage({id,type:'progress',phase:'working',done:i+1,total:windows.length});
    }
    const engine=globalThis.lectioPlusPunctuationEngine;
    const guarded=core.guardBoundaries(document,predictions,engine.danglingPrepositionalPhrase);
    const reinforced=core.reinforce(document,guarded,engine.analyze);
    self.postMessage({id,type:'result',result:core.render(document,reinforced,data.options||{})});
  }catch(error){
    self.postMessage({id,type:'error',message:(error instanceof ModelLoadError?error.message:'Sprogmodellen kunne ikke køre. Kontrollér, at hele extension-mappen er kopieret, genindlæs udvidelsen, og prøv igen.')+' Teksten er ikke ændret.'});
  }finally{busy=false;}
};
