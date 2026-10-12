import React from 'react';
import { User } from 'firebase/auth';
import {
  Music,
  Play,
  Square,
  Cloud,
  CloudCheck,
  CloudUpload,
  FolderOpen,
  LogOut,
  Sparkles,
  Volume2,
  History,
} from 'lucide-react';
import { SongDraft } from '../types';

interface NavbarProps {
  activeSong: SongDraft | null;
  currentUser: User | null;
  accessToken: string | null;
  isSyncing: boolean;
  isLoopPlaying: boolean;
  activeChordIndex: number;
  activeBeat: number;
  activeView?: 'daw' | 'lyrics';
  onViewChange?: (view: 'daw' | 'lyrics') => void;
  onToggleLoop: () => void;
  onManualSync: () => void;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  onOpenDriveModal: () => void;
  onOpenRevisionsModal?: () => void;
  onOpenMediaStudio?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSong,
  currentUser,
  accessToken,
  isSyncing,
  isLoopPlaying,
  activeChordIndex,
  activeBeat,
  activeView = 'daw',
  onViewChange,
  onToggleLoop,
  onManualSync,
  onGoogleSignIn,
  onSignOut,
  onOpenDriveModal,
  onOpenRevisionsModal,
  onOpenMediaStudio,
}) => {
  return (
    <header className="bg-[#030712]/90 backdrop-blur-2xl text-slate-100 border-b border-white/10 sticky top-0 z-30 px-3 lg:px-5 py-2 shadow-2xl relative">
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_10px_#38bdf8]" />
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-slate-100 text-base">
                Lyric Flow <span className="text-sky-400 font-bold">Pro</span>
              </span>
              <span className="text-[9px] font-mono font-medium tracking-wider uppercase px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-500/30">
                DAW WORKSTATION
              </span>
            </div>
          </div>

          {/* View Mode Toggle: Futuristic DAW vs Lyric Desk */}
          {onViewChange && (
            <div className="hidden md:flex items-center bg-slate-950 p-0.5 rounded-lg border border-white/10 ml-2">
              <button
                onClick={() => onViewChange('daw')}
                className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                  activeView === 'daw'
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                DAW Console
              </button>
              <button
                onClick={() => onViewChange('lyrics')}
                className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                  activeView === 'lyrics'
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Lyric Studio
              </button>
            </div>
          )}
        </div>

        {/* Center: Progression Playback / Metronome Quick Control */}
        {activeSong && activeSong.progression && activeSong.progression.length > 0 && (
          <div className="hidden md:flex items-center gap-3 bg-slate-950/80 px-3 py-1.5 rounded-full border border-slate-800/80">
            <button
              onClick={onToggleLoop}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isLoopPlaying
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              title={isLoopPlaying ? 'Stop Chord Progression Loop' : 'Play Progression Loop'}
            >
              {isLoopPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isLoopPlaying ? 'Stop Loop' : 'Play Chords'}</span>
            </button>

            <div className="flex items-center gap-1 text-xs">
              {activeSong.progression.map((chord, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    isLoopPlaying && activeChordIndex === idx
                      ? 'bg-sky-400 text-slate-950 font-bold scale-105'
                      : 'bg-slate-900 text-slate-300 border border-slate-800'
                  }`}
                >
                  {chord}
                </span>
              ))}
            </div>

            <div className="h-3 w-px bg-slate-800 mx-1" />

            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <span>{activeSong.tempo} BPM</span>
              <span>•</span>
              <span>Key {activeSong.key}</span>
            </div>

            {isLoopPlaying && (
              <div className="flex items-center gap-1 ml-1">
                {[0, 1, 2, 3].map((b) => (
                  <span
                    key={b}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      activeBeat === b ? 'bg-sky-400 scale-125' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Right: Drive Status & Google Auth */}
        <div className="flex items-center gap-2">
          {/* AI Media Studio (Lyria & Veo) */}
          {onOpenMediaStudio && (
            <button
              onClick={onOpenMediaStudio}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-sky-300 hover:text-sky-200 bg-sky-500/10 border border-sky-500/30 rounded-lg hover:bg-sky-500/20 transition-all cursor-pointer"
              title="Generate Music tracks (Lyria 3) and Cinematic Videos (Veo 3.1)"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline font-medium">Media Studio</span>
            </button>
          )}

          {/* Quick Revisions Hub Button */}
          {onOpenRevisionsModal && (
            <button
              onClick={onOpenRevisionsModal}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-slate-100 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all cursor-pointer"
              title="Open Revisions Central Hub (/lyricflow-pro/revisions)"
            >
              <History className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline font-medium">Revisions</span>
              {activeSong?.revisions && activeSong.revisions.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-[10px] font-mono font-bold text-sky-300">
                  {activeSong.revisions.length}
                </span>
              )}
            </button>
          )}

          {/* Google Drive Status & Trigger */}
          {currentUser && accessToken ? (
            <div className="flex items-center gap-1 bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-lg">
              <button
                onClick={onOpenDriveModal}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
                title="Manage Google Drive @lyricflow-pro sync"
              >
                <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-mono text-[11px] font-medium text-sky-300">@lyricflow-pro</span>
              </button>

              <button
                onClick={onManualSync}
                disabled={isSyncing}
                className={`p-1 rounded text-slate-400 hover:text-white transition-colors ${
                  isSyncing ? 'animate-spin text-sky-400' : ''
                }`}
                title="Save & Sync current song to Google Drive"
              >
                {isSyncing ? (
                  <CloudUpload className="w-3.5 h-3.5" />
                ) : activeSong?.driveFileId ? (
                  <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Cloud className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenDriveModal}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-950/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
            >
              <Cloud className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Drive Sync</span>
            </button>
          )}

          {/* User Sign In / Profile */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-slate-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 text-xs flex items-center justify-center font-bold">
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <button
                onClick={onSignOut}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                title="Sign out of Google"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onGoogleSignIn}
              className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm"
              title="Sign in with Google to sync with @lyricflow-pro folder"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>Connect Drive</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
