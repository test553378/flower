// Original procedural score and effects. No recordings, samples, or third-party music.
const MELODY = [72,76,79,76,74,77,81,77,76,79,83,79,77,76,74,71,72,76,79,84,81,79,77,74,76,74,72,71,69,71,72,null];
const EFFECTS = { tap: [79], undo: [74,72], correct: [72,76,79,84], clear: [72,76,79,84,83,86,84], save: [76,79,84], hint: [72,74] };
export class GameAudio {
  constructor(win = window) {
    this.win = win; this.settings = { bgm: true, effects: true, voice: true };
    this.context = null; this.musicTimer = null; this.noteIndex = 0; this.active = false; this.hidden = false;
    this.musicNodes = new Set(); this.effectNodes = new Set(); this.utterance = null; this.speechToken = 0;
  }
  unlock() {
    try {
      const Context = this.win.AudioContext || this.win.webkitAudioContext;
      if (!this.context && Context) this.context = new Context();
      if (this.context?.state === 'suspended' || this.context?.state === 'interrupted') this.context.resume().then(() => this.syncMusic()).catch(() => {});
      this.syncMusic();
    } catch { /* Text and gameplay remain available. */ }
  }
  setActive(active) { this.active = active; if (!active) { this.cancelSpeech(); this.stopNodes(this.effectNodes); } this.syncMusic(); }
  tone(midi, start, duration, volume, music = false) {
    if (!this.context || this.context.state !== 'running') return;
    const oscillator = this.context.createOscillator(), gain = this.context.createGain();
    const nodes = music ? this.musicNodes : this.effectNodes;
    oscillator.type = 'sine'; oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(volume, start + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain); gain.connect(this.context.destination); nodes.add(oscillator);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); nodes.delete(oscillator); };
    oscillator.start(start); oscillator.stop(start + duration + .02);
  }
  syncMusic() {
    const shouldPlay = this.active && !this.hidden && this.settings.bgm && this.context?.state === 'running';
    if (!shouldPlay) { this.stopMusic(); return; }
    if (this.musicTimer !== null) return;
    const tick = () => {
      if (!this.active || this.hidden || !this.settings.bgm || this.context?.state !== 'running') return;
      const now = this.context.currentTime, note = MELODY[this.noteIndex % MELODY.length];
      if (note) this.tone(note, now, .42, this.utterance ? .012 : .035, true);
      if (this.noteIndex % 4 === 0) this.tone([48,53,55,48][Math.floor(this.noteIndex / 8) % 4], now, 1.1, .018, true);
      this.noteIndex++;
    };
    tick(); this.musicTimer = this.win.setInterval(tick, 340);
  }
  stopNodes(nodes) { for (const node of nodes) { try { node.stop(); } catch {} } nodes.clear(); }
  stopMusic() { if (this.musicTimer !== null) this.win.clearInterval(this.musicTimer); this.musicTimer = null; this.stopNodes(this.musicNodes); }
  effect(name) {
    if (!this.settings.effects || this.hidden || !this.context) return;
    const notes = EFFECTS[name] || EFFECTS.tap;
    notes.forEach((note, i) => this.tone(note, this.context.currentTime + i * .105, .22, .075));
  }
  cancelSpeech() {
    this.speechToken++;
    try { this.win.speechSynthesis?.cancel(); } catch {}
    this.utterance = null;
  }
  speak(text) {
    this.cancelSpeech();
    if (!this.settings.voice || this.hidden || !this.win.speechSynthesis || !this.win.SpeechSynthesisUtterance) return;
    try {
      const utterance = new this.win.SpeechSynthesisUtterance(text), token = this.speechToken;
      utterance.lang = 'ja-JP'; utterance.rate = .85; utterance.pitch = 1.1; utterance.volume = 1;
      const voices = this.win.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang === 'ja-JP') || voices.find(v => v.lang.startsWith('ja'));
      if (voice) utterance.voice = voice;
      utterance.onend = utterance.onerror = () => { if (token === this.speechToken) this.utterance = null; };
      this.utterance = utterance; this.win.speechSynthesis.speak(utterance);
    } catch { this.utterance = null; }
  }
  toggle(key) {
    if (!(key in this.settings)) return;
    this.settings[key] = !this.settings[key];
    if (key === 'voice' && !this.settings.voice) this.cancelSpeech();
    if (key === 'effects' && !this.settings.effects) this.stopNodes(this.effectNodes);
    this.syncMusic();
  }
  suspend() {
    this.hidden = true; this.cancelSpeech(); this.stopMusic(); this.stopNodes(this.effectNodes);
    try { this.context?.suspend()?.catch(() => {}); } catch {}
  }
  resume() { this.hidden = false; /* Next user tap resumes iOS AudioContext. */ }
  destroy() { this.suspend(); try { this.context?.close()?.catch(() => {}); } catch {} }
}
