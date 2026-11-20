type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

type Note = {
  frequency: number;
  start: number;
  duration: number;
  volume: number;
  type?: OscillatorType;
  endFrequency?: number;
};

let audioContext: AudioContext | null = null;
let muted = false;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioContext) return audioContext;
  const AudioCtor =
    window.AudioContext ??
    (window as WindowWithWebkitAudio).webkitAudioContext;
  if (!AudioCtor) return null;
  try {
    audioContext = new AudioCtor();
    return audioContext;
  } catch {
    return null;
  }
}

function playNotes(notes: Note[]): void {
  if (muted) return;
  try {
    const ctx = getContext();
    if (!ctx) return;
    void ctx.resume();
    const now = ctx.currentTime;
    for (const note of notes) {
      const start = now + note.start;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = note.type ?? 'sine';
      oscillator.frequency.setValueAtTime(note.frequency, start);
      if (note.endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(
          note.endFrequency,
          start + note.duration,
        );
      }
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(note.volume, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + note.duration + 0.03);
    }
  } catch {
    return;
  }
}

export const audio = {
  setMuted(next: boolean): void {
    muted = next;
  },
  isMuted(): boolean {
    return muted;
  },
  click(): void {
    playNotes([
      {
        frequency: 520,
        endFrequency: 660,
        start: 0,
        duration: 0.07,
        volume: 0.02,
        type: 'triangle',
      },
    ]);
  },
  taskComplete(): void {
    playNotes([
      { frequency: 659.25, start: 0, duration: 0.16, volume: 0.045 },
      { frequency: 880, start: 0.07, duration: 0.18, volume: 0.04 },
      { frequency: 1046.5, start: 0.15, duration: 0.22, volume: 0.03 },
    ]);
  },
  coin(): void {
    playNotes([
      { frequency: 987.77, start: 0, duration: 0.09, volume: 0.035 },
      { frequency: 1318.51, start: 0.06, duration: 0.14, volume: 0.028 },
    ]);
  },
  pop(): void {
    playNotes([
      {
        frequency: 330,
        endFrequency: 620,
        start: 0,
        duration: 0.09,
        volume: 0.05,
        type: 'triangle',
      },
      { frequency: 880, start: 0.05, duration: 0.06, volume: 0.018 },
    ]);
  },
  remove(): void {
    playNotes([
      {
        frequency: 420,
        endFrequency: 230,
        start: 0,
        duration: 0.14,
        volume: 0.035,
        type: 'triangle',
      },
    ]);
  },
  error(): void {
    playNotes([
      {
        frequency: 220,
        endFrequency: 165,
        start: 0,
        duration: 0.16,
        volume: 0.035,
        type: 'sawtooth',
      },
    ]);
  },
};
