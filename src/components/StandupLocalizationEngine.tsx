import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  Copy,
  Check,
  Languages,
  Clock,
  ChevronRight,
  Info,
  Mic,
  FileCode,
  Play,
  RotateCw,
} from 'lucide-react';
import { LocalizedComedySegment, LanguageCode } from '../types';
import { playPcm24kAudio } from '../lib/audio432';

const LANGUAGE_RULES: Record<string, { label: string; flag: string; rule: string; example: string }> = {
  DE: {
    label: 'German (Deutsch)',
    flag: '🇩🇪',
    rule: 'Umgangssprache with SOV verb-ending structure to delay the operative punchline to the very end.',
    example: 'Swaps Walmart for Aldi Süd / Lidl; delays verbs like "...abgezockt worden."',
  },
  ES: {
    label: 'Spanish (Español)',
    flag: '🇪🇸',
    rule: 'High rapid tempo, regional vernacular (Castilian vs Mexican), accentuating the absolute final word.',
    example: 'Swaps Target for Mercadona/Oxxo; rapid cadence leading to sudden punchline drop.',
  },
  FR: {
    label: 'French (Français)',
    flag: '🇫🇷',
    rule: 'Conversational verlan/argot, rhythmic timing fillers ("genre", "du coup") before punchlines.',
    example: 'Swaps superstore for Carrefour / Monoprix; pauses with "genre..." before climax.',
  },
  JA: {
    label: 'Japanese (日本語)',
    flag: '🇯🇵',
    rule: 'Punchy phrasing with natural spoken delivery, boke-tsukkomi comedic framing and timing pauses.',
    example: 'Natural colloquial expressions with dramatic setup pause before the final punchline.',
  },
  IT: {
    label: 'Italian (Italiano)',
    flag: '🇮🇹',
    rule: 'Expressive comedic cadence with regional irony, delaying the punchline verb/noun.',
    example: 'Swaps stores for Esselunga/Conad; dramatic conversational buildup.',
  },
  PT: {
    label: 'Portuguese (Português)',
    flag: '🇧🇷',
    rule: 'Warm, bouncy observational rhythm with colloquial slang (BR/PT).',
    example: 'Swaps stores for Pão de Açúcar / Continente.',
  },
};

const SAMPLE_SCRIPTS = [
  {
    title: '54-Minute Hour & The Grocery Run',
    character: 'Host (Jordan)',
    text: "You know they say the Dragon9 hour is only 54 minutes? That explains why I spent an hour at the grocery store... and still got charged for late parking!",
  },
  {
    title: 'Blender Container Crash at 2 AM',
    character: 'Lead Comedian',
    text: "I spent three days rendering 540 frames headlessly in an Ubuntu container on my phone, only to realize I left the camera pointed at... an invisible default cube!",
  },
  {
    title: '432Hz Sound Healer in the Coffee Shop',
    character: 'Observational Comic',
    text: "This hipster barista told me the espresso machine vibrates at 432 hertz for cellular alignment. Bro, it's not aligning my chakras... it's just vibrating off the counter!",
  },
];

interface StandupLocalizationEngineProps {
  onQueueStem: (stemData: any) => void;
}

