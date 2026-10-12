import React, { useState } from 'react';
import {
  Music,
  Play,
  Square,
  Repeat,
  Plus,
  Trash2,
  ArrowRightLeft,
  Volume2,
  Sparkles,
  Layers,
  Loader2,
  Check,
  Compass,
} from 'lucide-react';
import { SongDraft, SmartChordSuggestion } from '../types';
import {
  audioSynth,
  POPULAR_PROGRESSIONS,
  transposeChord,
  transposeLyrics,
  GUITAR_CHORD_CHART,
} from '../services/audioSynth';
import { generateSmartChords } from '../services/aiService';

interface ChordStudioProps {
  song: SongDraft;
  isLoopPlaying: boolean;
  activeChordIndex: number;
  activeBeat: number;
  onToggleLoop: () => void;
  onUpdateSong: (updated: Partial<SongDraft>) => void;
}

const COMMON_CHORDS_PALETTE = [
  'C', 'G', 'Am', 'F', 'Dm', 'Em', 'D', 'A', 'E',
  'Cmaj7', 'G7', 'Am7', 'Fmaj7', 'Dsus4', 'Asus4', 'Cadd9', 'Bm', 'Bb',
];

const MOOD_OPTIONS = [
  'Bittersweet & Nostalgic',
  'Emotional & Uplifting',
  'Melancholic & Intimate',
  'Driving & Anthemic',
  'Soulful & Jazzy',
  'Dark & Brooding',
];

