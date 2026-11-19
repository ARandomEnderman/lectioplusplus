(() => {
  'use strict';
  // Shared by the Python/JavaScript workshop, SQLite and regex editor.
  globalThis.lectioPlusCodeLayout = (c, h, controls) => {
    const {E} = c, {node, inputs, actions, status, out, button} = h;
    const {editor, cm, name, language, settings, stdin, trace, inputMode} = controls;
    node.classList.remove('lxp-tool-form');
    node.classList.add('lxp-code-ide');
    const toolbar = E('header', 'lxp-code-toolbar');
    const body = E('div', 'lxp-code-body');
    const sidebar = E('aside', 'lxp-code-sidebar', E('h3', '', 'Arbejdsområde'), inputs);
    sidebar.setAttribute('aria-label', 'Kode, opgaver og editorindstillinger');
    const main = E('div', 'lxp-code-main');
    const filename = E('strong', 'lxp-code-filename');
    const filebar = E('div', 'lxp-code-filebar', E('span', 'lxp-code-file-icon', '</>'), filename);
    const source = E('div', 'lxp-code-editor-pane');
    const editorLabel = editor.closest('label');
    source.append(editorLabel);
    const panel = E('section', 'lxp-code-panel');
    const tabbar = E('div', 'lxp-code-panel-tabs');
    const tabs = E('div', 'lxp-code-tabs');tabs.setAttribute('role', 'tablist');tabs.setAttribute('aria-label', 'Programmets paneler');
    const panels = E('div', 'lxp-code-panels');
    const terminal = E('pre', 'lxp-code-terminal');terminal.tabIndex=0;terminal.setAttribute('aria-label', 'Terminaloutput');
    const inputPanel = E('div', 'lxp-code-input-panel', inputMode.closest('label'), stdin.closest('label'), trace.closest('label'), E('p', 'lxp-settings-help', 'Python spørger i terminalen og venter på Enter. Du kan også vælge forudfyldte svar, ét pr. linje. Opgavetest bruger opgavens egne svar. JavaScript: input() læser hele tekstfeltet.'));
    const variables = E('div', 'lxp-code-variables');
    const terminalPane = E('div', 'lxp-code-terminal-pane', terminal);
    const inputRow=E('div','lxp-code-terminal-input'),inputLabel=E('label','',E('span','','Svar til programmet')),answer=E('input');
    answer.type='text';answer.maxLength=4096;answer.autocomplete='off';answer.spellcheck=false;answer.placeholder='Skriv dit svar, og tryk Enter';
    inputLabel.append(answer);inputRow.append(inputLabel);inputRow.hidden=true;terminalPane.append(inputRow);
    let inputReply=null;
    const sendAnswer=()=>{
      if(!inputReply)return;
      const value=answer.value;
      if(inputReply(value)===false){status.textContent='Svaret kunne ikke sendes. Kontrollér, om programmet stadig kører.';return;}
      clearInput();append(value+'\n','stdin');
    };
    const sendInput=button('Send svar',sendAnswer,inputRow);
    answer.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();event.stopPropagation();sendAnswer();}});
    function clearInput(){inputReply=null;inputRow.hidden=true;answer.value='';node.dataset.waitingInput='false';}
    const entries = [['terminal', 'Terminal', terminalPane], ['input', 'Input', inputPanel], ['result', 'Resultat', out], ['variables', 'Variable', variables]];
    const tabButtons = new Map();let activeTab='terminal';
    const id = 'lxp-code-panel-'+h.id;
    for(const [key, label, content] of entries){
      content.id=id+'-'+key;content.setAttribute('role','tabpanel');content.setAttribute('aria-labelledby',content.id+'-tab');content.tabIndex=0;
      const b=button(label,()=>selectTab(key),tabs);b.id=content.id+'-tab';b.setAttribute('role','tab');b.setAttribute('aria-controls',content.id);tabButtons.set(key,b);panels.append(content);
      b.addEventListener('keydown',event=>{const keys=[...tabButtons.keys()];let index=keys.indexOf(key);if(event.key==='ArrowRight')index=(index+1)%keys.length;else if(event.key==='ArrowLeft')index=(index+keys.length-1)%keys.length;else if(event.key==='Home')index=0;else if(event.key==='End')index=keys.length-1;else return;event.preventDefault();selectTab(keys[index]);tabButtons.get(keys[index]).focus();});
    }
    function selectTab(key){activeTab=key;panel.hidden=false;terminalToggle.setAttribute('aria-expanded','true');for(const [k,,content]of entries){content.hidden=k!==key;const b=tabButtons.get(k);b.setAttribute('aria-selected',String(k===key));b.tabIndex=k===key?0:-1;}refreshEditor();}
    const clear=button('Ryd terminal',()=>{terminal.replaceChildren();status.textContent='Terminalen er ryddet.';},tabbar);clear.title='Ryd den synlige udskrift';
    button('Kopiér output',async()=>{await navigator.clipboard.writeText(terminal.textContent);status.textContent='Terminaloutput kopieret.';},tabbar);
    tabbar.prepend(tabs);panel.append(tabbar,panels);
    const cursor=E('span','lxp-code-cursor','Ln 1, Kol 1'),languageLabel=E('span','lxp-code-language');
    const statusbar=E('footer','lxp-code-statusbar',status,cursor,languageLabel);
    status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    const sidebarToggle=button('Opgaver og filer',()=>setSidebar(node.dataset.sidebarOpen!=='true',true),toolbar);
    sidebarToggle.title='Vis eller skjul opgaver, filer og indstillinger · Ctrl+B';
    const terminalToggle=button('Terminal',()=>{panel.hidden=!panel.hidden;terminalToggle.setAttribute('aria-expanded',String(!panel.hidden));refreshEditor();},toolbar);terminalToggle.title='Vis eller skjul terminal · Ctrl+J';
    const fullscreen=button('Udvid til hele vinduet',()=>setFullscreen(!isFullscreen),toolbar);
    fullscreen.setAttribute('aria-pressed','false');
    toolbar.prepend(actions);
    button('Editorindstillinger',()=>{setSidebar(true);settings.open=true;settings.querySelector('select')?.focus();},toolbar);
    let current = {...c.prefs().code}, lastSidebarPref=c.prefs().code.sidebarOpen, isFullscreen=false, restoreFocus, inertElements=[], savedOverflow='';
    const limits={height:[600,1600,820],terminalHeight:[120,600,240],sidebarWidth:[200,440,260]};
    const dimension = (key,value) => Math.max(limits[key][0],Math.min(limits[key][1],Math.round(Number(value)||limits[key][2])));
    const heightLabel=E('label','lxp-tool-field',E('span','','Arbejdsområdets højde'));
    const heightInput=E('input');heightInput.type='range';heightInput.min='600';heightInput.max='1600';heightInput.step='20';heightInput.setAttribute('aria-label','Arbejdsområdets højde');
    const heightValue=E('output');heightLabel.append(heightInput,heightValue);settings.append(heightLabel,E('p','lxp-settings-help','Træk i skillelinjerne for at ændre størrelsen. Med tastaturet: vælg skillelinjen med Tab og brug piletasterne. Ctrl+Enter: kør · Ctrl+Shift+Enter: test · Ctrl+S: gem.'));
    const handles=new Map();
    function applySize(key,value){current[key]=dimension(key,value);const css={height:'--lxp-ide-height',terminalHeight:'--lxp-terminal-height',sidebarWidth:'--lxp-code-sidebar-width'};node.style.setProperty(css[key],current[key]+'px');handles.get(key)?.setAttribute('aria-valuenow',String(current[key]));if(key==='height'){heightInput.value=String(current[key]);heightValue.value=current[key]+' px';}refreshEditor();}
    async function persist(patch){try{await c.save(p=>({code:{...p.code,...patch}}));}catch(e){status.textContent=e.message;}}
    function separator(key, label, vertical){
      const handle=E('div','lxp-code-resizer lxp-code-resizer-'+key);handle.tabIndex=0;handle.setAttribute('role','separator');handle.setAttribute('aria-label',label);handle.title=label+' · Træk, eller brug piletasterne';handle.setAttribute('aria-orientation',vertical?'vertical':'horizontal');handle.setAttribute('aria-valuemin',limits[key][0]);handle.setAttribute('aria-valuemax',limits[key][1]);handles.set(key,handle);
      handle.addEventListener('keydown',event=>{let next=current[key];const sign=key==='terminalHeight'?-1:1;if(event.key==='Home')next=limits[key][0];else if(event.key==='End')next=limits[key][1];else if((vertical?['ArrowLeft','ArrowRight']:['ArrowUp','ArrowDown']).includes(event.key))next+=((event.key==='ArrowLeft'||event.key==='ArrowUp')?-20:20)*sign;else return;event.preventDefault();applySize(key,next);void persist({[key]:current[key]});});
      handle.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();const start=vertical?event.clientX:event.clientY,initial=current[key];handle.setPointerCapture?.(event.pointerId);handle.classList.add('is-dragging');const move=e=>{if(e.pointerId!==event.pointerId)return;const delta=(vertical?e.clientX:e.clientY)-start;applySize(key,initial+(key==='terminalHeight'?-delta:delta));};const finish=e=>{if(e.pointerId!==event.pointerId)return;handle.classList.remove('is-dragging');handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',finish);handle.removeEventListener('pointercancel',finish);handle.removeEventListener('lostpointercapture',finish);void persist({[key]:current[key]});};handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);handle.addEventListener('lostpointercapture',finish);});
      return handle;
    }
    heightInput.addEventListener('input',()=>applySize('height',heightInput.value));heightInput.addEventListener('change',()=>void persist({height:current.height}));
    function setSidebar(open,save=false){node.dataset.sidebarOpen=String(open);sidebarToggle.setAttribute('aria-expanded',String(open));sidebar.hidden=!open;refreshEditor();if(save)void persist({sidebarOpen:open});}
    function refreshEditor(){cm?.refresh();}
    function setFullscreen(open){
      if(open===isFullscreen)return;
      isFullscreen=open;node.classList.toggle('lxp-code-fullscreen',open);fullscreen.textContent=open?'Gendan størrelse':'Udvid til hele vinduet';fullscreen.setAttribute('aria-label',fullscreen.textContent);fullscreen.setAttribute('aria-pressed',String(open));
      if(open){restoreFocus=document.activeElement;savedOverflow=document.body.style.overflow;document.body.style.overflow='hidden';node.setAttribute('role','dialog');node.setAttribute('aria-modal','true');node.setAttribute('aria-label','Kodeværksted i hele vinduet');let branch=node;while(branch.parentElement&&branch!==document.body){for(const sibling of branch.parentElement.children)if(sibling!==branch&&!['SCRIPT','STYLE','LINK'].includes(sibling.tagName)){inertElements.push([sibling,sibling.inert]);sibling.inert=true;}branch=branch.parentElement;}fullscreen.focus();}
      else{document.body.style.overflow=savedOverflow;for(const [element,inert]of inertElements)element.inert=inert;inertElements=[];node.removeAttribute('role');node.removeAttribute('aria-modal');node.removeAttribute('aria-label');if(restoreFocus?.isConnected)restoreFocus.focus();}
      refreshEditor();
    }
    node.addEventListener('keydown',event=>{
      if(isFullscreen&&event.key==='Escape'){event.preventDefault();event.stopPropagation();setFullscreen(false);return;}
      if(isFullscreen&&event.key==='Tab'){const all=[...node.querySelectorAll('button, input, select, textarea, [tabindex="0"], summary')].filter(el=>!el.disabled&&!el.closest('[hidden]')&&el.getClientRects().length);if(all.length){const first=all[0],last=all.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}}
    },true);
    addEventListener('hashchange',()=>setFullscreen(false));addEventListener('pagehide',()=>setFullscreen(false));
    const observer=new MutationObserver(()=>{if(isFullscreen&&(!node.isConnected||node.closest('[hidden]')))setFullscreen(false);});
    observer.observe(document.body,{attributes:true,attributeFilter:['hidden'],subtree:true,childList:true});
    addEventListener('pagehide',()=>observer.disconnect(),{once:true});
    main.append(filebar,source,separator('terminalHeight','Hæv eller sænk terminalens skillelinje',false),panel);
    body.append(sidebar,separator('sidebarWidth','Sidepanelets bredde',true),main);
    node.replaceChildren(toolbar,body,statusbar,separator('height','Arbejdsområdets højde',false));
    for(const key of Object.keys(limits))applySize(key,current[key]);
    setSidebar(current.sidebarOpen!==false&&!matchMedia('(max-width: 700px)').matches);selectTab(activeTab);
    cm?.on('cursorActivity',()=>{const position=cm.getCursor();cursor.textContent=`Ln ${position.line+1}, Kol ${position.ch+1}`;});
    function sync(){const p=c.prefs().code;for(const key of Object.keys(limits))if(dimension(key,p[key])!==current[key])applySize(key,p[key]);if(p.sidebarOpen!==lastSidebarPref){lastSidebarPref=p.sidebarOpen;setSidebar(p.sidebarOpen!==false);}filename.textContent=name.value||'Unavngivet';languageLabel.textContent=language.options[language.selectedIndex]?.textContent||language.value;refreshEditor();}
    name.addEventListener('input',sync);sync();
    const maxOutput=130000;
    function append(text,kind='stdout'){
      const scroll=terminal.scrollHeight-terminal.scrollTop-terminal.clientHeight<48;
      const remaining=maxOutput-terminal.textContent.length;if(remaining<=0)return;
      const value=String(text).slice(0,remaining);const last=terminal.lastElementChild;
      if(last?.dataset.stream===kind)last.append(document.createTextNode(value));else{const span=E('span','lxp-code-stream-'+kind,value);span.dataset.stream=kind;terminal.append(span);}
      if(scroll)terminal.scrollTop=terminal.scrollHeight;
    }
    return {terminal,variables,selectTab,sync,refreshEditor,sidebarToggle,terminalToggle,
      requestInput(reply){inputReply=reply;inputRow.hidden=false;node.dataset.waitingInput='true';selectTab('terminal');answer.focus();terminal.scrollTop=terminal.scrollHeight;},
      start(label){clearInput();terminal.replaceChildren();out.replaceChildren();variables.replaceChildren();selectTab('terminal');append('› '+label+'\n','command');},append,
      finish(message,error=false){clearInput();append('\n'+message+'\n',error?'stderr':'system');},
      setBusy(busy){node.dataset.running=String(busy);if(!busy)clearInput();},
      closeFullscreen:()=>setFullscreen(false)};
  };
})();
