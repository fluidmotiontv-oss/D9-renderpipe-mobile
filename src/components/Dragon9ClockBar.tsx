import React, { useEffect, useState } from 'react';
import { Clock, Play, RotateCcw, Activity } from 'lucide-react';
import { Dragon9Clock } from '../types';

interface Dragon9ClockBarProps {
  currentFrame: number;
  setCurrentFrame: (frame: number | ((prev: number) => number)) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean | ((prev: boolean) => boolean)) => void;
}

export const Dragon9ClockBar: React.FC<Dragon9ClockBarProps> = ({
  currentFrame,
  setCurrentFrame,
  isPlaying,
  setIsPlaying,
}) => {
  const [clockData, setClockData] = useState<Dragon9Clock>({
    dragon9_hours: 0,
    dragon9_minutes: 0,
    dragon9_seconds: 0,
    standard_time: '',
    frequency_hz: 432,
    current_frame: 0,
    total_cycle_frames: 540,
    progress_percent: 0,
  });

  // Calculate real-time Dragon9 54-minute temporal metrics
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const earthSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      
      // In Dragon9, 1 Dragon Hour = 54 standard minutes = 3240 standard seconds
      const d9TotalSeconds = earthSeconds;
      const d9Hours = Math.floor(d9TotalSeconds / 3240);
      const d9Remaining = d9TotalSeconds % 3240;
      const d9Minutes = Math.floor(d9Remaining / 60);
      const d9Seconds = d9Remaining % 60;

      const progress = ((currentFrame % 540) / 540) * 100;

      setClockData({
        dragon9_hours: d9Hours,
        dragon9_minutes: d9Minutes,
        dragon9_seconds: d9Seconds,
        standard_time: now.toLocaleTimeString([], { hour12: false }),
        frequency_hz: 432,
        current_frame: currentFrame,
        total_cycle_frames: 540,
        progress_percent: progress,
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [currentFrame]);

  // Frame stepper when playing (30 fps simulated at ~33ms)
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentFrame((prev) => (prev >= 540 ? 1 : prev + 1));
    }, 33);
    return () => clearInterval(timer);
  }, [isPlaying, setCurrentFrame]);

  const sequenceSeconds = (currentFrame / 30).toFixed(2);

  return (
    <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Left: 54-Minute Hour Temporal Readout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-zinc-400 font-medium">Dragon9 Temporal Clock:</span>
            <span className="font-mono text-zinc-100 font-bold tracking-wider text-sm bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
              {String(clockData.dragon9_hours).padStart(2, '0')}h :{' '}
              {String(clockData.dragon9_minutes).padStart(2, '0')}m (54m/hr) :{' '}
              {String(clockData.dragon9_seconds).padStart(2, '0')}s
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 text-zinc-500 font-mono">
            <span>Standard:</span>
            <span className="text-zinc-400">{clockData.standard_time}</span>
          </div>
        </div>

        {/* Center: Sequence Timeline & Frame Counter (540 Frames = 18.0s) */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-center">
          <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
            <button
              id="timeline-play-pause-btn"
              onClick={() => setIsPlaying((p) => !p)}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 transition"
              title={isPlaying ? 'Pause frame loop' : 'Play 18s / 540-frame sequence'}
            >
              <Play className={`w-3.5 h-3.5 ${isPlaying ? 'text-amber-400 fill-amber-400' : ''}`} />
            </button>
            <button
              id="timeline-reset-frame-btn"
              onClick={() => {
                setIsPlaying(false);
                setCurrentFrame(1);
              }}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
              title="Reset to frame 0001"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="h-3 w-px bg-zinc-800 mx-1" />

            <div className="font-mono text-zinc-300 flex items-center gap-1">
              <span className="text-amber-400 font-semibold">
                F_{String(currentFrame).padStart(4, '0')}
              </span>
              <span className="text-zinc-500">/ 0540</span>
              <span className="text-zinc-400 ml-1">({sequenceSeconds}s @ 30fps)</span>
            </div>
          </div>

          {/* Progress Mini Bar */}
          <div className="w-24 sm:w-32 bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-75"
              style={{ width: `${clockData.progress_percent}%` }}
            />
          </div>
        </div>

        {/* Right: 432Hz Carrier Alignment Badge */}
        <div className="flex items-center gap-3 font-mono">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
            <Activity className="w-3 h-3 text-amber-400" />
            <span>Carrier: 432.00 Hz</span>
          </div>
          <span className="hidden sm:inline text-zinc-500">
            Ratio: 18s : 54m (1:180)
          </span>
        </div>
      </div>
    </div>
  );
};
