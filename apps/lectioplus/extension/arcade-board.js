(() => {
  'use strict';
  const A=globalThis.lectioPlusArcade;
  const symbols=['●','◆','▲','★','♥','✚'];
  function status(s){
    if(globalThis.lectioPlusQuizGames?.ids.has(s.id))return globalThis.lectioPlusQuizBoard.status(s);
    const done=s.status!=='playing';
    switch(s.id){
      case 'teacher':return done?'Quiz færdig · '+s.correct+' af '+s.rounds.length+' rigtige.':s.stage==='ready'?'Spørgsmål '+s.rounds.length+' · '+s.correct+' rigtige':s.message || 'Henter skolens lærere…';
      case 'flap':return (done?(s.status==='won'?'Hele ruten gennemført! ':'Turen sluttede. '):'')+s.passed+' af 15 porte';
      case 'moles':return (done?'Tiden er gået':'Tid tilbage '+Math.ceil(30-s.time)+' s')+' · '+s.hits+' træffere · '+s.misses+' fejl';
      case 'echo':return done?(s.status==='won'?'Du huskede alle otte sekvenser!':'Sekvensen brød. Næste farve var '+A.names[s.expected].toLocaleLowerCase('da')+'.'):'Runde '+s.sequence.length+' af 8 · '+(s.phase==='watch'?'Se lysene':'Din tur');
      case 'slide':case 'sudoku':return (done?'Løst på ':'Antal træk · ')+s.moves+(done?' træk!':'');
      case 'code':return done?(s.status==='won'?'Koden blev knækket på '+s.log.length+' forsøg!':'Koden var '+s.secret.map(i=>A.names[i]).join(' · ')):'Forsøg '+(s.log.length+1)+' af 8';
      case 'word':return done?(s.status==='won'?'Du fandt ordet ':'Ordet var ')+s.word+'.':(6-s.errors)+' fejl tilbage';
      case 'maze':case 'crates':return (done?'Alle tre baner gennemført!':('Bane '+(s.round+1)+' af 3'))+' · '+s.moves+' træk';
      case 'reversi':return (done?(s.winner===0?'Uafgjort':(s.winner===1?'Sort':'Hvid')+' vandt!'):(s.message?s.message+' ':'')+(s.player===1?'Sort':'Hvid')+' har tur')+' · Sort '+s.board.filter(v=>v===1).length+' / Hvid '+s.board.filter(v=>v===2).length;
    }
  }
  function board(s,grid,E,B,action,started,start,teacherPhoto){
    if(globalThis.lectioPlusQuizGames?.ids.has(s.id))return globalThis.lectioPlusQuizBoard.draw(s,grid,E,B,action,started,start);
    grid.classList.add('lxp-arc-view');
    const done=s.status!=='playing';
    function group(n,cls=''){
      const el=E('div','lxp-arc-group '+cls);el.style.setProperty('--lxp-columns',n);grid.append(el);return el;
    }
    function button(parent,text,type,value,disabled=false,label=text){
      const b=B(text,()=>action(type,value));
      b.dataset.cell=type+'-'+String(value??'');b.disabled=done||disabled;b.setAttribute('aria-label',label);parent.append(b);return b;
    }
    const prompt=text=>grid.append(E('h2','lxp-arc-prompt',text));
    function colorButton(parent,i,disabled){
      const b=button(parent,symbols[i]+' '+A.names[i],'pick',i,disabled);b.dataset.tone=i;return b;
    }
    switch(s.id){
      case 'teacher':{
        grid.append(E('p','lxp-arc-caption','Din skoles lærere'));
        if(done){
          prompt('Du fik '+s.correct+' af '+s.rounds.length+' rigtige');
          grid.append(E('p','',s.correct===s.rounds.length?'Fuld plade! Du kendte hver eneste lærer.':'Spil igen for at få spørgsmålene i en ny rækkefølge.'));
          if(s.mistakes.length){
            const review=E('details','lxp-arc-review');review.append(E('summary','','Se de lærere, du missede'));
            const list=E('ul');for(const {name,answer} of s.mistakes)list.append(E('li','',name+' · Du gættede på '+answer));review.append(list);grid.append(review);
          }break;
        }
        if(s.stage!=='ready'){
          prompt(s.stage==='loading'?'Henter lærerfoto…':'Gæt læreren');
          if(s.stage==='retry')button(grid,'Prøv igen','retry');
          break;
        }
        const q=s.rounds.at(-1);
        if(teacherPhoto)grid.append(teacherPhoto);
        prompt('Hvem er læreren?');
        const answers=group(2);
        for(const name of q.options){
          const revealed=s.answer!==null;
          const correct=revealed&&name===q.name,wrong=revealed&&!correct&&name===s.answer;
          const b=button(answers,(correct?'✓ ':wrong?'× ':'')+name,'pick',name,revealed,name);
          if(correct||wrong)b.dataset.mark=correct?'yes':'no';
        }
        if(s.answer!==null){
          const result=E('p','lxp-arc-answer',s.answer===q.name?'Helt rigtigt!':'Det var '+q.name+'.');result.setAttribute('role','status');grid.append(result);
          button(grid,s.more?'Næste lærer':'Se resultat','next');
        }
        break;
      }
      case 'moles':{
        const g=group(3,'lxp-arc-moles');
        for(let i=0;i<9;i++){
          const b=button(g,s.hole===i?'🐾':'·','pick',i,false,'Hul '+(i+1)+(s.hole===i?' med muldvarp':''));
          if(s.hole===i){
            b.classList.add('lxp-arc-lit');const mole=E('span','lxp-arc-mole');
            mole.setAttribute('aria-hidden','true');b.replaceChildren(mole);
          }
        }break;
      }
      case 'echo':{
        prompt(s.phase==='watch'?'Husk rækkefølgen':'Gentag rækkefølgen');
        const g=group(2,'lxp-arc-echo');for(let i=0;i<4;i++){const b=colorButton(g,i,s.phase!=='repeat');if(s.lit===i)b.classList.add('lxp-arc-lit');}break;
      }
      case 'slide':{
        const g=group(4,'lxp-arc-square');const hole=s.tiles.indexOf(0);
        s.tiles.forEach((v,i)=>{const movable=Math.abs(i%4-hole%4)+Math.abs((i>>2)-(hole>>2))===1;
          const b=button(g,v||'','pick',i,!movable||!v,v?'Brik '+v:'Tomt felt');b.dataset.tile=!v?'empty':movable?'active':'rest';});break;
      }
      case 'sudoku':{
        const g=group(4,'lxp-arc-square lxp-arc-sudoku');s.cells.forEach((v,i)=>{
          const b=button(g,v||'·','pick',i,s.fixed[i],'Række '+(1+(i>>2))+', kolonne '+(1+i%4)+', '+(v||'tom'));
          b.setAttribute('aria-pressed',String(i===s.selected));if(s.fixed[i])b.dataset.fixed='true';
        });const keys=group(5);for(const n of [1,2,3,4,0])button(keys,n||'Slet','digit',n,s.selected<0);break;
      }
      case 'code':{
        prompt(Array.from({length:4},(_,i)=>s.guess[i]===undefined?'＿':symbols[s.guess[i]]).join('  '));
        const g=group(3);for(let i=0;i<6;i++)colorButton(g,i,s.guess.length===4);
        const actions=group(2);button(actions,'Fortryd','undo',null,!s.guess.length);button(actions,'Tjek kode','check',null,s.guess.length!==4);
        if(s.log.length){const history=E('ol','lxp-arc-log');for(const row of s.log)history.append(E('li','',row.guess.map(i=>symbols[i]).join(' ')+' · '+row.exact+' på plads · '+row.other+' forkert plads'));grid.append(history);}break;
      }
      case 'word':{
        grid.append(E('p','',s.hint));prompt([...s.word].map(c=>done||s.letters.includes(c)?c:'_').join(' '));
        const g=group(6,'lxp-arc-letters');for(const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ'){
          const used=s.letters.includes(ch),b=button(g,ch,'pick',ch,used);if(used)b.dataset.mark=s.word.includes(ch)?'yes':'no';
        }break;
      }
      case 'maze':case 'crates':{
        const crates=s.id==='crates',g=group(s.width,'lxp-arc-map');
        const nearby=[s.pos-s.width,s.pos+s.width,s.pos-1,s.pos+1];
        for(let i=0;i<s.map.length;i++){
          const wall=s.map[i]==='#',box=crates&&s.boxes.includes(i),goal=crates?s.map[i]==='.':i===s.exit;
          const icon=s.pos===i?'●':box?(goal?'✅':'📦'):goal?'◎':'';
          const el=nearby.includes(i)&&!wall?button(g,icon,'pick',i,false,'Gå til felt '+(i+1)):E('span','',icon);
          if(!el.parentNode)g.append(el);
          el.dataset.floor=wall?'wall':s.pos===i?'player':goal?'goal':'open';
        }
        grid.append(E('p','',crates?'● Dig　📦 Kasse　◎ Mål':'● Dig　◎ Udgang'));
        if(crates){const row=group(2);button(row,'Fortryd træk','undo',null,!s.history.length);button(row,'Nulstil rum','resetRoom');}
        break;
      }
      case 'reversi':{
        const g=group(8,'lxp-arc-reversi');s.board.forEach((v,i)=>{
          const valid=s.legal.includes(i),b=button(g,v===1?'●':v===2?'○':valid?'·':'','pick',i,!valid,'Række '+(1+(i>>3))+', kolonne '+(1+i%8)+(valid?', muligt træk':''));
          b.dataset.disc=v;b.dataset.legal=String(valid);
        });break;
      }
    }
  }
  globalThis.lectioPlusArcadeBoard={board,status};
})();
