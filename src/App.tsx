import React, { useState } from 'react';
import { Header } from './components/Header';
import { Dragon9ClockBar } from './components/Dragon9ClockBar';
import { StandupLocalizationEngine } from './components/StandupLocalizationEngine';
import { ElevenLabsVoiceQueue } from './components/ElevenLabsVoiceQueue';
import { MobileContainerPipeline } from './components/MobileContainerPipeline';
import { ContentProducerSuite } from './components/ContentProducerSuite';
import { VoiceStem } from './types';
import { start432HzCarrier, stop432HzCarrier, is432HzRunning } from './lib/audio432';

export default function App() {
  const [activeTab, setActiveTab] = useState<'localization' | 'pipeline' | 'voice_queue' | 'producer'>('localization');
  const [currentFrame, setCurrentFrame] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isAudioCarrierPlaying, setIsAudioCarrierPlaying] = useState<boolean>(false);

  // Shared voice stems queue
  const [stems, setStems] = useState<VoiceStem[]>([
    {
      id: 'stem_init_001',
      segment_id: '001',
      character: 'Host (Jordan)',
      text: "You know they say the Dragon9 hour is only 54 minutes? That explains why I spent an hour at the grocery store... and still got charged for late parking!",
      language: 'DE',
      provider: 'elevenlabs',
      voice_id: '21m00Tcm4TlvDq8ikWAM',
      voice_name: 'Rachel (Comedic)',
      duration_sec: 4.8,
      start_frame: 30,
      end_frame: 174,
      harmonic_freq: 432,
      created_at: new Date().toISOString(),
    },
  ]);

  const toggleAudioCarrier = () => {
    if (is432HzRunning()) {
      stop432HzCarrier();
      setIsAudioCarrierPlaying(false);
    } else {
      start432HzCarrier(432, 0.08);
      setIsAudioCarrierPlaying(true);
    }
  };

  const handleQueueStem = (newStem: VoiceStem) => {
    setStems((prev) => [newStem, ...prev]);
    setActiveTab('voice_queue');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAudioCarrierPlaying={isAudioCarrierPlaying}
        onToggleAudioCarrier={toggleAudioCarrier}
      />

      {/* Dragon 9 54-Minute Hour & Timeline Clock Bar */}
      <Dragon9ClockBar
        currentFrame={currentFrame}
        setCurrentFrame={setCurrentFrame}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />

      {/* Main Content Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'localization' && (
          <StandupLocalizationEngine onQueueStem={handleQueueStem} />
        )}

        {activeTab === 'voice_queue' && (
          <ElevenLabsVoiceQueue
            stems={stems}
            setStems={setStems}
            currentFrame={currentFrame}
          />
        )}

        {activeTab === 'pipeline' && (
          <MobileContainerPipeline
            currentFrame={currentFrame}
            totalStems={stems.length}
          />
        )}

        {activeTab === 'producer' && (
          <ContentProducerSuite />
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/60 py-4 px-6 text-xs text-zinc-500 text-center flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-2">
        <div className="flex items-center gap-2">
          <span>Dragon 9 Synchronized Time AI Studio</span>
          <span>•</span>
          <span className="text-zinc-400">Project ID: gen-lang-client-0271228173</span>
        </div>
        <div className="font-mono text-[11px] text-zinc-400">
          ARM64 Termux Ubuntu Container • Headless Blender 5.0.1 • 432Hz Harmonic Carrier
        </div>
      </footer>
    </div>
  );
}
