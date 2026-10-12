/**
 * Web Audio API Acoustic Chord Synthesizer & Progression Loop Engine
 */

class AudioSynthEngine {
  private ctx: AudioContext | null = null;
  private isLoopPlaying: boolean = false;
  private loopTimer: any = null;
  private currentLoopStep: number = 0;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Base note frequencies in octave 3/4
  private readonly NOTE_FREQS: Record<string, number> = {
    C3: 130.81, 'C#3': 138.59, Db3: 138.59, D3: 146.83, 'D#3': 155.56, Eb3: 155.56, E3: 164.81,
    F3: 174.61, 'F#3': 185.0, Gb3: 185.0, G3: 196.0, 'G#3': 207.65, Ab3: 207.65, A3: 220.0,
    'A#3': 233.08, Bb3: 233.08, B3: 246.94,
    C4: 261.63, 'C#4': 277.18, Db4: 277.18, D4: 293.66, 'D#4': 311.13, Eb4: 311.13, E4: 329.63,
    F4: 349.23, 'F#4': 369.99, Gb4: 369.99, G4: 392.0, 'G#4': 415.3, Ab4: 415.3, A4: 440.0,
    'A#4': 466.16, Bb4: 466.16, B4: 493.88,
    C5: 523.25, 'C#5': 554.37, Db5: 554.37, D5: 587.33, 'D#5': 622.25, Eb5: 622.25, E5: 659.25,
    F5: 698.46, 'F#5': 739.99, Gb5: 739.99, G5: 783.99, 'G#5': 830.61, Ab5: 830.61, A5: 880.0,
  };

  /**
   * Generates note frequencies for a given chord name (e.g. C, Am, G7, F#m, Dsus4)
   */
  getChordFrequencies(chordName: string): number[] {
    const clean = chordName.trim().replace(/^\[|\]$/g, '');
    const match = clean.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return [261.63, 329.63, 392.0]; // fallback to C major

    const root = match[1];
    const quality = match[2];

    const SEMITONES: Record<string, number> = {
      C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
      G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
    };

    const rootVal = SEMITONES[root] ?? 0;
    // Standard root frequency at octave 3 (base 130.81 Hz for C3)
    const baseFreq = 130.81 * Math.pow(2, rootVal / 12);

    let intervals = [0, 4, 7]; // Major triad

    if (quality === 'm' || quality === 'min') {
      intervals = [0, 3, 7]; // minor
    } else if (quality === '7' || quality === 'dom7') {
      intervals = [0, 4, 7, 10]; // dominant 7th
    } else if (quality === 'maj7' || quality === 'M7') {
      intervals = [0, 4, 7, 11]; // major 7th
    } else if (quality === 'm7' || quality === 'min7') {
      intervals = [0, 3, 7, 10]; // minor 7th
    } else if (quality === 'sus4') {
      intervals = [0, 5, 7]; // suspended 4th
    } else if (quality === 'sus2') {
      intervals = [0, 2, 7]; // suspended 2nd
    } else if (quality === 'add9') {
      intervals = [0, 4, 7, 14]; // add 9
    } else if (quality === 'dim' || quality === '°') {
      intervals = [0, 3, 6]; // diminished
    } else if (quality === 'aug' || quality === '+') {
      intervals = [0, 4, 8]; // augmented
    }

    // Return frequencies spanning across a warm acoustic spread (root in bass, triad higher)
    const freqs: number[] = [];
    // Bass note
    freqs.push(baseFreq);
    // Upper harmony
    intervals.forEach((semi) => {
      freqs.push(baseFreq * Math.pow(2, (semi + 12) / 12));
    });
    // Add octave shimmer
    freqs.push(baseFreq * Math.pow(2, (intervals[1] + 24) / 12));

    return freqs;
  }

  /**
   * Realistic acoustic guitar/piano strum simulator
   */
  playChord(chordName: string, duration = 1.8, instrument: 'guitar' | 'piano' = 'guitar') {
    const ctx = this.getContext();
    const freqs = this.getChordFrequencies(chordName);
    const now = ctx.currentTime;

    freqs.forEach((freq, idx) => {
      // Guitar strum offset between strings (20-30ms)
      const strumOffset = instrument === 'guitar' ? idx * 0.025 : idx * 0.005;
      const startTime = now + strumOffset;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Subtle warm filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(instrument === 'guitar' ? 2400 : 3800, startTime);
      filter.frequency.exponentialRampToValueAtTime(300, startTime + duration);

      // Acoustic harmonics combination (triangle + sine)
      osc.type = instrument === 'guitar' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Envelope: fast pluck attack, gentle exponential decay
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.22 / Math.sqrt(freqs.length), startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
    });
  }

