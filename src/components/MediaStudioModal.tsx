import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Music,
  Sparkles,
  Play,
  Pause,
  Download,
  Upload,
  RefreshCw,
  Loader2,
  X,
  Plus,
  Sliders,
  Check,
  Radio,
  Image as ImageIcon,
} from 'lucide-react';
import { SongDraft, AudioMemo } from '../types';
import {
  generateMusicAudio,
  startVideoGeneration,
  pollVideoStatus,
  downloadGeneratedVideo,
} from '../services/aiService';

interface MediaStudioModalProps {
  song: SongDraft;
  isOpen: boolean;
  onClose: () => void;
  onAddAudioMemo?: (memo: AudioMemo) => void;
}

export const MediaStudioModal: React.FC<MediaStudioModalProps> = ({
  song,
  isOpen,
  onClose,
  onAddAudioMemo,
}) => {
  const [activeTab, setActiveTab] = useState<'music' | 'video'>('music');

  // Music State (Lyria-3)
  const [musicPrompt, setMusicPrompt] = useState(
    `An evocative ${song.genre || 'indie folk'} track in ${song.key || 'C'} with acoustic guitar and ambient warmth at ${song.tempo || 120} BPM.`
  );
  const [musicDuration, setMusicDuration] = useState<'clip' | 'pro'>('clip');
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [musicError, setMusicError] = useState<string | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [savedToMemos, setSavedToMemos] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Video State (Veo-3.1)
  const [videoPrompt, setVideoPrompt] = useState(
    `Cinematic visualizer for "${song.title || 'Song'}": Golden hour sunlight streaming through vintage window, gentle dust particles, atmospheric moody lighting, 35mm film aesthetic.`
  );
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoImageBase64, setVideoImageBase64] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoProgressStatus, setVideoProgressStatus] = useState<string>('');
  const [videoError, setVideoError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pollIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  if (!isOpen) return null;

  // Handle Lyria Music Generation
  const handleGenerateMusic = async () => {
    setIsGeneratingMusic(true);
    setMusicError(null);
    setSavedToMemos(false);
    try {
      const res = await generateMusicAudio({
        prompt: musicPrompt,
        duration: musicDuration,
        genre: song.genre,
        mood: 'uplifting',
      });
      setGeneratedAudioUrl(res.audioUrl);
    } catch (err: any) {
      console.error('Music generation error:', err);
      setMusicError(err.message || 'Failed to generate music audio.');
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  const togglePlayAudio = () => {
    if (!generatedAudioUrl) return;
    if (isPlayingMusic) {
      audioElementRef.current?.pause();
      setIsPlayingMusic(false);
    } else {
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio(generatedAudioUrl);
        audioElementRef.current.onended = () => setIsPlayingMusic(false);
      }
      audioElementRef.current.play();
      setIsPlayingMusic(true);
    }
  };

  const handleSaveToAudioMemos = async () => {
    if (!generatedAudioUrl || !onAddAudioMemo) return;
    try {
      const res = await fetch(generatedAudioUrl);
      const blob = await res.blob();
      const newMemo: AudioMemo = {
        id: `lyria_${Date.now()}`,
        name: `Lyria Track: ${song.title || 'Untitled'} (${musicDuration})`,
        url: generatedAudioUrl,
        blob,
        duration: musicDuration === 'clip' ? 30 : 90,
        createdAt: Date.now(),
      };
      onAddAudioMemo(newMemo);
      setSavedToMemos(true);
      setTimeout(() => setSavedToMemos(false), 2000);
    } catch (err) {
      console.error('Failed to save to audio memos:', err);
    }
  };

  // Handle Veo Video Generation
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateVideo = async () => {
    setIsGeneratingVideo(true);
    setVideoError(null);
    setVideoProgressStatus('Initializing Veo 3.1 Fast video model...');
    try {
      const operationName = await startVideoGeneration({
        prompt: videoPrompt,
        aspectRatio: videoAspectRatio,
        imageBase64: videoImageBase64,
      });

      setVideoProgressStatus('Generating video frames (this may take 30-60 seconds)...');

      // Poll status every 8 seconds
      pollIntervalRef.current = setInterval(async () => {
        try {
          const status = await pollVideoStatus(operationName);
          if (status.done) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            if (status.error) {
              setVideoError(status.error);
              setIsGeneratingVideo(false);
            } else {
              setVideoProgressStatus('Downloading high-definition video...');
              const videoUrl = await downloadGeneratedVideo(operationName);
              setGeneratedVideoUrl(videoUrl);
              setIsGeneratingVideo(false);
            }
          } else {
            setVideoProgressStatus('Rendering dynamic camera motion & cinematic lighting...');
          }
        } catch (pollErr: any) {
          console.error('Video poll error:', pollErr);
        }
      }, 8000);
    } catch (err: any) {
      console.error('Video generation error:', err);
      setVideoError(err.message || 'Failed to start video generation.');
      setIsGeneratingVideo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-950/80 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-serif">
                AI Media Studio (Music & Video)
              </h3>
              <p className="text-[11px] text-slate-400">
                Instrumental arrangement generation via Lyria-3 and music visualizers via Veo-3.1
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

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-2 gap-2">
          <button
            onClick={() => setActiveTab('music')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'music'
                ? 'bg-sky-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>AI Music Generation (Lyria 3)</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'video'
                ? 'bg-sky-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>AI Music Video & Visualizer (Veo 3.1)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 text-xs space-y-4">
          {/* TAB 1: MUSIC GENERATION */}
          {activeTab === 'music' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Arrangement Prompt</span>
                  <span className="text-[10px] text-slate-500">
                    Key: {song.key || 'C'} • {song.tempo || 120} BPM
                  </span>
                </label>
                <textarea
                  value={musicPrompt}
                  onChange={(e) => setMusicPrompt(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-xs focus:outline-none focus:border-sky-400 leading-relaxed font-sans"
                  placeholder="Describe instruments, harmonic textures, tempo, and mood..."
                />
              </div>

              {/* Mode / Duration options */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setMusicDuration('clip')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    musicDuration === 'clip'
                      ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="font-bold text-xs">lyria-3-clip-preview</p>
                  <p className="text-[10px] opacity-75">30-second acoustic preview hook</p>
                </div>

                <div
                  onClick={() => setMusicDuration('pro')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    musicDuration === 'pro'
                      ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="font-bold text-xs">lyria-3-pro-preview</p>
                  <p className="text-[10px] opacity-75">Extended full arrangement track</p>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateMusic}
                disabled={isGeneratingMusic || !musicPrompt.trim()}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/15 transition-all text-xs"
              >
                {isGeneratingMusic ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Audio via Lyria 3...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Music Track</span>
                  </>
                )}
              </button>

              {musicError && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200">
                  {musicError}
                </div>
              )}

              {/* Generated Audio Card */}
              {generatedAudioUrl && !isGeneratingMusic && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400 font-serif flex items-center gap-1.5">
                      <Music className="w-4 h-4" />
                      <span>Generated Audio Ready</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {onAddAudioMemo && (
                        <button
                          onClick={handleSaveToAudioMemos}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors"
                        >
                          {savedToMemos ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Saved to Memos!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 text-sky-400" />
                              <span>Save to Song Memos</span>
                            </>
                          )}
                        </button>
                      )}

                      <a
                        href={generatedAudioUrl}
                        download={`${song.title || 'song'}-lyria.wav`}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        title="Download WAV file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Player controls */}
                  <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <button
                      onClick={togglePlayAudio}
                      className="w-9 h-9 rounded-full bg-sky-400 hover:bg-sky-300 text-slate-950 flex items-center justify-center transition-all shadow"
                    >
                      {isPlayingMusic ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1">
                      <p className="font-semibold text-slate-200 text-xs">
                        {song.title || 'Untitled Track'} — Lyria Instrumental
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Acoustic stereo mix • {musicDuration === 'clip' ? '30 sec' : '90 sec'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VIDEO GENERATION */}
          {activeTab === 'video' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Visual Scene Prompt</label>
                <textarea
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-xs focus:outline-none focus:border-sky-400 leading-relaxed font-sans"
                  placeholder="Describe the aesthetic, lighting, camera movement, and thematic imagery..."
                />
              </div>

              {/* Aspect Ratio & Image-to-Video options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Aspect Ratio */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Aspect Ratio
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setVideoAspectRatio('16:9')}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        videoAspectRatio === '16:9'
                          ? 'bg-sky-500 text-slate-950 border-sky-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      16:9 (Widescreen)
                    </button>
                    <button
                      onClick={() => setVideoAspectRatio('9:16')}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        videoAspectRatio === '9:16'
                          ? 'bg-sky-500 text-slate-950 border-sky-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      9:16 (Shorts / Reel)
                    </button>
                  </div>
                </div>

                {/* Optional Image Reference */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Reference Image (Optional)</span>
                    {videoImageBase64 && (
                      <button
                        onClick={() => setVideoImageBase64(null)}
                        className="text-[10px] text-rose-400 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                    <span>{videoImageBase64 ? 'Change Reference Image' : 'Upload Cover / Concept Art'}</span>
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo || !videoPrompt.trim()}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/15 transition-all text-xs"
              >
                {isGeneratingVideo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering Video with Veo 3.1...</span>
                  </>
                ) : (
                  <>
                    <Film className="w-4 h-4" />
                    <span>Generate Music Video Clip</span>
                  </>
                )}
              </button>

              {isGeneratingVideo && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-2">
                  <Loader2 className="w-6 h-6 text-sky-400 animate-spin mx-auto" />
                  <p className="text-slate-300 font-serif">{videoProgressStatus}</p>
                  <p className="text-[10px] text-slate-500">
                    Veo 3.1 Fast Generate Preview • Cinematic 720p Render
                  </p>
                </div>
              )}

              {videoError && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200">
                  {videoError}
                </div>
              )}

              {/* Video Player Result */}
              {generatedVideoUrl && !isGeneratingVideo && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400 font-serif flex items-center gap-1.5">
                      <Film className="w-4 h-4" />
                      <span>Generated Video Preview</span>
                    </span>

                    <a
                      href={generatedVideoUrl}
                      download={`${song.title || 'song'}-visualizer.mp4`}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download MP4</span>
                    </a>
                  </div>

                  <video
                    src={generatedVideoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full rounded-lg border border-slate-800 aspect-video object-cover"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            Close Studio
          </button>
        </div>
      </div>
    </div>
  );
};
