import React, { useState, useRef, useEffect } from 'react';
import {
  Edit3,
  Eye,
  Plus,
  Music,
  Hash,
  Sparkles,
  Search,
  BookOpen,
  Volume2,
  Copy,
  Check,
  History,
  FolderOpen,
  SlidersHorizontal,
  Clock,
  Activity,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Mic,
  BarChart2,
  Tag,
} from 'lucide-react';
import { SongDraft } from '../types';
import { countSyllablesInLine, analyzeRhymeScheme } from '../services/rhymeDictionary';
import { audioSynth, transposeChord, transposeLyrics } from '../services/audioSynth';

interface LyricEditorProps {
  song: SongDraft;
  onUpdateSong: (updated: Partial<SongDraft>) => void;
  onSelectWordForRhyme: (word: string) => void;
  onOpenRevisions?: () => void;
  onQuickSnapshot?: () => void;
  onOpenCoWriter?: () => void;
  onOpenAnalysis?: () => void;
  onOpenVoiceToLyric?: () => void;
  onOpenMetaTags?: () => void;
}

export const LyricEditor: React.FC<LyricEditorProps> = ({
  song,
  onUpdateSong,
  onSelectWordForRhyme,
  onOpenRevisions,
  onQuickSnapshot,
  onOpenCoWriter,
  onOpenAnalysis,
  onOpenVoiceToLyric,
  onOpenMetaTags,
}) => {
  const [viewMode, setViewMode] = useState<'interactive' | 'edit'>('interactive');
  const [copied, setCopied] = useState(false);
  const [showAdvancedMeta, setShowAdvancedMeta] = useState(true);
  const [transposeWithLyrics, setTransposeWithLyrics] = useState(true);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [lastTapFeedback, setLastTapFeedback] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const revisionsCount = song.revisions?.length || 0;

  // Tap Tempo Metronome Calculator
  const handleTapTempo = () => {
    const now = Date.now();
    setTapTimes((prev) => {
      const recent = prev.filter((t) => now - t < 2500);
      const updated = [...recent, now];
      if (updated.length >= 2) {
        const intervals: number[] = [];
        for (let i = 1; i < updated.length; i++) {
          intervals.push(updated[i] - updated[i - 1]);
        }
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        if (avg > 0) {
          const bpm = Math.round(60000 / avg);
          const clamped = Math.min(Math.max(bpm, 40), 240);
          onUpdateSong({ tempo: clamped });
          setLastTapFeedback(`${clamped} BPM`);
          setTimeout(() => setLastTapFeedback(null), 1500);
        }
      } else {
        setLastTapFeedback('Tap again...');
      }
      return updated;
    });
  };

  // Instant Key Transposition handler
  const handleTranspose = (semitones: number) => {
    if (semitones === 0) return;
    const currentKey = song.key || 'C';
    const newKey = transposeChord(currentKey, semitones);
    const updatedProgression = (song.progression || []).map((ch) => transposeChord(ch, semitones));

    const updates: Partial<SongDraft> = {
      key: newKey,
      progression: updatedProgression,
    };

    if (transposeWithLyrics && song.content) {
      updates.content = transposeLyrics(song.content, semitones);
    }

    onUpdateSong(updates);
    audioSynth.playChord(newKey);
  };

  // Sounding key calculation with capo
  const soundingKey =
    song.capo && song.capo > 0 && song.key ? transposeChord(song.key, song.capo) : null;

  const MAJOR_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F', 'Bb', 'Eb', 'Ab'];
  const MINOR_KEYS = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'Dm', 'Gm', 'Cm'];
  const TIME_SIGNATURE_PRESETS = ['4/4', '3/4', '6/8', '2/4', '12/8', '5/4', '7/8'];
  const TEMPO_PRESETS = [
    { label: 'Ballad', bpm: 72 },
    { label: 'Mid', bpm: 96 },
    { label: 'Groove', bpm: 116 },
    { label: 'Upbeat', bpm: 128 },
    { label: 'Fast', bpm: 144 },
  ];

  // Common chords to quickly insert
  const quickChords = song.progression.length > 0
    ? [...new Set([...song.progression, 'C', 'G', 'Am', 'F', 'Em', 'D', 'Dm'])]
    : ['C', 'G', 'Am', 'F', 'Em', 'D', 'Dm', 'E', 'A'];

  const lines = song.content.split('\n');
  const rhymeScheme = analyzeRhymeScheme(lines);

  const totalWords = song.content
    .replace(/\[[^\]]*\]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const insertAtCursor = (textToInsert: string) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = song.content;
    const newText = text.substring(0, start) + textToInsert + text.substring(end);

    onUpdateSong({ content: newText });

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 10);
  };

  const handleCopyLyrics = () => {
    // Copy clean lyrics without chord brackets or with chord brackets based on user preference
    navigator.clipboard.writeText(song.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Parses a single lyric line with chords like "[Am]Walking down [F]the street"
   * into an array of { chord?: string, text: string } segments for interactive rendering.
   */
  const parseLineSegments = (line: string) => {
    const regex = /\[([A-G][#b]?[^\]]*)\]/g;
    const segments: { chord?: string; text: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      const textBefore = line.substring(lastIndex, match.index);
      if (textBefore || segments.length === 0) {
        if (segments.length > 0 && !segments[segments.length - 1].chord) {
          segments[segments.length - 1].text += textBefore;
        } else if (textBefore) {
          segments.push({ text: textBefore });
        }
      }

      segments.push({
        chord: match[1],
        text: '',
      });

      lastIndex = regex.lastIndex;
    }

    const remainingText = line.substring(lastIndex);
    if (segments.length > 0 && segments[segments.length - 1].chord && !segments[segments.length - 1].text) {
      segments[segments.length - 1].text = remainingText;
    } else if (remainingText || segments.length === 0) {
      segments.push({ text: remainingText });
    }

    return segments;
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Editor Subheader & Toolbar */}
      <div className="px-4 lg:px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('interactive')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'interactive'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Interactive Sheet</span>
            </button>
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'edit'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Lyrics</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 font-mono ml-2">
            <span>{lines.length} lines</span>
            <span>•</span>
            <span>{totalWords} words</span>
          </div>
        </div>

        {/* Right side controls & AI Suite triggers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {onOpenCoWriter && (
            <button
              onClick={onOpenCoWriter}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-950 font-bold bg-sky-400 hover:bg-sky-300 rounded-md transition-all shadow-sm"
              title="Open AI Lyric Co-Writer (rhymes, stanza continuations, thematic expansions)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Co-Writer</span>
            </button>
          )}

          {onOpenAnalysis && (
            <button
              onClick={onOpenAnalysis}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-sky-300 border border-slate-700 rounded-md transition-colors"
              title="Analyze lyric density, emotional arc, and structural balance"
            >
              <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">Song Analysis</span>
              <span className="md:hidden">Analysis</span>
            </button>
          )}

          {onOpenVoiceToLyric && (
            <button
              onClick={onOpenVoiceToLyric}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-sky-300 border border-slate-700 rounded-md transition-colors"
              title="Voice-to-Lyric Refinement (transcribe spoken hooks with Gemini 3.5)"
            >
              <Mic className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">Voice Refinement</span>
              <span className="md:hidden">Voice</span>
            </button>
          )}

          {onOpenMetaTags && (
            <button
              onClick={onOpenMetaTags}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-sky-300 border border-slate-700 rounded-md transition-colors"
              title="Natural Language Meta-Tagging (Genre, mood tags, tempo)"
            >
              <Tag className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden lg:inline">Auto-Tag</span>
            </button>
          )}

          <div className="h-4 w-px bg-slate-800 mx-0.5 hidden sm:block" />

          {onOpenRevisions && (
            <button
              onClick={onOpenRevisions}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
              title="Open Revisions Central Hub (/lyricflow-pro/revisions)"
            >
              <History className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Revisions Hub</span>
              <span className="sm:hidden">Revs</span>
              {revisionsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[10px] font-semibold border border-sky-500/30">
                  {revisionsCount}
                </span>
              )}
            </button>
          )}

          {onQuickSnapshot && (
            <button
              onClick={onQuickSnapshot}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-md transition-colors"
              title="Record instant revision snapshot to /lyricflow-pro/revisions"
            >
              <Plus className="w-3 h-3" />
              <span>Snapshot</span>
            </button>
          )}

          <button
            onClick={handleCopyLyrics}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-md transition-colors"
            title="Copy Lyrics with Chords"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Chord Insert Toolbar (Shown during Edit mode) */}
      {viewMode === 'edit' && (
        <div className="px-4 lg:px-6 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Music className="w-3 h-3 text-sky-400" />
            <span>Insert:</span>
          </span>

          <div className="flex items-center gap-1">
            {quickChords.map((chord) => (
              <button
                key={chord}
                onClick={() => insertAtCursor(`[${chord}]`)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-sky-300 border border-slate-700 rounded text-xs font-mono font-medium transition-all"
                title={`Insert [${chord}] at cursor`}
              >
                [{chord}]
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Section Markers */}
          <div className="flex items-center gap-1">
            {['[Verse]', '[Chorus]', '[Pre-Chorus]', '[Bridge]', '[Outro]'].map((sec) => (
              <button
                key={sec}
                onClick={() => insertAtCursor(`\n${sec}\n`)}
                className="px-2 py-0.5 bg-slate-800/70 hover:bg-slate-700 text-slate-300 border border-slate-700/50 rounded text-xs font-mono transition-colors whitespace-nowrap"
              >
                {sec}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Song Metadata Card (Title, Subtitle, Key, BPM, Time Sig, Capo Overrides) */}
          <div className="p-4 sm:p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4 shadow-sm">
            {/* Title, Subtitle, Status & Quick Summary Badges */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <input
                  type="text"
                  value={song.title}
                  onChange={(e) => onUpdateSong({ title: e.target.value })}
                  placeholder="Song Title..."
                  className="text-2xl sm:text-3xl font-bold bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none focus:border-b focus:border-sky-400 pb-1 font-serif tracking-tight w-full sm:w-auto flex-1"
                />

                <div className="flex items-center gap-2">
                  <select
                    value={song.status}
                    onChange={(e) => onUpdateSong({ status: e.target.value as any })}
                    className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-400 capitalize font-medium"
                  >
                    <option value="idea">Idea</option>
                    <option value="draft">Draft</option>
                    <option value="in_progress">In Progress</option>
                    <option value="polished">Polished</option>
                    <option value="finished">Finished</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowAdvancedMeta(!showAdvancedMeta)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Toggle musical overrides panel"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                    <span className="hidden sm:inline">Overrides</span>
                    {showAdvancedMeta ? (
                      <ChevronUp className="w-3 h-3 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Subtitle / Concept line */}
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <input
                  type="text"
                  value={song.subtitle || ''}
                  onChange={(e) => onUpdateSong({ subtitle: e.target.value })}
                  placeholder="Subtitle / Concept (e.g. 'Acoustic ballad in D with alternate bridge')..."
                  className="w-full bg-transparent text-slate-300 placeholder-slate-600 text-xs focus:outline-none focus:border-b focus:border-slate-700 py-0.5"
                />
              </div>

              {/* Quick glance pill badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-sky-300 font-mono">
                  <Music className="w-3 h-3 text-sky-400" />
                  <span>Key: <strong>{song.key || 'C'}</strong></span>
                  {soundingKey && (
                    <span className="text-slate-400 font-sans">
                      (sounds {soundingKey})
                    </span>
                  )}
                </span>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-200 font-mono">
                  <Activity className="w-3 h-3 text-sky-400" />
                  <span><strong>{song.tempo || 120}</strong> BPM</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                  <Clock className="w-3 h-3 text-sky-400" />
                  <span>Meter: <strong>{song.timeSignature || '4/4'}</strong></span>
                </span>

                {song.capo > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 font-mono">
                    <span>Capo <strong>{song.capo}</strong></span>
                  </span>
                )}
              </div>
            </div>

            {/* Manual Musical Overrides Panel (Key, Tempo, Time Signature, Capo) */}
            {showAdvancedMeta && (
              <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-xs">
                {/* 1. KEY OVERRIDE & TRANSPOSITION */}
                <div className="p-3 bg-slate-950/70 border border-slate-800/90 rounded-xl space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-mono font-semibold tracking-wider text-sky-400 flex items-center gap-1">
                        <Music className="w-3 h-3" />
                        <span>Key Override</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => audioSynth.playChord(song.key || 'C')}
                        className="text-[10px] text-slate-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                        title="Audition root chord"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Audition</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={song.key}
                        onChange={(e) => onUpdateSong({ key: e.target.value })}
                        placeholder="e.g. C, Am, F#"
                        className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-sky-300 font-mono font-bold text-sm focus:outline-none focus:border-sky-400"
                      />

                      {/* Transposition Semitone Steppers */}
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleTranspose(-1)}
                          className="px-2 py-1 hover:bg-slate-800 text-slate-300 hover:text-sky-300 rounded font-mono font-semibold text-xs transition-colors"
                          title="Transpose down 1 semitone (-1)"
                        >
                          -1
                        </button>
                        <div className="w-px h-3.5 bg-slate-800" />
                        <button
                          type="button"
                          onClick={() => handleTranspose(1)}
                          className="px-2 py-1 hover:bg-slate-800 text-slate-300 hover:text-sky-300 rounded font-mono font-semibold text-xs transition-colors"
                          title="Transpose up 1 semitone (+1)"
                        >
                          +1
                        </button>
                      </div>
                    </div>

                    {/* Transpose with Lyrics Toggle */}
                    <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={transposeWithLyrics}
                        onChange={(e) => setTransposeWithLyrics(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0 w-3 h-3"
                      />
                      <span>Transpose chord tags in lyrics</span>
                    </label>
                  </div>

                  {/* Common Keys Quick Picker */}
                  <div className="pt-2 border-t border-slate-800/60">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Quick Keys</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[...MAJOR_KEYS.slice(0, 6), ...MINOR_KEYS.slice(0, 4)].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => {
                            onUpdateSong({ key: k });
                            audioSynth.playChord(k);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                            song.key === k
                              ? 'bg-sky-500 text-slate-950 font-bold'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. TEMPO (BPM) & TAP METRONOME */}
                <div className="p-3 bg-slate-950/70 border border-slate-800/90 rounded-xl space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-mono font-semibold tracking-wider text-sky-400 flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span>Tempo (BPM)</span>
                      </label>
                      {lastTapFeedback && (
                        <span className="text-[10px] font-mono text-emerald-400 font-semibold animate-pulse">
                          {lastTapFeedback}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="40"
                        max="240"
                        value={song.tempo || 120}
                        onChange={(e) => onUpdateSong({ tempo: Math.min(240, Math.max(40, parseInt(e.target.value) || 120)) })}
                        className="w-20 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono font-bold text-sm focus:outline-none focus:border-sky-400"
                      />

                      {/* Tempo Steppers */}
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateSong({ tempo: Math.max(40, (song.tempo || 120) - 5) })}
                          className="px-1.5 py-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded font-mono text-[11px] transition-colors"
                          title="Decrease tempo by 5 BPM"
                        >
                          -5
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateSong({ tempo: Math.max(40, (song.tempo || 120) - 1) })}
                          className="px-1.5 py-1 hover:bg-slate-800 text-slate-300 hover:text-sky-300 rounded font-mono text-[11px] transition-colors"
                          title="Decrease tempo by 1 BPM"
                        >
                          -1
                        </button>
                        <div className="w-px h-3.5 bg-slate-800" />
                        <button
                          type="button"
                          onClick={() => onUpdateSong({ tempo: Math.min(240, (song.tempo || 120) + 1) })}
                          className="px-1.5 py-1 hover:bg-slate-800 text-slate-300 hover:text-sky-300 rounded font-mono text-[11px] transition-colors"
                          title="Increase tempo by 1 BPM"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateSong({ tempo: Math.min(240, (song.tempo || 120) + 5) })}
                          className="px-1.5 py-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded font-mono text-[11px] transition-colors"
                          title="Increase tempo by 5 BPM"
                        >
                          +5
                        </button>
                      </div>

                      {/* Tap Tempo Button */}
                      <button
                        type="button"
                        onClick={handleTapTempo}
                        className="px-2.5 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-lg text-xs font-mono font-semibold transition-all active:scale-95"
                        title="Tap repeatedly to set tempo"
                      >
                        TAP
                      </button>
                    </div>

                    {/* Smooth Range Slider */}
                    <input
                      type="range"
                      min="40"
                      max="220"
                      value={song.tempo || 120}
                      onChange={(e) => onUpdateSong({ tempo: parseInt(e.target.value) || 120 })}
                      className="w-full accent-sky-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Mood Presets */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-1">
                    {TEMPO_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => onUpdateSong({ tempo: preset.bpm })}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          song.tempo === preset.bpm
                            ? 'bg-sky-500 text-slate-950 font-bold'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title={`${preset.label} (${preset.bpm} BPM)`}
                      >
                        {preset.bpm}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. TIME SIGNATURE OVERRIDE */}
                <div className="p-3 bg-slate-950/70 border border-slate-800/90 rounded-xl space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-mono font-semibold tracking-wider text-sky-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Time Signature</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">Meter</span>
                    </div>

                    <input
                      type="text"
                      value={song.timeSignature || '4/4'}
                      onChange={(e) => onUpdateSong({ timeSignature: e.target.value })}
                      placeholder="e.g. 4/4, 3/4, 6/8"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono font-bold text-sm focus:outline-none focus:border-sky-400"
                    />

                    <p className="text-[10px] text-slate-400 leading-tight">
                      {song.timeSignature === '3/4'
                        ? '3 beats per bar (Waltz / Triple feel)'
                        : song.timeSignature === '6/8'
                        ? '6 eighth notes per bar (Ballad / Blues pulse)'
                        : song.timeSignature === '2/4'
                        ? '2 beats per bar (March / Fast folk)'
                        : song.timeSignature === '12/8'
                        ? '12 eighth notes (Slow soul & blues)'
                        : '4 beats per bar (Standard common time)'}
                    </p>
                  </div>

                  {/* Preset Buttons */}
                  <div className="pt-2 border-t border-slate-800/60 flex flex-wrap gap-1">
                    {TIME_SIGNATURE_PRESETS.map((meter) => (
                      <button
                        key={meter}
                        type="button"
                        onClick={() => onUpdateSong({ timeSignature: meter })}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          song.timeSignature === meter
                            ? 'bg-sky-500 text-slate-950 font-bold'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        {meter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. CAPO & SOUNDING PITCH */}
                <div className="p-3 bg-slate-950/70 border border-slate-800/90 rounded-xl space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-mono font-semibold tracking-wider text-sky-400 flex items-center gap-1">
                        <span>Capo Position</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">Fret 0-12</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={song.capo ?? 0}
                        onChange={(e) => onUpdateSong({ capo: Math.min(12, Math.max(0, parseInt(e.target.value) || 0)) })}
                        className="w-20 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono font-bold text-sm focus:outline-none focus:border-sky-400"
                      />

                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateSong({ capo: Math.max(0, (song.capo || 0) - 1) })}
                          className="px-2.5 py-1 hover:bg-slate-800 text-slate-300 hover:text-sky-300 rounded font-mono font-semibold text-xs transition-colors"
                          title="Decrease Capo fret"
                        >
                          -
                        </button>
                        <div className="w-px h-3.5 bg-slate-800" />
                        <button
                          type="button"
                          onClick={() => onUpdateSong({ capo: Math.min(12, (song.capo || 0) + 1) })}
                          className="px-2.5 py-1 hover:bg-slate-800 text-slate-300 hover:text-sky-300 rounded font-mono font-semibold text-xs transition-colors"
                          title="Increase Capo fret"
                        >
                          +
                        </button>
                      </div>

                      {song.capo > 0 && (
                        <button
                          type="button"
                          onClick={() => onUpdateSong({ capo: 0 })}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                          title="Reset Capo to 0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="pt-1">
                      {song.capo > 0 ? (
                        <div className="p-1.5 rounded bg-sky-500/10 border border-sky-500/20 text-[10px] text-sky-300 font-mono">
                          Playing in <strong>{song.key || 'C'}</strong> shapes sounds in{' '}
                          <strong className="text-sky-200 underline">{soundingKey}</strong>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500">
                          Standard tuning (No capo). Fret 0 sounds at true written pitch.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick Capo Fret selector */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center gap-1">
                    {[0, 1, 2, 3, 4, 5].map((fret) => (
                      <button
                        key={fret}
                        type="button"
                        onClick={() => onUpdateSong({ capo: fret })}
                        className={`flex-1 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          (song.capo || 0) === fret
                            ? 'bg-sky-500 text-slate-950 font-bold'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {fret === 0 ? 'None' : `${fret}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lyrics Editor / Interactive Sheet */}
          {viewMode === 'edit' ? (
            /* Direct Textarea with Live Syllable Counter Margin */
            <div className="relative bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
              <div className="flex">
                {/* Left Gutter: Syllable Counts per line */}
                <div className="w-12 bg-slate-950/60 border-r border-slate-800/80 py-4 select-none text-right pr-2 space-y-[2px]">
                  {lines.map((line, idx) => {
                    const isSectionHeader = line.trim().startsWith('[') && line.trim().endsWith(']');
                    const sylCount = isSectionHeader ? '' : countSyllablesInLine(line);
                    return (
                      <div
                        key={idx}
                        className="h-6 text-[11px] font-mono text-slate-500 flex items-center justify-end"
                        title={sylCount ? `${sylCount} syllables in line ${idx + 1}` : undefined}
                      >
                        {sylCount ? (
                          <span className="text-[10px] px-1 rounded bg-slate-800/80 text-sky-400/90">
                            {sylCount}
                          </span>
                        ) : (
                          <span className="text-slate-700">{idx + 1}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={song.content}
                  onChange={(e) => onUpdateSong({ content: e.target.value })}
                  placeholder="Write your lyrics here with chords in brackets, e.g. [Am]Walking down the [F]street..."
                  rows={Math.max(16, lines.length + 2)}
                  className="flex-1 p-4 bg-transparent text-slate-100 font-mono text-sm leading-6 resize-none focus:outline-none focus:ring-0 whitespace-pre scrollbar-none"
                />
              </div>
            </div>
          ) : (
            /* Interactive Lyric Sheet View */
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 lg:p-8 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>Click any <strong className="text-sky-300">chord</strong> to hear it strum. Click any <strong className="text-sky-300">word</strong> to find rhymes.</span>
                </div>
                <button
                  onClick={() => setViewMode('edit')}
                  className="text-sky-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit chords & words</span>
                </button>
              </div>

              {lines.map((line, lineIdx) => {
                const trimmed = line.trim();
                const isSectionHeader = trimmed.startsWith('[') && trimmed.endsWith(']');
                const sylCount = countSyllablesInLine(line);
                const rhymeCode = rhymeScheme[lineIdx];

                if (isSectionHeader) {
                  return (
                    <div key={lineIdx} className="pt-4 pb-1">
                      <span className="inline-block px-2.5 py-1 rounded bg-slate-800 text-sky-300 font-mono text-xs font-semibold uppercase tracking-wider border border-slate-700">
                        {trimmed.replace(/^\[|\]$/g, '')}
                      </span>
                    </div>
                  );
                }

                if (!trimmed) {
                  return <div key={lineIdx} className="h-3" />;
                }

                const segments = parseLineSegments(line);

                return (
                  <div key={lineIdx} className="flex items-start gap-3 group py-0.5">
                    {/* Syllable Counter & Rhyme Scheme Pill */}
                    <div className="w-14 flex-shrink-0 flex items-center justify-end gap-1.5 text-[11px] font-mono text-slate-500 pt-3 select-none">
                      {rhymeCode && (
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 text-[9px] flex items-center justify-center font-bold border border-slate-700">
                          {rhymeCode}
                        </span>
                      )}
                      <span
                        className="px-1.5 py-0.5 rounded bg-slate-950 text-sky-400/90 text-[10px] border border-slate-800"
                        title={`${sylCount} syllables`}
                      >
                        {sylCount}
                      </span>
                    </div>

                    {/* Lyric + Floating Chords Row */}
                    <div className="flex-1 flex flex-wrap items-end gap-x-1 gap-y-3 font-mono text-sm leading-relaxed">
                      {segments.map((seg, segIdx) => (
                        <div key={segIdx} className="inline-flex flex-col items-start min-w-[12px]">
                          {/* Floating Chord Above */}
                          {seg.chord ? (
                            <button
                              onClick={() => audioSynth.playChord(seg.chord!)}
                              className="text-xs font-bold text-sky-400 hover:text-sky-200 hover:bg-sky-500/20 px-1 rounded transition-colors font-mono -mb-0.5 flex items-center gap-0.5 cursor-pointer"
                              title={`Play ${seg.chord} chord`}
                            >
                              <span>{seg.chord}</span>
                              <Volume2 className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          ) : (
                            <span className="h-4 text-[10px] text-transparent select-none">-</span>
                          )}

                          {/* Lyric Text with Clickable Words */}
                          <span className="text-slate-200 whitespace-pre">
                            {seg.text.split(/(\s+)/).map((part, partIdx) => {
                              const cleanWord = part.trim().replace(/[^a-zA-Z]/g, '');
                              if (!cleanWord) {
                                return <span key={partIdx}>{part}</span>;
                              }
                              return (
                                <button
                                  key={partIdx}
                                  onClick={() => onSelectWordForRhyme(cleanWord)}
                                  className="hover:text-sky-300 hover:underline underline-offset-4 decoration-sky-400/60 cursor-pointer font-sans text-base transition-colors"
                                  title={`Find rhymes for "${cleanWord}"`}
                                >
                                  {part}
                                </button>
                              );
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Songwriter Notes & Rhyme Scratchpad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                <span>Song Notes & Concepts</span>
              </label>
              <textarea
                value={song.notes || ''}
                onChange={(e) => onUpdateSong({ notes: e.target.value })}
                placeholder="Story behind the song, production notes, arrangement ideas, reference tracks..."
                rows={3}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-md p-2.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-sky-400 resize-none"
              />
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Rhyme Bank & Scratchpad</span>
              </label>
              <textarea
                value={song.rhymeNotes || ''}
                onChange={(e) => onUpdateSong({ rhymeNotes: e.target.value })}
                placeholder="Saved rhymes, favorite phrases, metaphors to weave into the chorus..."
                rows={3}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-md p-2.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-sky-400 resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
