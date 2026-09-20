export type LanguageCode = 'DE' | 'ES' | 'FR' | 'JA' | 'IT' | 'PT' | 'KO' | 'ZH';

export interface LocalizedComedySegment {
  segment_id: string;
  target_language: string;
  source_text: string;
  localized_text: string;
  timing_markers: string;
  adaptation_notes: string;
  character?: string;
  syllable_count_original?: number;
  syllable_count_localized?: number;
  duration_target_seconds?: number;
  voice_stem_url?: string;
  voice_stem_status?: 'pending' | 'generated' | 'cached' | 'error';
}

export interface VoiceStem {
  id: string;
  segment_id: string;
  character: string;
  text: string;
  language: string;
  provider: 'elevenlabs' | 'gemini_tts' | 'mock';
  voice_id: string;
  voice_name: string;
  audio_base64?: string;
  duration_sec: number;
  start_frame: number;
  end_frame: number;
  harmonic_freq: number; // 432Hz or harmonic multiples
  created_at: string;
}

export interface PipelineConfig {
  workspace_path: string;
  environment: string;
  project_id: string;
  blender_version: string;
  fps: number;
  total_frames_18s: number;
  smart_cache_file: string;
  has_cached_frames: boolean;
  audio_frequency: number; // 432Hz
  output_targets: {
    sequence_18s: string;
    sequence_60min: string;
  };
  elevenlabs_configured: boolean;
  gemini_configured: boolean;
}

export interface ContentProductionResult {
  type: 'ebook' | 'storefront' | 'media_script' | 'social_promos';
  title?: string;
  subtitle?: string;
  chapter_breakdown?: { chapter: number; title: string; summary: string }[];
  sales_pitch?: string;
  pricing_strategy?: { platform: string; tier: string; price: string; description: string }[];
  landing_copy?: {
    headline: string;
    subheadline: string;
    value_propositions: string[];
    call_to_action: string;
  };
  script_lines?: {
    cue_audio?: string;
    cue_visual?: string;
    pacing?: string;
    speaker: string;
    dialogue: string;
  }[];
  social_snippets?: {
    platform: string;
    hook: string;
    body: string;
    call_to_action: string;
    hashtags: string[];
  }[];
  raw_markdown?: string;
}

export interface Dragon9Clock {
  dragon9_hours: number;
  dragon9_minutes: number;
  dragon9_seconds: number;
  standard_time: string;
  frequency_hz: number; // 432
  current_frame: number;
  total_cycle_frames: number; // 540
  progress_percent: number;
}

export interface StemConflict {
  stemA_id: string;
  stemB_id: string;
  stemA_label: string;
  stemB_label: string;
  overlap_start_frame: number;
  overlap_end_frame: number;
  overlap_duration_frames: number;
  overlap_duration_sec: number;
  severity: 'critical' | 'tight_buffer';
  description: string;
}

export interface BoundaryViolation {
  stem_id: string;
  character: string;
  start_frame: number;
  end_frame: number;
  limit_frame: number;
  overflow_frames: number;
  overflow_sec: number;
  message: string;
}

export interface TimelineValidationReport {
  is_valid: boolean;
  total_stems: number;
  conflicts: StemConflict[];
  boundary_violations: BoundaryViolation[];
  total_overlap_frames: number;
  total_occupied_duration_sec: number;
  timeline_mode: '18s_micro_cycle' | '54m_dragon9_hour';
  timeline_total_frames: number;
  timestamp: string;
}

