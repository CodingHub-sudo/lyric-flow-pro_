import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setCachedToken,
} from './services/firebaseAuth';
import {
  loadStoredSongs,
  saveStoredSongs,
  getActiveSongId,
  setActiveSongId,
} from './services/storage';
import {
  getOrCreateAppFolder,
  saveDraftToDrive,
  saveRevisionToDrive,
  indexRevisionsFromDrive,
} from './services/googleDrive';
import { audioSynth } from './services/audioSynth';
import { SongDraft, AudioMemo, SongRevision, DriveFolderInfo, LyricSuggestion } from './types';
import { Navbar } from './components/Navbar';
import { SongSidebar } from './components/SongSidebar';
import { LyricEditor } from './components/LyricEditor';
import { ChordStudio } from './components/ChordStudio';
import { RhymeAssistant } from './components/RhymeAssistant';
import { VoiceMemoRecorder } from './components/VoiceMemoRecorder';
import { DriveSyncModal } from './components/DriveSyncModal';
import { RevisionsHub } from './components/RevisionsHub';
import { LyricCoWriter } from './components/LyricCoWriter';
import { SongAnalysisModal } from './components/SongAnalysisModal';
import { MetaTagModal } from './components/MetaTagModal';
import { VoiceToLyricModal } from './components/VoiceToLyricModal';
import { MediaStudioModal } from './components/MediaStudioModal';
import { DawStudioView } from './components/DawStudioView';
import { BookOpen, Sparkles, Music, ChevronDown, ChevronUp, X, CheckCircle2, Sliders } from 'lucide-react';

