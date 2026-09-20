import React, { useState, useMemo, useEffect } from 'react';
import {
  Volume2,
  Play,
  Pause,
  Trash2,
  Terminal,
  Copy,
  Check,
  Radio,
  Clock,
  Layers,
  Sparkles,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Wand2,
  RotateCcw,
  Maximize2,
  Grid,
  ChevronDown,
  ChevronUp,
  Activity,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import { VoiceStem, TimelineValidationReport } from '../types';
import { start432HzCarrier, stop432HzCarrier } from '../lib/audio432';
import {
  validateVoiceStemsTimeline,
  batchDeconflictStems,
  batchQuantizeStemsHarmonicGrid,
  batchDistributeStems,
  generateMockConflictingStems,
  formatFrameToTime,
  DRAGON9_TIMELINE_CONSTANTS,
} from '../lib/timelineValidator';

const ELEVENLABS_PRESET_VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', style: 'Crisp & Comedic Timing' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', style: 'Deep Resonance & Punchline Timing' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', style: 'Brisk & Energetic Delivery' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', style: 'Fast Witty Monologue' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', style: 'Deadpan Observational Tone' },
];

interface ElevenLabsVoiceQueueProps {
  stems: VoiceStem[];
  setStems: React.Dispatch<React.SetStateAction<VoiceStem[]>>;
  currentFrame: number;
}

