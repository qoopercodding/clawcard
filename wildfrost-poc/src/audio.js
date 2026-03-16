// audio.js — Web Audio API syntezator, zero zewnętrznych plików
const Audio = (() => {
  let ctx = null;
  function gc() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, type, dur, vol, delay = 0) {
    const c = gc(), o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime + delay);
    g.gain.setValueAtTime(0, c.currentTime + delay);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + delay + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
    o.start(c.currentTime + delay);
    o.stop(c.currentTime + delay + dur + 0.05);
  }
  function noise(dur, vol, delay = 0) {
    const c = gc(), n = c.sampleRate * dur, buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), g = c.createGain();
    src.buffer = buf; src.connect(g); g.connect(c.destination);
    g.gain.setValueAtTime(vol, c.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
    src.start(c.currentTime + delay);
  }
  return {
    playCard() { tone(300,'sine',0.1,0.25); tone(500,'sine',0.07,0.12,0.05); },
    hit()      { noise(0.05,0.35); tone(110,'square',0.12,0.2,0.02); },
    death()    { tone(220,'sawtooth',0.18,0.28); tone(170,'sawtooth',0.25,0.18,0.08); tone(130,'sawtooth',0.3,0.12,0.18); },
    bell()     { tone(880,'sine',0.28,0.35); tone(1100,'sine',0.22,0.28,0.08); tone(1320,'sine',0.35,0.22,0.17); },
    freeBell() { [880,1100,1320,1760].forEach((f,i) => tone(f,'sine',0.4,0.32,i*0.07)); },
    win()      { [523,659,784,1046].forEach((f,i) => tone(f,'sine',0.32,0.38,i*0.12)); },
    place()    { tone(440,'triangle',0.13,0.28); tone(550,'triangle',0.18,0.22,0.07); },
    snow()     { tone(1200,'sine',0.07,0.18); tone(900,'sine',0.1,0.13,0.05); },
    heal()     { tone(660,'sine',0.13,0.22); tone(880,'sine',0.18,0.18,0.08); },
  };
})();
