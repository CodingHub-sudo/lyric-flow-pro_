import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Sparkles,
  Play,
  Pause,
  Upload,
  Copy,
  Check,
  X,
  FileText,
  Music,
  RefreshCw,
  Loader2,
  Volume2,
  ArrowRight,
  Radio,
} from 'lucide-react';
import { SongDraft, VoicePolishResult } from '../types';
import { transcribeAndPolishVoice } from '../services/aiService';

interface VoiceToLyricModalProps {
  song: SongDraft;
  isOpen: boolean;
  onClose: () => void;
  onInsertLyrics: (lyrics: string) => void;
  onReplaceLyrics: (lyrics: string) => void;
}

export const VoiceToLyricModal: React.FC<VoiceToLyricModalProps> = ({
  song,
  isOpen,
  onClose,
  onInsertLyrics,
  onReplaceLyrics,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VoicePolishResult | null>(null);
  const [activeView, setActiveView] = useState<'polished' | 'raw'>('polished');
  const [copiedText, setCopiedText] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  if (!isOpen) return null;

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      setError('Could not access microphone. Please grant permission in browser settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioBlob(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setError(null);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleTranscribeAndPolish = async () => {
    if (!audioBlob) {
      setError('Please record or upload an audio memo first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const base64Audio = await blobToBase64(audioBlob);
      const mimeType = audioBlob.type || 'audio/webm';

      const polishRes = await transcribeAndPolishVoice({
        audioBase64: base64Audio,
        mimeType,
        songContext: {
          title: song.title,
          genre: song.genre,
          key: song.key,
          tempo: song.tempo,
        },
      });

      setResult(polishRes);
      setActiveView('polished');
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message || 'Failed to transcribe and polish audio memo.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayAudio = () => {
    if (!audioUrl) return;
    if (isPlayingAudio) {
      audioElementRef.current?.pause();
      setIsPlayingAudio(false);
    } else {
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio(audioUrl);
        audioElementRef.current.onended = () => setIsPlayingAudio(false);
      }
      audioElementRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-950/80 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-serif">
                Voice-to-Lyric Refinement
              </h3>
              <p className="text-[11px] text-slate-400">
                Spoken audio transcription via Gemini 3.5 Transcribe + Songwriting Polish Layer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Audio Recording & Input Card */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-sky-400" />
                <span>Voice Memo Input</span>
              </span>

              {audioBlob && (
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Audio Captured ({formatTime(recordingSeconds || Math.round(audioBlob.size / 16000))})
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold flex items-center gap-2 animate-pulse shadow-lg shadow-red-600/20"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Stop Recording ({formatTime(recordingSeconds)})</span>
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-sky-500/15"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start Voice Recording</span>
                </button>
              )}

              {/* Upload file button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl font-medium flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload Audio File</span>
              </button>

              {/* Play preview */}
              {audioUrl && (
                <button
                  onClick={togglePlayAudio}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl font-medium flex items-center gap-1.5 transition-colors"
                >
                  {isPlayingAudio ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-sky-400" />
                      <span>Pause Audio</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-sky-400" />
                      <span>Play Preview</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              Speak or sing stream-of-consciousness words, melodic rhymes, or lyrical fragments.
            </p>
          </div>

          {/* Action Trigger */}
          {audioBlob && !result && (
            <div className="flex justify-center">
              <button
                onClick={handleTranscribeAndPolish}
                disabled={isLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-slate-950 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-sky-500/20 disabled:opacity-50 transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transcribing & Polishing with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Transcribe & Polish into Song Lyrics</span>
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-400">
              <Loader2 className="w-7 h-7 text-sky-400 animate-spin" />
              <p className="text-slate-200 font-serif">1. Running Gemini 3.5 audio transcription...</p>
              <p className="text-[11px] text-slate-500">2. Structuring stanza breaks, chorus labels, and meter rhythm</p>
            </div>
          )}

          {/* Result Presentation */}
          {result && !isLoading && (
            <div className="space-y-3">
              {/* Structure badges & view switcher */}
              <div className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Detected Sections:</span>
                  {result.detectedStructure.map((sec, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-mono"
                    >
                      {sec}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setActiveView('polished')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      activeView === 'polished'
                        ? 'bg-sky-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Polished Song Lyrics
                  </button>
                  <button
                    onClick={() => setActiveView('raw')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      activeView === 'raw'
                        ? 'bg-sky-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Raw Transcript
                  </button>
                </div>
              </div>

              {/* Lyrics Box */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    {activeView === 'polished'
                      ? 'Structured with Verse/Chorus labels & natural line breaks'
                      : 'Verbatim spoken audio transcript'}
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(
                        activeView === 'polished' ? result.polishedLyrics : result.rawTranscript
                      )
                    }
                    className="flex items-center gap-1 text-slate-400 hover:text-sky-300"
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="text-slate-100 font-serif text-sm whitespace-pre-wrap leading-relaxed p-3 bg-slate-900/60 rounded-lg border border-slate-800/60 max-h-64 overflow-y-auto">
                  {activeView === 'polished' ? result.polishedLyrics : result.rawTranscript}
                </pre>

                {result.syllableMeterNotes && (
                  <p className="text-[11px] text-slate-400 italic bg-slate-900/40 p-2 rounded border border-slate-800/40">
                    🎵 {result.syllableMeterNotes}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={() => {
              setAudioBlob(null);
              setResult(null);
            }}
            disabled={!result && !audioBlob}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs transition-colors disabled:opacity-30"
          >
            Clear / Record Again
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs transition-colors"
            >
              Cancel
            </button>

            {result && (
              <>
                <button
                  onClick={() => {
                    onInsertLyrics('\n\n' + result.polishedLyrics);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Insert into Song</span>
                </button>

                <button
                  onClick={() => {
                    onReplaceLyrics(result.polishedLyrics);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-sky-500/10"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Polished Lyrics</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
