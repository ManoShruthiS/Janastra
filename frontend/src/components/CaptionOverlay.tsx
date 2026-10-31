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
