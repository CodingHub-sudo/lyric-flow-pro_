import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Plus,
  Copy,
  Check,
  X,
  Feather,
  Flame,
  ArrowRight,
  Sliders,
  Send,
  Loader2,
} from 'lucide-react';
import { SongDraft, LyricSuggestion } from '../types';
import { fetchLyricSuggestions } from '../services/aiService';

interface LyricCoWriterProps {
  song: SongDraft;
  onInsertLyrics: (text: string) => void;
  onClose?: () => void;
}

export const LyricCoWriter: React.FC<LyricCoWriterProps> = ({
  song,
  onInsertLyrics,
  onClose,
}) => {
  const [mode, setMode] = useState<'couplet' | 'continuation' | 'hook' | 'contrast'>('couplet');
  const [customPrompt, setCustomPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<LyricSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insertedId, setInsertedId] = useState<string | null>(null);

  const QUICK_PROMPTS = [
    'Sensory Imagery',
    'Bittersweet & Vulnerable',
    'Conversational Phrasing',
    'Anthemic Lift',
    'Internal Rhymes',
  ];

  const handleGenerate = async (overrideMode?: typeof mode) => {
    setIsLoading(true);
    setError(null);
    try {
      const activeMode = overrideMode || mode;
      const res = await fetchLyricSuggestions({
        currentLyrics: song.content,
        songTitle: song.title,
        genre: song.genre || 'Singer-Songwriter',
        key: song.key,
        tempo: song.tempo,
        mode: activeMode,
        prompt: customPrompt,
      });
      setSuggestions(res);
    } catch (err: any) {
      console.error('Co-writer error:', err);
      setError(err.message || 'Failed to generate suggestions. Ensure Gemini API key is set.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleInsert = (lines: string[], id: string) => {
    const textToInsert = '\n' + lines.join('\n') + '\n';
    onInsertLyrics(textToInsert);
    setInsertedId(id);
    setTimeout(() => setInsertedId(null), 1800);
  };

  return (
    <div className="w-full lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-20 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-serif">Lyric Co-Writer</h3>
            <p className="text-[10px] text-slate-400">Contextual AI lyricist powered by Gemini</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mode Selector */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-900/60 space-y-2">
        <div className="grid grid-cols-2 gap-1 text-xs">
          <button
            onClick={() => {
              setMode('couplet');
              handleGenerate('couplet');
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all ${
              mode === 'couplet'
                ? 'bg-sky-500 text-slate-950 font-bold shadow'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Feather className="w-3.5 h-3.5" />
            <span>Rhyming Couplet</span>
          </button>

          <button
            onClick={() => {
              setMode('continuation');
              handleGenerate('continuation');
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all ${
              mode === 'continuation'
                ? 'bg-sky-500 text-slate-950 font-bold shadow'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Stanza Flow</span>
          </button>

          <button
            onClick={() => {
              setMode('hook');
              handleGenerate('hook');
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all ${
              mode === 'hook'
                ? 'bg-sky-500 text-slate-950 font-bold shadow'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Chorus Hook</span>
          </button>

          <button
            onClick={() => {
              setMode('contrast');
              handleGenerate('contrast');
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all ${
              mode === 'contrast'
                ? 'bg-sky-500 text-slate-950 font-bold shadow'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Bridge Contrast</span>
          </button>
        </div>

        {/* Custom Prompt & Generate Row */}
        <div className="space-y-1.5">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerate();
              }}
              placeholder="Artist direction (e.g. 'more visual', 'night highway')..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
            <button
              onClick={() => handleGenerate()}
              disabled={isLoading}
              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-lg transition-all flex items-center gap-1"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Write</span>
            </button>
          </div>

          {/* Quick Direction Chips */}
          <div className="flex flex-wrap gap-1">
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp}
                onClick={() => {
                  setCustomPrompt(qp);
                }}
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-sky-300 border border-slate-800/80 transition-colors"
              >
                + {qp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-200">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
            <p className="text-xs font-mono">Listening to song context & crafting lines...</p>
          </div>
        )}

        {!isLoading && suggestions.length === 0 && !error && (
          <div className="py-12 text-center text-slate-500 text-xs px-4 space-y-2">
            <Sparkles className="w-8 h-8 text-sky-500/40 mx-auto" />
            <p className="font-serif text-slate-400">Ready to co-write with you.</p>
            <p className="text-[11px] text-slate-500">
              Select a mode above or enter an artist prompt to generate tailored lyrics matching{' '}
              <strong className="text-slate-400">{song.title || 'your song'}</strong>.
            </p>
            <button
              onClick={() => handleGenerate()}
              className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs rounded-lg font-medium transition-colors inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate First Ideas</span>
            </button>
          </div>
        )}

        {!isLoading &&
          suggestions.map((sug) => (
            <div
              key={sug.id}
              className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5 hover:border-sky-500/30 transition-all group"
            >
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {sug.label}
                </span>

                {sug.rhymeScheme && (
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                    Scheme: {sug.rhymeScheme}
                  </span>
                )}
              </div>

              {/* Lyrical Lines */}
              <div className="space-y-1 pl-2 border-l-2 border-sky-500/40">
                {sug.lines.map((line, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-100 font-serif italic tracking-wide">{line}</span>
                    {sug.syllableCounts && sug.syllableCounts[idx] && (
                      <span
                        className="text-[10px] font-mono text-slate-500 ml-2"
                        title={`${sug.syllableCounts[idx]} syllables`}
                      >
                        {sug.syllableCounts[idx]}s
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Rationale explanation */}
              {sug.rationale && (
                <p className="text-[11px] text-slate-400 italic bg-slate-900/50 p-2 rounded-lg border border-slate-800/40">
                  💡 {sug.rationale}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  onClick={() => handleCopy(sug.lines.join('\n'), sug.id)}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 text-[11px] flex items-center gap-1 transition-colors"
                  title="Copy lines to clipboard"
                >
                  {copiedId === sug.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleInsert(sug.lines, sug.id)}
                  className="px-2.5 py-1 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                  title="Insert lines into active song editor"
                >
                  {insertedId === sug.id ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Inserted!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span>Insert at Cursor</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