export default function App() {
  const [songs, setSongs] = useState<SongDraft[]>([]);
  const [activeSongId, setCurrentActiveSongId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'daw' | 'lyrics'>('daw');

  // Authentication & Drive
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isRevisionsModalOpen, setIsRevisionsModalOpen] = useState(false);
  const [driveFolderInfo, setDriveFolderInfo] = useState<DriveFolderInfo | null>(null);
  const [isIndexingRevisions, setIsIndexingRevisions] = useState(false);
  const [revisionToast, setRevisionToast] = useState<string | null>(null);

  // AI Suite Modals & Drawers
  const [isCoWriterOpen, setIsCoWriterOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isMetaTagModalOpen, setIsMetaTagModalOpen] = useState(false);
  const [isVoiceToLyricModalOpen, setIsVoiceToLyricModalOpen] = useState(false);
  const [isMediaStudioOpen, setIsMediaStudioOpen] = useState(false);

  // Audio Loop State
  const [isLoopPlaying, setIsLoopPlaying] = useState(false);
  const [activeChordIndex, setActiveChordIndex] = useState(0);
  const [activeBeat, setActiveBeat] = useState(0);

  // Sidebars & Drawers
  const [rhymeWord, setRhymeWord] = useState<string>('night');
  const [isRhymeDrawerOpen, setIsRhymeDrawerOpen] = useState(true);
  const [activeBottomTab, setActiveBottomTab] = useState<'chords' | 'memos'>('chords');

  // Load initial local songs
  useEffect(() => {
    const loaded = loadStoredSongs();
    setSongs(loaded);
    const savedActiveId = getActiveSongId();
    if (savedActiveId && loaded.some((s) => s.id === savedActiveId)) {
      setCurrentActiveSongId(savedActiveId);
    } else if (loaded.length > 0) {
      setCurrentActiveSongId(loaded[0].id);
      setActiveSongId(loaded[0].id);
    }
  }, []);

  // Save songs to localStorage on change
  useEffect(() => {
    if (songs.length > 0) {
      saveStoredSongs(songs);
    }
  }, [songs]);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        // Fallback or user logged out
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const activeSong = songs.find((s) => s.id === activeSongId) || songs[0] || null;

  // Change active song helper
  const handleSelectSong = (id: string) => {
    setCurrentActiveSongId(id);
    setActiveSongId(id);
    if (isLoopPlaying) {
      audioSynth.stopProgressionLoop();
      setIsLoopPlaying(false);
    }
  };

  // Update active song
  const handleUpdateSong = (updatedFields: Partial<SongDraft>) => {
    if (!activeSong) return;
    const updatedSongs = songs.map((s) =>
      s.id === activeSong.id
        ? {
            ...s,
            ...updatedFields,
            updatedAt: Date.now(),
          }
        : s
    );
    setSongs(updatedSongs);
  };

  // Create new song draft
  const handleCreateSong = () => {
    const newSong: SongDraft = {
      id: `song_${Date.now()}`,
      title: 'New Song Draft',
      status: 'draft',
      tempo: 120,
      timeSignature: '4/4',
      key: 'C',
      capo: 0,
      progression: ['C', 'G', 'Am', 'F'],
      tags: ['new'],
      content: `[Verse 1]\n[C]Write your lyrics here...\n[G]\n[Am]\n[F]\n\n[Chorus]\n[C]\n[G]\n[Am]\n[F]`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [newSong, ...songs];
    setSongs(updated);
    setCurrentActiveSongId(newSong.id);
    setActiveSongId(newSong.id);
  };

  // Duplicate song
  const handleDuplicateSong = (id: string) => {
    const target = songs.find((s) => s.id === id);
    if (!target) return;
    const duplicated: SongDraft = {
      ...target,
      id: `song_${Date.now()}`,
      title: `${target.title} (Copy)`,
      driveFileId: undefined,
      driveLastSynced: undefined,
      driveWebViewLink: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [duplicated, ...songs];
    setSongs(updated);
    setCurrentActiveSongId(duplicated.id);
    setActiveSongId(duplicated.id);
  };

  // Delete song
  const handleDeleteSong = (id: string) => {
    if (songs.length <= 1) {
      alert('You must keep at least one songwriting draft.');
      return;
    }
    const updated = songs.filter((s) => s.id !== id);
    setSongs(updated);
    if (activeSongId === id) {
      setCurrentActiveSongId(updated[0].id);
      setActiveSongId(updated[0].id);
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        setCachedToken(res.accessToken);
        // Open Drive Sync center
        setIsDriveModalOpen(true);
      }
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      alert(`Sign in failed: ${err.message || 'Please try again'}`);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setAccessToken(null);
  };

  // Load Drive folder info and index revisions whenever accessToken is available
  useEffect(() => {
    if (accessToken) {
      getOrCreateAppFolder(accessToken)
        .then((folder) => {
          setDriveFolderInfo(folder);
          if (folder.revisionsFolderId) {
            handleRefreshRevisionsIndex(folder.revisionsFolderId);
          }
        })
        .catch((err) => console.error('Failed to get app folder info:', err));
    } else {
      setDriveFolderInfo(null);
    }
  }, [accessToken]);

  // Index revisions from the /lyricflow-pro/revisions folder in Drive
  const handleRefreshRevisionsIndex = async (revFolderId?: string) => {
    if (!accessToken) return;
    const targetFolderId = revFolderId || driveFolderInfo?.revisionsFolderId;
    if (!targetFolderId) return;

    setIsIndexingRevisions(true);
    try {
      const indexedRevs = await indexRevisionsFromDrive(accessToken, targetFolderId);
      if (indexedRevs.length > 0) {
        setSongs((prevSongs) => {
          return prevSongs.map((song) => {
            const matchingRevs = indexedRevs.filter(
              (r) => r.songId === song.id || (r.title && r.title.toLowerCase() === song.title.toLowerCase())
            );
            if (matchingRevs.length === 0) return song;

            const existingRevs = song.revisions || [];
            const combined = [...existingRevs];
            for (const r of matchingRevs) {
              if (!combined.some((ex) => ex.id === r.id || (r.driveFileId && ex.driveFileId === r.driveFileId))) {
                combined.push(r);
              }
            }
            combined.sort((a, b) => b.timestamp - a.timestamp);
            return {
              ...song,
              revisions: combined,
              revisionsFolderId: targetFolderId,
            };
          });
        });
        setRevisionToast(`Indexed ${indexedRevs.length} revisions from /lyricflow-pro/revisions!`);
        setTimeout(() => setRevisionToast(null), 3000);
      }
    } catch (err: any) {
      console.warn('Could not index revisions from Drive:', err);
    } finally {
      setIsIndexingRevisions(false);
    }
  };

  // Create a new snapshot of active song into /revisions folder
  const handleCreateRevision = async (label: string) => {
    if (!activeSong) return;

    const lines = activeSong.content.split('\n');
    const words = activeSong.content.replace(/\[[^\]]*\]/g, '').trim().split(/\s+/).filter(Boolean);
    const chordsInContent = (activeSong.content.match(/\[([A-G][#b]?[^\]]*)\]/g) || []).length;

    const revisionId = `rev_${Date.now()}`;
    const newRevision: SongRevision = {
      id: revisionId,
      songId: activeSong.id,
      title: activeSong.title,
      versionLabel: label.trim() || `Snapshot ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      content: activeSong.content,
      progression: [...activeSong.progression],
      key: activeSong.key,
      tempo: activeSong.tempo,
      timeSignature: activeSong.timeSignature,
      capo: activeSong.capo,
      timestamp: Date.now(),
      notes: activeSong.rhymeNotes || undefined,
      summary: {
        lineCount: lines.length,
        wordCount: words.length,
        chordCount: chordsInContent,
        progressionSummary: activeSong.progression.join(' - '),
      },
    };

    // If connected to Google Drive, upload snapshot into /lyricflow-pro/revisions
    if (accessToken) {
      try {
        const folder = driveFolderInfo || (await getOrCreateAppFolder(accessToken));
        setDriveFolderInfo(folder);
        if (folder.revisionsFolderId) {
          const res = await saveRevisionToDrive(
            accessToken,
            activeSong,
            folder.revisionsFolderId,
            newRevision.versionLabel
          );
          newRevision.driveFileId = res.fileId;
          newRevision.driveWebViewLink = res.webViewLink;
        }
      } catch (err) {
        console.error('Failed to save revision to Drive:', err);
      }
    }

    const currentRevisions = activeSong.revisions || [];
    const updatedRevisions = [newRevision, ...currentRevisions];
    handleUpdateSong({
      revisions: updatedRevisions,
      activeRevisionId: newRevision.id,
    });

    setRevisionToast(
      `Snapshot "${newRevision.versionLabel}" saved${newRevision.driveFileId ? ' to Google Drive /revisions' : ''}!`
    );
    setTimeout(() => setRevisionToast(null), 3000);
  };

  // Restore snapshot into active workspace
  const handleRestoreRevision = (revision: SongRevision) => {
    if (!activeSong) return;

    handleUpdateSong({
      content: revision.content,
      progression: [...revision.progression],
      key: revision.key,
      tempo: revision.tempo,
      timeSignature: revision.timeSignature,
      capo: revision.capo || 0,
      activeRevisionId: revision.id,
    });

    setRevisionToast(`Restored version "${revision.versionLabel}" into workspace!`);
    setTimeout(() => setRevisionToast(null), 3500);
  };

  // Branch off snapshot into a brand new song draft
  const handleBranchRevision = (revision: SongRevision) => {
    const branchSong: SongDraft = {
      id: `song_${Date.now()}`,
      title: `${revision.title || activeSong?.title || 'Song'} (${revision.versionLabel})`,
      subtitle: `Branched from revision snapshot taken at ${new Date(revision.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      status: 'in_progress',
      tempo: revision.tempo,
      timeSignature: revision.timeSignature,
      key: revision.key,
      capo: revision.capo || 0,
      progression: [...revision.progression],
      tags: ['branch', 'revision'],
      content: revision.content,
      revisions: [revision],
      activeRevisionId: revision.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setSongs([branchSong, ...songs]);
    setCurrentActiveSongId(branchSong.id);
    setActiveSongId(branchSong.id);
    setIsRevisionsModalOpen(false);

    setRevisionToast(`Branched new draft: "${branchSong.title}"!`);
    setTimeout(() => setRevisionToast(null), 3500);
  };

  // Manual Google Drive Sync
  const handleManualSync = async () => {
    if (!accessToken) {
      setIsDriveModalOpen(true);
      return;
    }
    if (!activeSong) return;

    setIsSyncing(true);
    try {
      const folder = await getOrCreateAppFolder(accessToken);
      const res = await saveDraftToDrive(accessToken, activeSong, folder.id);
      handleUpdateSong({
        driveFileId: res.fileId,
        driveWebViewLink: res.webViewLink,
        driveLastSynced: Date.now(),
      });
    } catch (e) {
      console.error('Failed to sync draft to drive:', e);
      alert('Could not sync to Google Drive. Check permissions or network.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle audio progression loop
  const handleToggleLoop = () => {
    if (isLoopPlaying) {
      audioSynth.stopProgressionLoop();
      setIsLoopPlaying(false);
    } else {
      if (!activeSong || !activeSong.progression || activeSong.progression.length === 0) return;
      audioSynth.startProgressionLoop({
        chords: activeSong.progression,
        bpm: activeSong.tempo || 120,
        timeSignature: activeSong.timeSignature || '4/4',
        onStep: (step, beat) => {
          setActiveChordIndex(step);
          setActiveBeat(beat);
        },
      });
      setIsLoopPlaying(true);
    }
  };

  // Add voice memo
  const handleAddRecording = (memo: AudioMemo) => {
    if (!activeSong) return;
    const existing = activeSong.audioRecordings || [];
    handleUpdateSong({ audioRecordings: [memo, ...existing] });
  };

  // Delete voice memo
  const handleDeleteRecording = (memoId: string) => {
    if (!activeSong) return;
    const existing = activeSong.audioRecordings || [];
    handleUpdateSong({ audioRecordings: existing.filter((m) => m.id !== memoId) });
  };

  // When word is selected in lyrics
  const handleSelectWordForRhyme = (word: string) => {
    setRhymeWord(word);
    setIsRhymeDrawerOpen(true);
  };

  // Save word to active song's rhyme bank
  const handleSaveToRhymeBank = (word: string) => {
    if (!activeSong) return;
    const currentNotes = activeSong.rhymeNotes || '';
    const updated = currentNotes ? `${currentNotes}, ${word}` : word;
    handleUpdateSong({ rhymeNotes: updated });
  };

  // Insert word into lyrics
  const handleInsertWordIntoLyrics = (word: string) => {
    if (!activeSong) return;
    handleUpdateSong({ content: `${activeSong.content} ${word}` });
  };

  // Import song from Drive
  const handleImportSongFromDrive = (importedSong: SongDraft) => {
    // Check if already in list
    const existingIndex = songs.findIndex((s) => s.id === importedSong.id || s.driveFileId === importedSong.driveFileId);
    if (existingIndex >= 0) {
      const updated = [...songs];
      updated[existingIndex] = importedSong;
      setSongs(updated);
      setCurrentActiveSongId(importedSong.id);
    } else {
      setSongs([importedSong, ...songs]);
      setCurrentActiveSongId(importedSong.id);
    }
  };

  const handleSongSynced = (songId: string, driveFileId: string, webViewLink?: string) => {
    const updatedSongs = songs.map((s) =>
      s.id === songId
        ? {
            ...s,
            driveFileId,
            driveWebViewLink: webViewLink || s.driveWebViewLink,
            driveLastSynced: Date.now(),
          }
        : s
    );
    setSongs(updatedSongs);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Navigation */}
      <Navbar
        activeSong={activeSong}
        currentUser={currentUser}
        accessToken={accessToken}
        isSyncing={isSyncing}
        isLoopPlaying={isLoopPlaying}
        activeChordIndex={activeChordIndex}
        activeBeat={activeBeat}
        activeView={activeView}
        onViewChange={(v) => setActiveView(v)}
        onToggleLoop={handleToggleLoop}
        onManualSync={handleManualSync}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        onOpenRevisionsModal={() => setIsRevisionsModalOpen(true)}
        onOpenMediaStudio={() => setIsMediaStudioOpen(true)}
      />

      {/* Main Workspace Area */}
      {activeView === 'daw' ? (
        activeSong ? (
          <DawStudioView
            song={activeSong}
            onUpdateSong={handleUpdateSong}
            onOpenMediaStudio={() => setIsMediaStudioOpen(true)}
          />
        ) : (
          <div className="p-12 text-center text-slate-500 font-mono">
            No song selected. Please create or select a track.
          </div>
        )
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Song Drafts Sidebar */}
          <SongSidebar
            songs={songs}
            activeSongId={activeSongId}
            onSelectSong={handleSelectSong}
            onCreateSong={handleCreateSong}
            onDuplicateSong={handleDuplicateSong}
            onDeleteSong={handleDeleteSong}
            onOpenDriveImport={() => setIsDriveModalOpen(true)}
            isDriveConnected={!!accessToken}
          />

          {/* Center: Main Lyric & Chord Workspace */}
          <div className="flex-1 flex flex-col overflow-y-auto h-[calc(100vh-57px)]">
            {activeSong ? (
              <>
                {/* Lyrics Editor with Live Chords & Syllable Gutter */}
                <LyricEditor
                  song={activeSong}
                  onUpdateSong={handleUpdateSong}
                  onSelectWordForRhyme={handleSelectWordForRhyme}
                  onOpenRevisions={() => setIsRevisionsModalOpen(true)}
                  onQuickSnapshot={() => handleCreateRevision('Quick Snapshot')}
                  onOpenCoWriter={() => setIsCoWriterOpen(!isCoWriterOpen)}
                  onOpenAnalysis={() => setIsAnalysisModalOpen(true)}
                  onOpenVoiceToLyric={() => setIsVoiceToLyricModalOpen(true)}
                  onOpenMetaTags={() => setIsMetaTagModalOpen(true)}
                />

              {/* Bottom Expandable Tabs: Chord Studio & Voice Memos */}
              <div className="border-t border-slate-800 bg-slate-900/90">
                <div className="flex items-center justify-between px-4 lg:px-6 py-2 border-b border-slate-800/80 bg-slate-950/60">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveBottomTab('chords')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                        activeBottomTab === 'chords'
                          ? 'bg-sky-500 text-slate-950'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Music className="w-3.5 h-3.5" />
                      <span>Chord Studio & Progressions</span>
                    </button>

                    <button
                      onClick={() => setActiveBottomTab('memos')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                        activeBottomTab === 'memos'
                          ? 'bg-sky-500 text-slate-950'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>Voice Memos ({activeSong.audioRecordings?.length || 0})</span>
                    </button>
                  </div>

                  {/* Toggle Rhyme Drawer button on smaller screens */}
                  <button
                    onClick={() => setIsRhymeDrawerOpen(!isRhymeDrawerOpen)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-sky-300 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    <span>{isRhymeDrawerOpen ? 'Hide Rhymes' : 'Rhyme Assistant'}</span>
                  </button>
                </div>

                {activeBottomTab === 'chords' ? (
                  <ChordStudio
                    song={activeSong}
                    isLoopPlaying={isLoopPlaying}
                    activeChordIndex={activeChordIndex}
                    activeBeat={activeBeat}
                    onToggleLoop={handleToggleLoop}
                    onUpdateSong={handleUpdateSong}
                  />
                ) : (
                  <VoiceMemoRecorder
                    recordings={activeSong.audioRecordings || []}
                    onAddRecording={handleAddRecording}
                    onDeleteRecording={handleDeleteRecording}
                    onRefineToLyrics={() => setIsVoiceToLyricModalOpen(true)}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500">
              Select or create a song draft to begin writing.
            </div>
          )}
        </div>

        {/* Co-Writer AI Assistant Panel */}
        {isCoWriterOpen && activeSong && (
          <LyricCoWriter
            song={activeSong}
            onInsertLyrics={handleInsertWordIntoLyrics}
            onClose={() => setIsCoWriterOpen(false)}
          />
        )}

        {/* Right: Rhyme & Word Craft Assistant */}
        {isRhymeDrawerOpen && (
          <RhymeAssistant
            initialWord={rhymeWord}
            onSaveToRhymeBank={handleSaveToRhymeBank}
            onInsertWord={handleInsertWordIntoLyrics}
            onClose={() => setIsRhymeDrawerOpen(false)}
          />
        )}
      </div>
      )}

      {/* Floating Revisions / Sync Toast */}
      {revisionToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-sky-500/40 text-slate-100 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{revisionToast}</span>
          <button
            onClick={() => setRevisionToast(null)}
            className="text-slate-500 hover:text-slate-300 ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Revisions Central Hub Modal */}
      {isRevisionsModalOpen && activeSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl my-auto">
            <RevisionsHub
              song={activeSong}
              allSongs={songs}
              folderInfo={driveFolderInfo}
              accessToken={accessToken}
              isIndexing={isIndexingRevisions}
              onRefreshIndex={() => handleRefreshRevisionsIndex()}
              onCreateRevision={handleCreateRevision}
              onRestoreRevision={handleRestoreRevision}
              onBranchRevision={handleBranchRevision}
              onClose={() => setIsRevisionsModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Google Drive Workspace Modal */}
      <DriveSyncModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        currentUser={currentUser}
        accessToken={accessToken}
        activeSong={activeSong}
        allSongs={songs}
        onImportSong={handleImportSongFromDrive}
        onRestoreRevision={handleRestoreRevision}
        onSongSynced={handleSongSynced}
        onGoogleSignIn={handleGoogleSignIn}
      />

      {/* AI Automated Song Analysis Modal */}
      {activeSong && (
        <SongAnalysisModal
          song={activeSong}
          isOpen={isAnalysisModalOpen}
          onClose={() => setIsAnalysisModalOpen(false)}
          onApplyTipsToNotes={(tips) =>
            handleUpdateSong({
              ...activeSong,
              notes: (activeSong.notes ? activeSong.notes + '\n\n' : '') + tips,
            })
          }
        />
      )}

      {/* AI Natural Language Meta-Tag Modal */}
      {activeSong && (
        <MetaTagModal
          song={activeSong}
          isOpen={isMetaTagModalOpen}
          onClose={() => setIsMetaTagModalOpen(false)}
          onApplyMetadata={(updates) =>
            handleUpdateSong({
              ...activeSong,
              ...updates,
            })
          }
        />
      )}

      {/* AI Voice-to-Lyric Refinement Modal */}
      {activeSong && (
        <VoiceToLyricModal
          song={activeSong}
          isOpen={isVoiceToLyricModalOpen}
          onClose={() => setIsVoiceToLyricModalOpen(false)}
          onInsertLyrics={handleInsertWordIntoLyrics}
          onReplaceLyrics={(newLyrics) =>
            handleUpdateSong({
              ...activeSong,
              content: newLyrics,
            })
          }
        />
      )}

      {/* AI Media Studio (Lyria Music & Veo Video) */}
      {activeSong && (
        <MediaStudioModal
          song={activeSong}
          isOpen={isMediaStudioOpen}
          onClose={() => setIsMediaStudioOpen(false)}
          onAddAudioMemo={handleAddRecording}
        />
      )}
    </div>
  );
}