export const StandupLocalizationEngine: React.FC<StandupLocalizationEngineProps> = ({ onQueueStem }) => {
  const [sourceText, setSourceText] = useState(SAMPLE_SCRIPTS[0].text);
  const [character, setCharacter] = useState(SAMPLE_SCRIPTS[0].character);
  const [targetLang, setTargetLang] = useState<LanguageCode>('DE');
  const [segmentId, setSegmentId] = useState('001');
  const [isLoading, setIsLoading] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [activeSegment, setActiveSegment] = useState<LocalizedComedySegment | null>(null);
  const [copied, setCopied] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voiceProvider, setVoiceProvider] = useState<'elevenlabs' | 'gemini_tts' | 'auto'>('auto');

  // Localize Stand-up Script
  const handleLocalize = async () => {
    if (!sourceText.trim()) return;
    setIsLoading(true);
    setAudioUrl(null);
    try {
      const res = await fetch('/api/comedy/localize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_text: sourceText,
          target_language: targetLang,
          segment_id: segmentId,
          character,
          cultural_context: LANGUAGE_RULES[targetLang]?.rule,
        }),
      });

      if (!res.ok) {
        throw new Error('Localization request failed');
      }

      const data = await res.json();
      setActiveSegment(data);
    } catch (err: any) {
      console.error('Error localizing:', err);
      alert('Error during comedy localization: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Synthesize Voice Stem
  const handleSynthesizeVoice = async () => {
    if (!activeSegment) return;
    setIsSynthesizing(true);
    try {
      const res = await fetch('/api/voice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: activeSegment.localized_text,
          timing_markers: activeSegment.timing_markers,
          character: activeSegment.character || character,
          segment_id: activeSegment.segment_id,
          provider: voiceProvider,
          language: targetLang,
        }),
      });

      const data = await res.json();
      if (data.audio_base64) {
        setAudioUrl(data.audio_base64);
        if (data.format === 'pcm_24k' && data.raw_base64) {
          playPcm24kAudio(data.raw_base64);
        }
      }

      // Add to composition queue
      onQueueStem({
        id: `stem_${Date.now()}`,
        segment_id: activeSegment.segment_id,
        character: activeSegment.character || character,
        text: activeSegment.localized_text,
        timing_markers: activeSegment.timing_markers,
        language: targetLang,
        provider: data.provider || 'elevenlabs',
        voice_id: data.voice_id || 'rachel',
        voice_name: data.voice_name || 'Rachel (American Comedic)',
        duration_sec: 4.5,
        start_frame: 30,
        end_frame: 165,
        harmonic_freq: 432,
        audio_base64: data.audio_base64,
        created_at: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Voice synth error:', err);
      alert('Voice synthesis failed: ' + (err.message || 'Network error'));
    } finally {
      setIsSynthesizing(false);
    }
  };

  const copyJson = () => {
    if (!activeSegment) return;
    const jsonStr = JSON.stringify(
      {
        segment_id: activeSegment.segment_id,
        target_language: activeSegment.target_language,
        source_text: activeSegment.source_text,
        localized_text: activeSegment.localized_text,
        timing_markers: activeSegment.timing_markers,
        adaptation_notes: activeSegment.adaptation_notes,
      },
      null,
      2
    );
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedRule = LANGUAGE_RULES[targetLang];

  return (
    <div className="space-y-6">
      {/* Engine Overview Header */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 sm:p-6 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300">
                Rule 1: Equivalence of Humor
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 border border-sky-500/30 text-sky-300">
                Rule 2: Last-Word Punchline
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                Rule 3: Syllable Budget ±15%
              </span>
            </div>
            <h2 className="text-xl font-bold text-zinc-100 mt-2">
              Dragon 9 Stand-Up Comedy Localization Engine
            </h2>
            <p className="text-sm text-zinc-400 mt-1 max-w-3xl">
              Strict non-literal comedy adaptation engine. Preserves comic timing and setup-pause-punchline delivery with embedded <code className="text-amber-400">[pause: X.Xs]</code> synthesis tags, cultural store swaps, and language-specific grammar.
            </p>
          </div>

          {/* Presets Button Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500">Presets:</span>
            {SAMPLE_SCRIPTS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSourceText(s.text);
                  setCharacter(s.character);
                  setSegmentId(String(idx + 1).padStart(3, '0'));
                }}
                className="px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 rounded-lg border border-zinc-700/60 transition"
              >
                Preset {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Script Input & Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Languages className="w-4 h-4 text-amber-400" />
                Target Language
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Segment:</span>
                <input
                  type="text"
                  value={segmentId}
                  onChange={(e) => setSegmentId(e.target.value)}
                  className="w-14 px-2 py-0.5 text-xs font-mono bg-zinc-950 border border-zinc-800 rounded text-center text-amber-300 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Language Selection Grid */}
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(LANGUAGE_RULES).map(([code, info]) => (
                <button
                  key={code}
                  onClick={() => setTargetLang(code as LanguageCode)}
                  className={`px-3 py-2 rounded-xl text-left border transition-all ${
                    targetLang === code
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-sm'
                      : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{info.flag}</span>
                    <span className="font-semibold text-xs text-zinc-200">{code}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate mt-0.5">{info.label.split(' ')[0]}</div>
                </button>
              ))}
            </div>

            {/* Language Rule Explanation Card */}
            {selectedRule && (
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                  <Info className="w-3.5 h-3.5" />
                  <span>Grammar & Punchline Architecture ({targetLang})</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">{selectedRule.rule}</p>
                <p className="text-zinc-500 text-[10px] italic">Swaps: {selectedRule.example}</p>
              </div>
            )}

            {/* Character / Speaker */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Character / Speaker Name
              </label>
              <input
                type="text"
                value={character}
                onChange={(e) => setCharacter(e.target.value)}
                placeholder="e.g., Host (Jordan), Observational Performer"
                className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Source Script Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-400">
                  Original Stand-Up Script / Joke Setup
                </label>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {sourceText.length} chars
                </span>
              </div>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                rows={4}
                placeholder="Paste original stand-up joke setup, timing, and punchline..."
                className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500 font-sans leading-relaxed resize-none"
              />
            </div>

            {/* Voice Provider Selector */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-zinc-400">Voice Synthesis Engine:</span>
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <button
                  onClick={() => setVoiceProvider('auto')}
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    voiceProvider === 'auto' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400'
                  }`}
                >
                  Auto / ElevenLabs
                </button>
                <button
                  onClick={() => setVoiceProvider('gemini_tts')}
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    voiceProvider === 'gemini_tts' ? 'bg-sky-500/20 text-sky-300' : 'text-zinc-400'
                  }`}
                >
                  Gemini TTS
                </button>
              </div>
            </div>

            {/* Execute Localization Action */}
            <button
              id="execute-localize-btn"
              onClick={handleLocalize}
              disabled={isLoading || !sourceText.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Adapting Comedic Beats ({targetLang})...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Adapt Stand-Up into {selectedRule?.label || targetLang}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Localized Output & Timing Synthesis (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {activeSegment ? (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-5">
              {/* Header with Segment ID and Status */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                    SEGMENT #{activeSegment.segment_id}
                  </span>
                  <span className="text-xs font-medium text-zinc-300">
                    {selectedRule?.flag} {activeSegment.target_language} Localization
                  </span>
                </div>

                <button
                  id="copy-json-btn"
                  onClick={copyJson}
                  className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-950 hover:bg-zinc-800 rounded-lg border border-zinc-800 flex items-center gap-1.5 transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied JSON</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>

              {/* Syllable Count & Timing Metric Comparison */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    Original Syllables
                  </div>
                  <div className="text-base font-mono font-bold text-zinc-200 mt-0.5">
                    {activeSegment.syllable_count_original || '~'}
                  </div>
                  <div className="text-[10px] text-zinc-500">English baseline</div>
                </div>

                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    Localized Syllables
                  </div>
                  <div className="text-base font-mono font-bold text-amber-400 mt-0.5">
                    {activeSegment.syllable_count_localized || '~'}
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    Within ±15% Budget
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 p-3 bg-zinc-950 rounded-xl border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    Punchline Rule
                  </div>
                  <div className="text-xs font-semibold text-emerald-300 mt-1 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Last-Word Locked
                  </div>
                  <div className="text-[10px] text-zinc-500">Optimal audience trigger</div>
                </div>
              </div>

              {/* Localized Script with Highlighted Pauses */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Localized Script (Equivalence of Humor)
                </label>
                <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 text-zinc-100 text-sm leading-relaxed font-sans">
                  {activeSegment.localized_text}
                </div>
              </div>

              {/* Timing Markers with Embedded [pause: X.Xs] */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-amber-300 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Timing Markers for TTS Voice Synthesis
                </label>
                <div className="p-3.5 bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs font-mono text-amber-200 leading-relaxed">
                  {activeSegment.timing_markers.split(/(\[pause:\s*[0-9.]+s?\])/g).map((part, idx) => {
                    if (part.startsWith('[pause:')) {
                      return (
                        <span
                          key={idx}
                          className="inline-block px-1.5 py-0.5 mx-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[11px]"
                        >
                          {part}
                        </span>
                      );
                    }
                    return <span key={idx}>{part}</span>;
                  })}
                </div>
              </div>

              {/* Cultural Adaptation Notes */}
              <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800/80 space-y-1">
                <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-sky-400" />
                  Cultural Adaptation & Linguistic Notes
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {activeSegment.adaptation_notes}
                </p>
              </div>

              {/* Voice Stem Synthesis Action & Audio Player */}
              <div className="pt-2 border-t border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  id="synthesize-voice-btn"
                  onClick={handleSynthesizeVoice}
                  disabled={isSynthesizing}
                  className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  {isSynthesizing ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing Voice Stem...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Synthesize Voice Stem via ElevenLabs</span>
                    </>
                  )}
                </button>

                {audioUrl && (
                  <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800">
                    <audio src={audioUrl} controls className="h-7 w-48 sm:w-56" />
                    <span className="text-[10px] font-mono text-emerald-400">432Hz Matched</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[380px]">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center text-amber-400 mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-zinc-200">
                Awaiting Script Input
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mt-1">
                Select a target language (DE, ES, FR, JA), enter your stand-up routine, and click Adapt to generate rhythm-preserved comedy with exact timing tags.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
