// Shared audio utilities — imported by ThemeToggle and Nav (mobile toggle).
// AudioContext is created lazily on first user gesture (browser requirement).
let audioCtx: AudioContext | null = null;

export function playSwitch(turningOn: boolean) {
  try {
    audioCtx ??= new AudioContext();
    const ctx = audioCtx;
    const t = ctx.currentTime;

    // White noise snap (mechanical click)
    const snapLen = ctx.sampleRate * 0.035;
    const snapBuf = ctx.createBuffer(1, snapLen, ctx.sampleRate);
    const snapData = snapBuf.getChannelData(0);
    for (let i = 0; i < snapLen; i++) snapData[i] = Math.random() * 2 - 1;

    const snap = ctx.createBufferSource();
    snap.buffer = snapBuf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = turningOn ? 3500 : 1800;
    filter.Q.value = 0.8;

    const snapGain = ctx.createGain();
    snap.connect(filter);
    filter.connect(snapGain);
    snapGain.connect(ctx.destination);
    snapGain.gain.setValueAtTime(turningOn ? 0.5 : 0.4, t);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    snap.start(t);
    snap.stop(t + 0.035);

    // Low thump (housing resonance)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.frequency.setValueAtTime(turningOn ? 180 : 110, t);
    osc.frequency.exponentialRampToValueAtTime(turningOn ? 60 : 40, t + 0.09);
    oscGain.gain.setValueAtTime(turningOn ? 0.25 : 0.3, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.start(t);
    osc.stop(t + 0.09);
  } catch { /* audio unavailable, fail silently */ }
}
