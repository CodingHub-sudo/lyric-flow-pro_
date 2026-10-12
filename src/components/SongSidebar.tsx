import React, { useState } from 'react';
import {
  Plus,
  Search,
  Music2,
  Trash2,
  Copy,
  CloudCheck,
  CloudUpload,
  SlidersHorizontal,
  FileDown,
  History,
} from 'lucide-react';
import { SongDraft, SongStatus } from '../types';

interface SongSidebarProps {
  songs: SongDraft[];
  activeSongId: string | null;
  onSelectSong: (id: string) => void;
  onCreateSong: () => void;
  onDuplicateSong: (id: string) => void;
  onDeleteSong: (id: string) => void;
  onOpenDriveImport: () => void;
  isDriveConnected: boolean;
}

const STATUS_LABELS: Record<SongStatus, { label: string; bg: string; text: string }> = {
  idea: { label: 'Idea', bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-400' },
  draft: { label: 'Draft', bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400' },
  in_progress: { label: 'In Progress', bg: 'bg-sky-500/10 border-sky-500/30', text: 'text-sky-400' },
  polished: { label: 'Polished', bg: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-400' },
  finished: { label: 'Finished', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400' },
};

export const SongSidebar: React.FC<SongSidebarProps> = ({
  songs,
  activeSongId,
  onSelectSong,
  onCreateSong,
  onDuplicateSong,
  onDeleteSong,
  onOpenDriveImport,
  isDriveConnected,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredSongs = songs.filter((song) => {
    const matchesSearch =
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (song.subtitle && song.subtitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (song.genre && song.genre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      song.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || song.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <aside className="w-full md:w-80 lg:w-88 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-[calc(100vh-57px)]">
      {/* Top Header with Create Action */}
      <div className="p-3.5 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Drafts ({songs.length})
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onCreateSong}
              className="flex items-center gap-1 bg-sky-500 hover:bg-sky-400 text-slate-950 px-2.5 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all active:scale-95"
              title="Create New Song Draft"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Song</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search lyrics, title, chords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/60 transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          {['all', 'idea', 'in_progress', 'polished', 'finished'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-2 py-0.5 rounded-full capitalize whitespace-nowrap transition-colors ${
                statusFilter === filter
                  ? 'bg-slate-700 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {filter === 'all' ? 'All' : filter.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Song List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {filteredSongs.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs space-y-2">
            <Music2 className="w-8 h-8 mx-auto text-slate-600 stroke-[1.5]" />
            <p>No drafts match your search.</p>
            <button
              onClick={onCreateSong}
              className="text-sky-400 hover:underline font-medium block mx-auto"
            >
              Start a new song draft
            </button>
          </div>
        ) : (
          filteredSongs.map((song) => {
            const isActive = song.id === activeSongId;
            const statusConfig = STATUS_LABELS[song.status] || STATUS_LABELS.draft;

            return (
              <div
                key={song.id}
                onClick={() => onSelectSong(song.id)}
                className={`group relative p-3 rounded-lg border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-800/90 border-sky-500/50 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-xs font-semibold text-slate-200 truncate group-hover:text-sky-300 transition-colors">
                        {song.title || 'Untitled Draft'}
                      </h3>
                      {song.driveFileId && (
                        <span title="Synced to Google Drive @lyricflow-pro">
                          <CloudCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        </span>
                      )}
                      {song.revisions && song.revisions.length > 0 && (
                        <span
                          className="text-[9px] text-sky-400/90 bg-sky-500/10 border border-sky-500/20 px-1 rounded font-mono flex items-center gap-0.5"
                          title={`${song.revisions.length} revision snapshots`}
                        >
                          <History className="w-2.5 h-2.5" />
                          <span>{song.revisions.length}</span>
                        </span>
                      )}
                    </div>
                    {song.subtitle && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{song.subtitle}</p>
                    )}
                  </div>

                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-mono ${statusConfig.bg} ${statusConfig.text}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                {/* Song Musical Metatags */}
                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 font-mono">
                  <span className="text-sky-300/90 font-medium">Key {song.key}</span>
                  <span>•</span>
                  <span>{song.tempo} BPM</span>
                  {song.capo > 0 && (
                    <>
                      <span>•</span>
                      <span>Capo {song.capo}</span>
                    </>
                  )}
                </div>

                {/* Progression preview snippet */}
                {song.progression && song.progression.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-[10px] font-mono text-slate-400 overflow-hidden">
                    <span className="text-slate-500">Chords:</span>
                    {song.progression.slice(0, 4).map((ch, i) => (
                      <span key={i} className="px-1 rounded bg-slate-900 border border-slate-800">
                        {ch}
                      </span>
                    ))}
                    {song.progression.length > 4 && <span className="text-slate-500">+more</span>}
                  </div>
                )}

                {/* Quick actions hover toolbar */}
                <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded px-1 py-0.5 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSong(song.id);
                    }}
                    className="p-1 hover:text-sky-400 text-slate-400 transition-colors"
                    title="Duplicate Draft"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSong(song.id);
                    }}
                    className="p-1 hover:text-red-400 text-slate-400 transition-colors"
                    title="Delete Draft"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer: Quick Drive Import */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <button
          onClick={onOpenDriveImport}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-all"
        >
          <FileDown className="w-3.5 h-3.5 text-sky-400" />
          <span>Browse @lyricflow-pro Drive Files</span>
        </button>
      </div>
    </aside>
  );
};
