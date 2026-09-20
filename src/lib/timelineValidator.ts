import { VoiceStem, StemConflict, BoundaryViolation, TimelineValidationReport } from '../types';

export interface TimelineValidationOptions {
  timeline_mode: '18s_micro_cycle' | '54m_dragon9_hour';
  fps?: number;
  min_gap_frames?: number; // Minimum pause required between lines (e.g., 15 frames = 0.5s pause)
}

export const DRAGON9_TIMELINE_CONSTANTS = {
  FPS: 30,
  MICRO_CYCLE_SECONDS: 18,
  MICRO_CYCLE_FRAMES: 540,
  DRAGON9_HOUR_MINUTES: 54,
  DRAGON9_HOUR_SECONDS: 3240, // 54 * 60
  DRAGON9_HOUR_FRAMES: 97200, // 3240 * 30
  DEFAULT_COMEDIC_PAUSE_FRAMES: 15, // 0.5s @ 30fps
};

/**
 * Format frame count into standard MM:SS.ff or SS.fs display
 */
export function formatFrameToTime(frame: number, fps = 30): string {
  const totalSeconds = frame / fps;
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSecs = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${remainingSecs.toFixed(1).padStart(4, '0')}`;
}

/**
 * Validates all voice stems against the 54-minute / 18-second timeline.
 * Detects:
 * 1. Overlapping dialogue segments (dialogue clashing)
 * 2. Boundary violations (stems exceeding total cycle frames or starting before frame 0)
 * 3. Tight comedic pauses below the recommended breathing room
 */
export function validateVoiceStemsTimeline(
  stems: VoiceStem[],
  options: TimelineValidationOptions
): TimelineValidationReport {
  const fps = options.fps || DRAGON9_TIMELINE_CONSTANTS.FPS;
  const totalFrames =
    options.timeline_mode === '54m_dragon9_hour'
      ? DRAGON9_TIMELINE_CONSTANTS.DRAGON9_HOUR_FRAMES
      : DRAGON9_TIMELINE_CONSTANTS.MICRO_CYCLE_FRAMES;

  const minGap = options.min_gap_frames !== undefined ? options.min_gap_frames : 0;

  const conflicts: StemConflict[] = [];
  const boundaryViolations: BoundaryViolation[] = [];
  let totalOverlapFrames = 0;

  // 1. Boundary & Inverted Frame Check
  stems.forEach((stem) => {
    if (stem.start_frame < 0) {
      boundaryViolations.push({
        stem_id: stem.id,
        character: stem.character,
        start_frame: stem.start_frame,
        end_frame: stem.end_frame,
        limit_frame: 0,
        overflow_frames: Math.abs(stem.start_frame),
        overflow_sec: Math.abs(stem.start_frame) / fps,
        message: `Stem #${stem.segment_id} (${stem.character}) has negative start frame (${stem.start_frame}).`,
      });
    }

    if (stem.end_frame > totalFrames) {
      const overflow = stem.end_frame - totalFrames;
      boundaryViolations.push({
        stem_id: stem.id,
        character: stem.character,
        start_frame: stem.start_frame,
        end_frame: stem.end_frame,
        limit_frame: totalFrames,
        overflow_frames: overflow,
        overflow_sec: overflow / fps,
        message: `Stem #${stem.segment_id} (${stem.character}) exceeds the ${options.timeline_mode === '54m_dragon9_hour' ? '54-minute hour' : '18s cycle'} boundary by ${overflow} frames (${(overflow / fps).toFixed(2)}s).`,
      });
    }

    if (stem.end_frame <= stem.start_frame) {
      boundaryViolations.push({
        stem_id: stem.id,
        character: stem.character,
        start_frame: stem.start_frame,
        end_frame: stem.end_frame,
        limit_frame: stem.start_frame,
        overflow_frames: 0,
        overflow_sec: 0,
        message: `Stem #${stem.segment_id} (${stem.character}) has invalid duration (end_frame ${stem.end_frame} <= start_frame ${stem.start_frame}).`,
      });
    }
  });

  // 2. Pairwise Collision & Overlap Check
  // Sort by start_frame for consistent reporting
  const sortedStems = [...stems].sort((a, b) => a.start_frame - b.start_frame);

  for (let i = 0; i < sortedStems.length; i++) {
    for (let j = i + 1; j < sortedStems.length; j++) {
      const a = sortedStems[i];
      const b = sortedStems[j];

      // Stems overlap if a starts before b ends and b starts before a ends
      const overlapStart = Math.max(a.start_frame, b.start_frame);
      const overlapEnd = Math.min(a.end_frame, b.end_frame);

      if (overlapStart < overlapEnd) {
        // Direct critical dialogue clash!
        const durationFrames = overlapEnd - overlapStart;
        const durationSec = durationFrames / fps;
        totalOverlapFrames += durationFrames;

        conflicts.push({
          stemA_id: a.id,
          stemB_id: b.id,
          stemA_label: `#${a.segment_id} (${a.character})`,
          stemB_label: `#${b.segment_id} (${b.character})`,
          overlap_start_frame: overlapStart,
          overlap_end_frame: overlapEnd,
          overlap_duration_frames: durationFrames,
          overlap_duration_sec: durationSec,
          severity: 'critical',
          description: `Direct dialogue collision: #${a.segment_id} and #${b.segment_id} speak simultaneously between frames ${overlapStart}-${overlapEnd} (${durationSec.toFixed(2)}s).`,
        });
      } else if (minGap > 0 && b.start_frame - a.end_frame < minGap && b.start_frame >= a.end_frame) {
        // Gap is less than comedic breathing room
        const gapFrames = b.start_frame - a.end_frame;
        conflicts.push({
          stemA_id: a.id,
          stemB_id: b.id,
          stemA_label: `#${a.segment_id} (${a.character})`,
          stemB_label: `#${b.segment_id} (${b.character})`,
          overlap_start_frame: a.end_frame,
          overlap_end_frame: b.start_frame,
          overlap_duration_frames: minGap - gapFrames,
          overlap_duration_sec: (minGap - gapFrames) / fps,
          severity: 'tight_buffer',
          description: `Insufficient punchline pause: only ${gapFrames} frames (${(gapFrames / fps).toFixed(2)}s) between #${a.segment_id} and #${b.segment_id} (recommended minimum is ${minGap} frames / ${(minGap / fps).toFixed(2)}s).`,
        });
      }
    }
  }

  // Calculate total occupied dialogue duration
  const totalOccupiedSec = stems.reduce((sum, s) => sum + s.duration_sec, 0);

  const isValid = conflicts.filter((c) => c.severity === 'critical').length === 0 && boundaryViolations.length === 0;

  return {
    is_valid: isValid,
    total_stems: stems.length,
    conflicts,
    boundary_violations: boundaryViolations,
    total_overlap_frames: totalOverlapFrames,
    total_occupied_duration_sec: totalOccupiedSec,
    timeline_mode: options.timeline_mode,
    timeline_total_frames: totalFrames,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Batch resolves all dialogue overlaps by chronologically rippling stems forward
 * and applying a standardized comedic timing gap (e.g. 15 frames = 0.5s).
 */
export function batchDeconflictStems(
  stems: VoiceStem[],
  pauseBufferFrames = DRAGON9_TIMELINE_CONSTANTS.DEFAULT_COMEDIC_PAUSE_FRAMES,
  initialStartFrame = 15
): VoiceStem[] {
  if (stems.length === 0) return [];

  // Sort by current start_frame or segment_id
  const sorted = [...stems].sort((a, b) => {
    if (a.start_frame !== b.start_frame) return a.start_frame - b.start_frame;
    return a.segment_id.localeCompare(b.segment_id);
  });

  let currentCursor = Math.max(0, initialStartFrame);

  return sorted.map((stem) => {
    const durationFrames = Math.max(15, stem.end_frame - stem.start_frame);
    const newStart = Math.max(stem.start_frame, currentCursor);
    const newEnd = newStart + durationFrames;

    currentCursor = newEnd + pauseBufferFrames;

    return {
      ...stem,
      start_frame: newStart,
      end_frame: newEnd,
      duration_sec: Number((durationFrames / DRAGON9_TIMELINE_CONSTANTS.FPS).toFixed(2)),
    };
  });
}

/**
 * Batch quantizes stems to the 432Hz harmonic grid (frame multiples of 15 or 30).
 */
export function batchQuantizeStemsHarmonicGrid(stems: VoiceStem[], gridStep = 15): VoiceStem[] {
  return stems.map((stem) => {
    const duration = stem.end_frame - stem.start_frame;
    const quantizedStart = Math.round(stem.start_frame / gridStep) * gridStep;
    return {
      ...stem,
      start_frame: quantizedStart,
      end_frame: quantizedStart + duration,
    };
  });
}

/**
 * Distributes all stems evenly across the target timeline duration with balanced intermission.
 */
export function batchDistributeStems(
  stems: VoiceStem[],
  totalFrames = DRAGON9_TIMELINE_CONSTANTS.MICRO_CYCLE_FRAMES
): VoiceStem[] {
  if (stems.length === 0) return [];
  if (stems.length === 1) {
    const stem = stems[0];
    const duration = stem.end_frame - stem.start_frame;
    return [{ ...stem, start_frame: 30, end_frame: 30 + duration }];
  }

  const totalDialogueDuration = stems.reduce((acc, s) => acc + (s.end_frame - s.start_frame), 0);
  const remainingSpace = Math.max(0, totalFrames - totalDialogueDuration - 30);
  const gapBetween = Math.floor(remainingSpace / (stems.length + 1));

  let cursor = gapBetween;
  return stems.map((stem) => {
    const duration = stem.end_frame - stem.start_frame;
    const start = cursor;
    const end = start + duration;
    cursor = end + gapBetween;
    return {
      ...stem,
      start_frame: start,
      end_frame: end,
    };
  });
}

/**
 * Helper to generate mock conflicting stems for quick testing and demonstration
 */
export function generateMockConflictingStems(): VoiceStem[] {
  return [
    {
      id: 'stem_demo_001',
      segment_id: '001',
      character: 'Jordan (Host)',
      text: "Welcome to Dragon 9 time! Where each hour is 54 minutes, and you're always 6 minutes ahead of reality.",
      language: 'DE',
      provider: 'elevenlabs',
      voice_id: '21m00Tcm4TlvDq8ikWAM',
      voice_name: 'Rachel (Comedic)',
      duration_sec: 4.5,
      start_frame: 30,
      end_frame: 165,
      harmonic_freq: 432,
      created_at: new Date().toISOString(),
    },
    {
      id: 'stem_demo_002',
      segment_id: '002',
      character: 'Adam (Co-Host)',
      text: "Wait, so when my partner asks why I'm late, I just blame the sexagesimal astronomical cycle?",
      language: 'DE',
      provider: 'elevenlabs',
      voice_id: 'pNInz6obpgDQGcFmaJgB',
      voice_name: 'Adam (Punchline)',
      duration_sec: 4.2,
      // INTENTIONAL OVERLAP: starts at frame 130 while stem 001 runs until 165 (35 frames collision!)
      start_frame: 130,
      end_frame: 256,
      harmonic_freq: 432,
      created_at: new Date().toISOString(),
    },
    {
      id: 'stem_demo_003',
      segment_id: '003',
      character: 'Jordan (Host)',
      text: "Exactly! Tell them you're operating on 432Hz circadian harmony. Works every time... until the divorce papers arrive.",
      language: 'DE',
      provider: 'elevenlabs',
      voice_id: '21m00Tcm4TlvDq8ikWAM',
      voice_name: 'Rachel (Comedic)',
      duration_sec: 5.0,
      // INTENTIONAL OVERLAP: starts at frame 240 while stem 002 runs until 256 (16 frames collision!)
      start_frame: 240,
      end_frame: 390,
      harmonic_freq: 432,
      created_at: new Date().toISOString(),
    },
  ];
}
