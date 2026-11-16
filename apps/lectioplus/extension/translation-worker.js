'use strict';
importScripts('translation.js');
const pending=new Set();
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
  if(message?.type!=='lxp-translate')return;
  let url;try{url=new URL(sender.url);}catch{return;}
  if(sender.id!==chrome.runtime.id||!['https://www.lectio.dk','https://lectio.dk'].includes(url.origin)){respond({ok:false,error:'Oversætteren kan kun kaldes fra LectioPlus+ på Lectio.'});return;}
  const key=sender.tab?.id??'extension';if(pending.has(key)){respond({ok:false,error:'Vent på den igangværende oversættelse.'});return;}
  pending.add(key);
  lectioPlusTranslation.translate(message).then(result=>respond({ok:true,...result})).catch(error=>respond({ok:false,error:error.message})).finally(()=>pending.delete(key));
  return true;
});
