// Shared audio utilities — imported by ThemeToggle and Nav (mobile toggle).
// AudioContext is created lazily on first user gesture (browser requirement).
let audioCtx: AudioContext | null = null;

export function playSwitch(turningOn: boolean) {
  try {
    audioCtx ??= new AudioContext();
    const ctx = audioCtx;
    const t = ctx.currentTime;

    // One noise buffer feeds two layers: a sharp click + a short keycap "thock"
    const len = ctx.sampleRate * 0.04;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    const layer = (type: BiquadFilterType, freq: number, q: number, gain: number, dur: number) => {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain();
      src.connect(f); f.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.start(t); src.stop(t + dur);
    };

    // Sharp click transient (the leaf/jacket)
    layer('highpass', turningOn ? 3800 : 2800, 0.7, 0.5, 0.009);
    // Keycap body thock — bandpass resonance, slightly higher when turning on
    layer('bandpass', turningOn ? 1200 : 950, 5, 0.4, 0.035);
  } catch { /* audio unavailable, fail silently */ }
}
