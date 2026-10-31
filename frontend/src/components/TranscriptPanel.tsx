import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Search, Subtitles, Globe } from 'lucide-react';
import { CaptionItem, SupportedLanguage } from '../types/meeting';

interface TranscriptPanelProps {
  captions: CaptionItem[];
  selectedLanguage: string;
  supportedLanguages: SupportedLanguage[];
  onClose: () => void;
  onChangeLanguage: (lang: string) => void;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  captions,
  selectedLanguage,
  supportedLanguages,
  onClose,
  onChangeLanguage
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [captions.length]);

  const filteredCaptions = captions.filter((c) => {
    const text = c.translations[selectedLanguage] || c.original_text;
    const q = searchQuery.toLowerCase();
    return (
      c.speaker_name.toLowerCase().includes(q) ||
      text.toLowerCase().includes(q) ||
      c.original_text.toLowerCase().includes(q)
    );
  });

  const handleExport = () => {
    const lines = captions.map((c) => {
      const timeStr = new Date(c.timestamp * 1000).toLocaleTimeString();
      const text = c.translations[selectedLanguage] || c.original_text;
      return `[${timeStr}] ${c.speaker_name}: ${text}`;
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `JANASTRA_Transcript_${selectedLanguage}_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-80 sm:w-96 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-30 shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Subtitles className="w-5 h-5 text-blue-400" />
          <h2 className="font-semibold text-slate-100 text-sm sm:text-base">Live Transcript</h2>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleExport}
            title="Download Transcript"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            title="Collapse Transcript"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
