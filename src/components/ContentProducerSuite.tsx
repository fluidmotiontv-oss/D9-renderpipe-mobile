import React, { useState } from 'react';
import {
  BookOpen,
  ShoppingBag,
  Film,
  Share2,
  Sparkles,
  Copy,
  Check,
  RotateCw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ContentProductionResult } from '../types';

const PRESET_DRAFTS = [
  {
    title: 'Dragon 9 54-Minute Hour Manifesto',
    temporal_model: 'Dragon9 54-Minute Hour',
    draft: `The standard 60-minute hour is an artifact of ancient sexagesimal astronomy decoupled from circadian neurobiology and harmonic resonance.
The Dragon9 Temporal Framework restructures the cycle into 54-minute synchronized blocks (3240 seconds per hour).
At 432Hz harmonic alignment, human cognitive latency synchronizes with rhythmic attention spans, eliminating mid-afternoon burnout and providing an intuitive 18-second micro-cycle (540 frames @ 30fps) for digital media, stand-up comedic delivery, and mobile rendering pipelines.`,
  },
  {
    title: 'Fluid Media & ARM64 Container Rendering',
    temporal_model: 'Mobile Ubuntu ARM64 & Headless Blender',
    draft: `Decentralized studio production no longer requires $10,000 server racks.
By deploying Blender 5.0.1 headlessly inside an Ubuntu container on ARM64 mobile hardware via Termux, and virtualizing the framebuffer using Xvfb (xvfb-run -a), creators can render automated 3D sequences anywhere.
Paired with smart-cache frame validation and ElevenLabs automated dialogue synthesis, content generation becomes an automated localized stream.`,
  },
];

