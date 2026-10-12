import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Tag,
  Music,
  Gauge,
  Mic,
  Disc,
  Check,
  CheckCheck,
  RefreshCw,
  Loader2,
  Sliders,
} from 'lucide-react';
import { SongDraft, MetaTagSuggestion } from '../types';
import { generateMetaTags } from '../services/aiService';

interface MetaTagModalProps {
  song: SongDraft;
  isOpen: boolean;
  onClose: () => void;
  onApplyMetadata: (updates: {
    genre?: string;
    tags?: string[];
    tempo?: number;
    notes?: string;
  }) => void;
}

export const MetaTagModal: React.FC<MetaTagModalProps> = ({
  song,
  isOpen,
  onClose,
  onApplyMetadata,
}) => {
  const [suggestion, setSuggestion] = useState<MetaTagSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedBpm, setSelectedBpm] = useState<number>(song.tempo || 120);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handleFetchTags();
    }
  }, [isOpen, song.id]);

  const handleFetchTags = async () => {
    setIsLoading(true);
    setError(null);
    setAppliedSuccess(false);
    try {
      const res = await generateMetaTags({
        title: song.title,
        lyrics: song.content,
        progression: song.progression,
        key: song.key,
        tempo: song.tempo,
      });
      setSuggestion(res);
      setSelectedGenre(res.suggestedGenre);
      setSelectedTags(res.moodTags || []);
      if (res.suggestedBpm) {
        setSelectedBpm(res.suggestedBpm);
      }
    } catch (err: any) {
      console.error('Meta-tagging error:', err);
      setError(err.message || 'Failed to generate metadata tags');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleApply = () => {
    if (!suggestion) return;

    // Combine existing tags with newly selected tags, avoiding duplicates
    const combinedTags = Array.from(new Set([...(song.tags || []), ...selectedTags]));

    // Optionally format instrumentation and vocal delivery into notes if requested
    const additionalNotes = `\n--- AI Taxonomy & Production Notes ---\nVocal Style: ${suggestion.vocalDelivery}\nInstrumentation: ${suggestion.instrumentationIdeas.join(', ')}\nTheme: ${suggestion.thematicSummary}\n`;
    const updatedNotes = song.notes ? `${song.notes}\n${additionalNotes}` : additionalNotes;

    onApplyMetadata({
      genre: selectedGenre || song.genre,
      tags: combinedTags,
      tempo: selectedBpm || song.tempo,
      notes: updatedNotes,
    });

    setAppliedSuccess(true);
    setTimeout(() => {
      setAppliedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-950/80 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-serif">
                Natural Language Meta-Tagging
              </h3>
              <p className="text-[11px] text-slate-400">
                AI taxonomy scan for genre, mood tags, tempo, and vocal styling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFetchTags}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-300 transition-colors disabled:opacity-50"
              title="Re-scan metadata"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-7 h-7 text-sky-400 animate-spin" />
              <p className="text-slate-300 font-serif">Analyzing lyrical themes & chord patterns...</p>
              <p className="text-[11px] text-slate-500">Detecting mood signatures, harmonic pacing, and playlist genres</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-center">
              {error}
            </div>
          )}

          {suggestion && !isLoading && (
            <div className="space-y-4">
              {/* Thematic Summary Logline */}
              {suggestion.thematicSummary && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Thematic Logline
                  </span>
                  <p className="text-slate-200 italic font-serif leading-relaxed">
                    "{suggestion.thematicSummary}"
                  </p>
                </div>
              )}

              {/* Genre Selection */}
              <div className="space-y-2">
                <label className="text-[11px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-sky-400" />
                  <span>Suggested Primary Genre</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedGenre(suggestion.suggestedGenre)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      selectedGenre === suggestion.suggestedGenre
                        ? 'bg-sky-500 text-slate-950 border-sky-400 shadow'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    ★ {suggestion.suggestedGenre} (Top Fit)
                  </button>

                  {suggestion.alternateGenres?.map((alt) => (
                    <button
                      key={alt}
                      onClick={() => setSelectedGenre(alt)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs transition-all border ${
                        selectedGenre === alt
                          ? 'bg-sky-500 text-slate-950 font-bold border-sky-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood Tags */}
              <div className="space-y-2">
                <label className="text-[11px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-sky-400" />
                  <span>Mood & Atmosphere Tags</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {suggestion.moodTags?.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-full text-xs font-mono transition-all border ${
                          isSelected
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold'
                            : 'bg-slate-950 text-slate-500 border-slate-800/80 hover:text-slate-300'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tempo & Rhythm Descriptor */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-sky-400" />
                    <span>Tempo Recommendation</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono font-bold text-sky-400">{selectedBpm}</span>
                    <span className="text-[10px] text-slate-500">BPM</span>
                  </div>
                </div>
                <p className="text-slate-400 text-xs">{suggestion.tempoDescriptor}</p>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={selectedBpm}
                    onChange={(e) => setSelectedBpm(Number(e.target.value))}
                    className="flex-1 accent-sky-500 cursor-pointer"
                  />
                  <button
                    onClick={() => setSelectedBpm(suggestion.suggestedBpm)}
                    className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded font-mono"
                  >
                    Reset to {suggestion.suggestedBpm}
                  </button>
                </div>
              </div>

              {/* Vocal Delivery & Instrumentation Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Mic className="w-3 h-3 text-sky-400" />
                    <span>Vocal Delivery</span>
                  </span>
                  <p className="text-slate-300 leading-relaxed">{suggestion.vocalDelivery}</p>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Disc className="w-3 h-3 text-sky-400" />
                    <span>Instrumentation Ideas</span>
                  </span>
                  <ul className="text-slate-300 list-disc list-inside space-y-0.5">
                    {suggestion.instrumentationIdeas?.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleApply}
            disabled={!suggestion || isLoading}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-sky-500/10"
          >
            {appliedSuccess ? (
              <>
                <CheckCheck className="w-4 h-4 text-slate-950" />
                <span>Applied to Song!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Apply Tags & Metadata</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
