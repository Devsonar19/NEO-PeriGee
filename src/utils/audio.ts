/**
 * Web Audio API synthesizer for the high-tech mission telemetry ping
 * and hazard proximity alert beeps.
 */

let audioCtx: AudioContext | null = null;
let isAudioEnabled = false;

export function getAudioEnabled(): boolean {
  return isAudioEnabled;
}

export function setAudioEnabled(enabled: boolean): void {
  isAudioEnabled = enabled;
  if (enabled && !audioCtx) {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    } catch {
      // AudioContext unavailable
    }
  }
}

export function playTelemetryPing(frequency = 880, duration = 0.08): void {
  if (!isAudioEnabled) return;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, audioCtx.currentTime + duration);

    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    // Gracefully handle browser autoplay policies
  }
}

export function playHazardAlert(): void {
  if (!isAudioEnabled) return;
  try {
    playTelemetryPing(1200, 0.12);
    setTimeout(() => {
      playTelemetryPing(1400, 0.15);
    }, 120);
  } catch {
    // Ignore audio error
  }
}
