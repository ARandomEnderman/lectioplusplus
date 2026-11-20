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

  const waves = {kick:'sine',chip:'square',pluck:'triangle',keys:'triangle',bell:'sine',reed:'sawtooth',bass:'sine'};
  function scheduleTone(audio,master,n,onset,end){
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = waves[n.voice]; osc.frequency.value = 440 * 2 ** ((n.pitch-69)/12);
    if(n.voice==='kick'){
      osc.frequency.setValueAtTime(145,onset);
      osc.frequency.exponentialRampToValueAtTime(45,Math.min(onset+.085,end));
    }
    const volume = {kick:.48,chip:.11,reed:.12,bass:.28,bell:.38,keys:.35,pluck:.32}[n.voice];
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
  function playback(track,offset,rate=1) {
    const audio = new AudioContext(), master = audio.createGain();
    master.gain.value = .45; master.connect(audio.destination);
    const start = audio.currentTime - offset/rate, notes=track.notes;
    let cursor = notes.findIndex(n=>n.time+n.duration > offset);
    if (cursor < 0) cursor = notes.length;
    function schedule() {
      while (cursor < notes.length && start+notes[cursor].time/rate < audio.currentTime+.3) {
        const n = notes[cursor++], end = start+(n.time+n.duration*.94)/rate;
        const onset = Math.max(audio.currentTime,start+n.time/rate);
        if (end-onset < .015) continue;
        scheduleTone(audio,master,n,onset,end);
      }
    }
    return {ready:audio.resume(), now:()=>(audio.currentTime-start)*rate, schedule,
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

  const customTrack={id:'own-song',title:'Egen sang',artist:'Lokal lydfil',custom:true,targets:[],notes:[],end:0};

  // Vote for observed pulse periods on a logarithmic scale. Average across a
  // short run of similar intervals to reduce timing error from the audio frames.
  function estimateTempo(attacks,step){
    const votes=new Map();
    let winner=null;
    for(let i=1;i<attacks.length;i++){
      const gap=attacks[i].time-attacks[i-1].time;
      let first=i-1;
      while(first>0 && i-first<8){
        const earlier=attacks[first].time-attacks[first-1].time;
        if(Math.abs(earlier-gap)>Math.max(step*2,gap*.14))break;
        first--;
      }
      const period=(attacks[i].time-attacks[first].time)/(i-first);
      const position=48*Math.log2(period),center=Math.round(position);
      for(let bin=center-1;bin<=center+1;bin++){
        const weight=Math.sqrt(attacks[i].strength)*(1.5-Math.abs(bin-position));
        const vote=votes.get(bin)||{weight:0,periodSum:0};
        vote.weight+=weight;vote.periodSum+=weight*period;
        votes.set(bin,vote);
        if(!winner||vote.weight>winner.weight)winner=vote;
      }
    }
    return winner?Math.round(60*winner.weight/winner.periodSum):0;
  }

  function analyseAudio(buffer){
    const channels=Array.from({length:Math.min(2,buffer.numberOfChannels||1)},(_,i)=>buffer.getChannelData(i));
    const hop=Math.max(1,Math.round(buffer.sampleRate*.005)),step=hop/buffer.sampleRate;
    const energy=new Float32Array(Math.ceil(channels[0].length/hop)),flux=new Float32Array(energy.length);
    const low=new Float64Array(channels.length),last=new Float64Array(channels.length);
    const cut=1-Math.exp(-2*Math.PI*180/buffer.sampleRate);
    let prevBass=0,prevAir=0,prevLevel=0,peak=0;
    for(let k=0;k<energy.length;k++){
      const start=k*hop,end=Math.min(start+hop,channels[0].length);
      let power=0,bass=0,air=0;
      for(let ch=0;ch<channels.length;ch++){
        const samples=channels[ch];
        let bassSample=low[ch],previous=last[ch];
        for(let j=start;j<end;j++){
          const sample=samples[j];
          bassSample+=cut*(sample-bassSample);
          power+=sample*sample;bass+=bassSample*bassSample;air+=(sample-previous)**2;
          previous=sample;
        }
        low[ch]=bassSample;last[ch]=previous;
      }
      const count=(end-start)*channels.length;
      const level=Math.sqrt(power/count),bottom=Math.sqrt(bass/count),top=Math.sqrt(air/count);
      energy[k]=level;peak=Math.max(peak,level);
      flux[k]=Math.max(0,level-prevLevel)+.8*Math.max(0,bottom-prevBass)+1.8*Math.max(0,top-prevAir);
      prevLevel=.65*level+.35*prevLevel;prevBass=.65*bottom+.35*prevBass;prevAir=.65*top+.35*prevAir;
    }
    if(peak<.00001)throw Error('Filen indeholder ingen hørbar lyd.');
    const sums=new Float64Array(flux.length+1),attacks=[];
    for(let i=0;i<flux.length;i++)sums[i+1]=sums[i]+flux[i];
    const neighbourhood=Math.max(1,Math.round(.2/step));
    let valley=Infinity,lastPeak=0;
    for(let i=0;i<flux.length;i++){
      valley=Math.min(valley,flux[i]);
      if(flux[i]<=(flux[i-1]||0)||flux[i]<(flux[i+1]||0))continue;
      const lo=Math.max(0,i-neighbourhood),hi=Math.min(flux.length,i+neighbourhood+1);
      const floor=Math.max(peak*.003,(sums[hi]-sums[lo])/(hi-lo)*1.75,energy[i]*.035);
      // A sharp release also has high-frequency energy. Ignore it when the
      // sound itself has already fallen away (e.g. the end of a square pulse).
      if(flux[i]<=floor || energy[i]<(energy[i-1]||0)*.25)continue;
      const attack={time:i*step,strength:flux[i]/floor};
      // Two peaks separated by a clear dip are separate attacks, even in a fast roll.
      if(attacks.length && valley>.45*Math.min(lastPeak,flux[i])){
        if(flux[i]>lastPeak){attacks[attacks.length-1]=attack;lastPeak=flux[i];}
      }else{
        attacks.push(attack);lastPeak=flux[i];
      }
      valley=flux[i];
    }
    return {energy,step,peak,attacks,bpm:estimateTempo(attacks,step)};
  }
  function firstBeat(buffer){
    const analysis=analyseAudio(buffer);
    return analysis.attacks[0]?.time??0;
  }

  function fullChart(profile,recording){
    const {energy,step,peak,attacks=[]}=recording.analysis;
    const bpm=recording.analysis.bpm||profile.bpm||120,beat=60/bpm,end=recording.buffer.duration;
    let source=attacks;
    if(attacks.length<2){
      // Unmetered sustained audio: use a regular practice pulse only while audible.
      source=[];
      for(let time=recording.detectedStart;time<end;time+=beat){
        if(energy[Math.round(time/step)]>peak*.015)source.push({time,strength:1});
      }
    }
    const targets=[];
    for(const attack of source){
      const time=attack.time+recording.start-recording.detectedStart;
      if(time<0||time>end-Math.min(.12,end*.1))continue;
      const phase=targets.length*.76;
      targets.push({time,strength:attack.strength,x:320+180*Math.sin(phase),y:180+85*Math.cos(phase*.7)});
    }
    if(!targets.length)throw Error('Der var for lidt lyd til at lave en spilbar bane.');
    return {...profile,title:profile.custom?recording.filename.replace(/\.[^.]+$/,''):profile.title,
      bpm,end,targets,notes:[],estimated:attacks.length>=2 && Boolean(recording.analysis.bpm),recordId:recording.recordId};
  }

  // One roll per fresh round. Audio, pause/resume and input all use song time.
  // Each phrase chooses a rhythm and a cursor motif from actual note attacks.
  function newChart(track,density='normal',seed=crypto.getRandomValues(new Uint32Array(1))[0]){
    if(!track.targets.length)return track;
    let bits=seed>>>0;
    const random=()=>{bits=(Math.imul(1664525,bits)+1013904223)>>>0;return bits/4294967296;};
    let candidates=track.targets;
    if(track.notes.length){
      candidates=[];
      for(const note of track.notes){
        const strength=note.voice==='bass'?2:5;
        const prev=candidates.at(-1);
        if(prev && Math.abs(note.time-prev.time)<1e-7)prev.strength=Math.max(prev.strength,strength);
        else candidates.push({time:note.time,strength});
      }
    }
    const beat=60/track.bpm;
    const targets=[];
    let nextPhrase=-Infinity,pattern=0,orientation=0,angle=0,stride=0,index=0;
    let x=320,y=180;
    for(const note of candidates){
      const gap=note.time-(targets.at(-1)?.time??-Infinity);
      if(gap<=0)continue;
      if(note.time>=nextPhrase){
        nextPhrase=note.time+beat*(random()<.5?4:8);
        pattern=Math.floor(random()*3);orientation=random()*Math.PI*2;
        stride=50+80*random();angle=(random()<.5?-1:1)*(.4+random()*.8);index=0;
      }
      const slot=index++, accented=note.strength>=4;
      const accent=pattern===0?slot%4===0:pattern===1?slot%4===2:slot%3===0;
      const keep=(density==='dense'?.80:density==='sparse'?.31:.62)+(accent?.18:0)+(accented?.065:0);
      if(gap<beat*1.55 && random()>keep)continue;
      const length=Math.min(stride,Math.max(38,gap*440));
      orientation+=pattern===1?(slot%2?1.6:-1.4):pattern===2?angle*2:angle;
      let dx=Math.cos(orientation)*length,dy=Math.sin(orientation)*length*.76;
      if(x+dx<48||x+dx>592){dx=-dx;orientation=Math.PI-orientation;}
      if(y+dy<46||y+dy>314){dy=-dy;orientation=-orientation;}
      x+=dx;y+=dy;
      targets.push({time:note.time,x,y,figure:random(),accent:random()});
    }
    return {...track,targets,seed};
  }

  async function importRecording(file,track=customTrack){
    if(file.size>64*1024*1024)throw Error('Vælg en lydfil på højst 64 MB.');
    let buffer;
    try{
      const decoder=new OfflineAudioContext(1,1,22050);
      buffer=await decoder.decodeAudioData(await file.arrayBuffer());
    }catch{throw Error('Browseren kunne ikke læse lydfilen. Prøv MP3 eller WAV.');}
    const analysis=analyseAudio(buffer), bpm=analysis.bpm||track.bpm||120;
    const start=analysis.attacks[0]?.time??0;
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
      if(a.time>=nextSpin && a.time+4<track.end && (a.figure===undefined||a.figure>.8)){
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
    for(let i=0;i<targets.length-1;i++){
      const a=targets[i],b=targets[i+1],gap=b.time-a.time;
      if((a.figure===undefined?i%5!==3:a.figure>.28)||a.spinEnd||b.spinEnd||gap<.32)continue;
      const dx=(b.x-a.x)*.58,dy=(b.y-a.y)*.58;
      s.sliders.set(i,{x:a.x,y:a.y,cx:a.x+dx*.5-dy*.22,cy:a.y+dy*.5+dx*.22,
        ex:a.x+dx,ey:a.y+dy,time:a.time,end:a.time+Math.min(.95,gap*.74)});
    }
    return s;
  }
  const rulesets={
    standard:{name:'osu!',guide:'Sigt på cirklerne, følg sliderne og drej spinnerne.'},
    taiko:{name:'osu!taiko',guide:'Slå røde noter i midten og blå på kanten. Trom på de gule hvirvler.'},
    catch:{name:'osu!catch',guide:'Bevæg kurven under frugten. Hold sprint ved lange spring. Du kan også styre med mus eller touch.'},
    mania:{name:'osu!mania · 4K',guide:'Ram noterne på stregen i de fire spor. Hold lange noter til halen når stregen.'}
  };
  function modeSession(track,mode){
    if(!Object.hasOwn(rulesets,mode)||mode==='standard')return Object.assign(playingSession(track),{mode:'standard'});
    const targets=[],laneEnds=[-1,-1,-1,-1];
    let lastX=320,lastTime=0;
    track.targets.forEach((note,i)=>{
      const gap=(track.targets[i+1]?.time??track.end)-note.time;
      const next={time:note.time};
      if(mode==='catch'){
        const reach=Math.min(495,Math.max(0,note.time-lastTime)*510);
        const wanted=40+(note.x/640)*560;
        next.x=lastX+Math.max(-reach,Math.min(reach,wanted-lastX));
        lastX=next.x;lastTime=note.time;
      }else if(mode==='taiko'){
        next.lane=Number(note.accent===undefined?(i%5===2||i%5===3):note.accent>.6);
        if((note.figure===undefined?i%9===5:note.figure<.14)&&gap>.45)next.rollEnd=note.time+Math.min(.85,gap*.8);
      }else{
        let lane=Math.max(0,Math.min(3,Math.floor(note.x/160)));
        for(let j=0;j<4&&laneEnds[lane]>note.time-.07;j++)lane=(lane+1)%4;
        next.lane=lane;
        if((note.figure===undefined?i%6===3:note.figure<.2)&&gap>.18){
          next.end=Math.min(track.end-.20,note.time+Math.max(.27,Math.min(.9,gap*1.5)));
          if(next.end<=note.time+.2)delete next.end;
        }
        laneEnds[lane]=next.end||note.time;
        if((note.accent===undefined?i%12===8:note.accent>.90)&&laneEnds[(lane+2)%4]<note.time-.12){
          const chord=(lane+2)%4;targets.push({time:note.time,lane:chord});laneEnds[chord]=note.time;
        }
      }
      targets.push(next);
    });
    return {...session({...track,targets}),mode,judged:new Set(),holds:new Map(),basket:320,roll:null};
  }
  function mark(s,index,points){
    if(s.judged.has(index))return;
    s.judged.add(index);
    if(points){
      s.hits++;s.points+=points;s.combo++;s.longest=Math.max(s.longest,s.combo);
      s.score+=points+Math.min(20,s.combo-1)*5;s.verdict=String(points);
    }else{s.combo=0;s.verdict='Forpasset';}
    while(s.judged.has(s.index))s.index++;
  }
  function modeTick(s,time,input={}){
    time=Math.max(time,s.time);
    if(s.mode==='catch'){
      const speed=input.sprint?590:345;
      const move=dt=>{
        const dx=Number.isFinite(input.x)?input.x-s.basket:(input.direction||0)*speed*dt;
        s.basket=Math.max(24,Math.min(616,s.basket+Math.max(-speed*dt,Math.min(speed*dt,dx))));
      };
      let from=s.time;
      while(s.index<s.track.targets.length&&s.track.targets[s.index].time<=time){
        const fruit=s.track.targets[s.index];move(Math.max(0,fruit.time-from));from=fruit.time;
        mark(s,s.index,Math.abs(fruit.x-s.basket)<=28?300:0);
      }
      move(Math.max(0,time-from));
    }else{
      for(const [lane,hold] of s.holds){
        if(time>=hold.end){mark(s,hold.index,hold.points);s.holds.delete(lane);}
      }
      for(let i=s.index;i<s.track.targets.length;i++){
        const note=s.track.targets[i];if(note.time+.17>=time)break;
        if(!s.judged.has(i)&&s.holds.get(note.lane)?.index!==i)mark(s,i,0);
      }
      if(s.roll&&time>s.roll.rollEnd)s.roll=null;
    }
    s.time=time;
  }
  function modePress(s,lane,time){
    modeTick(s,time);
    for(let i=s.index;i<s.track.targets.length;i++){
      const note=s.track.targets[i],delta=Math.abs(time-note.time);
      if(note.time-time>.17)break;
      if(delta>.17||s.judged.has(i)||s.holds.has(lane))continue;
      if(note.lane!==lane){
        if(s.mode==='taiko'&&!s.roll){mark(s,i,0);return;}
        continue;
      }
      const points=delta<=.065?300:delta<=.115?100:50;
      if(note.end)s.holds.set(lane,{end:note.end,index:i,points});
      else{mark(s,i,points);if(note.rollEnd)s.roll=note;}
      return;
    }
    if(s.mode==='taiko'&&s.roll&&time<=s.roll.rollEnd){s.score+=10;s.verdict='Hvirvel +10';}
  }
  function modeRelease(s,lane,time){
    const hold=s.holds.get(lane);if(!hold)return;
    mark(s,hold.index,time>=hold.end-.1?hold.points:0);s.holds.delete(lane);
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

  function playRecording(track,recording,offset,rate=1){
    const audio=new AudioContext(), origin=audio.currentTime-offset/rate;
    const source=audio.createBufferSource(), gain=audio.createGain();
    source.buffer=recording.buffer;if(source.playbackRate)source.playbackRate.value=rate;source.connect(gain);gain.connect(audio.destination);
    const delay=recording.file?0:lead-recording.start;
    const when=Math.max(audio.currentTime,origin+delay/rate), end=origin+track.end/rate;
    if(end>when){
      gain.gain.setValueAtTime(.82,when);
      gain.gain.setValueAtTime(.82,Math.max(when,end-.10));
      gain.gain.linearRampToValueAtTime(0,end);
      source.start(when,Math.max(0,(when-origin)*rate-delay),(end-when)*rate);
    }
    return {ready:audio.resume(),now:()=>(audio.currentTime-origin)*rate,schedule(){},
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

  function mediaPlayback(media,track,offset,rate=1){
    media.pause();media.currentTime=offset;media.playbackRate=rate;media.muted=false;
    // Some browsers quantize currentTime. Interpolate between observed ticks,
    // bounded to one tick, so animation stays smooth without running through a stall.
    let anchor=null,stamp=0,last=offset;
    function now(){
      if(media.ended)return track.end;
      const raw=media.currentTime, tick=performance.now();
      if(raw!==anchor){anchor=raw;stamp=tick;}
      const ahead=!media.paused && !media.seeking && media.readyState>=3
        ?Math.min(.09,(tick-stamp)/1000)*rate:0;
      last=Math.max(last,Math.min(Math.max(raw,track.end-.001),raw+ahead));
      return last;
    }
    return {ready:media.play(),now,
      schedule(){},close(){media.pause();}};
  }

  globalThis.lectioPlusRhythm = {rulesets,newChart,modeSession,modePress,modeRelease,modeTick,tracks,popTracks,customTrack,fullChart,playingSession,sliderPoint,follow,session,advance,hit,playback,importRecording,playRecording,firstBeat,recordingClip,mediaPlayback,renderScore};
})();
