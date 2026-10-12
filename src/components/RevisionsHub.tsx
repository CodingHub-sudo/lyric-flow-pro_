import React, { useState } from 'react';
import {
  History,
  GitBranch,
  FolderOpen,
  Cloud,
  CloudUpload,
  RefreshCw,
  ExternalLink,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  FileText,
  Music,
  ArrowRight,
  Eye,
  Copy,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { SongDraft, SongRevision, DriveFolderInfo } from '../types';
import { audioSynth } from '../services/audioSynth';

interface RevisionsHubProps {
  song: SongDraft;
  allSongs: SongDraft[];
  folderInfo: DriveFolderInfo | null;
  accessToken: string | null;
  isIndexing: boolean;
  onRefreshIndex: () => void;
  onCreateRevision: (label: string) => Promise<void>;
  onRestoreRevision: (revision: SongRevision) => void;
  onBranchRevision: (revision: SongRevision) => void;
  onClose?: () => void;
}

export const RevisionsHub: React.FC<RevisionsHubProps> = ({
  song,
  allSongs,
  folderInfo,
  accessToken,
  isIndexing,
  onRefreshIndex,
  onCreateRevision,
  onRestoreRevision,
  onBranchRevision,
  onClose,
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);
  const [diffViewRevisionId, setDiffViewRevisionId] = useState<string | null>(null);
  const [scopeFilter, setScopeFilter] = useState<'current' | 'all'>('current');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const revisions = song.revisions || [];

  // Gather all revisions across all songs if scopeFilter is 'all'
  const allWorkspaceRevisions = allSongs.flatMap((s) => s.revisions || []);
  const displayedRevisions = scopeFilter === 'current' ? revisions : allWorkspaceRevisions;

  const handleSaveRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    const labelToSave = newLabel.trim() || `Snapshot ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setIsSaving(true);
    try {
      await onCreateRevision(labelToSave);
      setNewLabel('');
      setSuccessToast(`Saved revision "${labelToSave}" to /lyricflow-pro/revisions!`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      alert(`Could not save revision: ${err.message || 'Error occurred'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = (rev: SongRevision) => {
    if (
      window.confirm(
        `Restore workspace to "${rev.versionLabel}"? Current lyrics and chords will be loaded from this snapshot.`
      )
    ) {
      onRestoreRevision(rev);
      setSelectedRevisionId(rev.id);
      setSuccessToast(`Restored snapshot "${rev.versionLabel}" into active workspace!`);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  const handlePlayRevisionChords = (chords: string[]) => {
    if (!chords || chords.length === 0) return;
    audioSynth.startProgressionLoop({
      chords,
      bpm: song.tempo || 120,
      timeSignature: song.timeSignature || '4/4',
    });
  };

  return (
    <div className="bg-slate-950/80 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col max-w-5xl mx-auto my-4">
      {/* Header Banner: Directory Hub & Status */}
      <div className="p-4 sm:p-5 bg-white/5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100">
                Revisions Central Hub
              </h3>
              <span className="font-mono text-[11px] text-sky-300 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                <FolderOpen className="w-3 h-3 text-sky-400" />
                <span>lyricflow-pro/revisions</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Bi-directional versioning: snapshots of lyrics, chords & song metrics synced with your Google Drive.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {folderInfo?.revisionsWebViewLink && (
            <a
              href={folderInfo.revisionsWebViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700/60 transition-colors"
              title="Open the /revisions folder in Google Drive"
            >
              <span>Drive Folder</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          )}

          <button
            onClick={onRefreshIndex}
            disabled={isIndexing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
            title="Index revisions folder from Google Drive"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isIndexing ? 'animate-spin text-sky-400' : ''}`} />
            <span>{isIndexing ? 'Indexing...' : 'Index Revisions'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-xs"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Action Bar: Create Snapshot Form & Filter */}
      <div className="p-4 bg-slate-900 border-b border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Create Snapshot Form */}
        <form onSubmit={handleSaveRevision} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder={`Snapshot note, e.g. "Changed chorus chords to [${song.progression.slice(0, 3).join(', ')}]"`}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg text-xs font-semibold shadow-sm transition-all whitespace-nowrap disabled:opacity-50"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving Snapshot...' : 'Save Revision Snapshot'}</span>
          </button>
        </form>

        {/* Scope Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setScopeFilter('current')}
            className={`px-3 py-1 rounded-md transition-colors ${
              scopeFilter === 'current'
                ? 'bg-slate-800 text-sky-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            "{song.title}" ({revisions.length})
          </button>
          <button
            onClick={() => setScopeFilter('all')}
            className={`px-3 py-1 rounded-md transition-colors ${
              scopeFilter === 'all'
                ? 'bg-slate-800 text-sky-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Revisions ({allWorkspaceRevisions.length})
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successToast && (
        <div className="mx-4 mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Revisions Timeline List */}
      <div className="p-4 sm:p-5 overflow-y-auto max-h-[460px] space-y-3">
        {displayedRevisions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2 bg-slate-950/40 rounded-xl border border-slate-800">
            <History className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
            <p className="font-medium text-slate-400">No revisions recorded yet.</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Use the snapshot bar above to preserve an immutable version of your lyrics and chord progression into Google Drive.
            </p>
          </div>
        ) : (
          displayedRevisions.map((rev, index) => {
            const isSelected = selectedRevisionId === rev.id;
            const isDiffOpen = diffViewRevisionId === rev.id;
            const isChordsIdentical =
              JSON.stringify(rev.progression) === JSON.stringify(song.progression);
            const isKeyIdentical = rev.key === song.key;
            const lineDiff = rev.summary.lineCount - song.content.split('\n').length;

            return (
              <div
                key={rev.id || index}
                className={`bg-slate-950/70 border rounded-xl p-3.5 transition-all space-y-3 ${
                  isSelected
                    ? 'border-sky-500/60 ring-1 ring-sky-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Version label, timestamp, badges */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 text-xs sm:text-sm">
                        {rev.versionLabel}
                      </span>
                      {scopeFilter === 'all' && (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                          {rev.title}
                        </span>
                      )}
                      {rev.driveFileId && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                          <Cloud className="w-2.5 h-2.5" />
                          <span>Synced in Drive</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-500">
                      {new Date(rev.timestamp).toLocaleString()} • {rev.summary.lineCount} lines • {rev.summary.wordCount} words
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    {rev.driveWebViewLink && (
                      <a
                        href={rev.driveWebViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-white transition-colors rounded hover:bg-slate-800"
                        title="View revision file in Google Drive"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button
                      onClick={() => setDiffViewRevisionId(isDiffOpen ? null : rev.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors border ${
                        isDiffOpen
                          ? 'bg-sky-500 text-slate-950 border-sky-400 font-semibold'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                      title="Inspect differences between this snapshot and active workspace"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{isDiffOpen ? 'Hide Diff' : 'Inspect'}</span>
                    </button>

                    <button
                      onClick={() => onBranchRevision(rev)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-xs transition-colors"
                      title="Create a new draft song from this revision"
                    >
                      <GitBranch className="w-3 h-3 text-sky-400" />
                      <span className="hidden sm:inline">Branch</span>
                    </button>

                    <button
                      onClick={() => handleRestore(rev)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded text-xs transition-colors shadow-sm"
                      title="Restore lyrics and chord progression into active workspace"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore to Workspace</span>
                    </button>
                  </div>
                </div>

                {/* Metadata & Musical Progression Pill Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  {/* Chords Progression in this revision */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Chords:</span>
                    {rev.progression.map((chord, cIdx) => (
                      <span
                        key={cIdx}
                        className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-sky-300 font-mono text-[11px] rounded"
                      >
                        {chord}
                      </span>
                    ))}
                    <button
                      onClick={() => handlePlayRevisionChords(rev.progression)}
                      className="text-[10px] text-slate-400 hover:text-sky-300 ml-1 flex items-center gap-0.5"
                      title="Audition this progression"
                    >
                      <Music className="w-2.5 h-2.5" />
                      <span>Play</span>
                    </button>
                  </div>

                  {/* Musical Key & Tempo with Diff indicators */}
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Key {rev.key}
                      {!isKeyIdentical && (
                        <span className="text-sky-400 ml-1">(active: {song.key})</span>
                      )}
                    </span>
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {rev.tempo} BPM
                    </span>
                    {lineDiff !== 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded border text-[10px] ${
                          lineDiff > 0
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                        }`}
                      >
                        {lineDiff > 0 ? `+${lineDiff}` : lineDiff} lines vs active
                      </span>
                    )}
                  </div>
                </div>

                {/* Collapsible Inspector / Side-by-Side Comparison */}
                {isDiffOpen && (
                  <div className="pt-3 border-t border-slate-800 space-y-3 bg-slate-900/60 p-3 rounded-lg">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span>Snapshot Lyrics Preview with Chords</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(rev.content);
                          alert('Copied revision lyrics to clipboard!');
                        }}
                        className="text-[11px] text-slate-400 hover:text-sky-300 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy Text</span>
                      </button>
                    </div>

                    <div className="bg-slate-950 p-3 rounded border border-slate-800/90 font-mono text-xs text-slate-300 max-h-56 overflow-y-auto whitespace-pre leading-relaxed scrollbar-none">
                      {rev.content}
                    </div>

                    {rev.notes && (
                      <div className="text-xs text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800">
                        <span className="text-slate-500 font-semibold block mb-0.5">Notes attached:</span>
                        {rev.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3.5 bg-white/5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Every revision is stored as a JSON snapshot inside your Drive <strong className="text-sky-300">/lyricflow-pro/revisions/</strong> folder.</span>
        </div>
        <span>Target: Google Drive v3 REST API</span>
      </div>
    </div>
  );
};
