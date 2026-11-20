const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'../extension/teacher-directory.js'),'utf8');
const root='https://www.lectio.dk/lectio/17/';
function setup(respond){
  const dom=new JSDOM('',{url:root+'forside.aspx',runScripts:'outside-only'}),w=dom.window,requests=[];
  w.AbortSignal=AbortSignal;w.AbortController=AbortController;
  w.fetch=async(url,options)=>{
    assert.ok(url.startsWith(root));assert.equal(options.credentials,'same-origin');assert.equal(options.mode,'same-origin');assert.equal(options.cache,'no-store');
    requests.push(url);const answer=respond(new URL(url));
    if(typeof answer==='string')return {url,ok:true,status:200,text:async()=>answer};
    return answer || {url,status:404,ok:false};
  };
  w.Image=function(){
    const img=w.document.createElement('img');
    Object.defineProperty(img,'src',{set(v){img.setAttribute('src',v);queueMicrotask(()=>/999$/.test(v)?img.onerror?.():img.onload?.());}});
    Object.defineProperties(img,{naturalWidth:{value:72},naturalHeight:{value:96}});return img;
  };
  w.eval(source);return {open:signal=>w.lectioPlusTeacherDirectory.open(signal),requests,dom};
}
const link=(id,name,more='')=>'<li><a href="SkemaNy.aspx?type=laerer&amp;laererid='+id+'">'+name+'</a>'+more+'</li>';
const photo=id=>'<img src="/lectio/17/GetImage.aspx?pictureid='+id+'">';
(async()=>{
 const doc='<ul>'+link(1,'A Test (AT)',photo(101))+link(2,'B Test (BT)')+link(3,'C Test')+link(4,'D Test',photo(999))+link(5,'E Test')+link(6,'Delt navn')+link(7,'Delt navn')+link(3,'C Test')+'</ul>'+
 '<nav>'+link(14,'Mit skema')+'</nav><a href="/lectio/18/SkemaNy.aspx?type=laerer&laererid=99">Anden skole</a><a href="SkemaNy.aspx?type=elev&elevid=32">Elev Test</a>';
 const env=setup(url=>{
   if(url.pathname.endsWith('FindSkema.aspx'))return doc;
   if(url.searchParams.get('lectiocontextcard')==='T2')return '<span>Lærer - B Test</span>'+photo(102);
   if(url.searchParams.get('lectiocontextcard')==='T3')return '<span>Elev - Anden person</span>'+photo(666);
   if(url.searchParams.get('laererid')==='3')return '<div class="ls-master-pageheader"><div class="maintitle">Læreren C Test - Skema</div><div class="thumber">'+photo(103)+'</div></div>';
   if(url.searchParams.get('laererid')==='5')return '<div class="ls-master-pageheader"><div class="maintitle">Læreren Anden Test - Skema</div><div class="thumber">'+photo(666)+'</div></div>';
 });
 const controller=new AbortController(),session=await env.open(controller.signal);
 assert.deepEqual(Array.from(session.names).sort(),['A Test','B Test','C Test','D Test','E Test']);
 const pictures={};let more=true;
 while(more){const q=await session.next();more=q.more;if(q.image)pictures[q.name]=q.image.getAttribute('src').split('=').at(-1);}
 assert.deepEqual(pictures,{'A Test':'101','B Test':'102','C Test':'103'});env.dom.window.close();
 const fallback=setup(url=>url.pathname.endsWith('Adv.aspx')?'<section class="island"><span class="islandHeader">Lærere</span><select><option value="T21">En Test</option><option value="22">To Test</option><option value="T23">Tre Test</option><option value="T24">Fire Test</option><option value="S25">Elev</option></select></section>':'');
 assert.equal((await fallback.open(new AbortController().signal)).names.length,4);fallback.dom.window.close();
 const few=setup(()=>doc.slice(0,doc.indexOf(link(4,'D Test',photo(999)))));await assert.rejects(few.open(new AbortController().signal),/mindst fire/);few.dom.window.close();
 const loggedOut=setup(()=>({ok:true,status:200,url:root+'login.aspx',text:async()=>''}));await assert.rejects(loggedOut.open(new AbortController().signal),/Log ind/);loggedOut.dom.window.close();
 console.log('Teacher directory: exact school, four names, ambiguous names, authorised photos, missing and broken photos, fallback, expired login.');
})().catch(e=>{console.error(e);process.exitCode=1;});
