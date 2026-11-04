import React, { useEffect, useRef } from 'react';
import { Maximize2, Sparkles } from 'lucide-react';
import { CaptionItem } from '../types/meeting';

interface CaptionOverlayProps {
  captions: CaptionItem[];
  selectedLanguage: string;
  onExpandTranscript: () => void;
  activeSpeakerName?: string | null;
}

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  captions,
  selectedLanguage,
  onExpandTranscript,
  activeSpeakerName
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Take the last 3 captions for the continuous compact bottom overlay
  const recentCaptions = captions.slice(-3);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [recentCaptions]);

  if (recentCaptions.length === 0 && !activeSpeakerName) {
    return null;
  }

  return (
    <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 w-[94%] max-w-3xl z-20 pointer-events-auto">
      <div className="relative group bg-black/85 backdrop-blur-2xl rounded-2xl hairline-border p-4 sm:p-5 shadow-2xl transition-all duration-200 hover:border-white/20">
        {/* Minimal Expand Transcript Control */}
        <button
          onClick={onExpandTranscript}
          title="Expand to Full Continuous Transcript Panel"
          className="absolute -top-3.5 right-4 flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-obsidian-900 hover:bg-neutral-850 text-silver-200 hover:text-white text-[11px] font-semibold hairline-border transition-all duration-150 active:scale-95 shadow-lg tracking-wider"
        >
          <Maximize2 className="w-3 h-3 text-silver-300" />
          <span>Expand Transcript</span>
        </button>

        {/* Live Captions Stream with Buttery Smooth Entry (Primary Visual Priority) */}
        <div
          ref={containerRef}
          className="max-h-40 overflow-y-auto space-y-3 pr-2 scroll-smooth"
        >
          {recentCaptions.map((item) => {
            const displayText = item.translations[selectedLanguage] || item.original_text;

            return (
              <div
                key={item.id}
                className="flex items-start space-x-3 text-base sm:text-lg leading-relaxed animate-caption-glide"
              >
                {/* Minimalist Speaker Attribution Badge */}
                <span className="font-semibold text-white shrink-0 select-none bg-white/[0.08] px-2.5 py-0.5 rounded-md border border-white/10 text-xs sm:text-sm tracking-wide shadow-sm">
                  {item.speaker_name}
                </span>

                {/* Multilingual Caption Text */}
                <span className="text-silver-100 font-medium tracking-tight break-words">
                  {displayText}
                </span>
              </div>
            );
          })}

          {activeSpeakerName && recentCaptions.length === 0 && (
            <div className="flex items-center space-x-2 text-silver-matte text-sm italic py-1 animate-caption-glide">
              <Sparkles className="w-3.5 h-3.5 text-silver-300 animate-pulse" />
              <span className="text-silver-200 font-medium">{activeSpeakerName} is speaking...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};