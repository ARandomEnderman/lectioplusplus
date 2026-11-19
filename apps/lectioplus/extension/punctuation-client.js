(() => {
  'use strict';
  const scriptURL=document.currentScript?.src;
  let connection=null,serial=0;
  const aborted=()=>new DOMException('Behandlingen blev afbrudt.','AbortError');
  function open(){
    if(connection)return connection;
    const runtime=globalThis.chrome?.runtime,extension=typeof runtime?.getURL==='function';
    if(!extension&&!/^https?:$/.test(location.protocol))throw Error('Sprogmodellen kører i den installerede udvidelse. Installér testens extension-mappe for at prøve den. HTML-demoen kan stadig vise resten af designet.');
    if(extension&&typeof runtime.connect!=='function')throw Error('Forbindelsen til udvidelsen er udløbet. Genindlæs Lectio-fanen efter opdateringen.');
    if(!extension&&typeof MessageChannel==='undefined')throw Error('Browseren understøtter ikke den lokale sprogmodel.');
    // Use extension messaging in installed builds. postMessage between an
    // isolated content script and an extension frame has different source/origin
    // behavior across browsers; it is only needed for the localhost preview.
    const token=extension?Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join(''):'';
    const backgroundHost = extension && runtime.getURL('').startsWith('moz-extension://');
    const url=extension?runtime.getURL('punctuation-frame.html')+'#'+token:new URL('punctuation-frame.html',scriptURL||new URL('./extension/punctuation-client.js',location.href)).href;
    const frame=document.createElement('iframe');frame.hidden=true;frame.title='Lokal behandling af tegnsætning';frame.setAttribute('aria-hidden','true');frame.src=url;
    const state={frame,port:null,task:null,ready:null,closed:false};
    state.close=(error=aborted())=>{
      if(state.closed)return;state.closed=true;if(connection===state)connection=null;
      clearTimeout(state.readyTimer);state.rejectReady?.(error);state.task?.finish(error);
      try{state.port?.disconnect?.();state.port?.close?.();}catch{}
      frame.remove();
    };
    state.ready=new Promise((resolve,reject)=>{
      state.rejectReady=reject;
      state.readyTimer=setTimeout(()=>state.close(Error('Forbindelsen til sprogmodellen kunne ikke åbnes (15 sekunder). Genindlæs udvidelsen og derefter Lectio-fanen. Kontrollér, at hele extension-mappen er kopieret.')),15000);
      const receive=data=>{
        if(state.closed)return;
        if(data?.type==='ready'){clearTimeout(state.readyTimer);resolve();return;}
        const task=state.task;if(!task||data?.id!==task.id)return;
        if(data.type==='progress'){task.update(data);return;}
        if(data.type==='result'){task.finish(null,data.result);return;}
        if(data.type==='error')task.finish(Error(data.message));
      };
      const failed=()=>state.close(Error('Forbindelsen til sprogmodellen blev afbrudt. Genindlæs udvidelsen og Lectio-fanen, og prøv igen.'));
      frame.addEventListener('error',failed,{once:true});
      const connect = () => {
        if(state.closed)return;
        try{
          if(extension){
            const port=state.port=runtime.connect({name:'lxp-punctuation:'+token});
            port.onMessage.addListener(receive);
            port.onDisconnect.addListener(()=>{void runtime.lastError;failed();});
          }else{
            const channel=new MessageChannel();state.port=channel.port1;
            state.port.onmessage=({data})=>receive(data);state.port.onmessageerror=failed;state.port.start();
            frame.contentWindow.postMessage({type:'lxp-punctuation-connect'},new URL(url).origin,[channel.port2]);
          }
        }catch{failed();}
      };
      if (backgroundHost) connect();
      else frame.addEventListener('load',connect,{once:true});
    });
    connection=state;
    try{if (!backgroundHost) document.documentElement.append(frame);}catch{state.close(Error('Browseren kunne ikke åbne sprogmodellens lokale vindue. Genindlæs Lectio-fanen.'));}
    return state;
  }
  function close(){connection?.close();}
  async function analyze(text,options={},progress,signal){
    if(typeof text!=='string'||text.length>12000)throw Error('Indsæt højst 12.000 tegn ad gangen.');
    if(signal?.aborted)throw aborted();
    // Reserve the client before waiting for frame startup: a second request
    // must not replace or cancel the request that is already connecting.
    if(connection?.busy)throw Error('Vent på den igangværende tekst.');
    const state=open(),abort=()=>state.close();state.busy=true;signal?.addEventListener('abort',abort,{once:true});
    try{
      progress?.({phase:'connecting'});await state.ready;
      if(state.closed||signal?.aborted)throw aborted();
      return await new Promise((resolve,reject)=>{
        const id=++serial;let timer,done=false,stage='worker';
        const arm=(phase,ms)=>{clearTimeout(timer);stage=phase;timer=setTimeout(()=>state.close(Error(phase==='working'?'Behandlingen tog for lang tid. Prøv et kortere afsnit.':phase==='worker'?'Sprogmodellen svarede ikke under opstart (15 sekunder). Genindlæs udvidelsen og Lectio-fanen.':'Indlæsningen af sprogmodellen gik i stå (60 sekunder). Kontrollér, at hele vendor-mappen er kopieret, og genindlæs udvidelsen og Lectio-fanen.')),ms);};
        const finish=(error,result)=>{if(done)return;done=true;clearTimeout(timer);state.task=null;error?reject(error):resolve(result);};
        const update=data=>{
          // Do not extend a hung startup on repeated loading notifications.
          if(data.phase==='loading'&&stage==='worker')arm('loading',60000);
          if(data.phase==='working'&&stage!=='working')arm('working',120000);
          progress?.(data);
        };
        state.task={id,finish,update};arm('worker',15000);progress?.({phase:'worker'});
        try{state.port.postMessage({id,type:'analyze',text,options});}catch{state.close(Error('Teksten kunne ikke sendes til den lokale sprogmodel. Genindlæs Lectio-fanen.'));}
      });
    }finally{state.busy=false;signal?.removeEventListener('abort',abort);}
  }
  addEventListener('pagehide',close);
  globalThis.lectioPlusLocalPunctuation={analyze,close};
})();
