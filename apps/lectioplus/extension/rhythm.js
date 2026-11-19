(() => {
  'use strict';
  // Each score is an instrumental excerpt. Durations are in beats, and | marks a phrase.
  // A phrase's bass notes are played in order across that phrase.
  const scores = [
    ['korobeiniki', 'Korobeiniki · Tetris-melodien', 136, 'chip', 'E3 A2|D3 E3|A2 E3|D3 A2',
     'E5:1 B4:.5 C5:.5 D5:1 C5:.5 B4:.5 A4:1 A4:.5 C5:.5 E5:1 D5:.5 C5:.5 | B4:1.5 C5:.5 D5:1 E5:1 C5:1 A4:1 A4:2 | R:.5 D5:1 F5:.5 A5:1 G5:.5 F5:.5 E5:1.5 C5:.5 E5:1 D5:.5 C5:.5 | B4:1 B4:.5 C5:.5 D5:1 E5:1 C5:1 A4:1 A4:2'],
    ['wellerman', 'Wellerman', 100, 'pluck', 'A2 A2|D3 A2|A2 A2|E3 A2|F2 C3|D3 A2|F2 C3|E3 A2',
     'A3:.5 A3:.5 A3:.5 A3:.5 C4:.5 E4:.5 E4:1 | D4:.5 A3:.5 A3:.5 A3:.5 A3:.5 C4:.5 E4:1 | E4:.5 E4:.5 F4:.5 D4:.5 D4:.5 D4:.5 F4:1 | E4:.5 C4:.5 A3:.5 A3:.5 B3:1 A3:1 | A4:1 A4:.5 G4:.5 E4:.5 C4:.5 E4:1 | F4:.5 F4:.5 F4:.5 A4:.5 G4:.5 E4:.5 E4:1 | A4:1 A4:.5 G4:.5 E4:.5 C4:.5 E4:1 | D4:.5 D4:.5 C4:.5 B3:.5 A3:2'],
    ['mountain-king', 'I Dovregubbens hal', 124, 'pluck', 'B2 F#2|D3 F#2|B2 F#2|F#2 B2',
     'B3:.5 C#4:.5 D4:.5 E4:.5 F#4:.5 D4:.5 F#4:1 | F4:.5 C#4:.5 F4:1 E4:.5 C4:.5 E4:1 | B3:.5 C#4:.5 D4:.5 E4:.5 F#4:.5 D4:.5 F#4:.5 B4:.5 | A4:.5 F#4:.5 D4:.5 F#4:.5 A4:1 B4:1'],
    ['elise', 'Für Elise', 84, 'keys', 'A2|E3 A2|A2|E3 A2',
     'E5:.5 D#5:.5 E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 A4:2 | C4:.5 E4:.5 A4:.5 B4:1.5 E4:.5 G#4:.5 B4:.5 C5:1.5 | E5:.5 D#5:.5 E5:.5 D#5:.5 E5:.5 B4:.5 D5:.5 C5:.5 A4:2 | C4:.5 E4:.5 A4:.5 B4:1.5 E4:.5 C5:.5 B4:.5 A4:2'],
    ['sailor', 'Drunken Sailor', 122, 'reed', 'D3|C3|D3|C3 D3',
     'A4:.5 A4:.5 A4:.5 A4:.5 A4:.5 A4:.5 A4:.5 D4:.5 F4:.5 A4:1.5 | G4:.5 G4:.5 G4:.5 G4:.5 G4:.5 G4:.5 G4:.5 C4:.5 E4:.5 G4:1.5 | A4:.5 A4:.5 A4:.5 A4:.5 A4:.5 A4:.5 A4:.5 B4:.5 C5:.5 D5:1.5 | C5:.5 A4:.5 G4:.5 E4:.5 D4:2'],
    ['can-can', 'Can-can', 152, 'reed', 'C3|G2|C3|G2 C3',
     'G4:1 C5:1 C5:.5 D5:.5 E5:.5 F5:.5 | G5:.5 E5:.5 G5:1 G5:.5 F5:.5 D5:.5 B4:.5 | A4:1 F5:1 F5:.5 E5:.5 D5:.5 C5:.5 | B4:.5 G4:.5 A4:.5 B4:.5 C5:2'],
    ['ode', 'Ode til glæden', 104, 'keys', 'C3 G2|C3 G2|C3 G2|G2 C3',
     'E4 E4 F4 G4 G4 F4 E4 D4 | C4 C4 D4 E4 E4:1.5 D4:.5 D4:2 | E4 E4 F4 G4 G4 F4 E4 D4 | C4 C4 D4 E4 D4:1.5 C4:.5 C4:2'],
    ['turkish-march', 'Tyrkisk march', 112, 'keys', 'A2|E3|A2|E3 A2',
     'B4:.25 A4:.25 G#4:.25 A4:.25 C5:1 R:.5 D5:.25 C5:.25 B4:.25 C5:.25 E5:1 | R:.5 F5:.25 E5:.25 D#5:.25 E5:.25 B5:.25 A5:.25 G#5:.25 A5:.25 B5:.25 A5:.25 G#5:.25 A5:.25 | C6:1 A5:1 C6:.5 B5:.5 A5:.5 G5:.5 | A5:.5 G5:.5 F5:.5 E5:.5 D5:.5 E5:.5 C5:1'],
    ['greensleeves', 'Greensleeves', 96, 'pluck', 'A2 C3|G2 E3|A2 C3|E3 A2',
     'A3 C4:2 D4 E4:1.5 F4:.5 E4 | D4:2 B3 G3:1.5 A3:.5 B3 | C4:2 A3 A3:1.5 G#3:.5 A3 | B3:2 G#3 E3:3'],
    ['entertainer', 'The Entertainer', 94, 'keys', 'C3|C3|F2|G2 C3',
     'D4:.5 D#4:.5 E4:.5 C5:1 E4:.5 C5:1 | E4:.5 C5:2 R:.5 C5:.5 D5:.5 D#5:.5 E5:.5 | C5:.5 D5:.5 E5:1 B4:.5 D5:1 | C5:2 R:1'],
    ['habanera', 'Carmen · Habanera', 104, 'reed', 'D3|A2|D3|A2',
     'D5:1.5 C#5:.5 C5:1 C5:1 | B4:1.5 Bb4:.5 A4:1 A4:1 | G#4:1.5 G4:.5 F#4:1 F4:1 | E4:.5 F4:.5 E4:.5 D4:.5 A3:2'],
    ['nattmusik', 'Eine kleine Nachtmusik', 130, 'pluck', 'G2|D3|G2|D3 G2',
     'G4:1 R:.5 D4:.5 G4:1 R:.5 D4:.5 | G4:.5 D4:.5 G4:.5 B4:.5 D5:2 | C5:1 R:.5 A4:.5 C5:1 R:.5 A4:.5 | C5:.5 A4:.5 F#4:.5 A4:.5 D4:2'],
    ['jingle', 'Jingle Bells', 128, 'bell', 'C3|C3|F2 C3|G2',
     'E4 E4 E4:2 E4 E4 E4:2 | E4 G4 C4:1.5 D4:.5 E4:4 | F4 F4 F4:1.5 F4:.5 F4 E4 E4 E4:.5 E4:.5 | E4 D4 D4 E4 D4:2 G4:2'],
    ['birthday', 'Happy Birthday', 100, 'bell', 'C3 G2|G2 C3|C3 F2|G2 C3',
     'G4:.75 G4:.25 A4 G4 C5 B4:2 | G4:.75 G4:.25 A4 G4 D5 C5:2 | G4:.75 G4:.25 G5 E5 C5 B4 A4 | F5:.75 F5:.25 E5 C5 D5 C5:2'],
    ['amazing-grace', 'Amazing Grace', 82, 'reed', 'G2 G2|C3 G2|G2|D3',
     'D4 G4:2 B4:.5 G4:.5 B4:2 A4 | G4:2 E4 D4:2 D4 | G4:2 B4:.5 G4:.5 B4:2 A4 | D5:3 R:1'],
    ['frere', 'Mester Jakob', 112, 'bell', 'C3|C3 G2|C3|G2 C3',
     'C4 D4 E4 C4 C4 D4 E4 C4 | E4 F4 G4:2 E4 F4 G4:2 | G4:.5 A4:.5 G4:.5 F4:.5 E4 C4 G4:.5 A4:.5 G4:.5 F4:.5 E4 C4 | C4 G3 C4:2 C4 G3 C4:2'],
    ['saints', 'When the Saints Go Marching In', 124, 'reed', 'C3|C3|C3|G2',
     'C4 E4 F4 G4:3 | C4 E4 F4 G4:3 | C4 E4 F4 G4:2 E4:2 | C4:2 E4:2 D4:4'],
    ['auld-lang-syne', 'Skuld gammel venskab rejn forgo', 92, 'reed', 'G2|D3 G2|C3|G2 D3',
     'D4 G4:1.5 F#4:.5 G4 B4 | A4:1.5 G4:.5 A4 B4 G4:2 | G4 B4 D5:1.5 E5:.5 E5 | D5:1.5 B4:.5 B4 G4 A4:2'],
    ['twinkle', 'Twinkle, Twinkle, Little Star', 100, 'bell', 'C3 F2|F2 C3|C3 G2|C3 G2',
     'C4 C4 G4 G4 A4 A4 G4:2 | F4 F4 E4 E4 D4 D4 C4:2 | G4 G4 F4 F4 E4 E4 D4:2 | G4 G4 F4 F4 E4 E4 D4:2'],
    ['fifth', 'Beethovens femte', 110, 'pluck', 'C3|G2|C3|G2',
     'R:.5 G4:.5 G4:.5 G4:.5 Eb4:3 | R:.5 F4:.5 F4:.5 F4:.5 D4:4 | R:.5 G4:.5 G4:.5 G4:.5 Eb4:1 Ab4:.5 Ab4:.5 Ab4:.5 F4:1 | C5:.5 C5:.5 C5:.5 G4:3']
  ];

  function midi(name) {
    const [,letter,accidental,octave] = /^([A-G])([#b]?)([2-6])$/.exec(name);
    return 12 * (Number(octave) + 1) + {C:0,D:2,E:4,F:5,G:7,A:9,B:11}[letter]
      + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0);
  }

  const tracks = scores.map(([id,title,bpm,voice,bass,score], index) => {
    const beat = 60 / bpm, notes = [], targets = [];
    const roots = bass.split('|'), phrases = score.split('|');
    let time = 1.5, lastTarget = -1;
    for (let pass = 0; pass < 2; pass++) {
      phrases.forEach((phrase, p) => {
        const start = time;
        for (const token of phrase.trim().split(/\s+/)) {
          const [name, length = 1] = token.split(':');
          const duration = Number(length) * beat;
          if (name !== 'R') {
            const pitch = midi(name);
            notes.push({time, duration, pitch, voice});
            // Select onsets with room to move. Contours follow pitch and phrase direction.
            if (time - lastTarget >= Math.max(.23, beat * (pass ? .48 : .72)) - 1e-6) {
              const phase = targets.length * (.63 + (index % 4) * .085) + index + p * .34;
              targets.push({time, x:320 + 180 * Math.sin(phase), y:180 + 68 * Math.cos(phase * .72) - (pitch - 67) * 2.6});
              lastTarget = time;
            }
          }
          time += duration;
        }
        const chords = roots[p].split(' ');
        chords.forEach((root,i) => {
          const span = (time - start) / chords.length;
          for (let offset = 0; offset < span - .02; offset += beat) {
            const pulse = Math.round(offset / beat);
            notes.push({time:start + span*i + offset, duration:Math.min(span-offset, beat*.76),
              pitch:midi(root) + (pulse % 2 ? 7 : 0), voice:'bass'});
          }
        });
      });
    }
    return {id,title,bpm,notes:notes.sort((a,b)=>a.time-b.time),targets,end:time+.25};
  });

  function session(track) {
    return {track, index:0, score:0, combo:0, longest:0, hits:0, points:0, time:0, verdict:''};
  }
  function advance(s,time) {
    s.time = time;
    while (s.index < s.track.targets.length && time - s.track.targets[s.index].time > .17) {
      const target=s.track.targets[s.index];
      if(target.spinEnd){
        if(time<target.spinEnd)break;
        const fraction=(s.rotation||0)/target.required;
        const points=fraction>=1?300:fraction>=.65?100:fraction>=.35?50:0;
        if(points){s.hits++;s.combo++;s.points+=points;s.score+=points;s.longest=Math.max(s.longest,s.combo);}
        else s.combo=0;
        s.verdict=points?'Spinner '+points:'Forpasset';s.rotation=0;s.angle=null;s.index++;continue;
      }
      s.index++; s.combo = 0; s.verdict = 'Forpasset';
    }
  }
  function hit(s,x,y,time) {
    advance(s,time);
    const target = s.track.targets[s.index];
    if (!target || target.spinEnd || Math.abs(time-target.time) > .17 || Math.hypot(x-target.x,y-target.y) > 28) return;
    const delta = Math.abs(time-target.time);
    const points = delta <= .065 ? 300 : delta <= .115 ? 100 : 50;
    s.combo++; s.hits++; s.points += points; s.score += points + Math.min(20,s.combo-1)*5;
    const slider=s.sliders?.get(s.index);
    if(slider){s.following=slider;s.followTime=Math.max(time,slider.time);s.followed=0;}
    s.longest = Math.max(s.longest,s.combo); s.index++; s.verdict = String(points);
  }

  const waves = {chip:'square',pluck:'triangle',keys:'triangle',bell:'sine',reed:'sawtooth',bass:'sine'};
  function scheduleTone(audio,master,n,onset,end){
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = waves[n.voice]; osc.frequency.value = 440 * 2 ** ((n.pitch-69)/12);
    const volume = {chip:.11,reed:.12,bass:.28,bell:.38,keys:.35,pluck:.32}[n.voice];
    const held = n.voice==='reed' || n.voice==='chip';
    const attack = Math.min(onset+(held ? .026 : .012),end-.005);
    gain.gain.setValueAtTime(.0001,onset);
    gain.gain.exponentialRampToValueAtTime(volume,attack);
    gain.gain.exponentialRampToValueAtTime(volume*(held ? .72 : .17),attack+(end-attack)*.7);
    gain.gain.exponentialRampToValueAtTime(.0001,end);
    osc.connect(gain); gain.connect(master); osc.start(onset); osc.stop(end);
  }

  async function renderScore(track){
    const rate=22050, audio=new OfflineAudioContext(1,Math.ceil(track.end*rate),rate);
    const master=audio.createGain();master.gain.value=.75;master.connect(audio.destination);
    for(const note of track.notes)scheduleTone(audio,master,note,note.time,note.time+note.duration*.94);
    return recordingClip(track,{buffer:await audio.startRendering(),start:lead});
  }

  // Schedule on Web Audio's own clock. The same timeline drives hits and approach rings.
  function playback(track,offset) {
    const audio = new AudioContext(), master = audio.createGain();
    master.gain.value = .45; master.connect(audio.destination);
    const start = audio.currentTime - offset;
    let cursor = track.notes.findIndex(n=>n.time+n.duration > offset);
    if (cursor < 0) cursor = track.notes.length;
    function schedule() {
      while (cursor < track.notes.length && start+track.notes[cursor].time < audio.currentTime+.3) {
        const n = track.notes[cursor++], end = start+n.time+n.duration*.94;
        const onset = Math.max(audio.currentTime,start+n.time);
        if (end-onset < .015) continue;
        scheduleTone(audio,master,n,onset,end);
      }
    }
    return {ready:audio.resume(), now:()=>audio.currentTime-start, schedule,
      close(){if(audio.state!=='closed')void audio.close().catch(()=>{});}};
  }
  // Each set of four eight-step bars defines a different pop chart.
  // Slots are eighth notes. The accent pattern changes between the four sections.
  const popScores = [
    ['california-gurls','California Gurls','Katy Perry feat. Snoop Dogg',125,'01367452','x.x.x.x. x..xx.x. x.x..xx. x..xx.xx'],
    ['firework','Firework','Katy Perry',124,'64201357','x...x.x. x.x.x.x. x.xx..x. x..xx.xx'],
    ['roar','Roar','Katy Perry',90,'07632145','x...x... x.x..x.. x..xx.x. x.x.x..x'],
    ['shake-it-off','Shake It Off','Taylor Swift',160,'02571364','x...x.x. x.x...x. x.x.x.x. x..xx..x'],
    ['blank-space','Blank Space','Taylor Swift',96,'04371625','x...x..x x..x..x. x.x..x.. x..xx.x.'],
    ['anti-hero','Anti-Hero','Taylor Swift',97,'75310246','x..x..x. x.x.x... x..xx..x x.x..xx.'],
    ['blinding-lights','Blinding Lights','The Weeknd',171,'21456703','x...x... x.x...x. x.x.x.x. x..x..x.'],
    ['levitating','Levitating','Dua Lipa',103,'02135476','x..x.x.. x.x..x.x x..xx..x x.x.xx..'],
    ['bad-romance','Bad Romance','Lady Gaga',119,'37046251','x.x.x... x..x..x. x.x.xx.. x.xx..xx'],
    ['treasure','Treasure','Bruno Mars',116,'05732461','x..x..x. x.x..xx. x..x.x.x x.xx..x.']
  ];
  const lead = 1.5;
  const spots = [[134,102],[294,87],[461,87],[522,180],[453,267],[299,278],[145,255],[87,174]];
  const popTracks = popScores.map(([id,title,artist,bpm,path,patterns])=>{
    const beat = 60/bpm, bars = patterns.split(' '), targets = [], notes = [];
    for(let bar=0;bar<24;bar++){
      const section=Math.floor(bar/6);
      const pattern=bars[bar%6===5 ? (section+1)%4 : section];
      for(let slot=0;slot<8;slot++){
        const time=lead+(bar*4+slot/2)*beat;
        if(slot%2===0){
          notes.push({time, duration:beat*.28, pitch:slot%4===0?36:54, voice:'bass'});
        }
        if(pattern[slot]!=='x')continue;
        const pos=targets.length%8;
        const [x,y]=spots[Number(path[(section%2 ? 7-pos : pos)])];
        targets.push({time,x,y});
        notes.push({time,duration:beat*.16,pitch:slot%2 ? 82 : 73,voice:'pluck'});
      }
    }
    return {id,title,artist,bpm,targets,notes,end:lead+96*beat};
  });

  // Fold the onset strengths over one beat to estimate the phase of a studio recording.
  function firstBeat(buffer,bpm){
    const samples=buffer.getChannelData(0), rate=buffer.sampleRate;
    const hop=Math.max(1,Math.round(rate*.01)), beat=60/bpm, bins=100;
    const phase=new Float64Array(bins);
    let previous=0, first=null;
    for(let i=0;i+hop<=samples.length && i/rate<(first===null?24:first+16);i+=hop){
      let power=0;
      for(let j=i;j<i+hop;j++)power+=samples[j]*samples[j];
      const rms=Math.sqrt(power/hop);
      if(first===null && rms>.008)first=i/rate;
      if(first!==null){
        const bin=Math.round(((i/rate)%beat)/beat*bins)%bins;
        phase[bin]+=Math.max(0,rms-previous);
      }
      previous=rms;
    }
    if(first===null)return 0;
    let peak=0, strongest=-1;
    for(let i=0;i<bins;i++){
      const value=phase[i]+.65*(phase[(i+bins-1)%bins]+phase[(i+1)%bins]);
      if(value>strongest){strongest=value;peak=i;}
    }
    const phaseTime=peak*beat/bins;
    return Math.max(0,phaseTime+Math.ceil((first-.05-phaseTime)/beat)*beat);
  }

  const customTrack={id:'own-song',title:'Egen sang',artist:'Lokal lydfil',custom:true,targets:[],notes:[],end:0};
  // Read the envelope once. Keep both channels so a hard-panned beat is still visible.
  function analyseAudio(buffer){
    const channels=Array.from({length:Math.min(2,buffer.numberOfChannels||1)},(_,i)=>buffer.getChannelData(i));
    const hop=Math.max(1,Math.round(buffer.sampleRate*.02)), step=hop/buffer.sampleRate;
    const energy=new Float32Array(Math.ceil(channels[0].length/hop)), flux=new Float32Array(energy.length);
    let peak=0, average=0;
    for(let k=0;k<energy.length;k++){
      let power=0;
      const start=k*hop,end=Math.min(start+hop,channels[0].length);
      for(const samples of channels)for(let i=start;i<end;i+=2)power+=samples[i]*samples[i];
      energy[k]=Math.sqrt(power/(Math.ceil((end-start)/2)*channels.length));
      flux[k]=Math.max(0,energy[k]-average);
      average=.45*average+.55*energy[k];
      peak=Math.max(peak,energy[k]);
    }
    if(peak<.00001)throw Error('Filen indeholder ingen hørbar lyd.');
    // Autocorrelation of onset peaks, sampled across the whole song.
    const low=Math.ceil(60/185/step), high=Math.floor(60/72/step);
    const correlations=new Float64Array(high+2);
    let bestLag=0,bestScore=0;
    for(let lag=low;lag<=high;lag++){
      let score=0;
      for(let k=lag;k<flux.length;k++)score+=flux[k]*flux[k-lag];
      correlations[lag]=score;
      if(score>bestScore){bestLag=lag;bestScore=score;}
    }
    const curvature=2*bestScore-correlations[bestLag-1]-correlations[bestLag+1];
    const refined=bestLag+(curvature>0?(correlations[bestLag+1]-correlations[bestLag-1])/(2*curvature):0);
    return {energy,flux,step,peak,bpm:bestLag?Math.round(60/(refined*step)):120};
  }
  function fullChart(profile,recording){
    const {energy,flux,step,peak}=recording.analysis;
    const bpm=profile.custom?recording.analysis.bpm:profile.bpm, beat=60/bpm;
    const end=recording.buffer.duration, targets=[];
    // Follow local accents, leave rests empty, and keep enough room to approach each object.
    const radius=Math.floor(beat*.47/step);
    for(let grid=recording.detectedStart;grid<end;grid+=beat){
      const center=Math.round(grid/step);
      let accent=center,loud=0;
      for(let k=Math.max(0,center-radius);k<=Math.min(energy.length-1,center+radius);k++){
        loud=Math.max(loud,energy[k]);
        if(flux[k]>(flux[accent]||0))accent=k;
      }
      if(loud<peak*.009)continue;
      const time=(flux[accent]>peak*.025?accent*step:grid)+recording.start-recording.detectedStart;
      if(time<Math.min(.55,end*.25)||time>end-.18||time-(targets.at(-1)?.time??-1)<.23)continue;
      targets.push({time});
      // Include a distinct offbeat when the recording actually has a second attack.
      const half=Math.round((grid+beat/2)/step);
      let off=half;
      for(let k=Math.max(1,half-2);k<=Math.min(flux.length-2,half+2);k++)
        if(flux[k]>(flux[off]||0))off=k;
      const offTime=off*step+recording.start-recording.detectedStart;
      if(flux[off]>Math.max(peak*.07,(flux[accent]||0)*.32) &&
         offTime-time>=.23 && offTime<=end-.18)targets.push({time:offTime});
    }
    // Preserve a readable cursor path even when a chorus gains extra subdivisions.
    const seed=Array.from(recording.recordId).reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0)%628/100;
    let phase=seed;
    for(const [i,target] of targets.entries()){
      const gap=i?target.time-targets[i-1].time:beat;
      phase+=Math.min(1.25,.76*gap/beat);
      target.x=320+190*Math.sin(phase)+32*Math.sin(phase*.48);
      target.y=180+91*Math.cos(phase*.67+seed)+24*Math.sin(phase*1.42);
    }
    if(!targets.length)throw Error('Der var for lidt lyd til at lave en spilbar bane.');
    return {...profile,title:profile.custom?recording.filename.replace(/\.[^.]+$/,''):profile.title,
      bpm,end,targets,notes:[],recordId:recording.recordId};
  }
  async function importRecording(file,track=customTrack){
    if(file.size>64*1024*1024)throw Error('Vælg en lydfil på højst 64 MB.');
    let buffer;
    try{
      const decoder=new OfflineAudioContext(1,1,22050);
      buffer=await decoder.decodeAudioData(await file.arrayBuffer());
    }catch{throw Error('Browseren kunne ikke læse lydfilen. Prøv MP3 eller WAV.');}
    const analysis=analyseAudio(buffer), bpm=track.custom?analysis.bpm:track.bpm;
    const start=firstBeat(buffer,bpm);
    let hash=2166136261;
    for(const ch of [track.id,file.name,file.size,buffer.duration,file.lastModified||0].join('|'))
      hash=Math.imul(hash^ch.charCodeAt(0),16777619);
    const recordId='file-'+Array.from(String(hash>>>0),digit=>String.fromCharCode(97+Number(digit))).join('');
    const recording={id:track.id,profile:track,buffer,file,analysis,start,detectedStart:start,maxStart:Math.min(buffer.duration,start+60/bpm),
      filename:file.name,recordId};
    recording.chart=fullChart(track,recording);
    return recording;
  }

  function playingSession(track){
    const targets=[];
    let nextSpin=19;
    for(let i=0;i<track.targets.length;i++){
      const a=track.targets[i];
      if(a.time>=nextSpin && a.time+4<track.end){
        // Replace a continuous musical phrase. Never spin across a rest.
        let j=i;
        while(j+1<track.targets.length && track.targets[j+1].time-track.targets[j].time<.95 &&
            track.targets[j+1].time-a.time<=2.7)j++;
        const span=track.targets[j].time-a.time;
        if(span>=1.65){
          targets.push({x:320,y:180,time:a.time,spinEnd:a.time+span,required:span*2*Math.PI*1.15});
          nextSpin=a.time+32;i=j;continue;
        }
      }
      targets.push(a);
    }
    const s=session({...track,targets});
    s.sliders=new Map();
    for(let i=3;i<targets.length-1;i+=5){
      const a=targets[i],b=targets[i+1],gap=b.time-a.time;
      if(a.spinEnd||b.spinEnd||gap<.32)continue;
      const dx=(b.x-a.x)*.58,dy=(b.y-a.y)*.58;
      s.sliders.set(i,{x:a.x,y:a.y,cx:a.x+dx*.5-dy*.22,cy:a.y+dy*.5+dx*.22,
        ex:a.x+dx,ey:a.y+dy,time:a.time,end:a.time+Math.min(.95,gap*.74)});
    }
    return s;
  }
  function sliderPoint(path,time){
    const t=Math.max(0,Math.min(1,(time-path.time)/(path.end-path.time))), u=1-t;
    return {x:u*u*path.x+2*u*t*path.cx+t*t*path.ex,y:u*u*path.y+2*u*t*path.cy+t*t*path.ey};
  }
  function follow(s,time,aim,held){
    const spinner=s.track.targets[s.index];
    if(spinner?.spinEnd && time>=spinner.time && time<=spinner.spinEnd){
      const dx=(aim?.x??320)-320,dy=(aim?.y??180)-180;
      if(held && Math.hypot(dx,dy)>28){
        const angle=Math.atan2(dy,dx);
        if(s.angle!=null){
          const delta=angle-s.angle, arc=Math.abs(Math.atan2(Math.sin(delta),Math.cos(delta)));
          s.rotation=(s.rotation||0)+Math.min(arc,Math.max(0,time-s.spinTime)*Math.PI*12);
        }
        s.angle=angle;s.spinTime=time;
      }else s.angle=null;
    }
    const path=s.following;
    if(!path)return;
    const until=Math.min(path.end,time),previous=Math.max(path.time,s.followTime);
    if(until<=previous)return;
    const point=sliderPoint(path,until);
    if(held && aim && Math.hypot(aim.x-point.x,aim.y-point.y)<=42)
      s.followed+=Math.min(.09,until-previous);
    s.followTime=until;
    if(time>=path.end){
      const success=s.followed>=(path.end-path.time)*.65;
      if(success)s.score+=100;else s.combo=0;
      s.verdict=success?'Slider +100':'Slider sluppet';s.following=null;
    }
  }

  function playRecording(track,recording,offset){
    const audio=new AudioContext(), origin=audio.currentTime-offset;
    const source=audio.createBufferSource(), gain=audio.createGain();
    source.buffer=recording.buffer;source.connect(gain);gain.connect(audio.destination);
    const delay=recording.file?0:lead-recording.start;
    const when=Math.max(audio.currentTime,origin+delay), end=origin+track.end;
    if(end>when){
      gain.gain.setValueAtTime(.82,when);
      gain.gain.setValueAtTime(.82,Math.max(when,end-.10));
      gain.gain.linearRampToValueAtTime(0,end);
      source.start(when,Math.max(0,when-origin-delay),end-when);
    }
    return {ready:audio.resume(),now:()=>audio.currentTime-origin,schedule(){},
      close(){if(audio.state!=='closed')void audio.close().catch(()=>{});}};
  }
  // A local WAV has a seekable media clock, including the lead-in used by the chart.
  function recordingClip(track,recording){
    const buffer=recording.buffer,rate=buffer.sampleRate,channels=Math.min(2,buffer.numberOfChannels);
    const frames=Math.ceil(track.end*rate), stride=channels*2, bytes=frames*stride;
    const data=new ArrayBuffer(44+bytes), view=new DataView(data);
    function tag(offset,text){
      for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i));
    }
    tag(0,'RIFF');view.setUint32(4,36+bytes,true);tag(8,'WAVE');tag(12,'fmt ');
    view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);
    view.setUint32(24,rate,true);view.setUint32(28,rate*stride,true);
    view.setUint16(32,stride,true);view.setUint16(34,16,true);
    tag(36,'data');view.setUint32(40,bytes,true);
    const shift=Math.round((recording.start-lead)*rate);
    for(let ch=0;ch<channels;ch++){
      const samples=buffer.getChannelData(ch);
      const end=Math.min(frames,samples.length-shift);
      for(let frame=Math.max(0,-shift);frame<end;frame++){
        const fade=Math.min(1,(frames-frame)/(rate*.025));
        const v=Math.max(-1,Math.min(1,samples[frame+shift]*fade));
        view.setInt16(44+frame*stride+ch*2,Math.round(v*(v<0?32768:32767)),true);
      }
    }
    return new Blob([data],{type:'audio/wav'});
  }

  function mediaPlayback(media,track,offset){
    media.pause();media.currentTime=offset;media.muted=false;
    // Some browsers quantize currentTime. Interpolate between observed ticks,
    // bounded to one tick, so animation stays smooth without running through a stall.
    let anchor=null,stamp=0,last=offset;
    function now(){
      if(media.ended)return track.end;
      const raw=media.currentTime, tick=performance.now();
      if(raw!==anchor){anchor=raw;stamp=tick;}
      const ahead=!media.paused && !media.seeking && media.readyState>=3
        ?Math.min(.09,(tick-stamp)/1000):0;
      last=Math.max(last,Math.min(Math.max(raw,track.end-.001),raw+ahead));
      return last;
    }
    return {ready:media.play(),now,
      schedule(){},close(){media.pause();}};
  }

  globalThis.lectioPlusRhythm = {tracks,popTracks,customTrack,fullChart,playingSession,sliderPoint,follow,session,advance,hit,playback,importRecording,playRecording,firstBeat,recordingClip,mediaPlayback,renderScore};
})();
