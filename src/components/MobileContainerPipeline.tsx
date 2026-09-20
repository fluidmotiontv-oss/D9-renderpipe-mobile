import React, { useState, useEffect } from 'react';
import {
  Terminal,
  FolderTree,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Play,
  Copy,
  Check,
  RefreshCw,
  Box,
  FileCode,
  ShieldCheck,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { PipelineConfig } from '../types';

interface MobileContainerPipelineProps {
  currentFrame: number;
  totalStems: number;
}

export const MobileContainerPipeline: React.FC<MobileContainerPipelineProps> = ({
  currentFrame,
  totalStems,
}) => {
  const [pipelineConfig, setPipelineConfig] = useState<PipelineConfig | null>(null);
  const [activeScriptTab, setActiveScriptTab] = useState<'orchestrator' | 'audio_mixer' | 'blender_py' | 'manifest'>('orchestrator');
  const [generatedScripts, setGeneratedScripts] = useState<{
    orchestrator_bash?: string;
    stem_mixer_bash?: string;
    blender_python?: string;
  }>({});
  const [isCacheHit, setIsCacheHit] = useState(true);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([
    '[INIT] Workspace mapped: $HOME/dragon9/comedy_pipeline',
    '[OK] In-memory virtual framebuffer active: xvfb-run -a',
    '[CACHE] Smart-cache check: [ -f "$FRAMES_DIR/frame_0540.png" ] -> HIT',
    '[FFMPEG] 30fps libx264 compilation armed (540 frames = 18.0s)',
    '[AUDIO] 432Hz harmonic carrier linked to FFmpeg audio queue',
  ]);
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch status and generated scripts from backend
  useEffect(() => {
    fetch('/api/pipeline/status')
      .then((res) => res.json())
      .then((data) => {
        setPipelineConfig({
          workspace_path: data.workspace_path,
          environment: data.environment,
          project_id: 'gen-lang-client-0271228173',
          blender_version: data.blender.version,
          fps: data.video.fps,
          total_frames_18s: data.video.sequence_18s_frames,
          smart_cache_file: data.blender.frame_cache_target,
          has_cached_frames: data.blender.is_cached,
          audio_frequency: data.audio.carrier_frequency_hz,
          output_targets: {
            sequence_18s: data.video.sequence_18s_name,
            sequence_60min: data.video.sequence_60min_name,
          },
          elevenlabs_configured: data.elevenlabs_configured,
          gemini_configured: data.gemini_configured,
        });
      })
      .catch((err) => console.error('Pipeline status fetch failed:', err));

    fetch('/api/pipeline/generate-scripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frequency: 432,
        fps: 30,
        total_frames: 540,
        sequence_name: '18min_show_sequence.mp4',
        workspace: '$HOME/dragon9/comedy_pipeline',
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setGeneratedScripts(data);
      })
      .catch((err) => console.error('Script generation fetch failed:', err));
  }, []);

  const runPipelineCheck = () => {
    setIsRunningPipeline(true);
    const newLogs = [
      `[${new Date().toLocaleTimeString()}] Starting pipeline smart-cache validation...`,
      `[CACHE CHECK] Testing $FRAMES_DIR/frame_0540.png existence...`,
    ];
    setPipelineLogs(newLogs);

    setTimeout(() => {
      if (isCacheHit) {
        setPipelineLogs((prev) => [
          ...prev,
          `✅ [CACHE HIT] Frame 0540 found in cache. Skipping 3D Blender pass!`,
          `[AUDIO QUEUE] Mapping ${totalStems} ElevenLabs voice stems + 432Hz carrier tone...`,
          `[FFMPEG] Assembling 540 frames @ 30fps with libx264 -> 18min_show_sequence.mp4`,
          `🎉 Execution finished in 0.42s (zero terminal hangs / no nano required)!`,
        ]);
      } else {
        setPipelineLogs((prev) => [
          ...prev,
          `🔄 [CACHE MISS] Frame 0540 missing. Spawning Xvfb virtual framebuffer...`,
          `[BLENDER] xvfb-run -a blender --background --python render_script.py`,
          `[RENDER] Generated frames 1 through 540...`,
          `✅ Frame cache updated: $FRAMES_DIR/frame_0540.png written.`,
          `🎉 Render pass complete!`,
        ]);
        setIsCacheHit(true);
      }
      setIsRunningPipeline(false);
    }, 900);
  };

  const getActiveCode = () => {
    switch (activeScriptTab) {
      case 'orchestrator':
        return generatedScripts.orchestrator_bash || '# Loading orchestrator script...';
      case 'audio_mixer':
        return generatedScripts.stem_mixer_bash || '# Loading FFmpeg audio stem script...';
      case 'blender_py':
        return generatedScripts.blender_python || '# Loading Blender 5.0.1 Python script...';
      case 'manifest':
        return JSON.stringify(
          {
            project_id: 'gen-lang-client-0271228173',
            pipeline: 'Dragon 9 Synchronized Time Comedy Pipeline',
            environment: 'Android Termux -> Ubuntu Container (ARM64)',
            workspace: '$HOME/dragon9/comedy_pipeline',
            subdirectories: ['manifests', 'frames', 'output', 'assets', 'stems'],
            blender: {
              version: '5.0.1 Headless',
              framebuffer: 'Xvfb (xvfb-run -a)',
              cache_sentinel: 'frames/frame_0540.png',
            },
            ffmpeg: {
              fps: 30,
              frames_18s: 540,
              audio_carrier_hz: 432,
              codec_v: 'libx264',
              codec_a: 'aac',
            },
            voice_stems_queued: totalStems,
            outputs: ['18min_show_sequence.mp4', '60min_show_sequence.mp4'],
          },
          null,
          2
        );
    }
  };

  const copyCurrentScript = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Current Architectural State Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Environment Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span>Container Architecture</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Ubuntu ARM64 (Termux)</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 font-mono">
            Project: gen-lang-client-0271228173
          </p>
        </div>

        {/* Workspace Path Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span>Workspace Location</span>
            <FolderTree className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-zinc-100 font-mono truncate">
            $HOME/dragon9/comedy_pipeline
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            manifests / frames / output / assets
          </p>
        </div>

        {/* 3D Headless Blender Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span>3D Rendering Engine</span>
            <Box className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-sm font-bold text-zinc-100">
            Blender 5.0.1 Headless
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Xvfb In-Memory Framebuffer (EGL bypassed)
          </p>
        </div>

        {/* Smart Cache State Card */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
            <span>Smart-Cache Sentinel</span>
            <ShieldCheck className={`w-3.5 h-3.5 ${isCacheHit ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <div className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${isCacheHit ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
              {isCacheHit ? 'frame_0540.png CACHED' : 'CACHE INVALIDATED'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Skips redundant render passes
          </p>
        </div>
      </div>

      {/* Interactive Pipeline Action Bar */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 sm:p-5 backdrop-blur flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">
              Container Orchestration & Smart-Cache Verifier
            </h3>
            <p className="text-xs text-zinc-400">
              Simulates container pipeline execution on ARM64 Termux without terminal freezes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCacheHit((c) => !c)}
            className="px-3 py-2 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 transition"
          >
            Toggle Cache State: <span className="font-mono text-amber-400">{isCacheHit ? 'Hit' : 'Miss'}</span>
          </button>

          <button
            id="run-pipeline-test-btn"
            onClick={runPipelineCheck}
            disabled={isRunningPipeline}
            className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
          >
            {isRunningPipeline ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Test...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Test Orchestrator</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Terminal Logs & Script Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Terminal Logs (5 cols) */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Container Execution Log
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">bash 5.2</span>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-[11px] text-zinc-300 h-80 overflow-y-auto space-y-1.5 shadow-inner">
            <div className="text-zinc-600"># Container pipeline console output:</div>
            {pipelineLogs.map((log, index) => (
              <div
                key={index}
                className={`leading-relaxed ${
                  log.includes('✅') || log.includes('🎉')
                    ? 'text-emerald-400 font-semibold'
                    : log.includes('🔄')
                    ? 'text-amber-400'
                    : 'text-zinc-300'
                }`}
              >
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Script Code Viewer (7 cols) */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between">
            {/* Script selector tabs */}
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setActiveScriptTab('orchestrator')}
                className={`px-2.5 py-1 text-xs rounded-lg transition ${
                  activeScriptTab === 'orchestrator'
                    ? 'bg-zinc-800 text-amber-300 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                pipeline_orchestrator.sh
              </button>
              <button
                onClick={() => setActiveScriptTab('audio_mixer')}
                className={`px-2.5 py-1 text-xs rounded-lg transition ${
                  activeScriptTab === 'audio_mixer'
                    ? 'bg-zinc-800 text-sky-300 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                compose_audio_stems.sh
              </button>
              <button
                onClick={() => setActiveScriptTab('blender_py')}
                className={`px-2.5 py-1 text-xs rounded-lg transition ${
                  activeScriptTab === 'blender_py'
                    ? 'bg-zinc-800 text-emerald-300 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                render_script.py
              </button>
              <button
                onClick={() => setActiveScriptTab('manifest')}
                className={`px-2.5 py-1 text-xs rounded-lg transition ${
                  activeScriptTab === 'manifest'
                    ? 'bg-zinc-800 text-zinc-200 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                manifest.json
              </button>
            </div>

            <button
              onClick={copyCurrentScript}
              className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 flex items-center gap-1.5 transition"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Script</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-[11px] text-zinc-300 h-80 overflow-y-auto shadow-inner">
            <pre className="text-zinc-300 whitespace-pre leading-relaxed">
              {getActiveCode()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
