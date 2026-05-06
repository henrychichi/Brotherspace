// Simple audio cues using Web Audio API
const playTone = (frequency: number, type: OscillatorType, duration: number, volume = 0.1) => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export const playPostSound = () => {
  playTone(440, 'sine', 0.2, 0.1); // A4
  setTimeout(() => playTone(554.37, 'sine', 0.3, 0.1), 100); // C#5
};

export const playMessageSound = () => {
  playTone(880, 'sine', 0.1, 0.05); // A5
  setTimeout(() => playTone(880, 'sine', 0.1, 0.05), 150); // A5
};

export const playGoalSound = () => {
  playTone(523.25, 'sine', 0.1, 0.1); // C5
  setTimeout(() => playTone(659.25, 'sine', 0.1, 0.1), 100); // E5
  setTimeout(() => playTone(783.99, 'sine', 0.3, 0.1), 200); // G5
};

export const playErrorSound = () => {
  playTone(150, 'sawtooth', 0.3, 0.1);
};
