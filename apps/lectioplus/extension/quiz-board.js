(() => {
  'use strict';
  const Q=globalThis.lectioPlusQuizGames;
  const round=s=>'Runde '+(s.round+1)+' af '+s.rows.length;
  function status(s){
    if(s.id==='families')return (s.status==='won'?'Alle forbindelser fundet!':s.status==='lost'?'Runden er slut.':s.message||'Find fire ord, der hører sammen.')+' · '+s.solved.length+'/4 grupper · '+(4-s.tried.length)+' fejl tilbage';
    if(s.status!=='playing')return s.id==='dive'?'Slutdybde '+(s.score*10).toLocaleString('da-DK')+' m':s.log.filter(r=>r.points>0).length+' af '+s.rows.length+' rigtige'+(s.id==='higher'?' · Bedste serie '+s.longest:'');
    if(s.result)return s.result.text;
    if(s.id==='dive')return round(s)+' · '+Math.max(0,Math.ceil(s.deadline-s.time))+' sekunder';
    return round(s)+(s.id==='higher'?' · Serie '+s.streak:s.id==='atlas'?' · '+[0,100,65,35][s.clues]+' point på spil':'');
  }
  function draw(s,grid,E,B,action,started,start){
    grid.classList.add('lxp-quiz-view');
    const head=text=>grid.append(E('h2','lxp-arc-prompt',text));
    const line=(text,cls='')=>grid.append(E('p',cls,text));
    const row=()=>{const el=E('div','lxp-quiz-actions');grid.append(el);return el;};
    function button(parent,label,type,value,disabled=false){
      const b=B(label,()=>action(type,value));b.dataset.cell=type+'-'+String(value??'');b.disabled=disabled;parent.append(b);return b;
    }
    function form(label){
      const form=E('form','lxp-quiz-form'),input=E('input');input.type='text';input.setAttribute('aria-label',label);input.placeholder=label;input.maxLength=90;input.autocomplete='off';
      const send=E('button','lxp-game-button lxp-game-primary','Svar');send.type='submit';
      form.addEventListener('submit',e=>{e.preventDefault();if(input.value.trim())action('guess',input.value.trim());});
      form.append(input,send);grid.append(form);
      if(started&&!s.result&&grid.closest('.lxp-games')?.contains(document.activeElement))input.focus({preventScroll:true});
    }
    function stage(className){
      const el=E('div','lxp-quiz-stage '+className);grid.append(el);return el;
    }
    if(s.id==='dive'){
      const scene=stage('lxp-dive-scene'),sub=E('span','lxp-dive-sub','◉');
      sub.setAttribute('aria-hidden','true');scene.style.setProperty('--lxp-depth',Math.min(1,s.score/700));scene.append(sub);
      scene.append(E('strong','',(s.score*10).toLocaleString('da-DK')+' m'),E('small','',s.mode==='daily'?'Dagens dyk · '+s.day:'Frit dyk'));
      if(!started&&s.status==='playing'){
        head('Hvor dybt kan du nå?');line('Syv spørgsmål, ét svar hver. De mindre oplagte svar giver flere point.');
        const r=row();r.append(B('Start dagens dyk',start,'lxp-game-primary'));button(r,'Spil et frit dyk','free');return;
      }
    }
    if(s.id==='families'){
      const done=s.status!=='playing',groups=done?s.groups:s.solved;
      for(const group of groups){
        const el=E('div','lxp-family-set');el.dataset.found=String(s.solved.includes(group));el.append(E('strong','',group[0]),E('span','',group.slice(1).join(' · ')));grid.append(el);
      }
      if(done){head(s.status==='won'?'Alle fire grupper fundet':'Se de fire forbindelser');return;}
      const board=E('div','lxp-family-grid');grid.append(board);
      for(const word of s.words){const b=button(board,word,'pick',word);b.setAttribute('aria-pressed',String(s.selected.includes(word)));}
      const actions=row();button(actions,'Tjek gruppe ('+s.selected.length+'/4)','check',null,s.selected.length!==4);button(actions,'Bland ordene','mix');return;
    }
    if(s.status!=='playing'){
      head(status(s));line(s.score+' point i alt');
      const details=E('details','lxp-quiz-review');details.append(E('summary','','Se dine runder'));
      const list=E('ol');s.log.forEach(r=>list.append(E('li','',r.text+'　+'+r.points)));details.append(list);grid.append(details);return;
    }
    const q=s.rows[s.round];
    if(s.id==='dive'){head(q[0]);if(!s.result)form('Skriv dit svar');}
    if(s.id==='atlas'){
      const el=stage('lxp-atlas-scene');el.append(E('span','lxp-atlas-compass','✥'),E('strong','','Rejsemål '+(s.round+1)+' / '+s.rows.length));
      head('Hvilket land leder vi efter?');const list=E('ol','lxp-quiz-clues');q.slice(1,1+s.clues).forEach(clue=>list.append(E('li','',clue)));grid.append(list);
      if(!s.result){if(s.message)line(s.message);form('Skriv landets navn');const r=row();button(r,'Åbn næste ledetråd','clue',null,s.clues===3);button(r,'Vis landet','skip');}
    }
    if(s.id==='higher'){
      line(q.title,'lxp-arc-caption');head('Højere eller lavere?');const box=stage('lxp-compare');
      q.pair.forEach(([name,value],i)=>{const card=E('div');card.append(E('span','',name),E('strong','',i&&!s.result?'?':value.toLocaleString('da-DK')),E('small','',q.unit));box.append(card);});
      if(!s.result){const r=row();button(r,'↑ Højere','higher');button(r,'↓ Lavere','lower');}
    }
    if(s.id==='timeline'){
      line('Placér begivenheden','lxp-arc-caption');head(q[1]);const track=E('div','lxp-quiz-timeline');grid.append(track);
      for(let i=0;i<=s.line.length;i++){
        if(!s.result)button(track,i===0?'↑ Før '+s.line[0][0]:i===s.line.length?'↓ Efter '+s.line.at(-1)[0]:'Mellem '+s.line[i-1][0]+' og '+s.line[i][0],'place',i);
        if(i<s.line.length){const v=s.line[i],item=E('div','lxp-timeline-event');item.append(E('strong','',v[0]),E('span','',v[1]));if(s.result&&v===q)item.dataset.current='true';track.append(item);}
      }
    }
    if(s.result){
      const result=E('div','lxp-quiz-result');result.setAttribute('role','status');result.append(E('strong','',s.result.points?'+'+s.result.points+' point':'0 point'),E('span','',s.result.text));grid.append(result);
      button(row(),s.round+1===s.rows.length?'Se resultat':'Næste runde','next');
    }
  }
  globalThis.lectioPlusQuizBoard={draw,status};
})();
