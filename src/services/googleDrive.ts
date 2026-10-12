import { SongDraft, DriveFileSummary, DriveFolderInfo, SongRevision } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

const FOLDER_NAME = 'LYRIC_FLOW_PRO_OFFICIAL';
const REVISIONS_FOLDER_NAME = 'revisions';

/**
 * Searches for the 'LYRIC_FLOW_PRO_OFFICIAL' folder in user's Drive.
 * If not found, creates it.
 * Also locates or creates the nested 'revisions' folder within 'LYRIC_FLOW_PRO_OFFICIAL'.
 */
export async function getOrCreateAppFolder(token: string): Promise<DriveFolderInfo> {
  const query = encodeURIComponent(`name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`;

  const response = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to locate Drive folder: ${errorText}`);
  }

  const data = await response.json();
  let appFolder: DriveFolderInfo;

  if (data.files && data.files.length > 0) {
    appFolder = {
      id: data.files[0].id,
      name: data.files[0].name,
      webViewLink: data.files[0].webViewLink,
    };
  } else {
    // Create 'LYRIC_FLOW_PRO_OFFICIAL' folder
    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'LyricFlow Pro Songwriting Drafts & Chord Progressions',
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create '${FOLDER_NAME}' folder in Google Drive: ${errorText}`);
    }

    const newFolder = await createResponse.json();
    appFolder = {
      id: newFolder.id,
      name: newFolder.name,
      webViewLink: newFolder.webViewLink,
    };
  }

  // Explicitly locate or create the 'revisions' subfolder inside 'LYRIC_FLOW_PRO_OFFICIAL'
  const revisionsFolder = await getOrCreateRevisionsFolder(token, appFolder.id);
  appFolder.revisionsFolderId = revisionsFolder.id;
  appFolder.revisionsWebViewLink = revisionsFolder.webViewLink;

  return appFolder;
}

/**
 * Explicitly searches for or creates the 'revisions' folder within 'LYRIC_FLOW_PRO_OFFICIAL'
 */
export async function getOrCreateRevisionsFolder(token: string, parentFolderId: string): Promise<DriveFolderInfo> {
  const query = encodeURIComponent(`'${parentFolderId}' in parents and name = '${REVISIONS_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`;

  const response = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to locate 'revisions' folder: ${errorText}`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return {
      id: data.files[0].id,
      name: data.files[0].name,
      webViewLink: data.files[0].webViewLink,
    };
  }

  // Create 'revisions' folder inside parent
  const createResponse = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: REVISIONS_FOLDER_NAME,
      parents: [parentFolderId],
      mimeType: 'application/vnd.google-apps.folder',
      description: 'LyricFlow Pro Songwriting Revision History & Version Snapshots',
    }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Failed to create 'revisions' folder in Google Drive: ${errorText}`);
  }

  const newFolder = await createResponse.json();
  return {
    id: newFolder.id,
    name: newFolder.name,
    webViewLink: newFolder.webViewLink,
  };
}

/**
 * Lists all songwriting drafts inside the LYRIC_FLOW_PRO_OFFICIAL folder
 */
