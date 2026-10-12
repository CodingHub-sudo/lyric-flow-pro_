import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  BarChart3,
  Heart,
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  FileText,
} from 'lucide-react';
import { SongDraft, SongAnalysisResult } from '../types';
import { analyzeSong } from '../services/aiService';

interface SongAnalysisModalProps {
  song: SongDraft;
  isOpen: boolean;
  onClose: () => void;
  onApplyTipsToNotes?: (tipsText: string) => void;
}

export const SongAnalysisModal: React.FC<SongAnalysisModalProps> = ({
  song,
  isOpen,
  onClose,
  onApplyTipsToNotes,
}) => {
  const [analysis, setAnalysis] = useState<SongAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'structure' | 'emotional' | 'density'>('overview');
  const [copiedNotes, setCopiedNotes] = useState(false);

  useEffect(() => {
    if (isOpen && !analysis && song.content.trim()) {
      runAnalysis();
    }
  }, [isOpen, song.id]);

  const runAnalysis = async () => {
    if (!song.content.trim()) {
      setError('Add lyrics to your draft before running analysis.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeSong({
        title: song.title,
        lyrics: song.content,
        progression: song.progression,
        key: song.key,
        tempo: song.tempo,
        genre: song.genre,
      });
      setAnalysis(result);
    } catch (err: any) {
      console.error('Song analysis error:', err);
      setError(err.message || 'Failed to analyze song. Check server logs.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopySummary = () => {
    if (!analysis) return;
    const summary = `LyricFlow Pro Song Analysis for "${song.title}":
Overall Score: ${analysis.scores.overall}/100
Structure: ${analysis.scores.structure}/100 | Emotional Arc: ${analysis.scores.emotionalArc}/100 | Lyrical Density: ${analysis.scores.lyricalDensity}/100

Key Actionable Tips:
${analysis.actionableTips.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;

    navigator.clipboard.writeText(summary);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2000);
  };

  const handleAppendToNotes = () => {
    if (!analysis || !onApplyTipsToNotes) return;
    const notesText = `\n--- AI Song Analysis (${new Date().toLocaleDateString()}) ---\nOverall Score: ${analysis.scores.overall}/100\nActionable Tips:\n${analysis.actionableTips.map((t, i) => `• ${t}`).join('\n')}\n`;
    onApplyTipsToNotes(notesText);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 70) return 'text-sky-400 border-sky-500/30 bg-sky-500/10';
    return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-950/80 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 lg:p-5 border-b border-slate-800 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100 font-serif">
                  Automated Song Analysis
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {song.title || 'Untitled'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Objective AI audit of structural balance, emotional arc, and lyrical density
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runAnalysis}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-300 transition-colors disabled:opacity-50"
              title="Re-analyze draft"
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

        {/* Loading / Error States */}
        {isLoading && (
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            <h4 className="text-sm font-medium text-slate-200 font-serif">
              Scanning lyrics, metric cadence, and harmonic arc...
            </h4>
            <p className="text-xs text-slate-500 max-w-sm">
              Evaluating verse-chorus balance, syllable counts, rhyme predictability, and emotional
              tension payoff points.
            </p>
          </div>
        )}

        {error && !isLoading && (
          <div className="p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <p className="text-xs text-red-200">{error}</p>
            <button
              onClick={runAnalysis}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Analysis</span>
            </button>
          </div>
        )}

        {analysis && !isLoading && (
          <>
            {/* Score Overview Bar */}
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Overall Score
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-100">
                    {analysis.scores.overall}
                    <span className="text-xs text-slate-500">/100</span>
                  </span>
                </div>
                <div
                  className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs ${getScoreColor(
                    analysis.scores.overall
                  )}`}
                >
                  {analysis.scores.overall}
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Structure
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-100">
                    {analysis.scores.structure}
                    <span className="text-xs text-slate-500">/100</span>
                  </span>
                </div>
                <Layers className="w-5 h-5 text-sky-400" />
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Emotional Arc
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-100">
                    {analysis.scores.emotionalArc}
                    <span className="text-xs text-slate-500">/100</span>
                  </span>
                </div>
                <Heart className="w-5 h-5 text-rose-400" />
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Lyrical Density
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-100">
                    {analysis.scores.lyricalDensity}
                    <span className="text-xs text-slate-500">/100</span>
                  </span>
                </div>
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 px-4 bg-slate-950/40 text-xs font-medium">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-2.5 border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-sky-400 text-sky-300 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Overview & Strengths
              </button>
              <button
                onClick={() => setActiveTab('structure')}
                className={`px-3 py-2.5 border-b-2 transition-colors ${
                  activeTab === 'structure'
                    ? 'border-sky-400 text-sky-300 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Structural Balance
              </button>
              <button
                onClick={() => setActiveTab('emotional')}
                className={`px-3 py-2.5 border-b-2 transition-colors ${
                  activeTab === 'emotional'
                    ? 'border-sky-400 text-sky-300 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Emotional Arc
              </button>
              <button
                onClick={() => setActiveTab('density')}
                className={`px-3 py-2.5 border-b-2 transition-colors ${
                  activeTab === 'density'
                    ? 'border-sky-400 text-sky-300 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Lyrical Density & Meter
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Actionable Recommendations */}
                  <div className="p-4 bg-slate-950/80 rounded-xl border border-sky-500/30 space-y-2">
                    <h4 className="font-semibold text-slate-200 flex items-center gap-2 text-sm">
                      <Lightbulb className="w-4 h-4 text-sky-400" />
                      <span>Priority Action Items</span>
                    </h4>
                    <div className="space-y-2 pt-1">
                      {analysis.actionableTips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 text-slate-300">
                          <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">
                            {i + 1}
                          </span>
                          <p className="leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Core Strengths */}
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                    <h4 className="font-semibold text-slate-200 flex items-center gap-2 text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Song Strengths</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {analysis.strengths.map((s, i) => (
                        <div
                          key={i}
                          className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80 text-slate-300"
                        >
                          ✓ {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'structure' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                    <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                      Structural Assessment
                    </h4>
                    <p className="text-slate-300 leading-relaxed">
                      {analysis.structuralBalance.assessment}
                    </p>
                  </div>

                  {analysis.structuralBalance.sectionBreakdown?.length > 0 && (
                    <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                      <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                        Section Breakdown & Pacing
                      </h4>
                      <div className="space-y-2 pt-1">
                        {analysis.structuralBalance.sectionBreakdown.map((sec, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800"
                          >
                            <span className="font-bold text-sky-300">{sec.section}</span>
                            <span className="text-slate-400 font-mono">
                              {sec.linesCount} lines
                            </span>
                            <span className="text-slate-300 italic">{sec.rhythmPacing}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-sky-400">
                      Structure Refinement Suggestions:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 pt-1">
                      {analysis.structuralBalance.suggestions?.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'emotional' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                    <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                      Emotional Trajectory
                    </h4>
                    <p className="text-slate-300 leading-relaxed">
                      {analysis.emotionalArc.trajectory}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                    <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                      Tension & Release Dynamics
                    </h4>
                    <p className="text-slate-300 leading-relaxed">
                      {analysis.emotionalArc.tensionReleaseAnalysis}
                    </p>
                  </div>

                  {analysis.emotionalArc.peakMoments?.length > 0 && (
                    <div className="p-3 bg-rose-950/20 border border-rose-800/40 rounded-xl space-y-2">
                      <span className="text-[11px] font-bold text-rose-300">
                        Peak Emotional Moments / Anchor Lines:
                      </span>
                      <div className="space-y-1">
                        {analysis.emotionalArc.peakMoments.map((m, i) => (
                          <div
                            key={i}
                            className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-200 italic font-serif"
                          >
                            "{m}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'density' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                    <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                      Lyrical Density & Syllable Flow
                    </h4>
                    <p className="text-slate-300 leading-relaxed">
                      {analysis.lyricalDensity.feedback}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                        Cadence & Breath
                      </span>
                      <p className="text-slate-300">{analysis.lyricalDensity.syllableFlow}</p>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                        Rhyme Quality & Clutter
                      </span>
                      <p className="text-slate-300">
                        {analysis.lyricalDensity.rhymeClutterAssessment}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-blue-400">
                      Metric Tightening Suggestions:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 pt-1">
                      {analysis.lyricalDensity.suggestions?.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Audited with Gemini 3.8 Flash • Songwriting Analysis
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySummary}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                >
                  {copiedNotes ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Report</span>
                    </>
                  )}
                </button>

                {onApplyTipsToNotes && (
                  <button
                    onClick={handleAppendToNotes}
                    className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Save Tips to Song Notes</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
