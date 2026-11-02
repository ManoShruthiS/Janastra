import React, { useEffect, useRef } from 'react';
import { Maximize2 } from 'lucide-react';
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

  // Take the last 3 captions for the continuous bottom overlay
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
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-11/12 max-w-3xl z-20 pointer-events-auto">
      <div className="relative group bg-black/95 backdrop-blur-xl rounded-2xl border border-neutral-800 p-4 shadow-2xl transition-all duration-200 hover:border-gold-champagne/40">
        {/* Expand to full transcript panel button */}
        <button
          onClick={onExpandTranscript}
          title="Expand Full Meeting Transcript"
          className="absolute -top-3 right-4 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-obsidian-900 hover:bg-obsidian-800 text-gold-300 text-[11px] font-semibold border border-gold-champagne/40 shadow-gold-glow transition-transform hover:scale-105 active:scale-95 uppercase tracking-wider"
        >
          <Maximize2 className="w-3 h-3 text-gold-400" />
          <span>Full Transcript</span>
        </button>

        <div
          ref={containerRef}
          className="max-h-36 overflow-y-auto space-y-2.5 pr-2 scroll-smooth"
        >
          {recentCaptions.map((item) => {
            const displayText = item.translations[selectedLanguage] || item.original_text;

            return (
              <div
                key={item.id}
                className="flex items-start space-x-2.5 text-sm sm:text-base leading-relaxed"
              >
                <span className="font-bold text-gold-300 shrink-0 select-none bg-obsidian-850 px-2 py-0.5 rounded border border-gold-champagne/30 text-xs sm:text-sm tracking-wide">
                  {item.speaker_name}:
                </span>
                <span className="text-silver-200 font-medium break-words">
                  {displayText}
                </span>
              </div>
            );
          })}

          {activeSpeakerName && recentCaptions.length === 0 && (
            <div className="flex items-center space-x-2 text-silver-matte text-sm italic">
              <span className="w-2 h-2 rounded-full bg-gold-400 animate-ping" />
              <span className="text-gold-300">{activeSpeakerName} is speaking...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
