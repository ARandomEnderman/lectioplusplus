(() => {
  'use strict';
  const languages=[['da','Dansk'],['en','Engelsk'],['de','Tysk'],['fr','Fransk'],['es','Spansk'],['it','Italiensk'],['sv','Svensk'],['no','Norsk'],['fi','Finsk'],['nl','Nederlandsk'],['pl','Polsk'],['pt','Portugisisk'],['uk','Ukrainsk'],['ru','Russisk'],['tr','Tyrkisk'],['ar','Arabisk'],['ja','Japansk'],['ko','Koreansk'],['zh-CN','Kinesisk (forenklet)'],['hi','Hindi'],['el','Græsk'],['cs','Tjekkisk'],['ro','Rumænsk'],['hu','Ungarsk']];
  function validate(request){if(!request||typeof request.text!=='string'||!request.text.trim())throw Error('Indsæt eller hent markeret tekst først.');if([...request.text].length>2000)throw Error('Oversæt højst 2.000 tegn ad gangen.');if(!languages.some(([x])=>x===request.from)||!languages.some(([x])=>x===request.to))throw Error('Vælg to gyldige sprog.');return request;}
  function chunks(text){const encoder=new TextEncoder(),result=[];let rest=text;while(rest){let segment='',bytes=0;for(const char of rest){const size=encoder.encode(char).length;if(bytes+size>480)break;segment+=char;bytes+=size;}if(segment.length<rest.length){const cut=Math.max(segment.lastIndexOf('\n'),segment.lastIndexOf('. ')+1,segment.lastIndexOf(' '));if(cut>segment.length/2)segment=segment.slice(0,cut+1);}result.push(segment);rest=rest.slice(segment.length);}return result;}
  async function translate(request,fetcher=fetch){
    validate(request);
    if(request.from===request.to)return {text:request.text,provider:'Samme sprog',segments:0};
    const parts=request.text.split(/(\r\n|\r|\n)/).flatMap(line=>line.trim()?chunks(line):[line]);
    if(parts.filter(part=>part.trim()).length>24)throw Error('Teksten har mange korte linjer. Oversæt et mindre udsnit ad gangen.');
    const translated=[],deadline=Date.now()+45000;let segments=0;
    // Preserve the user's paragraph breaks and spacing ourselves. The service
    // may trim each response, and adding a space at every byte limit corrupts
    // long words and text in writing systems that do not use word spaces.
    for(const part of parts){
        const leading=part.match(/^\s*/)[0],trailing=part.match(/\s*$/)[0],body=part.trim();
        if(!body){translated.push(part);continue;}
        const url=new URL('https://api.mymemory.translated.net/get');
        url.searchParams.set('q',body);url.searchParams.set('langpair',request.from+'|'+request.to);
        const remaining=deadline-Date.now();
        if(remaining<=0)throw Error('Oversættelsen tog for lang tid. Prøv et mindre udsnit.');
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),Math.min(12000,remaining));
        try{
          const response=await fetcher(url.href,{credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',signal:controller.signal});
          if(!response.ok)throw Error(response.status===429?'Den gratis oversættelsesgrænse er nået. Prøv igen senere.':'Oversættelsestjenesten svarer ikke lige nu.');
          const data=await response.json();
          if(Number(data.responseStatus)!==200||data.quotaFinished)throw Error('Tjenesten kunne ikke oversætte. Den gratis grænse kan være nået, eller sprogparret kan være utilgængeligt.');
          const text=data.responseData?.translatedText;
          if(typeof text!=='string'||!text.trim()||text.length>12000)throw Error('Oversættelsestjenesten gav et ugyldigt svar.');
          translated.push(leading+text.trim()+trailing);segments++;
        }catch(e){if(e.name==='AbortError')throw Error('Oversættelsen tog for lang tid. Prøv igen.');throw e;}
        finally{clearTimeout(timer);}
    }
    return {text:translated.join(''),provider:'MyMemory',segments};
  }
  globalThis.lectioPlusTranslation={languages,validate,chunks,translate};
  globalThis.lectioPlusLabCore?.tools.push({id:'translate',category:'language',title:'Oversætter',description:'Oversæt mellem 24 sprog uden konto eller API-nøgle. Kræver internet.',special:true});
  let selection='',selectionTooLong=false;if(typeof document!=='undefined')document.addEventListener('selectionchange',()=>{const text=globalThis.getSelection?.()?.toString()||'';if(text.trim()){selectionTooLong=[...text].length>2000;selection=selectionTooLong?'':text;}});
  globalThis.lectioPlusTranslationTool=c=>{
    const {E,B,field}=c,node=E('section','lxp-writing'),controls=E('div','lxp-lab-inputs'),status=E('p','lxp-tool-notice');status.setAttribute('role','status');node.append(controls);
    const from=field(controls,{id:'from',label:'Oversæt fra',type:'select',options:languages,value:'da'}),to=field(controls,{id:'to',label:'Oversæt til',type:'select',options:languages,value:'en'}),input=field(node,{id:'source-text',label:'Tekst til oversættelse',type:'textarea',maxLength:4000,value:''}),output=field(node,{id:'translation',label:'Oversættelse',type:'textarea',maxLength:30000,value:''});input.rows=8;output.rows=8;output.readOnly=true;input.dir=output.dir='auto';let version=0,busy=false;
    const count=E('p','lxp-settings-help');count.setAttribute('aria-label','Tegntæller');node.insertBefore(count,output.closest('label')||output);
    const countText=()=>{const length=[...input.value].length;count.textContent=length.toLocaleString('da-DK')+' / 2.000 tegn';input.setAttribute('aria-invalid',String(length>2000));};countText();
    const changed=()=>{version++;output.value='';countText();status.textContent='Klar til oversættelse.';};for(const f of [from,to,input]){f.addEventListener('input',changed);f.addEventListener('change',changed);}
    const getSelection=B('lxp-secondary-button','Hent markeret tekst',()=>{if(selectionTooLong){status.textContent='Markér højst 2.000 tegn. Den tidligere markering bliver ikke brugt.';return;}if(!selection){status.textContent='Markér noget tekst på siden først. Du kan også indsætte tekst i feltet.';return;}input.value=selection;changed();},'Hent markeret tekst');
    const swap=B('lxp-secondary-button','Byt sprog',()=>{[from.value,to.value]=[to.value,from.value];if(output.value)input.value=output.value;changed();},'⇄ Byt sprog');controls.append(swap);
    const submit=B('lxp-primary-button','Oversæt teksten',async()=>{if(busy)return;const request={text:input.value,from:from.value,to:to.value};try{validate(request);}catch(e){status.textContent=e.message;return;}const current=version;busy=true;submit.disabled=true;output.value='';status.textContent='Oversætter…';try{let result;if(globalThis.chrome?.runtime?.sendMessage){result=await (globalThis.browser ?? globalThis.chrome).runtime.sendMessage({type:'lxp-translate',...request});if(!result?.ok)throw Error(result?.error||'Oversætteren kunne ikke starte. Genindlæs udvidelsen og Lectio.');}else result={ok:true,...await translate(request)};if(version===current){output.value=result.text;status.textContent='Oversat med '+result.provider+'.';}else status.textContent='Teksten eller sproget blev ændret. Tryk Oversæt igen for det nye valg.';}catch(e){if(version===current)status.textContent=e.message==='Failed to fetch'?'Ingen forbindelse til oversættelsestjenesten. Prøv igen senere.':e.message;}finally{busy=false;submit.disabled=false;}},'Oversæt');
    const copy=B('lxp-secondary-button','Kopiér oversættelsen',async()=>{if(!output.value)return;try{await navigator.clipboard.writeText(output.value);status.textContent='Oversættelsen er kopieret.';}catch{status.textContent='Markér oversættelsen og kopiér manuelt.';}},'Kopiér oversættelse');
    node.append(E('div','lxp-tool-actions',getSelection,submit,copy),status,E('p','lxp-settings-help','Ingen konto eller nøgle. Når du trykker Oversæt, sendes kun teksten i feltet og sprogvalget til MyMemory. Tekst og oversættelse gemmes ikke i udvidelsen. Højst 2.000 tegn ad gangen; den anonyme tjeneste har en gratis grænse på 5.000 tegn pr. dag. Linjeskift bevares. Lange afsnit deles i mindre tekststykker, og kvaliteten kan variere.'));
    const source=E('a','lxp-text-link','MyMemory · tjeneste og grænser');source.href='https://mymemory.translated.net/doc/usagelimits.php';source.target='_blank';source.rel='noopener noreferrer';node.append(source);return {node};
  };
})();
