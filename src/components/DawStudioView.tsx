import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Sliders,
  Cpu,
  Layers,
  Sparkles,
  Share2,
  Download,
  Film,
  Zap,
  Activity,
  CheckCircle2,
  ChevronRight,
  Maximize2,
  Radio,
  Music,
  Code,
  Settings,
  Eye,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import { SongDraft } from '../types';

interface DawStudioViewProps {
  song: SongDraft;
  onUpdateSong: (updates: Partial<SongDraft>) => void;
  onOpenMediaStudio: () => void;
}

export const DawStudioView: React.FC<DawStudioViewProps> = ({
  song,
  onUpdateSong,
  onOpenMediaStudio,
}) => {
  // Master Timeline playback & time
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(14.2);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [activeWorkflowNode, setActiveWorkflowNode] = useState<string>('ai_compose');

  // Export settings state
  const [exportFormat, setExportFormat] = useState<'FLAC 24-bit/96kHz' | 'WAV 32-bit Float' | 'Spatial Audio ADM BWF' | 'MP3 320kbps'>('FLAC 24-bit/96kHz');
  const [exportSampleRate, setExportSampleRate] = useState<'96 kHz' | '48 kHz' | '192 kHz'>('96 kHz');
  const [exportDither, setExportDither] = useState<boolean>(true);
  const [exportNormalize, setExportNormalize] = useState<boolean>(true);
  const [targetLufs, setTargetLufs] = useState<number>(-14.0);

  // Knurled Dial Knobs
  const [knobMasterGain, setKnobMasterGain] = useState(78); // 0-100
  const [knobNeuralWeight, setKnobNeuralWeight] = useState(64); // 0-100
  const [knobStereoWidth, setKnobStereoWidth] = useState(88); // 0-100
  const [knobHarmonicSat, setKnobHarmonicSat] = useState(42); // 0-100

  // Neural Network Live Progress Metrics
  const [neuralProgress, setNeuralProgress] = useState(94.8);
  const [latentEpochs, setLatentEpochs] = useState(2400);
  const [spectralConvergence, setSpectralConvergence] = useState(0.0018);
  const [beamSearchStatus, setBeamSearchStatus] = useState('Optimal Pitch Convergence');

  // Video Preview fallback / state
  const [videoHovered, setVideoHovered] = useState(false);

  // Timer loop for simulation
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= 180) return 0;
          return Number((prev + 0.1).toFixed(1));
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#020617] text-slate-100 select-none overflow-y-auto">
      {/* Upper Section: Left Panel (Project DNA) + Center Composition Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3.5 pb-2">
        {/* ========================================================================= */}
        {/* LEFT PANEL: "Project DNA" with glowing network nodes (3 cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="daw-frosted-smoked-glass rounded-xl p-4 flex flex-col h-full border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Top Sapphire Edge Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_12px_#38bdf8]" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] animate-pulse" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
                  Project DNA
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/60 border border-sky-500/30 text-sky-300">
                v3.8.4 NEURAL
              </span>
            </div>

            {/* Interactive Glowing Network Nodes Graph */}
            <div className="my-3 p-3 rounded-lg bg-slate-950/80 border border-white/5 relative overflow-hidden">
              <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-sky-400" /> Latent Node Topology
                </span>
                <span className="text-emerald-400 text-[10px]">COHERENT 99.4%</span>
              </div>

              {/* Node Topology Canvas/SVG */}
              <div className="h-44 w-full relative daw-node-grid-bg rounded border border-sky-500/10 flex items-center justify-center p-2">
                <svg className="w-full h-full" viewBox="0 0 280 150">
                  <defs>
                    <linearGradient id="sapphireNodeBeam" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
                    </linearGradient>
                    <filter id="glowSapphire" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Inter-Node Glowing Connectors */}
                  <line x1="50" y1="40" x2="140" y2="75" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="3 3" />
                  <line x1="50" y1="110" x2="140" y2="75" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.6" />
                  <line x1="140" y1="75" x2="230" y2="40" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.8" />
                  <line x1="140" y1="75" x2="230" y2="110" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.5" />
                  <line x1="50" y1="40" x2="50" y2="110" stroke="#0ea5e9" strokeWidth="1" strokeOpacity="0.2" />

                  {/* Pulsing signal on active route */}
                  <circle cx="185" cy="57" r="3" fill="#ffffff" filter="url(#glowSapphire)">
                    <animate attributeName="cx" from="140" to="230" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="cy" from="75" to="40" dur="2s" repeatCount="indefinite" />
                  </circle>

                  {/* Node 1: Harmonic Vector */}
                  <g className="cursor-pointer">
                    <circle cx="50" cy="40" r="14" fill="#0b1326" stroke="#38bdf8" strokeWidth="1.5" filter="url(#glowSapphire)" />
                    <circle cx="50" cy="40" r="5" fill="#38bdf8" />
                    <text x="50" y="65" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">HARMONIC</text>
                  </g>

                  {/* Node 2: Meter & Cadence */}
                  <g className="cursor-pointer">
                    <circle cx="50" cy="110" r="14" fill="#0b1326" stroke="#0284c7" strokeWidth="1.5" />
                    <circle cx="50" cy="110" r="4" fill="#0ea5e9" />
                    <text x="50" y="135" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">PROSODY</text>
                  </g>

                  {/* Node 3: Core Neural Conductor (Central) */}
                  <g className="cursor-pointer">
                    <circle cx="140" cy="75" r="20" fill="#030712" stroke="#38bdf8" strokeWidth="2.5" filter="url(#glowSapphire)" />
                    <circle cx="140" cy="75" r="8" fill="#38bdf8" className="animate-pulse" />
                    <text x="140" y="105" textAnchor="middle" fill="#38bdf8" fontWeight="bold" fontSize="9" fontFamily="monospace">CORE SYNAPSE</text>
                  </g>

                  {/* Node 4: Semantic Resonance (Top Right) */}
                  <g className="cursor-pointer">
                    <circle cx="230" cy="40" r="15" fill="#0b1326" stroke="#38bdf8" strokeWidth="2" filter="url(#glowSapphire)" />
                    <circle cx="230" cy="40" r="5" fill="#67e8f9" />
                    <text x="230" y="65" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontFamily="monospace">SEMANTICS</text>
                  </g>

                  {/* Node 5: Master Acoustic Space (Bottom Right) */}
                  <g className="cursor-pointer">
                    <circle cx="230" cy="110" r="14" fill="#0b1326" stroke="#0284c7" strokeWidth="1.5" />
                    <circle cx="230" cy="110" r="4" fill="#38bdf8" />
                    <text x="230" y="135" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">RENDER</text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Genetic Metadata Parameters */}
            <div className="flex-1 space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 flex items-center justify-between">
                <span className="text-slate-400">Root Scale / Mode</span>
                <span className="text-sky-300 font-bold px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/30">
                  {song.key || 'C'} Dorian Pure
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 flex items-center justify-between">
                <span className="text-slate-400">Atomic Tempo</span>
                <span className="text-sky-300 font-bold px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/30">
                  {song.tempo || 120} BPM <span className="text-slate-500 text-[10px]">(Sync Locked)</span>
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 flex items-center justify-between">
                <span className="text-slate-400">Time Signature</span>
                <span className="text-slate-200 font-bold">{song.timeSignature || '4/4'} Quad</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 flex items-center justify-between">
                <span className="text-slate-400">Capo Transposition</span>
                <span className="text-slate-200">{song.capo ? `+${song.capo} Semitones` : 'Concert Pitch (0)'}</span>
              </div>

              {/* Progression Sequence Nodes */}
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Harmonic Sequence Array</span>
                  <span className="text-sky-400">{song.progression?.length || 4} Bars</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(song.progression && song.progression.length > 0
                    ? song.progression
                    : ['Am', 'F', 'C', 'G']
                  ).map((chord, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded bg-[#0b1328] border border-sky-500/40 text-sky-200 font-bold text-xs shadow-[0_0_8px_rgba(56,189,248,0.15)]"
                    >
                      {chord}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Re-synthesize DNA Action */}
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">HASH: 8F-99-CE-41</span>
              <button
                onClick={() => {
                  setSpectralConvergence(0.0009);
                  setNeuralProgress(99.1);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-sky-300 border border-white/10 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-align DNA</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CENTER COMPOSITION DESK (9 cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-9 flex flex-col gap-3">
          {/* Main Smoked-Glass Workspace Console */}
          <div className="daw-frosted-smoked-glass rounded-xl p-4 border border-white/10 shadow-2xl relative flex flex-col">
            {/* Top Sapphire Glow Rim */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400/80 to-transparent" />

            {/* Top Bar of Composition Desk: Workspaces & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-semibold tracking-wider text-slate-200">
                    COMPOSITION DESK // ENGINE 3.8
                  </span>
                </div>

                {/* Node Workflow Selectors */}
                <div className="hidden sm:flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-white/5">
                  {[
                    { id: 'ai_compose', label: 'Node Flow' },
                    { id: 'routing', label: 'Signal Matrix' },
                    { id: 'stems', label: 'Neural Stems' },
                  ].map((node) => (
                    <button
                      key={node.id}
                      onClick={() => setActiveWorkflowNode(node.id)}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                        activeWorkflowNode === node.id
                          ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {node.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Machined Hardware Knurled Dials Row (Tactile Finish 5% Chrome Dials) */}
              <div className="flex items-center gap-4 bg-slate-950/70 px-3.5 py-1.5 rounded-lg border border-white/5">
                {/* Knob 1: Master Gain */}
                <div className="flex flex-col items-center group cursor-pointer" title="Master Analog Trim">
                  <div className="w-8 h-8 rounded-full chrome-knurled-dial flex items-center justify-center relative shadow-lg">
                    {/* Knurled indicator line */}
                    <div
                      className="w-0.5 h-3.5 bg-slate-950 rounded-full origin-bottom"
                      style={{ transform: `rotate(${(knobMasterGain / 100) * 270 - 135}deg)` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 mt-1">GAIN: {knobMasterGain}%</span>
                </div>

                {/* Knob 2: Neural Depth */}
                <div className="flex flex-col items-center group cursor-pointer" title="Neural Inference Weight">
                  <div className="w-8 h-8 rounded-full chrome-knurled-dial flex items-center justify-center relative shadow-lg">
                    <div
                      className="w-0.5 h-3.5 bg-sky-600 rounded-full origin-bottom"
                      style={{ transform: `rotate(${(knobNeuralWeight / 100) * 270 - 135}deg)` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-sky-400 mt-1">NEURAL: {knobNeuralWeight}%</span>
                </div>

                {/* Knob 3: Stereo Width */}
                <div className="flex flex-col items-center group cursor-pointer" title="Spatial Stereophonic Spread">
                  <div className="w-8 h-8 rounded-full chrome-knurled-dial flex items-center justify-center relative shadow-lg">
                    <div
                      className="w-0.5 h-3.5 bg-slate-950 rounded-full origin-bottom"
                      style={{ transform: `rotate(${(knobStereoWidth / 100) * 270 - 135}deg)` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 mt-1">WIDTH: {knobStereoWidth}%</span>
                </div>

                {/* Knob 4: Harmonic Saturation */}
                <div className="flex flex-col items-center group cursor-pointer" title="Obsidian Tube Saturation">
                  <div className="w-8 h-8 rounded-full chrome-knurled-dial flex items-center justify-center relative shadow-lg">
                    <div
                      className="w-0.5 h-3.5 bg-amber-600 rounded-full origin-bottom"
                      style={{ transform: `rotate(${(knobHarmonicSat / 100) * 270 - 135}deg)` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-amber-400 mt-1">TUBE: {knobHarmonicSat}%</span>
                </div>
              </div>
            </div>

            {/* Desk Workspace Body: Node Workflow Diagrams + Video Preview + Export Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 mt-3.5">
              {/* Node-Based Workflow Diagram (6 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <GitBranch className="w-3.5 h-3.5 text-sky-400" />
                    <span>Neural Composition Graph</span>
                  </span>
                  <span className="text-[10px] text-sky-400/80 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-500/20">
                    32 Latent Channels
                  </span>
                </div>

                {/* Interactive Node Graph Workspace */}
                <div className="h-64 rounded-lg bg-slate-950/90 border border-white/10 p-3 relative overflow-hidden daw-node-grid-bg flex flex-col justify-between">
                  {/* Visual Node Blocks */}
                  <div className="grid grid-cols-3 gap-2.5 z-10">
                    {/* Node 1: Lyric Semantic Tokenizer */}
                    <div className="p-2.5 rounded-lg bg-[#0b1328]/90 border border-sky-500/30 shadow-lg relative group">
                      <div className="w-2 h-2 rounded-full bg-sky-400 absolute top-2 right-2 animate-ping" />
                      <div className="text-[10px] font-mono text-sky-400 font-bold mb-1">NODE 01: LYRIC TOKENS</div>
                      <div className="text-xs text-slate-200 font-semibold truncate">{song.title || 'Untitled Track'}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1">
                        {song.content?.split('\n').filter(Boolean).length || 12} Metrical Lines
                      </div>
                      <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-400 w-4/5" />
                      </div>
                    </div>

                    {/* Node 2: Neural Prosody & Cadence */}
                    <div className="p-2.5 rounded-lg bg-[#0b1328]/90 border border-sky-400/50 shadow-lg relative group shadow-[0_0_12px_rgba(56,189,248,0.1)]">
                      <div className="text-[10px] font-mono text-sky-300 font-bold mb-1">NODE 02: CADENCE FLOW</div>
                      <div className="text-xs text-slate-200 font-semibold">120 BPM • 4/4</div>
                      <div className="text-[10px] font-mono text-emerald-400 mt-1">Pitch Centering 0.4ct</div>
                      <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 w-full" />
                      </div>
                    </div>

                    {/* Node 3: Audio Render Matrix */}
                    <div className="p-2.5 rounded-lg bg-[#0b1328]/90 border border-sky-500/30 shadow-lg relative group">
                      <div className="text-[10px] font-mono text-sky-400 font-bold mb-1">NODE 03: SYNTH MATRIX</div>
                      <div className="text-xs text-slate-200 font-semibold">Lyria 3 Engine</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1">Stereo Master Stem</div>
                      <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-400 w-3/4" />
                      </div>
                    </div>
                  </div>

                  {/* SVG Connecting Flow Lines across nodes */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" preserveAspectRatio="none">
                    <path
                      d="M 90 70 C 130 110, 150 110, 190 70"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      strokeOpacity="0.4"
                      strokeDasharray="4 4"
                    />
                    <path
                      d="M 190 70 C 230 110, 240 120, 280 70"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      strokeOpacity="0.6"
                    />
                  </svg>

                  {/* Secondary Workflow Sub-Nodes: Reverb, Dynamics, Master Limiter */}
                  <div className="flex items-center justify-between z-10 pt-2 border-t border-white/5 bg-slate-950/70 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400">Audio Chain:</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-300">
                        Obsidian Tube EQ
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-300">
                        Sapphire Limiter
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/40 text-sky-300">
                        Neural Stem Splitter
                      </span>
                    </div>

                    <button
                      onClick={onOpenMediaStudio}
                      className="flex items-center gap-1 text-[11px] font-mono text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      <span>Configure Chain</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Node Execution Live Metrics */}
                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                  <div className="p-2 rounded bg-slate-950/60 border border-white/5 flex flex-col">
                    <span className="text-slate-400">Latency Buffer</span>
                    <span className="text-slate-200 font-bold mt-0.5">32 Samples (0.7ms)</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-white/5 flex flex-col">
                    <span className="text-slate-400">DSP Headroom</span>
                    <span className="text-emerald-400 font-bold mt-0.5">+4.2 dB True Peak</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-white/5 flex flex-col">
                    <span className="text-slate-400">Neural Sync</span>
                    <span className="text-sky-400 font-bold mt-0.5">Continuous 96k</span>
                  </div>
                </div>
              </div>

              {/* Video Preview & Export Settings (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                {/* ========================================================================= */}
                {/* VIDEO PREVIEW: Black man wearing black headphones looking right */}
                {/* ========================================================================= */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                      <Film className="w-3.5 h-3.5 text-sky-400" />
                      <span>Visual Sync Preview (Veo 3.1)</span>
                    </span>
                    <span className="text-[10px] font-mono text-sky-400 px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/30">
                      16:9 • 4K ULTRA
                    </span>
                  </div>

                  {/* Photorealistic Video Preview Player Container */}
                  <div
                    onMouseEnter={() => setVideoHovered(true)}
                    onMouseLeave={() => setVideoHovered(false)}
                    className="relative aspect-video rounded-lg overflow-hidden border border-sky-500/30 shadow-[0_0_20px_rgba(2,132,199,0.2)] bg-black group"
                  >
                    {/* Photorealistic SVG / Visual Graphic of Black man wearing black headphones looking right */}
                    <div className="absolute inset-0 w-full h-full bg-[#030712] flex items-center justify-center overflow-hidden">
                      {/* High-fidelity Vector Representation with Studio Lighting and Sapphire Rim Light */}
                      <svg
                        className="w-full h-full object-cover"
                        viewBox="0 0 640 360"
                        preserveAspectRatio="xMidYMid slice"
                      >
                        <defs>
                          {/* Atmospheric Studio Background */}
                          <radialGradient id="studioBackdrop" cx="45%" cy="50%" r="75%">
                            <stop offset="0%" stopColor="#08142c" />
                            <stop offset="55%" stopColor="#030712" />
                            <stop offset="100%" stopColor="#010309" />
                          </radialGradient>

                          {/* Sapphire Blue Rim Light Gradient */}
                          <linearGradient id="sapphireRim" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                            <stop offset="70%" stopColor="#0284c7" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                          </linearGradient>

                          {/* Warm Studio Keylight */}
                          <radialGradient id="keyLightGlow" cx="65%" cy="35%" r="45%">
                            <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                          </radialGradient>

                          {/* Skin Tone Gradient for Profile of Black Man */}
                          <linearGradient id="skinToneGradient" x1="30%" y1="20%" x2="90%" y2="80%">
                            <stop offset="0%" stopColor="#5c3826" />
                            <stop offset="45%" stopColor="#3b2014" />
                            <stop offset="100%" stopColor="#1a0d08" />
                          </linearGradient>

                          {/* Headphone Satin Obsidian Finish */}
                          <linearGradient id="headphoneObsidian" x1="20%" y1="10%" x2="80%" y2="90%">
                            <stop offset="0%" stopColor="#334155" />
                            <stop offset="50%" stopColor="#0f172a" />
                            <stop offset="100%" stopColor="#020617" />
                          </linearGradient>

                          {/* Headphone Metallic Rim Accent */}
                          <linearGradient id="chromeBevel" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f8fafc" />
                            <stop offset="50%" stopColor="#64748b" />
                            <stop offset="100%" stopColor="#0f172a" />
                          </linearGradient>
                        </defs>

                        {/* Background Base */}
                        <rect width="640" height="360" fill="url(#studioBackdrop)" />
                        <rect width="640" height="360" fill="url(#keyLightGlow)" />

                        {/* Atmospheric Dust / Studio Particles */}
                        <circle cx="210" cy="90" r="1.5" fill="#38bdf8" opacity="0.6" />
                        <circle cx="340" cy="140" r="1.2" fill="#38bdf8" opacity="0.4" />
                        <circle cx="480" cy="70" r="2" fill="#ffffff" opacity="0.3" />
                        <circle cx="150" cy="220" r="1" fill="#38bdf8" opacity="0.5" />

                        {/* Subject: Profile of Black Man Wearing Black Headphones, Facing Right */}
                        <g transform="translate(140, 10)">
                          {/* Neck & Shoulders (Muscular, wearing dark studio crewneck) */}
                          <path
                            d="M 120 280 C 130 250, 150 240, 175 235 C 195 240, 220 260, 260 300 L 260 360 L 50 360 L 50 310 Z"
                            fill="#0b0f19"
                          />
                          <path
                            d="M 125 240 C 145 235, 175 235, 185 245 L 180 290 C 160 295, 140 290, 125 285 Z"
                            fill="url(#skinToneGradient)"
                          />

                          {/* Neck Sapphire Rim highlight on back of neck */}
                          <path
                            d="M 120 235 Q 123 260 125 285"
                            stroke="#38bdf8"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            opacity="0.8"
                            filter="drop-shadow(-2px 0 6px #38bdf8)"
                          />

                          {/* Head & Facial Profile silhouette (looking right) */}
                          {/* Cranium / Back of Head & Jawline */}
                          <path
                            d="M 140 100 C 140 60, 185 45, 230 50 C 255 54, 275 75, 280 100 C 285 110, 283 125, 282 135 C 286 142, 292 148, 290 156 C 288 162, 282 165, 280 172 C 282 182, 278 190, 268 196 C 255 204, 230 215, 215 220 C 190 226, 170 220, 155 210 C 140 190, 135 150, 140 100 Z"
                            fill="url(#skinToneGradient)"
                          />

                          {/* Facial Profile Contours (Brow, Nose bridge, Lips, Chin facing right) */}
                          <path
                            d="M 272 85 C 280 92, 284 100, 282 110 C 285 118, 293 126, 296 132 C 298 138, 290 142, 287 146 C 292 153, 291 160, 285 165 C 288 174, 284 182, 275 188 C 265 195, 245 205, 225 212"
                            fill="none"
                            stroke="#6c402b"
                            strokeWidth="1.5"
                            opacity="0.8"
                          />

                          {/* Sapphire Blue Rim Light along cranium & back silhouette */}
                          <path
                            d="M 148 68 C 158 52, 185 46, 225 50"
                            stroke="#38bdf8"
                            strokeWidth="3"
                            strokeLinecap="round"
                            opacity="0.85"
                          />

                          {/* Studio Headband of Black Headphones */}
                          <path
                            d="M 152 75 C 160 38, 215 32, 235 55"
                            stroke="url(#headphoneObsidian)"
                            strokeWidth="16"
                            strokeLinecap="round"
                            fill="none"
                          />
                          <path
                            d="M 152 75 C 160 38, 215 32, 235 55"
                            stroke="#64748b"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            fill="none"
                            opacity="0.6"
                          />

                          {/* Black Over-Ear Headphone Cup (Angled on ear) */}
                          <g transform="translate(185, 100) rotate(12)">
                            {/* Outer Headphone Chassis */}
                            <ellipse
                              cx="0"
                              cy="15"
                              rx="30"
                              ry="42"
                              fill="url(#headphoneObsidian)"
                              stroke="url(#chromeBevel)"
                              strokeWidth="2.5"
                            />
                            {/* Padded Acoustic Ear Cushion */}
                            <ellipse
                              cx="-6"
                              cy="15"
                              rx="22"
                              ry="34"
                              fill="#090d16"
                              stroke="#1e293b"
                              strokeWidth="1.5"
                            />
                            {/* Central Diamond-cut Knurled Accent Badge */}
                            <circle cx="2" cy="15" r="14" fill="#020617" stroke="#38bdf8" strokeWidth="1" />
                            <circle cx="2" cy="15" r="8" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" />
                            {/* Sapphire Edge Glow on Headphone Cup Rim */}
                            <path
                              d="M -20 -15 C -28 0, -28 30, -18 45"
                              stroke="#38bdf8"
                              strokeWidth="2.5"
                              fill="none"
                              opacity="0.9"
                              filter="drop-shadow(0 0 5px #38bdf8)"
                            />
                          </g>

                          {/* Studio Subtle Highlights on Cheekbone & Jaw */}
                          <path
                            d="M 250 140 Q 265 155 258 175"
                            stroke="#8a5338"
                            strokeWidth="4"
                            strokeLinecap="round"
                            opacity="0.4"
                            filter="blur(2px)"
                          />
                        </g>

                        {/* Camera Watermark / HUD Overlay in Viewfinder */}
                        <g opacity="0.8">
                          <text x="25" y="35" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold">
                            ● REC [SYNC 00:{formatTimestamp(currentTime)}]
                          </text>
                          <text x="25" y="52" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                            FPS: 59.94 • COLOR: ACEScc LOG • SHUTTER: 1/120
                          </text>

                          {/* Crosshair Viewfinder lines */}
                          <line x1="310" y1="180" x2="330" y2="180" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.5" />
                          <line x1="320" y1="170" x2="320" y2="190" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.5" />
                          <circle cx="320" cy="180" r="18" fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="3 3" />
                        </g>
                      </svg>
                    </div>

                    {/* Hover Control Overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-between p-3 transition-opacity duration-200 ${
                        videoHovered ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-sky-300 border border-sky-500/30">
                          AI VIDEO GEN: READY
                        </span>
                        <button
                          onClick={onOpenMediaStudio}
                          className="p-1 rounded bg-black/60 hover:bg-sky-500 hover:text-slate-950 text-slate-300 transition-colors"
                          title="Open Fullscreen Studio"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/30 transition-transform active:scale-95"
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                          <span>{isPlaying ? 'Pause Video' : 'Preview Video'}</span>
                        </button>
                        <span className="text-xs font-mono text-slate-200 bg-black/70 px-2 py-0.5 rounded">
                          {formatTimestamp(currentTime)} / 03:00.0
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* EXPORT SETTINGS: Production Master Delivery Controls */}
                {/* ========================================================================= */}
                <div className="p-3 rounded-lg bg-slate-950/80 border border-white/10 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-slate-200 font-bold">
                      <Download className="w-3.5 h-3.5 text-sky-400" />
                      <span>Master Audio Export Matrix</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">LOSSLESS MASTERING</span>
                  </div>

                  {/* Format Selector */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Target Format</label>
                      <select
                        value={exportFormat}
                        onChange={(e: any) => setExportFormat(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500 text-xs"
                      >
                        <option value="FLAC 24-bit/96kHz">FLAC 24-bit / 96 kHz</option>
                        <option value="WAV 32-bit Float">WAV 32-bit Float</option>
                        <option value="Spatial Audio ADM BWF">Spatial Audio ADM BWF</option>
                        <option value="MP3 320kbps">MP3 320 kbps (Stream)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Sample Rate</label>
                      <select
                        value={exportSampleRate}
                        onChange={(e: any) => setExportSampleRate(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500 text-xs"
                      >
                        <option value="96 kHz">96.0 kHz (Studio Standard)</option>
                        <option value="48 kHz">48.0 kHz (Cinema / Broadcast)</option>
                        <option value="192 kHz">192.0 kHz (Audiophile Archival)</option>
                      </select>
                    </div>
                  </div>

                  {/* Audio Engineering Switches: Dither & Loudness Normalization */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                    <button
                      onClick={() => setExportDither(!exportDither)}
                      className={`flex items-center justify-between p-2 rounded border transition-colors ${
                        exportDither
                          ? 'bg-sky-950/60 border-sky-500/40 text-sky-300'
                          : 'bg-slate-900 border-white/5 text-slate-400'
                      }`}
                    >
                      <span>TPDF Dither</span>
                      <span className={`text-[10px] font-bold ${exportDither ? 'text-sky-400' : 'text-slate-500'}`}>
                        {exportDither ? 'ENGAGED' : 'OFF'}
                      </span>
                    </button>

                    <button
                      onClick={() => setExportNormalize(!exportNormalize)}
                      className={`flex items-center justify-between p-2 rounded border transition-colors ${
                        exportNormalize
                          ? 'bg-sky-950/60 border-sky-500/40 text-sky-300'
                          : 'bg-slate-900 border-white/5 text-slate-400'
                      }`}
                    >
                      <span>EBU R128</span>
                      <span className={`text-[10px] font-bold ${exportNormalize ? 'text-sky-400' : 'text-slate-500'}`}>
                        {targetLufs} LUFS
                      </span>
                    </button>
                  </div>

                  {/* Render Master Stem Button */}
                  <button
                    onClick={() => {
                      alert(`Master package for "${song.title}" queued: ${exportFormat} at ${exportSampleRate} with ${targetLufs} LUFS normalization.`);
                    }}
                    className="w-full mt-1 py-2 px-3 rounded-lg bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-slate-950 font-bold font-mono text-xs shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>EXPORT HIGH-RES MASTER PACKAGE</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM MASTER TIMELINE: Vibrant blue audio waveforms next to Neural Net progress */}
      {/* ========================================================================= */}
      <div className="p-3.5 pt-1">
        <div className="rounded-xl border border-white/10 shadow-2xl overflow-hidden bg-[#030716] flex flex-col">
          {/* Header Transport Bar */}
          <div className="px-4 py-2 border-b border-white/5 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
            {/* Transport Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentTime(0);
                  setIsPlaying(false);
                }}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title="Return to Zero (RTZ)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md font-mono text-xs font-bold transition-all shadow-md ${
                  isPlaying
                    ? 'bg-sky-400 text-slate-950 shadow-sky-400/30'
                    : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlaying ? 'PAUSE' : 'PLAY MASTER'}</span>
              </button>

              <div className="h-6 w-px bg-white/10 mx-1" />

              {/* Timecode Readout with 8k Studio precision */}
              <div className="flex items-center gap-2 px-3 py-1 rounded bg-black/80 border border-sky-500/30 font-mono">
                <span className="text-[10px] text-sky-400">TC</span>
                <span className="text-sky-300 font-bold text-sm tracking-widest">{formatTimestamp(currentTime)}</span>
                <span className="text-slate-600 text-xs">/</span>
                <span className="text-slate-400 text-xs">03:00.0</span>
              </div>
            </div>

            {/* Central Master Peak Meters */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                <span>MASTER L/R:</span>
                <div className="flex flex-col gap-1 w-28">
                  <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden flex">
                    <div className="bg-gradient-to-r from-sky-400 to-emerald-400 h-full w-[82%]" />
                  </div>
                  <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden flex">
                    <div className="bg-gradient-to-r from-sky-400 to-emerald-400 h-full w-[78%]" />
                  </div>
                </div>
                <span className="text-emerald-400 text-[10px]">-0.3 dB</span>
              </div>
            </div>

            {/* Timeline Zoom & Grid Mode */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">ZOOM:</span>
              <button
                onClick={() => setTimelineZoom(Math.max(0.5, timelineZoom - 0.25))}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                -
              </button>
              <span className="text-sky-300 font-bold">{timelineZoom}x</span>
              <button
                onClick={() => setTimelineZoom(Math.min(3, timelineZoom + 0.25))}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                +
              </button>
            </div>
          </div>

          {/* Timeline Body: Vibrant Blue Audio Waveforms next to Neural Net Progress Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[160px] bg-[#020512]">
            {/* ========================================================================= */}
            {/* LEFT / CENTER: Vibrant Blue Audio Waveforms on Solid Midnight Navy Background */}
            {/* ========================================================================= */}
            <div className="lg:col-span-8 p-3 flex flex-col justify-between border-r border-white/5 relative overflow-hidden">
              {/* Ruler Bar with Bars and Beats */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-b border-white/5 pb-1 mb-2">
                <span>BAR 01.1</span>
                <span>BAR 05.1</span>
                <span>BAR 09.1 [VERSE]</span>
                <span>BAR 17.1 [CHORUS]</span>
                <span>BAR 25.1 [BRIDGE]</span>
                <span>BAR 33.1 [OUTRO]</span>
              </div>

              {/* Multi-Track Vibrant Blue Waveforms Canvas Container */}
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                  setCurrentTime(Number((ratio * 180).toFixed(1)));
                }}
                className="relative h-28 w-full bg-[#030a1c] rounded-lg border border-sky-500/20 cursor-pointer overflow-hidden group shadow-inner"
              >
                {/* Midnight Navy grid markers */}
                <div className="absolute inset-0 grid grid-cols-12 divide-x divide-white/[0.04] pointer-events-none" />

                {/* Live Playhead Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white z-20 shadow-[0_0_8px_#ffffff] transition-all pointer-events-none"
                  style={{ left: `${(currentTime / 180) * 100}%` }}
                >
                  <div className="w-2.5 h-2.5 -ml-1 bg-sky-400 rotate-45 border border-white" />
                </div>

                {/* VIBRANT BLUE AUDIO WAVEFORMS (Multi-harmonic stereo waveform rendering) */}
                <svg className="w-full h-full relative z-10 pulse-waveform" preserveAspectRatio="none" viewBox="0 0 1000 100">
                  <defs>
                    <linearGradient id="vibrantBlueWave" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
                      <stop offset="50%" stopColor="#0284c7" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#0369a1" stopOpacity="0.4" />
                    </linearGradient>
                    <linearGradient id="mirrorWave" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#082f49" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>

                  {/* Upper Waveform Peak Envelope */}
                  <path
                    d="M 0 50 
                       Q 20 20, 40 45 T 80 15 T 120 48 T 160 10 T 200 45 T 240 5 T 280 40 
                       T 320 8 T 360 42 T 400 2 T 440 38 T 480 12 T 520 45 T 560 5 T 600 40 
                       T 640 18 T 680 44 T 720 8 T 760 40 T 800 20 T 840 46 T 880 14 T 920 42 T 960 25 T 1000 50
                       L 1000 50 L 0 50 Z"
                    fill="url(#vibrantBlueWave)"
                  />

                  {/* Mirrored Lower Waveform */}
                  <path
                    d="M 0 50 
                       Q 20 80, 40 55 T 80 85 T 120 52 T 160 90 T 200 55 T 240 95 T 280 60 
                       T 320 92 T 360 58 T 400 98 T 440 62 T 480 88 T 520 55 T 560 95 T 600 60 
                       T 640 82 T 680 56 T 720 92 T 760 60 T 800 80 T 840 54 T 880 86 T 920 58 T 960 75 T 1000 50
                       L 1000 50 L 0 50 Z"
                    fill="url(#mirrorWave)"
                  />

                  {/* Central Zero-Crossing Line */}
                  <line x1="0" y1="50" x2="1000" y2="50" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4" />
                </svg>

                {/* Track label inside waveform */}
                <div className="absolute bottom-2 left-3 z-10 flex items-center gap-2 pointer-events-none">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-sky-300 border border-sky-500/30">
                    MASTER STEM: ACOUSTIC & VOCAL SYNAPSE
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    48000 Hz • 24-BIT STEREO
                  </span>
                </div>
              </div>

              {/* Timeline Footer Track Info */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
                  <span>Stereo Master Output 1-2 [Solid Midnight Navy Bus]</span>
                </span>
                <span className="text-slate-500">Continuous Bead-Blasted Titanium Chassis Frame</span>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* RIGHT: Neural Network Progress Panel */}
            {/* ========================================================================= */}
            <div className="lg:col-span-4 p-3.5 flex flex-col justify-between bg-[#04081c]/70">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-sky-400 animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="text-xs font-mono font-bold tracking-wider text-slate-200">
                      NEURAL NETWORK PROGRESS
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/40 text-sky-300 font-bold">
                    ACTIVE
                  </span>
                </div>

                {/* Master Neural Convergence Gauge */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">Latent Pitch & Prosody</span>
                    <span className="text-sky-400 font-bold">{neuralProgress.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-300 rounded-full shadow-[0_0_10px_#38bdf8] transition-all duration-300"
                      style={{ width: `${neuralProgress}%` }}
                    />
                  </div>
                </div>

                {/* Sub Metrics: Latent Epochs, Spectral Loss, Beam Search */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="p-2 rounded bg-slate-950/80 border border-white/5">
                    <div className="text-slate-400">Diffusion Epochs</div>
                    <div className="text-slate-200 font-bold text-xs mt-0.5">{latentEpochs} / 2500</div>
                  </div>

                  <div className="p-2 rounded bg-slate-950/80 border border-white/5">
                    <div className="text-slate-400">Spectral Loss</div>
                    <div className="text-emerald-400 font-bold text-xs mt-0.5">λ = {spectralConvergence}</div>
                  </div>
                </div>

                {/* Beam Status Indicator */}
                <div className="p-2.5 rounded-lg bg-sky-950/30 border border-sky-500/20 text-[11px] font-mono flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-slate-300">{beamSearchStatus}</span>
                  </div>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>

              {/* Bottom Quick Action: Realtime Sync & Retrain */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">Inference Core: v3.8</span>
                <button
                  onClick={() => {
                    setNeuralProgress(99.9);
                    setSpectralConvergence(0.0004);
                    setBeamSearchStatus('Loss Minimum Locked');
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-mono border border-white/10 transition-colors"
                >
                  Optimize Weights
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