  /**
   * Metronome click sound
   */
  playClick(accent = false) {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(accent ? 1200 : 800, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Progression Loop Player
   */
  startProgressionLoop({
    chords,
    bpm = 100,
    timeSignature = '4/4',
    onStep,
  }: {
    chords: string[];
    bpm: number;
    timeSignature?: string;
    onStep?: (chordIndex: number, beat: number) => void;
  }) {
    this.stopProgressionLoop();
    if (!chords || chords.length === 0) return;

    this.isLoopPlaying = true;
    this.currentLoopStep = 0;

    const beatsPerBar = timeSignature.startsWith('3') ? 3 : timeSignature.startsWith('6') ? 6 : 4;
    const beatIntervalMs = (60 / bpm) * 1000;
    let currentBeat = 0;

    const tick = () => {
      if (!this.isLoopPlaying) return;

      if (currentBeat === 0) {
        // Play chord on downbeat of bar
        const chord = chords[this.currentLoopStep];
        this.playChord(chord, (beatsPerBar * beatIntervalMs) / 1000);
      }

      // Play metronome click
      this.playClick(currentBeat === 0);
      if (onStep) {
        onStep(this.currentLoopStep, currentBeat);
      }

      currentBeat++;
      if (currentBeat >= beatsPerBar) {
        currentBeat = 0;
        this.currentLoopStep = (this.currentLoopStep + 1) % chords.length;
      }

      this.loopTimer = setTimeout(tick, beatIntervalMs);
    };

    tick();
  }

  stopProgressionLoop() {
    this.isLoopPlaying = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }

  isLooping(): boolean {
    return this.isLoopPlaying;
  }
}

export const audioSynth = new AudioSynthEngine();

// Chromatic scale for transpositions
export const CHROMATIC_NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const CHROMATIC_NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Transpose a single chord name by delta semitones (e.g. +1, -2)
 */
export function transposeChord(chord: string, semitones: number, preferFlats = false): string {
  if (!chord || semitones === 0) return chord;
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const root = match[1];
  const rest = match[2];

  let idx = CHROMATIC_NOTES_SHARP.indexOf(root);
  if (idx === -1) {
    idx = CHROMATIC_NOTES_FLAT.indexOf(root);
  }
  if (idx === -1) return chord;

  let newIdx = (idx + semitones) % 12;
  if (newIdx < 0) newIdx += 12;

  const scale = preferFlats ? CHROMATIC_NOTES_FLAT : CHROMATIC_NOTES_SHARP;
  return `${scale[newIdx]}${rest}`;
}

/**
 * Transposes all chords inside a lyrics text (e.g. "[C]Hello [G]world" -> "[D]Hello [A]world")
 */
export function transposeLyrics(text: string, semitones: number): string {
  if (semitones === 0) return text;
  return text.replace(/\[([A-G][#b]?[^\]]*)\]/g, (match, chordInside) => {
    return `[${transposeChord(chordInside, semitones)}]`;
  });
}

/**
 * Popular chord progression templates for songwriters
 */
export const POPULAR_PROGRESSIONS = [
  { name: 'Pop Anthem (I - V - vi - IV)', chords: ['C', 'G', 'Am', 'F'], mood: 'Catchy, Uplifting' },
  { name: 'Emotional Ballad (vi - IV - I - V)', chords: ['Am', 'F', 'C', 'G'], mood: 'Melancholy, Reflective' },
  { name: 'Doo-Wop Classic (I - vi - IV - V)', chords: ['C', 'Am', 'F', 'G'], mood: 'Nostalgic, Soulful' },
  { name: 'Acoustic Folk (I - IV - vi - V)', chords: ['G', 'C', 'Em', 'D'], mood: 'Earthy, Storytelling' },
  { name: 'Indie / RnB (ii - V - I - vi)', chords: ['Dm', 'G', 'C', 'Am'], mood: 'Smooth, Jazzy' },
  { name: 'Rock Drive (I - bVII - IV - I)', chords: ['E', 'D', 'A', 'E'], mood: 'Driving, Energetic' },
  { name: 'Atmospheric Cinematic (i - VI - III - VII)', chords: ['Em', 'C', 'G', 'D'], mood: 'Dramatic, Epic' },
];

/**
 * Guitar chord diagram finger positions: [E, A, D, G, B, e]
 * -1 = mute, 0 = open string, >0 = fret number
 */
export const GUITAR_CHORD_CHART: Record<string, { frets: number[]; fingers?: string }> = {
  C: { frets: [-1, 3, 2, 0, 1, 0] },
  G: { frets: [3, 2, 0, 0, 3, 3] },
  Am: { frets: [-1, 0, 2, 2, 1, 0] },
  F: { frets: [1, 3, 3, 2, 1, 1] },
  D: { frets: [-1, -1, 0, 2, 3, 2] },
  Dm: { frets: [-1, -1, 0, 2, 3, 1] },
  Em: { frets: [0, 2, 2, 0, 0, 0] },
  E: { frets: [0, 2, 2, 1, 0, 0] },
  A: { frets: [-1, 0, 2, 2, 2, 0] },
  B7: { frets: [-1, 2, 1, 2, 0, 2] },
  Bm: { frets: [-1, 2, 4, 4, 3, 2] },
  Cadd9: { frets: [-1, 3, 2, 0, 3, 3] },
  Dsus4: { frets: [-1, -1, 0, 2, 3, 3] },
  Asus4: { frets: [-1, 0, 2, 2, 3, 0] },
};
