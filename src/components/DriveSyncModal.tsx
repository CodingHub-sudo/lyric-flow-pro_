import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  FolderOpen,
  Cloud,
  CloudUpload,
  RefreshCw,
  ExternalLink,
  FileDown,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Search,
  History,
  GitBranch,
  RotateCcw,
} from 'lucide-react';
import { SongDraft, DriveFileSummary, DriveFolderInfo, SongRevision } from '../types';
import {
  getOrCreateAppFolder,
  listFolderFiles,
  listRevisionsFiles,
  saveDraftToDrive,
  saveRevisionToDrive,
  loadDraftFromDrive,
  loadRevisionFromDrive,
  openGoogleDrivePicker,
} from '../services/googleDrive';

interface DriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  accessToken: string | null;
  activeSong: SongDraft | null;
  allSongs: SongDraft[];
  onImportSong: (song: SongDraft) => void;
  onRestoreRevision?: (revision: SongRevision) => void;
  onSongSynced: (songId: string, driveFileId: string, webViewLink?: string) => void;
  onGoogleSignIn: () => void;
}

export const DriveSyncModal: React.FC<DriveSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  accessToken,
  activeSong,
  allSongs,
  onImportSong,
  onRestoreRevision,
  onSongSynced,
  onGoogleSignIn,
}) => {
  const [folderInfo, setFolderInfo] = useState<DriveFolderInfo | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFileSummary[]>([]);
  const [revisionFiles, setRevisionFiles] = useState<DriveFileSummary[]>([]);
  const [activeTab, setActiveTab] = useState<'drafts' | 'revisions'>('drafts');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoCreateRevision, setAutoCreateRevision] = useState(true);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (isOpen && accessToken) {
      loadDriveData();
    }
  }, [isOpen, accessToken]);

  const loadDriveData = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setSyncMessage(null);
    try {
      // Find or create 'lyricflow-pro' folder and its 'revisions' subfolder
      const folder = await getOrCreateAppFolder(accessToken);
      setFolderInfo(folder);

      // List all master drafts in 'lyricflow-pro' folder
      const files = await listFolderFiles(accessToken, folder.id);
      setDriveFiles(files);

      // Explicitly list all revisions in 'lyricflow-pro/revisions' folder
      if (folder.revisionsFolderId) {
        const revs = await listRevisionsFiles(accessToken, folder.revisionsFolderId);
        setRevisionFiles(revs);
      }
    } catch (err: any) {
      console.error('Error fetching drive data:', err);
      setSyncMessage({
        type: 'error',
        text: err.message || 'Failed to connect to Google Drive folder.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncCurrentSong = async () => {
    if (!accessToken || !activeSong) return;
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const folder = folderInfo || (await getOrCreateAppFolder(accessToken));
      // Save primary draft
      const res = await saveDraftToDrive(accessToken, activeSong, folder.id);
      onSongSynced(activeSong.id, res.fileId, res.webViewLink);

      // Also version it inside /lyricflow-pro/revisions
      if (autoCreateRevision && folder.revisionsFolderId) {
        await saveRevisionToDrive(
          accessToken,
          activeSong,
          folder.revisionsFolderId,
          `Sync ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        );
      }

      setSyncMessage({
        type: 'success',
        text: `"${activeSong.title}" saved to /lyricflow-pro ${
          autoCreateRevision ? 'and versioned in /revisions' : ''
        }!`,
      });
      // Refresh list
      loadDriveData();
    } catch (err: any) {
      setSyncMessage({
        type: 'error',
        text: err.message || 'Failed to sync to Google Drive.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncAllSongs = async () => {
    if (!accessToken) return;
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const folder = folderInfo || (await getOrCreateAppFolder(accessToken));
      let count = 0;
      for (const s of allSongs) {
        const res = await saveDraftToDrive(accessToken, s, folder.id);
        onSongSynced(s.id, res.fileId, res.webViewLink);
        if (autoCreateRevision && folder.revisionsFolderId) {
          await saveRevisionToDrive(accessToken, s, folder.revisionsFolderId, 'Batch Workspace Sync');
        }
        count++;
      }
      setSyncMessage({
        type: 'success',
        text: `All ${count} song drafts saved and versioned in /lyricflow-pro/revisions!`,
      });
      loadDriveData();
    } catch (err: any) {
      setSyncMessage({
        type: 'error',
        text: err.message || 'Failed to sync drafts to Drive.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportFile = async (fileId: string) => {
    if (!accessToken) return;
    setIsLoading(true);
    setSyncMessage(null);
    try {
      const imported = await loadDraftFromDrive(accessToken, fileId);
      onImportSong(imported);
      setSyncMessage({
        type: 'success',
        text: `Imported "${imported.title}" from Google Drive into LyricFlow Pro.`,
      });
    } catch (err: any) {
      setSyncMessage({
        type: 'error',
        text: err.message || 'Failed to import file from Google Drive.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreRevisionFile = async (fileId: string) => {
    if (!accessToken) return;
    setIsLoading(true);
    setSyncMessage(null);
    try {
      const rev = await loadRevisionFromDrive(accessToken, fileId);
      if (onRestoreRevision) {
        onRestoreRevision(rev);
        setSyncMessage({
          type: 'success',
          text: `Restored snapshot "${rev.versionLabel}" for "${rev.title}" into active workspace!`,
        });
      }
    } catch (err: any) {
      setSyncMessage({
        type: 'error',
        text: err.message || 'Failed to load revision from Google Drive.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchPicker = () => {
    if (!accessToken) return;
    openGoogleDrivePicker({
      token: accessToken,
      onSelectFile: (fileId) => {
        handleImportFile(fileId);
      },
      onError: () => {
        setSyncMessage({
          type: 'error',
          text: 'Google Drive file picker closed or unavailable.',
        });
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-950/80 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>Google Drive Workspace Hub</span>
                <span className="font-mono text-xs text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                  @lyricflow-pro
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Synchronized folder hierarchy: active drafts in <strong className="text-slate-300">/lyricflow-pro</strong> and version history in <strong className="text-sky-300">/revisions</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Connection Status Banner */}
          {!currentUser || !accessToken ? (
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-center">
              <Cloud className="w-8 h-8 mx-auto text-sky-400 opacity-80" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-200">
                  Connect your Google Drive
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Sign in with Google to automatically recognize and index the{' '}
                  <strong className="text-slate-200">@lyricflow-pro</strong> folder and{' '}
                  <strong className="text-sky-300">/revisions</strong> subfolder in your Google Drive.
                </p>
              </div>

              <button
                onClick={onGoogleSignIn}
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
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
                <span>Sign in with Google</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {currentUser.photoURL && (
                    <img
                      src={currentUser.photoURL}
                      alt="User"
                      className="w-7 h-7 rounded-full border border-slate-700"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div>
                    <span className="text-xs font-semibold text-slate-200">
                      Connected as {currentUser.displayName || currentUser.email}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                      <span>/lyricflow-pro</span>
                      <span>›</span>
                      <span className="text-sky-300">/revisions ({revisionFiles.length} files)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {folderInfo?.webViewLink && (
                    <a
                      href={folderInfo.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs transition-colors"
                      title="Open lyricflow-pro in Drive"
                    >
                      <span>Drive Root</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  )}
                  {folderInfo?.revisionsWebViewLink && (
                    <a
                      href={folderInfo.revisionsWebViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-md text-xs transition-colors"
                      title="Open /revisions folder in Drive"
                    >
                      <span>Revisions Folder</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Versioning checkbox */}
              <label className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoCreateRevision}
                  onChange={(e) => setAutoCreateRevision(e.target.checked)}
                  className="rounded border-slate-700 text-sky-500 focus:ring-0 focus:ring-offset-0 bg-slate-900"
                />
                <span>Automatically snapshot a version into <strong className="text-sky-300">/revisions</strong> when syncing</span>
              </label>

              {/* Sync Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                {activeSong && (
                  <button
                    onClick={handleSyncCurrentSong}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span>Sync "{activeSong.title}" + Snapshot</span>
                  </button>
                )}

                <button
                  onClick={handleSyncAllSongs}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync All ({allSongs.length}) Songs</span>
                </button>

                <button
                  onClick={handleLaunchPicker}
                  className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition-all cursor-pointer"
                  title="Browse any file in Google Drive via native picker"
                >
                  <Search className="w-3.5 h-3.5 text-sky-400" />
                  <span>Browse Entire Drive</span>
                </button>
              </div>
            </div>
          )}

          {/* Sync status alert feedback */}
          {syncMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                syncMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {syncMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <span>{syncMessage.text}</span>
            </div>
          )}

          {/* Dual Folder Tabs: Drafts vs Revisions Hub */}
          {currentUser && accessToken && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('drafts')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === 'drafts'
                        ? 'bg-slate-800 text-slate-100 font-semibold border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    <span>Master Drafts ({driveFiles.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('revisions')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === 'revisions'
                        ? 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <History className="w-3.5 h-3.5 text-sky-400" />
                    <span>Revisions Central Hub ({revisionFiles.length})</span>
                  </button>
                </div>

                <button
                  onClick={loadDriveData}
                  disabled={isLoading}
                  className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Refresh Drive folders"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Indexing Google Drive files...
                </div>
              ) : activeTab === 'drafts' ? (
                /* Primary Drafts List */
                driveFiles.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
                    <p>No draft files found in your @lyricflow-pro folder yet.</p>
                    <p className="text-[11px] text-slate-600">
                      Click "Sync Now" above to backup your current draft into Google Drive!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {driveFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-2.5 bg-slate-950/70 hover:bg-slate-800/60 border border-slate-800 rounded-lg flex items-center justify-between gap-3 text-xs transition-colors group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                            <span className="font-medium text-slate-200 truncate">
                              {file.name.replace(/\.lyricflow\.json|\.json$/gi, '')}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                            Modified: {new Date(file.modifiedTime).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-white transition-colors"
                              title="Open file in Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            onClick={() => handleImportFile(file.id)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-slate-200 border border-slate-700 rounded text-xs font-medium transition-colors"
                            title="Import this draft into LyricFlow Pro"
                          >
                            <FileDown className="w-3 h-3" />
                            <span>Open</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Revisions Subfolder Files List */
                revisionFiles.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
                    <History className="w-6 h-6 mx-auto text-slate-600" />
                    <p>No revision snapshots found in <span className="font-mono text-sky-300">/lyricflow-pro/revisions</span> yet.</p>
                    <p className="text-[11px] text-slate-600">
                      Snapshots taken via the Revisions Hub or on sync will appear here and can be restored anytime.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {revisionFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-2.5 bg-slate-950/70 hover:bg-slate-800/60 border border-slate-800 rounded-lg flex items-center justify-between gap-3 text-xs transition-colors group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <History className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                            <span className="font-medium text-slate-200 truncate">
                              {file.name.replace(/\.json$/gi, '')}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                            Snapshot Time: {new Date(file.modifiedTime).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-white transition-colors"
                              title="Open revision in Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            onClick={() => handleRestoreRevisionFile(file.id)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded text-xs font-semibold transition-colors shadow-sm"
                            title="Restore lyrics and chord progression from this revision"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Folder target: Google Drive / lyricflow-pro / revisions</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

