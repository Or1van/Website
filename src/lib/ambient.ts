// Procedural ambience built with the Web Audio API: wind, a low drone and a distant bell.
// Nothing is downloaded, and the AudioContext is only created after the visitor
// presses the sound button (browsers require a user gesture anyway).

type Listener = (on: boolean) => void;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let echo: GainNode | null = null;
let on = false;
let bellTimer: ReturnType<typeof setTimeout> | undefined;
let suspendTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<Listener>();

function brownNoise(context: AudioContext, seconds: number) {
  const length = context.sampleRate * seconds;
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return buffer;
}

function lfo(context: AudioContext, rate: number, depth: number, target: AudioParam) {
  const osc = context.createOscillator();
  osc.frequency.value = rate;
  const gain = context.createGain();
  gain.gain.value = depth;
  osc.connect(gain).connect(target);
  osc.start();
}

function build() {
  const c = new AudioContext();
  ctx = c;
  master = c.createGain();
  master.gain.value = 0;
  master.connect(c.destination);

  // Wind: brown noise through a wandering band-pass filter.
  const wind = c.createBufferSource();
  wind.buffer = brownNoise(c, 6);
  wind.loop = true;
  const band = c.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 420;
  band.Q.value = 0.7;
  const windGain = c.createGain();
  windGain.gain.value = 0.55;
  lfo(c, 0.06, 260, band.frequency);
  lfo(c, 0.11, 0.3, windGain.gain);
  wind.connect(band).connect(windGain).connect(master);
  wind.start();

  // Drone: detuned low tones under a dark low-pass.
  const droneFilter = c.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.value = 320;
  const droneGain = c.createGain();
  droneGain.gain.value = 0.16;
  lfo(c, 0.045, 0.06, droneGain.gain);
  droneFilter.connect(droneGain).connect(master);
  for (const [freq, type] of [
    [55, "sine"],
    [55.4, "triangle"],
    [82.4, "sine"],
    [110.7, "sine"],
  ] as const) {
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = c.createGain();
    g.gain.value = 0.25;
    osc.connect(g).connect(droneFilter);
    osc.start();
  }

  // Echo bus for the bell.
  const delay = c.createDelay(2);
  delay.delayTime.value = 0.42;
  const feedback = c.createGain();
  feedback.gain.value = 0.38;
  echo = c.createGain();
  echo.gain.value = 0.6;
  echo.connect(delay);
  delay.connect(feedback).connect(delay);
  delay.connect(master);
  echo.connect(master);
}

function bell() {
  if (!ctx || !echo) return;
  const t = ctx.currentTime + 0.05;
  const base = [146.8, 164.8, 196][Math.floor(Math.random() * 3)];
  for (const [ratio, level] of [
    [1, 0.09],
    [2.76, 0.04],
    [5.4, 0.018],
  ]) {
    const osc = ctx.createOscillator();
    osc.frequency.value = base * ratio;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 7 / ratio);
    osc.connect(g).connect(echo);
    osc.start(t);
    osc.stop(t + 7.5);
  }
}

function scheduleBell() {
  bellTimer = setTimeout(
    () => {
      bell();
      scheduleBell();
    },
    14000 + Math.random() * 16000,
  );
}

export function setAmbient(next: boolean) {
  if (next === on) return;
  on = next;
  clearTimeout(suspendTimer);
  if (on) {
    if (!ctx) build();
    void ctx!.resume();
    master!.gain.setTargetAtTime(0.55, ctx!.currentTime, 1.4);
    setTimeout(bell, 2200);
    scheduleBell();
  } else if (ctx && master) {
    clearTimeout(bellTimer);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.35);
    suspendTimer = setTimeout(() => void ctx?.suspend(), 2000);
  }
  listeners.forEach((fn) => fn(on));
}

export function isAmbientOn() {
  return on;
}

export function subscribeAmbient(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
