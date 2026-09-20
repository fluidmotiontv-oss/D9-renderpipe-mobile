import React from 'react';
import { Radio, Terminal, Sparkles, Volume2, Cpu, Clock } from 'lucide-react';

interface HeaderProps {
  activeTab: 'localization' | 'pipeline' | 'voice_queue' | 'producer';
  setActiveTab: (tab: 'localization' | 'pipeline' | 'voice_queue' | 'producer') => void;
  isAudioCarrierPlaying: boolean;
  onToggleAudioCarrier: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isAudioCarrierPlaying,
  onToggleAudioCarrier,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Project Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shadow-sm">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-semibold text-zinc-100 tracking-tight">
                Dragon 9 Synchronized Time AI Studio
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-xs font-mono rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                Ubuntu ARM64 Active
              </span>
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-2">
              <span>Termux Container</span>
              <span className="text-zinc-600">•</span>
              <span>Blender 5.0.1 Headless</span>
              <span className="text-zinc-600">•</span>
              <span className="font-mono text-amber-400/90">432Hz Audio Matrix</span>
            </p>
          </div>
        </div>

        {/* Global Controls & Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* 432Hz Carrier Tone Toggle */}
          <button
            id="toggle-432hz-carrier-btn"
            onClick={onToggleAudioCarrier}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 border transition-all ${
              isAudioCarrierPlaying
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
            title="Toggle Web Audio 432Hz harmonic carrier sine wave"
          >
            <Radio className={`w-3.5 h-3.5 ${isAudioCarrierPlaying ? 'animate-pulse text-amber-400' : ''}`} />
            <span>{isAudioCarrierPlaying ? '432Hz Sine [Active]' : 'Test 432Hz Tone'}</span>
          </button>

          {/* Navigation Pill Buttons */}
          <nav className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800/80">
            <button
              id="nav-localization-tab"
              onClick={() => setActiveTab('localization')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'localization'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Comedy Engine</span>
            </button>

            <button
              id="nav-voice-queue-tab"
              onClick={() => setActiveTab('voice_queue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'voice_queue'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Voice Stems & 432Hz</span>
            </button>

            <button
              id="nav-pipeline-tab"
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'pipeline'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pipeline & Cache</span>
            </button>

            <button
              id="nav-producer-tab"
              onClick={() => setActiveTab('producer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'producer'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Media Architect</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
