// ─────────────────────────────────────────────────────────────────────────────
// Sound effects — a short win/lose blip on each answer.
//
// Sounds are synthesised with the Web Audio API (no audio files), so they add
// nothing to the bundle and work offline. The on/off preference is persisted in
// localStorage and defaults to on. The AudioContext is created lazily on first
// use — by then a tap/keypress has happened, satisfying the browser autoplay
// gesture requirement.
// ─────────────────────────────────────────────────────────────────────────────

const SOUND_KEY = 'mathle:sound';

let enabled = readEnabled();
let ctx: AudioContext | null = null;

function readEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

/** Whether sound is currently on. */
export function isSoundEnabled(): boolean {
  return enabled;
}

/** Persist and apply the sound preference. */
export function setSoundEnabled(on: boolean): void {
  enabled = on;
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
  } catch {
    // Storage unavailable (private mode): keep the in-memory value only.
  }
}

/** Flip the sound preference and return the new state. */
export function toggleSound(): boolean {
  setSoundEnabled(!enabled);
  return enabled;
}

function audio(): AudioContext | null {
  if (!enabled) return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** One short tone at `freq` Hz, `start` seconds from now, lasting `dur`. */
function blip(
  c: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = 'sine',
  gain = 0.16,
): void {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur);
}

/** A bright two-note rise for a correct answer. */
export function playCorrect(): void {
  const c = audio();
  if (!c) return;
  blip(c, 660, 0, 0.12, 'triangle');
  blip(c, 990, 0.09, 0.17, 'triangle');
}

/** A low two-note buzz for a wrong answer. */
export function playWrong(): void {
  const c = audio();
  if (!c) return;
  blip(c, 200, 0, 0.2, 'square', 0.12);
  blip(c, 150, 0.09, 0.26, 'square', 0.12);
}