export const ChordStudio: React.FC<ChordStudioProps> = ({
  song,
  isLoopPlaying,
  activeChordIndex,
  activeBeat,
  onToggleLoop,
  onUpdateSong,
}) => {
  const [selectedChordForDiagram, setSelectedChordForDiagram] = useState<string>(
    song.progression[0] || 'C'
  );
  const [progressionTab, setProgressionTab] = useState<'ai' | 'presets'>('ai');
  const [selectedMood, setSelectedMood] = useState<string>(MOOD_OPTIONS[0]);
  const [aiProgressions, setAiProgressions] = useState<SmartChordSuggestion[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [auditioningId, setAuditioningId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const handleFetchAiChords = async (moodToUse?: string) => {
    setIsLoadingAi(true);
    setAiError(null);
    try {
      const results = await generateSmartChords({
        key: song.key || 'C',
        mood: moodToUse || selectedMood,
        genre: song.genre || 'Singer-Songwriter',
        timeSignature: song.timeSignature || '4/4',
        tempo: song.tempo || 120,
        currentProgression: song.progression,
        lyricsSnippet: song.content,
      });
      setAiProgressions(results);
    } catch (err: any) {
      console.error('Smart chords error:', err);
      setAiError(err.message || 'Failed to generate chord suggestions.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleAudition = async (chords: string[], id: string) => {
    setAuditioningId(id);
    for (let i = 0; i < chords.length; i++) {
      audioSynth.playChord(chords[i]);
      await new Promise((r) => setTimeout(r, 650));
    }
    setAuditioningId(null);
  };


  const handleAddChord = (chord: string) => {
    const updated = [...song.progression, chord];
    onUpdateSong({ progression: updated });
    audioSynth.playChord(chord);
  };

  const handleRemoveChord = (index: number) => {
    const updated = song.progression.filter((_, i) => i !== index);
    onUpdateSong({ progression: updated });
  };

  const handleApplyPreset = (chords: string[]) => {
    onUpdateSong({ progression: chords });
    if (chords[0]) {
      setSelectedChordForDiagram(chords[0]);
      audioSynth.playChord(chords[0]);
    }
  };

  const handleTranspose = (semitones: number, transposeLyricsAlso: boolean) => {
    const updatedProgression = song.progression.map((ch) => transposeChord(ch, semitones));
    const newKey = transposeChord(song.key || 'C', semitones);

    const changes: Partial<SongDraft> = {
      key: newKey,
      progression: updatedProgression,
    };

    if (transposeLyricsAlso) {
      changes.content = transposeLyrics(song.content, semitones);
    }

    onUpdateSong(changes);
  };

  const diagram = GUITAR_CHORD_CHART[selectedChordForDiagram] || GUITAR_CHORD_CHART['C'];

  return (
    <div className="bg-slate-900 border-t border-slate-800 p-4 lg:p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Progression Bar & Loop Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                Chord Progression Loop
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Arrange your song's harmonic flow. Click any chord to hear it.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleLoop}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                isLoopPlaying
                  ? 'bg-sky-500 text-slate-950 shadow-sky-500/20 active:scale-95'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {isLoopPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Progression</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Loop Progression</span>
                </>
              )}
            </button>

            {/* Tempo adjustment */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400 font-mono">BPM:</span>
              <input
                type="number"
                min="40"
                max="240"
                value={song.tempo}
                onChange={(e) => onUpdateSong({ tempo: parseInt(e.target.value) || 120 })}
                className="w-14 bg-transparent text-sky-400 font-mono font-bold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Current Progression Chain */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Sequence ({song.progression.length} Chords)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Transpose:</span>
              <button
                onClick={() => handleTranspose(-1, true)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono"
                title="Transpose Down 1 Semitone (-1)"
              >
                -1
              </button>
              <button
                onClick={() => handleTranspose(1, true)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono"
                title="Transpose Up 1 Semitone (+1)"
              >
                +1
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {song.progression.map((chord, idx) => {
              const isActive = isLoopPlaying && activeChordIndex === idx;
              return (
                <div
                  key={idx}
                  className={`group relative flex items-center gap-1.5 px-3 py-2.5 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 scale-105 shadow-md shadow-sky-500/20'
                      : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelectedChordForDiagram(chord);
                      audioSynth.playChord(chord);
                    }}
                    className="flex items-center gap-1.5 cursor-pointer"
                    title={`Hear ${chord} strum`}
                  >
                    <span className="font-mono text-base">{chord}</span>
                    <Volume2 className={`w-3.5 h-3.5 ${isActive ? 'opacity-90' : 'opacity-40'}`} />
                  </button>

                  <button
                    onClick={() => handleRemoveChord(idx)}
                    className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity ${
                      isActive ? 'hover:bg-sky-600' : 'hover:bg-slate-800 text-slate-400'
                    }`}
                    title="Remove chord"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {/* Quick Add Palette Dropdown or Plus */}
            <div className="flex items-center gap-1">
              {['C', 'G', 'Am', 'F', 'Dm', 'Em'].map((quick) => (
                <button
                  key={quick}
                  onClick={() => handleAddChord(quick)}
                  className="px-2.5 py-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-sky-300 border border-slate-800/80 text-xs font-mono transition-colors"
                  title={`Add ${quick} to sequence`}
                >
                  +{quick}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Popular Presets & AI Smart Progressions Split with Guitar Diagram */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: AI Smart Progressions vs Genre Presets */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProgressionTab('ai')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    progressionTab === 'ai'
                      ? 'bg-sky-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-950'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Smart Progressions</span>
                </button>

                <button
                  onClick={() => setProgressionTab('presets')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    progressionTab === 'presets'
                      ? 'bg-sky-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-950'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Popular Genre Presets</span>
                </button>
              </div>

              {progressionTab === 'ai' && (
                <button
                  onClick={() => handleFetchAiChords()}
                  disabled={isLoadingAi}
                  className="px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isLoadingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Generate Chords</span>
                </button>
              )}
            </div>

            {progressionTab === 'ai' ? (
              <div className="space-y-3">
                {/* Mood Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">
                    Mood/Feel:
                  </span>
                  {MOOD_OPTIONS.map((mood) => (
                    <button
                      key={mood}
                      onClick={() => {
                        setSelectedMood(mood);
                        handleFetchAiChords(mood);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                        selectedMood === mood
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:text-slate-200'
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>

                {isLoadingAi && (
                  <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-400">
                    <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
                    <p className="text-xs font-serif">Composing harmonic progressions in {song.key || 'C'} ({selectedMood})...</p>
                  </div>
                )}

                {aiError && !isLoadingAi && (
                  <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-200">
                    {aiError}
                  </div>
                )}

                {!isLoadingAi && aiProgressions.length === 0 && !aiError && (
                  <div className="p-6 bg-slate-950/40 border border-slate-800 rounded-xl text-center space-y-2">
                    <p className="text-xs text-slate-400 font-serif">
                      Let Gemini suggest intelligent chord voicings tailored to {song.title || 'your song'} in Key of {song.key || 'C'}.
                    </p>
                    <button
                      onClick={() => handleFetchAiChords()}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs rounded-lg font-medium inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Suggest 3 Matching Progressions</span>
                    </button>
                  </div>
                )}

                {!isLoadingAi && aiProgressions.length > 0 && (
                  <div className="space-y-2.5">
                    {aiProgressions.map((prog) => (
                      <div
                        key={prog.id}
                        className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 hover:border-sky-500/30 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-100 font-serif mr-2">
                              {prog.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                              {prog.mood} • {prog.genreFit}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleAudition(prog.chords, prog.id)}
                              disabled={auditioningId === prog.id}
                              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                              title="Audition sequence with audio synth"
                            >
                              <Play className="w-3 h-3 text-sky-400 fill-current" />
                              <span>{auditioningId === prog.id ? 'Playing...' : 'Audition'}</span>
                            </button>

                            <button
                              onClick={() => {
                                handleApplyPreset(prog.chords);
                                setAppliedId(prog.id);
                                setTimeout(() => setAppliedId(null), 1500);
                              }}
                              className="px-2.5 py-1 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 text-[11px] font-bold flex items-center gap-1 transition-colors"
                              title="Set as active song progression"
                            >
                              {appliedId === prog.id ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Applied!</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3" />
                                  <span>Apply</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Chord Pills + Roman Numerals */}
                        <div className="flex items-center gap-2 pt-0.5">
                          {prog.chords.map((chord, cIdx) => (
                            <div
                              key={cIdx}
                              onClick={() => {
                                setSelectedChordForDiagram(chord);
                                audioSynth.playChord(chord);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-center cursor-pointer hover:border-sky-400 transition-colors"
                            >
                              <span className="text-xs font-mono font-bold text-sky-300 block">
                                {chord}
                              </span>
                              {prog.romanNumerals && prog.romanNumerals[cIdx] && (
                                <span className="text-[9px] font-mono text-slate-500 block">
                                  {prog.romanNumerals[cIdx]}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Explanation & Transition Tips */}
                        <div className="text-[11px] text-slate-400 space-y-0.5 bg-slate-900/40 p-2 rounded border border-slate-800/40">
                          <p className="text-slate-300">💡 {prog.whyItWorks}</p>
                          {prog.transitionTips && (
                            <p className="text-slate-400 italic">↪ {prog.transitionTips}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {POPULAR_PROGRESSIONS.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleApplyPreset(preset.chords)}
                    className="p-3 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 hover:border-slate-700 rounded-lg cursor-pointer transition-all space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-200 group-hover:text-sky-300 transition-colors">
                        {preset.name}
                      </span>
                      <span className="text-[10px] text-slate-400">{preset.mood}</span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      {preset.chords.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-sky-300"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guitar Fretboard / Chord Inspector */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Guitar Chart: <strong className="text-sky-400 font-mono text-sm">{selectedChordForDiagram}</strong>
              </h4>
              <button
                onClick={() => audioSynth.playChord(selectedChordForDiagram)}
                className="p-1.5 bg-slate-800 hover:bg-sky-500 hover:text-slate-950 rounded text-slate-300 transition-colors"
                title="Strum Chord"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Simple Graphic Fretboard representation */}
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex flex-col items-center justify-center space-y-2">
              {/* String labels E A D G B e */}
              <div className="flex gap-4 text-[10px] font-mono text-slate-400">
                {['E', 'A', 'D', 'G', 'B', 'e'].map((s, i) => (
                  <span key={i} className="w-4 text-center">
                    {s}
                  </span>
                ))}
              </div>

              {/* Fret values */}
              <div className="flex gap-4 text-xs font-mono font-bold text-sky-400">
                {diagram.frets.map((fret, i) => (
                  <span
                    key={i}
                    className={`w-4 h-6 flex items-center justify-center rounded ${
                      fret === -1
                        ? 'text-slate-600'
                        : fret === 0
                        ? 'text-emerald-400'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    }`}
                  >
                    {fret === -1 ? 'X' : fret === 0 ? 'O' : fret}
                  </span>
                ))}
              </div>

              <p className="text-[10px] text-slate-400 text-center pt-2">
                X = Mute • O = Open • Numbers = Fret position
              </p>
            </div>

            {/* Quick palette of chords to view diagram */}
            <div className="flex flex-wrap gap-1 pt-1">
              {COMMON_CHORDS_PALETTE.slice(0, 10).map((ch) => (
                <button
                  key={ch}
                  onClick={() => {
                    setSelectedChordForDiagram(ch);
                    audioSynth.playChord(ch);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    selectedChordForDiagram === ch
                      ? 'bg-sky-400 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
