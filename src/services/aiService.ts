import {
  LyricSuggestion,
  SmartChordSuggestion,
  SongAnalysisResult,
  MetaTagSuggestion,
  VoicePolishResult,
} from '../types';

export async function fetchLyricSuggestions(params: {
  currentLyrics: string;
  songTitle: string;
  genre?: string;
  key?: string;
  tempo?: number;
  mode?: 'couplet' | 'continuation' | 'hook' | 'contrast';
  prompt?: string;
}): Promise<LyricSuggestion[]> {
  const res = await fetch('/api/ai/lyric-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error (${res.status})`);
  }

  const data = await res.json();
  return data.suggestions || [];
}

export async function generateSmartChords(params: {
  key: string;
  mood?: string;
  genre?: string;
  timeSignature?: string;
  tempo?: number;
  currentProgression?: string[];
  lyricsSnippet?: string;
}): Promise<SmartChordSuggestion[]> {
  const res = await fetch('/api/ai/chord-progression', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error (${res.status})`);
  }

  const data = await res.json();
  return data.progressions || [];
}

export async function analyzeSong(params: {
  title: string;
  lyrics: string;
  progression?: string[];
  key?: string;
  tempo?: number;
  genre?: string;
}): Promise<SongAnalysisResult> {
  const res = await fetch('/api/ai/analyze-song', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error (${res.status})`);
  }

  const data = await res.json();
  return data.analysis;
}

export async function generateMetaTags(params: {
  title: string;
  lyrics: string;
  progression?: string[];
  key?: string;
  tempo?: number;
}): Promise<MetaTagSuggestion> {
  const res = await fetch('/api/ai/meta-tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error (${res.status})`);
  }

  const data = await res.json();
  return data.metadata;
}

export async function transcribeAndPolishVoice(params: {
  audioBase64: string;
  mimeType?: string;
  songContext?: {
    title?: string;
    genre?: string;
    key?: string;
    tempo?: number;
  };
}): Promise<VoicePolishResult> {
  const res = await fetch('/api/ai/transcribe-voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error (${res.status})`);
  }

  const data = await res.json();
  return {
    rawTranscript: data.rawTranscript || '',
    polishedLyrics: data.polishedLyrics || '',
    detectedStructure: data.detectedStructure || [],
    syllableMeterNotes: data.syllableMeterNotes || '',
    suggestedChordsHint: data.suggestedChordsHint || [],
  };
}

export async function generateMusicAudio(params: {
  prompt: string;
  duration?: 'clip' | 'pro';
  genre?: string;
  mood?: string;
}): Promise<{ audioUrl: string; lyrics?: string }> {
  const res = await fetch('/api/ai/generate-music', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error (${res.status})`);
  }

  const data = await res.json();
  if (!data.audioBase64) {
    throw new Error('No audio stream returned from Lyria model');
  }

  const byteCharacters = atob(data.audioBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: data.mimeType || 'audio/wav' });
  const audioUrl = URL.createObjectURL(blob);

  return { audioUrl, lyrics: data.lyrics };
}

export async function startVideoGeneration(params: {
  prompt: string;
  aspectRatio?: '16:9' | '9:16';
  imageBase64?: string | null;
  mimeType?: string;
}): Promise<string> {
  const res = await fetch('/api/ai/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error (${res.status})`);
  }

  const data = await res.json();
  return data.operationName;
}

export async function pollVideoStatus(operationName: string): Promise<{ done: boolean; error: string | null }> {
  const res = await fetch('/api/ai/video-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationName }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error (${res.status})`);
  }

  return await res.json();
}

export async function downloadGeneratedVideo(operationName: string): Promise<string> {
  const res = await fetch('/api/ai/video-download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationName }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to download video (${res.status})`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