export const ElevenLabsVoiceQueue: React.FC<ElevenLabsVoiceQueueProps> = ({
  stems,
  setStems,
  currentFrame,
}) => {
  const [selectedVoice, setSelectedVoice] = useState(ELEVENLABS_PRESET_VOICES[0]);
  const [activeStemPlaying, setActiveStemPlaying] = useState<string | null>(null);
  const [copiedFfmpeg, setCopiedFfmpeg] = useState(false);
  const [carrierVolume, setCarrierVolume] = useState(0.08);

  // Batch Validation & 54-Minute Timeline State
  const [timelineMode, setTimelineMode] = useState<'18s_micro_cycle' | '54m_dragon9_hour'>('18s_micro_cycle');
  const [pauseBufferFrames, setPauseBufferFrames] = useState<number>(DRAGON9_TIMELINE_CONSTANTS.DEFAULT_COMEDIC_PAUSE_FRAMES); // 15 frames = 0.5s
  const [isValidatingBatch, setIsValidatingBatch] = useState<boolean>(false);
  const [batchActionFeedback, setBatchActionFeedback] = useState<string | null>(null);
  const [showConflictsPanel, setShowConflictsPanel] = useState<boolean>(true);

  // Total frames depending on timeline mode
  const totalTimelineFrames =
    timelineMode === '54m_dragon9_hour'
      ? DRAGON9_TIMELINE_CONSTANTS.DRAGON9_HOUR_FRAMES
      : DRAGON9_TIMELINE_CONSTANTS.MICRO_CYCLE_FRAMES;

  // Real-time calculation of timeline validation report
  const validationReport: TimelineValidationReport = useMemo(() => {
    return validateVoiceStemsTimeline(stems, {
      timeline_mode: timelineMode,
      fps: DRAGON9_TIMELINE_CONSTANTS.FPS,
      min_gap_frames: 0, // strict overlap detection
    });
  }, [stems, timelineMode]);

  // Set of stem IDs that are in direct conflict
  const conflictingStemIds = useMemo(() => {
    const ids = new Set<string>();
    validationReport.conflicts.forEach((c) => {
      if (c.severity === 'critical') {
        ids.add(c.stemA_id);
        ids.add(c.stemB_id);
      }
    });
    return ids;
  }, [validationReport]);

  // Remove stem
  const removeStem = (id: string) => {
    setStems((prev) => prev.filter((s) => s.id !== id));
  };

  // Play stem with optional 432Hz carrier backing
  const playStemAudio = (stem: VoiceStem) => {
    if (activeStemPlaying === stem.id) {
      setActiveStemPlaying(null);
      stop432HzCarrier();
      return;
    }

    if (stem.audio_base64) {
      setActiveStemPlaying(stem.id);
      start432HzCarrier(432, carrierVolume);
      const audio = new Audio(stem.audio_base64);
      audio.onended = () => {
        setActiveStemPlaying(null);
        stop432HzCarrier();
      };
      audio.play().catch(() => {
        setActiveStemPlaying(null);
        stop432HzCarrier();
      });
    }
  };

  // 1. Batch Utility: Run Validation Check
  const handleRunBatchValidation = () => {
    setIsValidatingBatch(true);
    setBatchActionFeedback('Scanning all voice stems against 54-minute timeline boundaries...');
    setTimeout(() => {
      setIsValidatingBatch(false);
      if (validationReport.is_valid) {
        setBatchActionFeedback(
          `✅ Verified: All ${stems.length} dialogue stems are 100% collision-free in the ${
            timelineMode === '54m_dragon9_hour' ? '54-minute hour' : '18-second micro-cycle'
          }!`
        );
      } else {
        const count = validationReport.conflicts.filter((c) => c.severity === 'critical').length;
        setBatchActionFeedback(
          `⚠️ Found ${count} overlapping dialogue collisions across ${validationReport.total_overlap_frames} frames (${(
            validationReport.total_overlap_frames / 30
          ).toFixed(2)}s).`
        );
      }
      setTimeout(() => setBatchActionFeedback(null), 4000);
    }, 450);
  };

  // 2. Batch Utility: Auto-Resolve Overlaps (Chronological Deconfliction)
  const handleAutoResolveOverlaps = () => {
    if (stems.length === 0) return;
    const deconflicted = batchDeconflictStems(stems, pauseBufferFrames, 15);
    setStems(deconflicted);
    setBatchActionFeedback(
      `🎉 Successfully deconflicted all stems! Applied ${(pauseBufferFrames / 30).toFixed(
        1
      )}s comedic pause buffers between lines.`
    );
    setTimeout(() => setBatchActionFeedback(null), 4000);
  };

  // 3. Batch Utility: Snap to 432Hz Harmonic Beat Grid (15-frame increments)
  const handleHarmonicQuantize = () => {
    if (stems.length === 0) return;
    const quantized = batchQuantizeStemsHarmonicGrid(stems, 15);
    setStems(quantized);
    setBatchActionFeedback('⚡ All stem start frames snapped to 432Hz harmonic 15-frame beat boundaries.');
    setTimeout(() => setBatchActionFeedback(null), 3500);
  };

  // 4. Batch Utility: Distribute Evenly Across Sequence
  const handleDistributeStems = () => {
    if (stems.length === 0) return;
    const distributed = batchDistributeStems(stems, totalTimelineFrames);
    setStems(distributed);
    setBatchActionFeedback(
      `⚖️ Evenly distributed ${stems.length} voice stems across the ${
        timelineMode === '54m_dragon9_hour' ? '54-minute hour' : '18-second sequence'
      }.`
    );
    setTimeout(() => setBatchActionFeedback(null), 3500);
  };

  // 5. Batch Utility: Load Overlapping Demo Stems for Instant Testing
  const handleLoadDemoOverlaps = () => {
    const demo = generateMockConflictingStems();
    setStems(demo);
    setShowConflictsPanel(true);
    setBatchActionFeedback('Loaded 3 demo comedy stems with intentional dialogue collisions (35f and 16f overlaps).');
    setTimeout(() => setBatchActionFeedback(null), 4500);
  };

  // Manual stem frame nudging
  const adjustStemFrame = (id: string, deltaFrames: number) => {
    setStems((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const duration = s.end_frame - s.start_frame;
        const newStart = Math.max(0, s.start_frame + deltaFrames);
        return {
          ...s,
          start_frame: newStart,
          end_frame: newStart + duration,
        };
      })
    );
  };

  // Generate FFmpeg composition filter_complex command
  const generateFfmpegFilter = () => {
    if (stems.length === 0) {
      return `# FFmpeg 432Hz carrier with standard show loop
ffmpeg -y -framerate 30 -i $FRAMES_DIR/frame_%04d.png \\
       -f lavfi -i "sine=frequency=432:sample_rate=48000:duration=18" \\
       -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k \\
       $OUTPUT_DIR/18min_show_sequence.mp4`;
    }

    const inputs = stems
      .map((s) => `       -i "$STEMS_DIR/stem_${s.segment_id}.mp3" \\`)
      .join('\n');

    const delays = stems
      .map((s, idx) => {
        const delayMs = Math.round((s.start_frame / 30) * 1000);
        return `[${idx + 2}:a]adelay=${delayMs}|${delayMs}[s${idx}];`;
      })
      .join('\n  ');

    const mixInputs = ['[carrier]', ...stems.map((_, idx) => `[s${idx}]`)].join('');
    const totalInputs = stems.length + 1;

    return `# FFmpeg 432Hz Carrier & Multi-Voice Stem Composition Command
# Timeline: ${timelineMode === '54m_dragon9_hour' ? '54-Minute Dragon9 Hour' : '18s / 540 Frames'}
# Collision Status: ${validationReport.is_valid ? 'VERIFIED (0 Overlaps)' : `WARNING (${validationReport.conflicts.length} Overlaps)`}
ffmpeg -y \\
       -framerate 30 -i "$FRAMES_DIR/frame_%04d.png" \\
       -f lavfi -i "sine=frequency=432:sample_rate=48000:duration=${timelineMode === '54m_dragon9_hour' ? 3240 : 18}" \\
${inputs}
       -filter_complex "\\
  [1:a]volume=0.15[carrier];\\
  ${delays}
  ${mixInputs}amix=inputs=${totalInputs}:duration=first:dropout_transition=2[aout]" \\
       -map 0:v -map "[aout]" \\
       -c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 20 \\
       -c:a aac -b:a 192k \\
       "$OUTPUT_DIR/${timelineMode === '54m_dragon9_hour' ? '60min_show_sequence.mp4' : '18min_show_sequence.mp4'}"`;
  };

  const copyFfmpegCommand = () => {
    navigator.clipboard.writeText(generateFfmpegFilter());
    setCopiedFfmpeg(true);
    setTimeout(() => setCopiedFfmpeg(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview & Objective Banner */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              ElevenLabs Dialogue Queue
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              432Hz Carrier Sync
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              54-Min Timeline Batch Validator
            </span>
          </div>
          <h2 className="text-xl font-bold text-zinc-100 mt-2">
            Voice Stem Queue & 54-Minute Timeline Validator
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Batch checks dialogue segments against the Dragon9 54-minute timeline (3,240s / 97,200 frames) and 18s micro-cycles to prevent audio collisions and preserve stand-up comedic delivery.
          </p>
        </div>

        {/* Voice Selection */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 block mb-1">
              Active Voice Model
            </label>
            <select
              value={selectedVoice.id}
              onChange={(e) => {
                const found = ELEVENLABS_PRESET_VOICES.find((v) => v.id === e.target.value);
                if (found) setSelectedVoice(found);
              }}
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
            >
              {ELEVENLABS_PRESET_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.style.split('&')[0]})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* BATCH VALIDATION UTILITY TOOLBAR */}
      <div className="bg-zinc-900/95 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          {/* Left: Validation Status Readout */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                validationReport.is_valid
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
              }`}
            >
              {validationReport.is_valid ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Timeline Validation Status:
                </span>
                <span
                  id="timeline-validation-badge"
                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    validationReport.is_valid
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {validationReport.is_valid
                    ? '0 Overlaps • Timeline Verified'
                    : `${validationReport.conflicts.filter((c) => c.severity === 'critical').length} Collision(s) Detected`}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {validationReport.is_valid
                  ? `All ${stems.length} voice stems are sequenced with clear comedic spacing across the ${
                      timelineMode === '54m_dragon9_hour' ? '54-minute hour' : '18s sequence'
                    }.`
                  : `Overlapping dialogue detected! Stems talk over each other for ${
                      validationReport.total_overlap_frames
                    } frames (${(validationReport.total_overlap_frames / 30).toFixed(2)}s).`}
              </p>
            </div>
          </div>

          {/* Right: Scope & Comedic Timing Pause Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Timeline Scope Switcher */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                id="timeline-scope-18s-btn"
                onClick={() => setTimelineMode('18s_micro_cycle')}
                className={`px-3 py-1 rounded-lg transition font-medium ${
                  timelineMode === '18s_micro_cycle'
                    ? 'bg-zinc-800 text-amber-300 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                18s Micro-Cycle (540f)
              </button>
              <button
                id="timeline-scope-54m-btn"
                onClick={() => setTimelineMode('54m_dragon9_hour')}
                className={`px-3 py-1 rounded-lg transition font-medium ${
                  timelineMode === '54m_dragon9_hour'
                    ? 'bg-zinc-800 text-amber-300 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                54-Minute Hour (97.2kf)
              </button>
            </div>

            {/* Comedic Pause Buffer Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-800 text-xs text-zinc-400">
              <span className="text-[11px] text-zinc-500">Deconflict Pause:</span>
              <select
                value={pauseBufferFrames}
                onChange={(e) => setPauseBufferFrames(Number(e.target.value))}
                className="bg-transparent text-amber-400 font-mono font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value={0} className="bg-zinc-900 text-zinc-200">0s (Strict abut)</option>
                <option value={15} className="bg-zinc-900 text-zinc-200">0.5s (15f pause)</option>
                <option value={30} className="bg-zinc-900 text-zinc-200">1.0s (30f punchline)</option>
                <option value={45} className="bg-zinc-900 text-zinc-200">1.5s (45f laugh gap)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Batch Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Run Validation */}
            <button
              id="run-batch-validation-btn"
              onClick={handleRunBatchValidation}
              disabled={isValidatingBatch}
              className="px-3.5 py-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700/80 flex items-center gap-1.5 transition active:scale-95"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isValidatingBatch ? 'animate-spin text-amber-400' : 'text-emerald-400'}`} />
              <span>Validate Timeline</span>
            </button>

            {/* Auto-Resolve Overlaps */}
            <button
              id="auto-resolve-overlaps-btn"
              onClick={handleAutoResolveOverlaps}
              disabled={stems.length === 0}
              className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Auto-Resolve All Overlaps</span>
            </button>

            {/* Quantize to 432Hz Grid */}
            <button
              id="quantize-harmonic-grid-btn"
              onClick={handleHarmonicQuantize}
              disabled={stems.length === 0}
              className="px-3 py-2 text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 flex items-center gap-1.5 transition"
              title="Snap start frames to 432Hz harmonic 15-frame beats"
            >
              <Grid className="w-3.5 h-3.5 text-sky-400" />
              <span>Snap 432Hz Grid</span>
            </button>

            {/* Distribute Evenly */}
            <button
              id="distribute-stems-btn"
              onClick={handleDistributeStems}
              disabled={stems.length <= 1}
              className="px-3 py-2 text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 flex items-center gap-1.5 transition"
              title="Distribute dialogue stems evenly across the active sequence"
            >
              <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Distribute Stems</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Load Mock Collisions Demo */}
            <button
              id="load-mock-overlaps-btn"
              onClick={handleLoadDemoOverlaps}
              className="px-3 py-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center gap-1.5 transition"
              title="Insert 3 comedy dialogue stems with intentional collisions to test validation and resolution"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Overlap Test Cases</span>
            </button>

            {/* Toggle Conflicts List */}
            {validationReport.conflicts.length > 0 && (
              <button
                onClick={() => setShowConflictsPanel((prev) => !prev)}
                className="px-2.5 py-1.5 text-xs text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl flex items-center gap-1 transition"
              >
                <span>{validationReport.conflicts.length} Conflicts</span>
                {showConflictsPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Action feedback toast banner */}
        {batchActionFeedback && (
          <div className="p-3 bg-zinc-950 rounded-xl border border-amber-500/30 text-xs font-mono text-amber-300 flex items-center justify-between animate-fadeIn">
            <span>{batchActionFeedback}</span>
            <button
              onClick={() => setBatchActionFeedback(null)}
              className="text-zinc-500 hover:text-zinc-300 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Collapsible Conflicts Detailed Breakdown */}
        {showConflictsPanel && validationReport.conflicts.length > 0 && (
          <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-rose-300 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                Detected Dialogue Collisions ({validationReport.conflicts.length})
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                Total Overlap: {validationReport.total_overlap_frames} frames (
                {(validationReport.total_overlap_frames / 30).toFixed(2)}s)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {validationReport.conflicts.map((conflict, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-zinc-950/90 rounded-lg border border-rose-500/40 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-200">
                      {conflict.stemA_label} <span className="text-rose-400">⚡ clashes with</span> {conflict.stemB_label}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300">
                      -{conflict.overlap_duration_frames}f ({conflict.overlap_duration_sec.toFixed(2)}s)
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                    Overlap range: Frames <strong className="text-amber-400">{conflict.overlap_start_frame}</strong> to{' '}
                    <strong className="text-amber-400">{conflict.overlap_end_frame}</strong>. Comedic timing is impaired by overlapping voices.
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                    <span>Target: Delay second stem by +{conflict.overlap_duration_frames + pauseBufferFrames} frames</span>
                    <button
                      onClick={() => adjustStemFrame(conflict.stemB_id, conflict.overlap_duration_frames + pauseBufferFrames)}
                      className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 hover:text-amber-200 transition"
                    >
                      Nudge Stem B ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Frame Timeline Visualizer with Overlap Warning Markers */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
              {timelineMode === '54m_dragon9_hour'
                ? 'Dragon9 54-Minute Timeline Track Alignment (97,200 Frames / 3,240s)'
                : '18s Sequence Audio Track Alignment (540 Frames @ 30fps)'}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
            <span>
              Playhead: <span className="text-amber-400 font-bold">{currentFrame}</span> / {totalTimelineFrames}
            </span>
            <span className="text-zinc-500">
              ({formatFrameToTime(currentFrame, 30)})
            </span>
          </div>
        </div>

        {/* Timeline Strip */}
        <div className="relative w-full h-28 bg-zinc-950 rounded-xl border border-zinc-800 p-2 overflow-hidden flex flex-col justify-between">
          {/* 432Hz Background Carrier Wave Graphic */}
          <div className="absolute inset-0 opacity-15 pointer-events-none flex items-center">
            <svg className="w-full h-12 text-amber-400" preserveAspectRatio="none" viewBox="0 0 100 20">
              <path
                d="M 0 10 Q 5 0, 10 10 T 20 10 T 30 10 T 40 10 T 50 10 T 60 10 T 70 10 T 80 10 T 90 10 T 100 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          </div>

          {/* Time markers depending on mode */}
          <div className="flex justify-between text-[10px] font-mono text-zinc-600 px-1 relative z-0">
            {timelineMode === '54m_dragon9_hour' ? (
              <>
                <span>00:00 (F0)</span>
                <span>13:30 (F24.3k)</span>
                <span>27:00 (F48.6k)</span>
                <span>40:30 (F72.9k)</span>
                <span>54:00 (F97.2k)</span>
              </>
            ) : (
              <>
                <span>0.0s (F0)</span>
                <span>4.5s (F135)</span>
                <span>9.0s (F270)</span>
                <span>13.5s (F405)</span>
                <span>18.0s (F540)</span>
              </>
            )}
          </div>

          {/* Placed Voice Stems as Blocks & Overlap Regions */}
          <div className="relative h-12 w-full flex items-center">
            {/* Render Red Collision Zone Overlays */}
            {validationReport.conflicts.map((c, cIdx) => {
              if (c.severity !== 'critical') return null;
              const leftPercent = (c.overlap_start_frame / totalTimelineFrames) * 100;
              const widthPercent = Math.max(
                1.5,
                ((c.overlap_end_frame - c.overlap_start_frame) / totalTimelineFrames) * 100
              );
              return (
                <div
                  key={`collision-${cIdx}`}
                  style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                  className="absolute h-10 top-1 rounded bg-rose-500/35 border-2 border-rose-500/80 z-20 flex items-center justify-center animate-pulse pointer-events-none"
                  title={`Overlap Collision: ${c.stemA_label} & ${c.stemB_label}`}
                >
                  <AlertTriangle className="w-3 h-3 text-rose-300 drop-shadow" />
                </div>
              );
            })}

            {/* Voice Stems */}
            {stems.map((stem) => {
              const leftPercent = (stem.start_frame / totalTimelineFrames) * 100;
              const widthPercent = Math.max(
                2,
                Math.min(
                  100 - leftPercent,
                  ((stem.end_frame - stem.start_frame) / totalTimelineFrames) * 100
                )
              );
              const isColliding = conflictingStemIds.has(stem.id);

              return (
                <div
                  key={stem.id}
                  style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                  className={`absolute h-8 rounded-lg flex items-center px-2 text-[10px] font-mono overflow-hidden shadow-sm transition-all z-10 ${
                    isColliding
                      ? 'bg-rose-950/80 border-2 border-rose-500 text-rose-200'
                      : 'bg-sky-500/20 border border-sky-400/50 text-sky-200'
                  }`}
                  title={`Stem ${stem.segment_id}: ${stem.character} (F${stem.start_frame} - F${stem.end_frame}) ${
                    isColliding ? '⚠️ COLLISION DETECTED' : '✅ NON-OVERLAPPING'
                  }`}
                >
                  {isColliding ? (
                    <AlertTriangle className="w-3 h-3 text-rose-400 mr-1 shrink-0" />
                  ) : (
                    <Volume2 className="w-3 h-3 text-sky-400 mr-1 shrink-0" />
                  )}
                  <span className="truncate">
                    #{stem.segment_id} {stem.character}
                  </span>
                </div>
              );
            })}

            {/* Current Frame Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 shadow-[0_0_8px_#f59e0b] z-30 transition-all duration-75"
              style={{ left: `${(currentFrame / totalTimelineFrames) * 100}%` }}
            />
          </div>

          {/* 432Hz Carrier Base Track */}
          <div className="flex items-center justify-between text-[10px] text-amber-400/80 font-mono pt-1 border-t border-zinc-800/60 relative z-0">
            <span className="flex items-center gap-1">
              <Radio className="w-3 h-3 text-amber-400" /> Continuous 432Hz Sine Tone Carrier
            </span>
            <span>Sample Rate: 48,000Hz (AAC / PCM)</span>
          </div>
        </div>
      </div>

      {/* Stem List & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Stems (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-sky-400" />
              Active Voice Stems ({stems.length})
            </h3>
            <span className="text-xs text-zinc-500 font-mono">
              Total Duration: {(validationReport.total_occupied_duration_sec).toFixed(1)}s
            </span>
          </div>

          {stems.length === 0 ? (
            <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-8 text-center space-y-3">
              <p className="text-xs text-zinc-400">
                No voice stems in queue. Click <strong className="text-amber-400">Load Overlap Test Cases</strong> above or use the Comedy Engine tab.
              </p>
              <button
                onClick={handleLoadDemoOverlaps}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-medium transition inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Load Sample Stand-up Dialogue</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {stems.map((stem) => {
                const isColliding = conflictingStemIds.has(stem.id);

                return (
                  <div
                    key={stem.id}
                    className={`bg-zinc-900/80 border rounded-xl p-4 transition space-y-3 ${
                      isColliding
                        ? 'border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                        : 'border-zinc-800 hover:border-zinc-700/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                            isColliding
                              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                              : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                          }`}
                        >
                          STEM #{stem.segment_id}
                        </span>
                        <span className="text-xs font-semibold text-zinc-200">{stem.character}</span>
                        <span className="text-[10px] text-zinc-500">({stem.language})</span>
                        {isColliding && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            OVERLAPPING
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {stem.audio_base64 && (
                          <button
                            onClick={() => playStemAudio(stem)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                              activeStemPlaying === stem.id
                                ? 'bg-amber-500 text-zinc-950 font-bold'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                            }`}
                          >
                            {activeStemPlaying === stem.id ? (
                              <>
                                <Pause className="w-3 h-3" />
                                <span>Playing + 432Hz</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                <span>Preview</span>
                              </>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => removeStem(stem.id)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg transition"
                          title="Remove stem"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 font-sans italic line-clamp-2">
                      &quot;{stem.text}&quot;
                    </p>

                    {/* Fine-Tuning & Frame Steppers */}
                    <div className="pt-2 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-zinc-400">Frame Range:</span>
                        <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-amber-400 font-bold">
                          {stem.start_frame} → {stem.end_frame}
                        </span>
                        <span className="text-zinc-500">
                          ({formatFrameToTime(stem.start_frame, 30)} - {formatFrameToTime(stem.end_frame, 30)})
                        </span>
                      </div>

                      {/* Manual Nudge Buttons */}
                      <div className="flex items-center gap-1 text-[10px] font-mono">
                        <button
                          onClick={() => adjustStemFrame(stem.id, -15)}
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                          title="Shift back 15 frames (-0.5s)"
                        >
                          -15f
                        </button>
                        <button
                          onClick={() => adjustStemFrame(stem.id, 15)}
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                          title="Shift forward 15 frames (+0.5s)"
                        >
                          +15f
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Generated FFmpeg Filter Composition Script (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              FFmpeg Composition Queue
            </h3>
            <button
              id="copy-ffmpeg-cmd-btn"
              onClick={copyFfmpegCommand}
              className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-950 hover:bg-zinc-800 rounded-lg border border-zinc-800 flex items-center gap-1.5 transition"
            >
              {copiedFfmpeg ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy FFmpeg</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-300 space-y-3 overflow-x-auto">
            <div className="flex items-center justify-between text-[11px] text-zinc-500 pb-2 border-b border-zinc-800">
              <span>libx264 30fps + 432Hz sine mix</span>
              <span className="text-amber-400">
                {validationReport.is_valid ? 'Validation OK' : 'Collisions Warning'}
              </span>
            </div>
            <pre className="text-[11px] text-emerald-300/90 whitespace-pre leading-relaxed">
              {generateFfmpegFilter()}
            </pre>
          </div>

          {/* 432Hz Volume Slider for Test */}
          <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              432Hz Sine Carrier Gain:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.01"
                max="0.25"
                step="0.01"
                value={carrierVolume}
                onChange={(e) => setCarrierVolume(parseFloat(e.target.value))}
                className="w-24 accent-amber-500"
              />
              <span className="font-mono text-amber-400 text-xs w-10 text-right">
                {Math.round(carrierVolume * 100)}%
              </span>
            </div>
          </div>

          {/* Timeline Mechanics Educational Callout */}
          <div className="p-3.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-xs space-y-1.5 text-zinc-400">
            <div className="font-bold text-zinc-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Dragon 9 Stand-up Dialogue Timing Rule</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Stand-up comedy depends on setup-pause-punchline delivery. When voice stems overlap, punchlines collide and audience comprehension drops to 0%. The batch deconflict utility enforces minimum 0.5s (15-frame) pause buffers aligned with the 432Hz harmonic carrier wave.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
