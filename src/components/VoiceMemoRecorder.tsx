import React, { useState, useRef } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Volume2,
  Plus,
  Radio,
  Sparkles,
} from 'lucide-react';
import { AudioMemo } from '../types';

interface VoiceMemoRecorderProps {
  recordings: AudioMemo[];
  onAddRecording: (memo: AudioMemo) => void;
  onDeleteRecording: (id: string) => void;
  onRefineToLyrics?: (memo: AudioMemo) => void;
}

export const VoiceMemoRecorder: React.FC<VoiceMemoRecorderProps> = ({
  recordings,
  onAddRecording,
  onDeleteRecording,
  onRefineToLyrics,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const activeAudioElRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        const newMemo: AudioMemo = {
          id: `memo_${Date.now()}`,
          name: `Vocal Idea ${recordings.length + 1}`,
          url: audioUrl,
          blob: audioBlob,
          duration: recordingDuration,
          createdAt: Date.now(),
        };

        onAddRecording(newMemo);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to access microphone:', err);
      alert('Could not access microphone. Please enable microphone permissions in your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const handlePlayToggle = (memo: AudioMemo) => {
    if (playingId === memo.id) {
      if (activeAudioElRef.current) {
        activeAudioElRef.current.pause();
      }
      setPlayingId(null);
    } else {
      if (activeAudioElRef.current) {
        activeAudioElRef.current.pause();
      }
      const audio = new Audio(memo.url);
      activeAudioElRef.current = audio;
      audio.onended = () => setPlayingId(null);
      audio.play();
      setPlayingId(memo.id);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="bg-slate-900 border-t border-slate-800 p-4 lg:p-6 space-y-4">
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Scratchpad Voice Memos ({recordings.length})
            </h3>
          </div>

          <div>
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold animate-pulse shadow-md transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop ({formatTime(recordingDuration)})</span>
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-all"
              >
                <Mic className="w-3.5 h-3.5 text-sky-400" />
                <span>Record Hook / Melody</span>
              </button>
            )}
          </div>
        </div>

        {/* List of recordings */}
        {recordings.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            No audio memos recorded for this draft yet. Use the record button to capture a melody hook or vocal cadence.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {recordings.map((memo) => (
              <div
                key={memo.id}
                className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs space-x-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => handlePlayToggle(memo)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                      playingId === memo.id
                        ? 'bg-sky-400 text-slate-950'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {playingId === memo.id ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="truncate">
                    <p className="font-medium text-slate-200 truncate">{memo.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {formatTime(memo.duration || 0)} • {new Date(memo.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {onRefineToLyrics && (
                    <button
                      onClick={() => onRefineToLyrics(memo)}
                      className="px-2 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded text-[11px] flex items-center gap-1 transition-colors"
                      title="Transcribe and polish voice memo into structured song lyrics"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Refine</span>
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteRecording(memo.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete recording"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