export const ContentProducerSuite: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_DRAFTS[0]);
  const [draftText, setDraftText] = useState(PRESET_DRAFTS[0].draft);
  const [activeSubTab, setActiveSubTab] = useState<'ebook' | 'storefront' | 'media_script' | 'social_promos'>('ebook');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ContentProductionResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateContent = async () => {
    if (!draftText.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/content/produce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_or_draft: draftText,
          content_type: activeSubTab,
          target_platform: activeSubTab === 'ebook' ? 'Payhip & Gumroad' : 'Multi-channel',
          temporal_model: selectedPreset.temporal_model,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate content package');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error('Content error:', err);
      alert('Content production failed: ' + (err.message || 'Error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const copyMarkdown = () => {
    if (!result) return;
    const textToCopy = result.raw_markdown || JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              Media Architect Suite
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
              Dragon 9 Temporal Framework
            </span>
          </div>
          <h2 className="text-xl font-bold text-zinc-100 mt-2">
            Digital Content Producer & Packaging Engine
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Translates essays and temporal mechanics into ready-to-publish e-books, storefront copy, broadcast media scripts with AV cues, and social distribution hooks.
          </p>
        </div>

        {/* Deliverable Sub-tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveSubTab('ebook')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              activeSubTab === 'ebook'
                ? 'bg-zinc-800 text-indigo-300 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>E-Book (Payhip/Gumroad)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('storefront')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              activeSubTab === 'storefront'
                ? 'bg-zinc-800 text-emerald-300 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Storefront Copy</span>
          </button>

          <button
            onClick={() => setActiveSubTab('media_script')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              activeSubTab === 'media_script'
                ? 'bg-zinc-800 text-amber-300 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>AV Media Scripts</span>
          </button>

          <button
            onClick={() => setActiveSubTab('social_promos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              activeSubTab === 'social_promos'
                ? 'bg-zinc-800 text-sky-300 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Social Snippets</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Concepts & Presets (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Draft Concept & Essays
              </label>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-zinc-500">Preset:</span>
                {PRESET_DRAFTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedPreset(p);
                      setDraftText(p.draft);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] ${
                      selectedPreset.title === p.title
                        ? 'bg-amber-500/20 text-amber-300 font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    #{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={8}
              placeholder="Paste essay, book outline, or fluid media concept..."
              className="w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500 font-sans leading-relaxed resize-none"
            />

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
              <div className="font-semibold text-zinc-300">Production Directives Active:</div>
              <ul className="list-disc list-inside text-zinc-500 space-y-0.5">
                <li>Embeds audio/visual cues: <code className="text-amber-400">[Audio Cue: 432Hz]</code>, <code className="text-sky-400">[Visual Cue: ...]</code></li>
                <li>Clear user agency, value propositions, and Payhip/Gumroad pricing models</li>
              </ul>
            </div>

            <button
              onClick={handleGenerateContent}
              disabled={isGenerating || !draftText.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Packaging Media Assets...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate {activeSubTab.replace('_', ' ').toUpperCase()} Package</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Structured Output Display (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {result ? (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-zinc-100">
                    {result.title || 'Dragon 9 Content Architecture'}
                  </h3>
                  {result.subtitle && (
                    <p className="text-xs text-amber-400 mt-0.5">{result.subtitle}</p>
                  )}
                </div>

                <button
                  onClick={copyMarkdown}
                  className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-950 hover:bg-zinc-800 rounded-lg border border-zinc-800 flex items-center gap-1.5 transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>
              </div>

              {/* View 1: E-Book Packaging */}
              {activeSubTab === 'ebook' && (
                <div className="space-y-4">
                  {result.sales_pitch && (
                    <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800">
                      <div className="text-[11px] uppercase tracking-wider text-amber-400 font-bold mb-1">
                        Sales Pitch & Positioning
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{result.sales_pitch}</p>
                    </div>
                  )}

                  {result.chapter_breakdown && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Chapter Breakdown
                      </div>
                      <div className="space-y-2">
                        {result.chapter_breakdown.map((ch) => (
                          <div key={ch.chapter} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 text-xs">
                            <div className="font-semibold text-zinc-200 flex items-center gap-2">
                              <span className="text-indigo-400">Ch. {ch.chapter}:</span>
                              <span>{ch.title}</span>
                            </div>
                            <p className="text-zinc-400 mt-1 text-[11px] leading-relaxed">{ch.summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.pricing_strategy && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Payhip & Gumroad Pricing Tiers
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {result.pricing_strategy.map((tier, idx) => (
                          <div key={idx} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-zinc-200">{tier.tier}</span>
                              <span className="font-mono font-bold text-amber-400">{tier.price}</span>
                            </div>
                            <p className="text-zinc-400 mt-1 text-[11px]">{tier.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* View 2: Storefront Copy */}
              {activeSubTab === 'storefront' && result.landing_copy && (
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                    <div className="text-sm font-bold text-zinc-100">
                      {result.landing_copy.headline}
                    </div>
                    <p className="text-xs text-zinc-400">
                      {result.landing_copy.subheadline}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Core Value Propositions
                    </div>
                    <div className="space-y-2">
                      {result.landing_copy.value_propositions.map((item, idx) => (
                        <div key={idx} className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800/80 text-xs flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <span className="text-zinc-300">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-emerald-400">Call To Action</div>
                      <div className="text-xs font-semibold text-emerald-200 mt-0.5">{result.landing_copy.call_to_action}</div>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs">
                      Instant Access
                    </span>
                  </div>
                </div>
              )}

              {/* View 3: Media Scripts with AV Cues */}
              {activeSubTab === 'media_script' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Audio / Visual Voiceover Directives
                  </div>
                  {result.script_lines?.map((line, idx) => (
                    <div key={idx} className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-bold">{line.speaker}</span>
                        {line.pacing && <span className="text-zinc-500">Pacing: {line.pacing}</span>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                        {line.cue_audio && (
                          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                            {line.cue_audio}
                          </div>
                        )}
                        {line.cue_visual && (
                          <div className="p-2 rounded bg-sky-500/10 border border-sky-500/20 text-sky-300">
                            {line.cue_visual}
                          </div>
                        )}
                      </div>

                      <p className="text-zinc-200 text-xs leading-relaxed pt-1">
                        &quot;{line.dialogue}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* View 4: Social Promotional Snippets */}
              {activeSubTab === 'social_promos' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Distribution Snippets & Hooks
                  </div>
                  {result.social_snippets?.map((snip, idx) => (
                    <div key={idx} className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-sky-400">{snip.platform}</span>
                        <span className="text-zinc-500">{snip.body.length} chars</span>
                      </div>
                      <div className="font-semibold text-zinc-100">{snip.hook}</div>
                      <p className="text-zinc-300 text-xs leading-relaxed">{snip.body}</p>
                      <div className="text-amber-400 text-[11px] font-semibold">{snip.call_to_action}</div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {snip.hashtags.map((tag, hIdx) => (
                          <span key={hIdx} className="text-[10px] text-zinc-500 font-mono">{tag}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[380px]">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center text-indigo-400 mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-zinc-200">
                Ready for Digital Packaging
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mt-1">
                Select an e-book outline or fluid media draft on the left, choose your target format, and click Generate Package.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
