// All audio is synthesized locally; no music downloads or external services.
window.starforgeAudio = (() => {
  const key = 'starforge-audio-v1';
  let settings = { music: true, effects: true, volume: 35 };
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved) settings = {
      music: typeof saved.music === 'boolean' ? saved.music : true,
      effects: typeof saved.effects === 'boolean' ? saved.effects : true,
      volume: Number.isFinite(saved.volume) ? Math.max(0, Math.min(100, saved.volume)) : 35
    };
  } catch {}
  let context, master, musicBus, effectsBus, timer, nextPhrase, phrase = 0;
  const chords = [[130.81,164.81,196,246.94],[110,130.81,164.81,196],[87.31,110,130.81,164.81],[98,123.47,146.83,196]];
  function persist() { try { localStorage.setItem(key, JSON.stringify(settings)); } catch {} }
  function update() {
    document.getElementById('musicToggle').textContent = `Music: ${settings.music ? 'on' : 'off'}`;
    document.getElementById('soundToggle').textContent = `Sounds: ${settings.effects ? 'on' : 'off'}`;
    document.getElementById('musicToggle').setAttribute('aria-pressed', String(settings.music));
    document.getElementById('soundToggle').setAttribute('aria-pressed', String(settings.effects));
    if (context) {
      master.gain.setTargetAtTime(settings.volume / 100, context.currentTime, .08);
      musicBus.gain.setTargetAtTime(settings.music ? .3 : 0, context.currentTime, .15);
      effectsBus.gain.setTargetAtTime(settings.effects ? .7 : 0, context.currentTime, .03);
    }
  }
  function tone(frequency, start, duration, volume, bus, type = 'sine', attack = .02) {
    const oscillator = context.createOscillator(), envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(volume, start + attack);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(envelope); envelope.connect(bus);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
    oscillator.start(start); oscillator.stop(start + duration + .05);
  }
  function schedule() {
    if (!context || context.state !== 'running' || document.hidden) return;
    if (nextPhrase < context.currentTime) nextPhrase = context.currentTime + .1;
    if (nextPhrase > context.currentTime + .5) return;
    const chord = chords[phrase++ % chords.length];
    chord.forEach(f => tone(f, nextPhrase, 7, .075, musicBus, 'sine', 1.3));
    [0,2,1,3].forEach((n,i) => tone(chord[n]*2, nextPhrase+i*1.5, 2.4, .055, musicBus, 'sine', .1));
    nextPhrase += 6;
  }
  function start() {
    try {
      if (!context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        context = new Audio();
        master=context.createGain(); musicBus=context.createGain(); effectsBus=context.createGain();
        musicBus.connect(master); effectsBus.connect(master); master.connect(context.destination);
        nextPhrase=context.currentTime+.1;
        update();
        timer=setInterval(schedule,250);
      }
      if (context.state === 'suspended') context.resume().then(schedule).catch(()=>{});
      else schedule();
    } catch { /* Gameplay remains available if this browser cannot play audio. */ }
  }
  document.addEventListener('pointerdown', start, { once:true });
  document.addEventListener('keydown', start, { once:true });
  document.addEventListener('visibilitychange', () => {
    if (!context) return;
    if (document.hidden) context.suspend().catch(()=>{});
    else start();
  });
  document.getElementById('musicToggle').onclick=()=>{settings.music=!settings.music;start();update();persist();};
  document.getElementById('soundToggle').onclick=()=>{settings.effects=!settings.effects;start();update();persist();};
  document.getElementById('audioVolume').value=settings.volume;
  document.getElementById('audioVolume').oninput=e=>{settings.volume=Number(e.target.value);start();update();persist();};
  update();
  return {
    click() { start(); if(context && settings.effects && !document.hidden) tone(640,context.currentTime,.055,.15,effectsBus,'triangle',.002); },
    upgrade() { start(); if(context && settings.effects && !document.hidden) [523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,context.currentTime+i*.09,.65,.16,effectsBus)); }
  };
})();
