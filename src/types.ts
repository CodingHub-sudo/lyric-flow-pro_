export type SongStatus = 'idea' | 'draft' | 'in_progress' | 'polished' | 'finished';

export interface AudioMemo {
  id: string;
  name: string;
  url: string;
  blob?: Blob;
  duration: number;
  createdAt: number;
}

export interface SongRevision {
  id: string; // Unique revision identifier (e.g. rev_1710000000)
  songId: string; // Associated SongDraft ID
  title: string;
  versionLabel: string; // e.g. "Chorus acoustic overhaul", "Bridge chords to Em", "Initial Draft"
  timestamp: number;
  author?: string;
  key: string;
  tempo: number;
  timeSignature: string;
  capo: number;
  progression: string[];
  content: string; // lyrics with chord tags
  notes?: string;
  rhymeNotes?: string;
  driveFileId?: string; // Google Drive file ID in revisions folder
  driveWebViewLink?: string;
  summary?: {
    lineCount: number;
    wordCount: number;
    chordCount: number;
    progressionSummary: string;
  };
}

export interface SongDraft {
  id: string;
  title: string;
  subtitle?: string;
  artist?: string;
  status: SongStatus;
  genre?: string;
  tempo: number; // BPM, e.g. 120
  timeSignature: string; // '4/4', '3/4', '6/8', etc.
  key: string; // 'C', 'G', 'Am', etc.
  capo: number; // 0 for no capo
  content: string; // lyrics with chord tags e.g. "[C]First line of the [G]verse"
  progression: string[]; // e.g. ['C', 'G', 'Am', 'F']
  notes?: string;
  rhymeNotes?: string;
  audioRecordings?: AudioMemo[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
  // Revision tracking
  revisions?: SongRevision[];
  activeRevisionId?: string;
  lastRevisionSavedAt?: number;
  // Google Drive integration metadata
  driveFileId?: string;
  driveLastSynced?: number;
  driveWebViewLink?: string;
  revisionsFolderId?: string;
  revisionsWebViewLink?: string;
}

export interface DriveFolderInfo {
  id: string;
  name: string;
  webViewLink?: string;
  revisionsFolderId?: string;
  revisionsWebViewLink?: string;
}

export interface DriveFileSummary {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
  size?: string;
}

export interface RhymeResult {
  word: string;
  score?: number;
  numSyllables: number;
  type: 'perfect' | 'near' | 'synonym' | 'phrase';
}

export interface ChordNoteInfo {
  name: string;
  notes: string[];
  guitarFretPattern?: number[]; // [E, A, D, G, B, e] -1 for mute, 0 for open
  pianoKeys?: number[]; // semitone offsets from root
}

// AI Feature Interfaces
export interface LyricSuggestion {
  id: string;
  type: 'couplet' | 'continuation' | 'hook' | 'contrast';
  label: string;
  lines: string[];
  rhymeScheme?: string;
  syllableCounts?: number[];
  rationale?: string;
}

export interface SmartChordSuggestion {
  id: string;
  name: string;
  chords: string[];
  romanNumerals: string[];
  mood: string;
  genreFit: string;
  transitionTips: string;
  whyItWorks: string;
}

export interface SongAnalysisResult {
  scores: {
    structure: number; // 0-100
    emotionalArc: number; // 0-100
    lyricalDensity: number; // 0-100
    overall: number; // 0-100
  };
  structuralBalance: {
    assessment: string;
    sectionBreakdown: { section: string; linesCount: number; rhythmPacing: string }[];
    suggestions: string[];
  };
  emotionalArc: {
    trajectory: string;
    tensionReleaseAnalysis: string;
    peakMoments: string[];
    suggestions: string[];
  };
  lyricalDensity: {
    feedback: string;
    syllableFlow: string;
    rhymeClutterAssessment: string;
    suggestions: string[];
  };
  strengths: string[];
  actionableTips: string[];
}

export interface MetaTagSuggestion {
  suggestedGenre: string;
  alternateGenres: string[];
  moodTags: string[];
  tempoDescriptor: string;
  suggestedBpm: number;
  vocalDelivery: string;
  instrumentationIdeas: string[];
  thematicSummary: string;
}

export interface VoicePolishResult {
  rawTranscript: string;
  polishedLyrics: string;
  detectedStructure: string[];
  syllableMeterNotes: string;
  suggestedChordsHint?: string[];
}

