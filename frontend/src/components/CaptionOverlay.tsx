import React from 'react';
import { Sparkles } from 'lucide-react';
import { CaptionItem } from '../types/meeting';

interface CaptionOverlayProps {
  captions: CaptionItem[];
  selectedLanguage: string;
  activeSpeakerName?: string | null;
}

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  captions,
  selectedLanguage,
  activeSpeakerName
}) => {
  // Always display only the latest spoken sentence (no scrollable backlog)
  const latestCaption = captions.length > 0 ? captions[captions.length - 1] : null;

  if (!latestCaption && !activeSpeakerName) {
    return null;
  }

  const displayText = latestCaption
    ? (latestCaption.translations[selectedLanguage] || latestCaption.original_text)
    : null;

  return (
    <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 w-auto max-w-3xl z-20 pointer-events-none px-4 flex justify-center">
      <div className="inline-flex items-center space-x-3 bg-black/85 backdrop-blur-2xl rounded-2xl hairline-border px-5 py-3 shadow-2xl animate-caption-glide max-w-full">
        {latestCaption ? (
          <>
            {/* Speaker Name Tag */}
            <span className="font-semibold text-white shrink-0 select-none bg-white/[0.12] px-2.5 py-1 rounded-lg border border-white/15 text-xs sm:text-sm tracking-wide shadow-sm">
              {latestCaption.speaker_name}
            </span>

            {/* Clean Live Multilingual Caption Text */}
            <span className="text-white text-sm sm:text-base md:text-lg font-medium tracking-tight break-words">
              {displayText}
            </span>
          </>
        ) : (
          <div className="flex items-center space-x-2 text-silver-matte text-sm italic py-0.5">
            <Sparkles className="w-3.5 h-3.5 text-silver-300 animate-pulse" />
            <span className="text-silver-200 font-medium">{activeSpeakerName} is speaking...</span>
          </div>
        )}
      </div>
    </div>
  );
};
