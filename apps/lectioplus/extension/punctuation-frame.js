// The extension-origin frame owns the WASM worker. Installed builds use a
// browser runtime port; localhost previews use a same-origin MessageChannel.
(() => {
  'use strict';
  let port=null,worker=null,timer=null,active=null;
  const runtime=globalThis.chrome?.runtime;
  const clear=()=>{worker?.terminate();worker=null;clearTimeout(timer);active=null;};
  function attach(send,listen){
    if(port)return;port={postMessage:send};
    listen(data=>{
      if(data?.type==='cancel'){clear();return;}
      if(data?.type!=='analyze'||!Number.isSafeInteger(data.id)||typeof data.text!=='string'||data.text.length>12000||active!==null)return;
      clearTimeout(timer);
      if(!worker){
        try{worker=new Worker('punctuation-worker.mjs',{type:'module'});}catch{port.postMessage({id:data.id,type:'error',message:'Browseren kunne ikke starte den lokale sprogmodel. Genindlæs udvidelsen og Lectio-fanen.'});return;}
        worker.onmessage=({data:message})=>{
          if(message?.id!==active)return;
          port.postMessage(message);
          if(message.type==='result'||message.type==='error'){
            active=null;timer=setTimeout(clear,60000);
          }
        };
        worker.onerror=()=>{const id=active;clear();port.postMessage({id,type:'error',message:'Sprogmodellens program kunne ikke indlæses. Kopiér hele extension-mappen, og genindlæs udvidelsen og Lectio-fanen.'});};
        worker.onmessageerror=worker.onerror;
      }
      active=data.id;
      try{worker.postMessage(data);}catch{worker.onerror();}
    });
    port.postMessage({type:'ready'});
  }
  if(runtime?.onConnect){
    const token=location.hash.slice(1);
    runtime.onConnect.addListener(incoming=>{
      const sender=incoming.sender;
      let origin;try{origin=new URL(sender?.url).origin;}catch{return;}
      if(port||!/^[a-f0-9]{32}$/.test(token)||incoming.name!=='lxp-punctuation:'+token||sender.id!==runtime.id||!['https://www.lectio.dk','https://lectio.dk'].includes(origin)||!Number.isInteger(sender.tab?.id)||sender.frameId!==0)return;
      incoming.onDisconnect.addListener(()=>{void runtime.lastError;clear();port=null;});
      attach(data=>incoming.postMessage(data),listen=>incoming.onMessage.addListener(listen));
    });
  }else{
    addEventListener('message',event=>{
      if(port||event.source!==parent||event.origin!==location.origin||!/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(event.origin)||event.data?.type!=='lxp-punctuation-connect'||!event.ports?.[0])return;
      const incoming=event.ports[0];
      attach(data=>incoming.postMessage(data),listen=>{incoming.onmessage=({data})=>listen(data);incoming.start();});
    });
  }
  addEventListener('pagehide',clear);
})();