export async function listFolderFiles(token: string, folderId: string): Promise<DriveFileSummary[]> {
  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&fields=files(id,name,mimeType,modifiedTime,webViewLink,size)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to list files in folder: ${res.statusText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Saves or updates a SongDraft into Google Drive inside LYRIC_FLOW_PRO_OFFICIAL folder
 */
export async function saveDraftToDrive(
  token: string,
  song: SongDraft,
  folderId?: string
): Promise<{ fileId: string; webViewLink?: string }> {
  const fileName = `${(song.title || 'Untitled_Song').replace(/[^\w\s-]/gi, '') || 'Song'}_draft.json`;
  const fileContent = JSON.stringify(
    {
      ...song,
      updatedAt: Date.now(),
    },
    null,
    2
  );

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  if (song.driveFileId) {
    // Update existing file
    const metadata = {
      name: fileName,
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      closeDelimiter;

    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${song.driveFileId}?uploadType=multipart&fields=id,webViewLink`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!res.ok) {
      // If 404 (file was deleted in Drive), retry as new creation
      if (res.status === 404) {
        const freshSong = { ...song, driveFileId: undefined };
        return saveDraftToDrive(token, freshSong, folderId);
      }
      const errText = await res.text();
      throw new Error(`Failed to update file in Drive: ${errText}`);
    }

    const data = await res.json();
    return { fileId: data.id, webViewLink: data.webViewLink };
  } else {
    // Create new file
    const metadata = {
      name: fileName,
      parents: folderId ? [folderId] : [],
      description: `Songwriting draft created with LyricFlow Pro. Key: ${song.key}, BPM: ${song.tempo}`,
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      closeDelimiter;

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to save draft to Google Drive: ${errText}`);
    }

    const data = await res.json();
    return { fileId: data.id, webViewLink: data.webViewLink };
  }
}

/**
 * Lists all files inside the revisions folder
 */
export async function listRevisionsFiles(token: string, revisionsFolderId: string): Promise<DriveFileSummary[]> {
  const query = encodeURIComponent(`'${revisionsFolderId}' in parents and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&fields=files(id,name,mimeType,modifiedTime,webViewLink,size,description)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to list revisions in folder: ${res.statusText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Saves a versioned snapshot of a song into the 'revisions' folder in Google Drive
 */
export async function saveRevisionToDrive(
  token: string,
  song: SongDraft,
  revisionsFolderId: string,
  versionLabel?: string
): Promise<{ fileId: string; webViewLink?: string; revision: SongRevision }> {
  const timestamp = Date.now();
  const label = versionLabel?.trim() || `Snapshot ${new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  
  const lines = song.content.split('\n');
  const words = song.content
    .replace(/\[[^\]]*\]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const chordMatches = song.content.match(/\[([A-G][#b]?[^\]]*)\]/g) || [];

  const revision: SongRevision = {
    id: `rev_${timestamp}`,
    songId: song.id,
    title: song.title,
    versionLabel: label,
    timestamp,
    key: song.key,
    tempo: song.tempo,
    timeSignature: song.timeSignature,
    capo: song.capo,
    progression: [...song.progression],
    content: song.content,
    notes: song.notes,
    rhymeNotes: song.rhymeNotes,
    summary: {
      lineCount: lines.length,
      wordCount: words,
      chordCount: chordMatches.length,
      progressionSummary: song.progression.join(' - '),
    },
  };

  // Formulate structured file name e.g. "Midnight Echoes_rev_2026-09-05T07-15_ChorusUpdate.json"
  const safeTitle = (song.title || 'Untitled_Song').replace(/[^\w\s-]/gi, '').trim().replace(/\s+/g, '_');
  const safeLabel = label.replace(/[^\w-]/g, '_').slice(0, 30);
  const fileName = `${safeTitle}_rev_${timestamp}_${safeLabel}.json`;

  const fileContent = JSON.stringify(revision, null, 2);

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    parents: [revisionsFolderId],
    description: `Songwriting Revision snapshot [${label}] for "${song.title}". Key: ${song.key}, Chords: [${song.progression.join(', ')}]`,
    properties: {
      songId: song.id,
      revisionId: revision.id,
      versionLabel: label,
    },
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to save revision to Google Drive: ${errText}`);
  }

  const data = await res.json();
  revision.driveFileId = data.id;
  revision.driveWebViewLink = data.webViewLink;

  return {
    fileId: data.id,
    webViewLink: data.webViewLink,
    revision,
  };
}

/**
 * Loads a specific song revision snapshot from Google Drive
 */
export async function loadRevisionFromDrive(token: string, fileId: string): Promise<SongRevision> {
  const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,webViewLink,properties`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) throw new Error('Could not fetch revision metadata');
  const metadata = await metaRes.json();

  const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!contentRes.ok) throw new Error('Could not read revision file contents');

  const text = await contentRes.text();
  try {
    const parsed = JSON.parse(text);
    return {
      ...parsed,
      driveFileId: metadata.id,
      driveWebViewLink: metadata.webViewLink,
    };
  } catch (err) {
    throw new Error('Failed to parse revision JSON from Drive');
  }
}

/**
 * Indexes all revisions inside the revisions folder and parses their metadata
 */
export async function indexRevisionsFromDrive(
  token: string,
  revisionsFolderId: string,
  songId?: string
): Promise<SongRevision[]> {
  const files = await listRevisionsFiles(token, revisionsFolderId);
  const revisions: SongRevision[] = [];

  // Parse files in batches to keep responsive
  const batch = files.slice(0, 30); // inspect up to 30 recent revisions
  await Promise.all(
    batch.map(async (f) => {
      try {
        const rev = await loadRevisionFromDrive(token, f.id);
        if (!songId || rev.songId === songId) {
          revisions.push(rev);
        }
      } catch (err) {
        console.warn(`Could not index revision file ${f.name}:`, err);
      }
    })
  );

  return revisions.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Loads a song draft file from Google Drive
 */
export async function loadDraftFromDrive(token: string, fileId: string): Promise<SongDraft> {
  // First fetch metadata
  const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,webViewLink`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) throw new Error('Could not fetch file metadata');
  const metadata = await metaRes.json();

  // Then fetch content
  const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!contentRes.ok) throw new Error('Could not read file contents from Drive');

  const text = await contentRes.text();
  try {
    const parsed = JSON.parse(text);
    return {
      ...parsed,
      id: parsed.id || `draft_${Date.now()}`,
      title: parsed.title || metadata.name.replace(/\.lyricflow\.json|\.json$/gi, ''),
      driveFileId: metadata.id,
      driveWebViewLink: metadata.webViewLink,
      driveLastSynced: Date.now(),
    };
  } catch {
    // If plain text file (.txt or .md)
    return {
      id: `draft_${Date.now()}`,
      title: metadata.name.replace(/\.[^/.]+$/, ''),
      status: 'draft',
      tempo: 120,
      timeSignature: '4/4',
      key: 'C',
      capo: 0,
      content: text,
      progression: ['C', 'G', 'Am', 'F'],
      tags: ['imported'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      driveFileId: metadata.id,
      driveWebViewLink: metadata.webViewLink,
      driveLastSynced: Date.now(),
    };
  }
}

/**
 * Open Google Picker to select a file from user's Google Drive
 */
export function openGoogleDrivePicker({
  token,
  onSelectFile,
  onError,
}: {
  token: string;
  onSelectFile: (fileId: string, fileName: string) => void;
  onError?: (err: any) => void;
}) {
  const scriptId = 'google-picker-api';
  const initPicker = () => {
    const gapi = (window as any).gapi;
    const google = (window as any).google;

    if (!gapi || !google || !google.picker) {
      if (onError) onError(new Error('Google Picker library not yet loaded'));
      return;
    }

    try {
      const view = new google.picker.DocsView()
        .setIncludeFolders(true)
        .setMimeTypes('application/json,text/plain,application/vnd.google-apps.folder,text/markdown');

      const picker = new google.picker.PickerBuilder()
        .enableFeature(google.picker.Feature.NAV_HIDDEN)
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .setAppId(firebaseConfig.projectId)
        .setOAuthToken(token)
        .addView(view)
        .setDeveloperKey(firebaseConfig.apiKey)
        .setTitle('Select Song Draft from @LYRIC_FLOW_PRO_OFFICIAL or Drive')
        .setCallback((data: any) => {
          if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
            const doc = data[google.picker.Response.DOCUMENTS][0];
            onSelectFile(doc[google.picker.Document.ID], doc[google.picker.Document.NAME]);
          }
        })
        .build();

      picker.setVisible(true);
    } catch (e) {
      if (onError) onError(e);
    }
  };

  if (!(window as any).gapi) {
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      (window as any).gapi.load('picker', { callback: initPicker });
    };
    script.onerror = (e) => onError?.(e);
    document.body.appendChild(script);
  } else if (!(window as any).google?.picker) {
    (window as any).gapi.load('picker', { callback: initPicker });
  } else {
    initPicker();
  }
}
