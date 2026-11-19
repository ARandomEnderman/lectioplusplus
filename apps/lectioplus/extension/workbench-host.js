(() => {
  'use strict';
  const runtime=globalThis.chrome?.runtime,protocol=3;
  let port,frame,channel,active=0,timer,ocrWorker,assetController,acceptInput;
  const assets=new Map();
  async function asset(path,binary=false){
    const key=path+binary;if(assets.has(key))return assets.get(key);
    const signal=assetController.signal;
    try{
      const response=await fetch(path,{signal});
      if(!response.ok)throw Error('Mangler fil: '+path+' [LXP28-FIL]');
      const value=await (binary?response.arrayBuffer():response.text());
      if(signal.aborted)throw Error('Indlæsningen blev afbrudt.');
      assets.set(key,value);return value;
    }catch(error){
      if(signal.aborted||/LXP28-FIL/.test(error.message))throw error;
      throw Error('Kunne ikke læse '+path+': '+error.message+' [LXP28-FIL]');
    }
  }
  function clear(){
    clearTimeout(timer);assetController?.abort();assetController=null;
    channel?.close();channel=null;frame?.remove();frame=null;
    void ocrWorker?.terminate();ocrWorker=null;active=0;acceptInput=null;
  }
  function attach(send,listen){
    port={postMessage:send};
    listen(async data=>{
      if(data?.type==='stdin'){if(data.id===active)acceptInput?.(data);return;}
      if(data?.type!=='execute'||!Number.isSafeInteger(data.id)||active)return;
      const p=data.payload;
      if(!p||!['python','javascript','sql','regex','ocr'].includes(p.language)||typeof p.code!=='string'||p.code.length>100000)return;
      active=data.id;const id=active;assetController=new AbortController();
      let detail='Indlæser lokale filer',working=false,started=false,outputSize=0;
      const fail=message=>{if(active!==id)return;clear();send({id,type:'error',message});};
      const report=(stage,message)=>{detail=message;send({id,type:'progress',phase:'loading',stage,message});};
      const deadline=(ms,code)=>{clearTimeout(timer);timer=setTimeout(()=>fail('Opstarten stoppede ved: '+detail+'. ['+code+']'),ms);};
      let remaining=10000,runSince=null,waitingInput=null,lastInput=0;
      const pauseRun=()=>{if(runSince!==null){remaining-=Math.max(0,Date.now()-runSince);runSince=null;}clearTimeout(timer);};
      const resumeRun=()=>{runSince=Date.now();timer=setTimeout(()=>fail('Programmet blev stoppet efter 10 sekunders kørsel. Kontrollér løkkerne.'),Math.max(0,remaining));};
      acceptInput=data=>{
        if(waitingInput===null||data.requestId!==waitingInput||typeof data.value!=='string'||data.value.length>4096||/[\r\n]/.test(data.value))return;
        waitingInput=null;
        try{channel.postMessage({type:'stdin',id,requestId:data.requestId,value:data.value});resumeRun();send({id,type:'progress',phase:'working'});}
        catch(e){fail('Svaret kunne ikke sendes til programmet: '+e.message);}
      };
      report('assets',detail);deadline(20000,'LXP28-FILER');
      try{
        if(p.language==='ocr'){
          deadline(60000,'LXP28-OCR');
          if(typeof p.image!=='string'||p.image.length>15000000||!/^data:image\/(png|jpeg|webp);base64,/.test(p.image)||!['dan','eng','dan+eng'].includes(p.ocrLanguage))throw Error('Ugyldigt billede eller OCR-sprog.');
          if(!globalThis.Tesseract)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='vendor/workbench/tesseract.js/dist/tesseract.min.js';script.onload=resolve;script.onerror=()=>reject(Error('OCR-programmet mangler. Kopiér hele extension-mappen.'));document.head.append(script);});
          if(active!==id)return;
          const base=new URL('vendor/workbench/',location.href).href;
          const worker=await Tesseract.createWorker(p.ocrLanguage,1,{workerPath:base+'tesseract.js/dist/worker.min.js',corePath:base+'tesseract.js-core/tesseract-core-lstm.wasm.js',langPath:base+'tessdata',workerBlobURL:false,cacheMethod:'none',gzip:true,logger:event=>{if(active===id)report('ocr',event.status+' '+Math.round((event.progress||0)*100)+' %');}});
          if(active!==id){void worker.terminate();return;}ocrWorker=worker;
          const result=await worker.recognize(p.image);if(active!==id)return;
          clear();send({id,type:'result',result:{text:result.data.text}});return;
        }
        const files={worker:await asset('workbench-worker.js')};
        if(active!==id)return;
        if(p.language==='python')for(const [key,path,binary] of [['py','pyodide.mjs',false],['asm','pyodide.asm.mjs',false],['wasm','pyodide.asm.wasm',true],['stdlib','python_stdlib.zip',true],['lock','pyodide-lock.json',false]]){
          report('assets','Indlæser Python · '+path);
          files[key]=await asset('vendor/workbench/pyodide/'+path,binary);
          if(active!==id)return;
        }
        if(p.language==='sql'){
          files.sql=await asset('vendor/workbench/sql.js/dist/sql-wasm.js');if(active!==id)return;
          files.sqlWasm=await asset('vendor/workbench/sql.js/dist/sql-wasm.wasm',true);if(active!==id)return;
        }
        // Check that the HTML was copied before navigating. A successful fetch
        // alone does not prove that the browser permits the embedded frame.
        await asset('workbench-sandbox.html');if(active!==id)return;
        report('sandbox','Åbner isoleret kørselsmiljø');deadline(8000,'LXP29-SANDBOX-LOAD');
        frame=document.createElement('iframe');frame.setAttribute('sandbox','allow-scripts');
        frame.src=runtime?.getURL?runtime.getURL('workbench-sandbox.html'):'workbench-sandbox.html';
        frame.onerror=()=>fail('Browseren kunne ikke åbne workbench-sandbox.html. Genindlæs udvidelsen efter opdatering af manifest.json, og genindlæs derefter Lectio-fanen. [LXP29-SANDBOX-LOAD]');
        let frameLoaded=false;
        frame.onload=()=>{
          if(active!==id||frameLoaded)return;frameLoaded=true;
          // Browsers can fire load for an error document too. Only the reply
          // over our channel proves that the actual bootstrap is running.
          report('sandbox-connect','Venter på svar fra det isolerede kørselsmiljø');deadline(8000,'LXP29-SANDBOX-READY');
          try{
            const pair=new MessageChannel();channel=pair.port1;let sandboxReady=false;
            channel.onmessageerror=()=>fail('Data fra kørselsmiljøet kunne ikke læses. [LXP28-KANAL]');
            channel.onmessage=({data:r})=>{
              if(active!==id)return;
              if(r?.type==='sandbox-ready'){
                if(sandboxReady)return;
                if(r.protocol!==protocol){fail('Kodeværkstedets filer har forskellige versioner. Opdatér hele extension-mappen og genindlæs udvidelsen og Lectio-fanen. [LXP28-VERSION]');return;}
                sandboxReady=true;report('worker','Starter programprocessen');deadline(8000,'LXP28-WORKER');
                try{channel.postMessage({id,payload:p,files});}catch(e){fail('Programmet kunne ikke overføres: '+e.message+' [LXP28-OVERFØRSEL]');}
                return;
              }
              if(!sandboxReady||r?.id!==id)return;
              if(r.type==='progress'&&r.phase==='loading'&&!working){
                if(r.stage==='worker-ready'&&!started){started=true;report('runtime','Starter '+p.language+' lokalt');deadline(30000,'LXP28-RUNTIME');}
                const stages={modules:'Indlæser Python-moduler',wasm:'Kontrollerer Python-motoren',python:'Starter Python',sql:'Starter SQLite'};
                if(started&&stages[r.stage])report(r.stage,stages[r.stage]);
              }else if(started&&r.type==='progress'&&r.phase==='working'&&!working){
                working=true;clearTimeout(timer);
                resumeRun();send(r);
              }else if(started&&working&&p.language==='python'&&p.interactiveInput===true&&r.type==='progress'&&r.phase==='input'&&waitingInput===null&&Number.isSafeInteger(r.requestId)&&r.requestId>lastInput){
                pauseRun();if(remaining<=0){fail('Programmet blev stoppet efter 10 sekunders kørsel. Kontrollér løkkerne.');return;}waitingInput=lastInput=r.requestId;send({id,type:'progress',phase:'input',requestId:r.requestId});
              }else if(started&&r.type==='progress'&&r.phase==='output'&&typeof r.text==='string'&&r.text.length<=8192&&outputSize+r.text.length<=100000){
                outputSize+=r.text.length;send({id,type:'progress',phase:'output',text:r.text,stream:r.stream==='stderr'?'stderr':'stdout'});
              }else if(r.type==='result'||r.type==='error'){clear();send(r);}
            };
            channel.start();frame.contentWindow.postMessage({type:'lxp-workbench-sandbox'},'*',[pair.port2]);
          }catch(e){fail('Forbindelsen til kørselsmiljøet kunne ikke startes: '+e.message+' [LXP28-KANAL]');}
        };
        document.body.append(frame);
      }catch(e){fail(e.message);}
    });
    send({type:'ready',protocol});
  }
  if(runtime?.onConnect){
    const token=location.hash.slice(1);
    runtime.onConnect.addListener(incoming=>{
      const sender=incoming.sender;let origin;try{origin=new URL(sender?.url).origin;}catch{return;}
      if(port||!/^[a-f0-9]{32}$/.test(token)||incoming.name!=='lxp-workbench:'+token||sender.id!==runtime.id||!['https://www.lectio.dk','https://lectio.dk'].includes(origin)||!Number.isInteger(sender.tab?.id)||sender.frameId!==0)return;
      incoming.onDisconnect.addListener(()=>{void runtime.lastError;clear();port=null;});
      attach(d=>incoming.postMessage(d),fn=>incoming.onMessage.addListener(fn));
    });
  }else addEventListener('message',event=>{
    if(port||event.source!==parent||event.origin!==location.origin||!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(event.origin)||event.data?.type!=='lxp-workbench-connect'||!event.ports[0])return;
    const p=event.ports[0];attach(d=>p.postMessage(d),fn=>{p.onmessage=e=>fn(e.data);p.start();});
  });
  addEventListener('pagehide',clear);
})();
