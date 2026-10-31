import React, { useEffect, useRef } from 'react';
import { Maximize2, Subtitles } from 'lucide-react';
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
      <div className="relative group bg-slate-950/85 backdrop-blur-md rounded-2xl border border-slate-700/70 p-4 shadow-2xl transition-all duration-200 hover:border-blue-500/50">
        {/* Expand to full transcript panel button */}
        <button
          onClick={onExpandTranscript}
          title="Expand Full Meeting Transcript"
          className="absolute -top-3 right-4 flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Maximize2 className="w-3 h-3" />
          <span>Full Transcript</span>
        </button>

        <div
          ref={containerRef}
          className="max-h-36 overflow-y-auto space-y-2.5 pr-2 scroll-smooth"
        >
          {recentCaptions.map((item) => {
            // Retrieve translated text according to the participant's individually selected language
            const displayText = item.translations[selectedLanguage] || item.original_text;

            return (
              <div
                key={item.id}
                className="flex items-start space-x-2.5 text-sm sm:text-base leading-relaxed animate-fade-in"
              >
                <span className="font-bold text-blue-400 shrink-0 select-none bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                  {item.speaker_name}:
                </span>
                <span className="text-slate-100 font-medium break-words">
                  {displayText}
                </span>
              </div>
            );
          })}

          {activeSpeakerName && recentCaptions.length === 0 && (
            <div className="flex items-center space-x-2 text-slate-400 text-sm italic">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{activeSpeakerName} is speaking...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
