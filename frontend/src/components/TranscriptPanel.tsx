import React, { useEffect, useRef, useState } from 'react';
import { Minimize2, Download, Search, Subtitles, Globe } from 'lucide-react';
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
    <div className="w-full sm:w-96 md:w-[420px] h-full bg-obsidian-950 border-l border-neutral-800/90 flex flex-col z-30 shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800/90 flex items-center justify-between bg-black">
        <div className="flex items-center space-x-2">
          <Subtitles className="w-5 h-5 text-silver-200" />
          <h2 className="font-bold text-white text-sm sm:text-base tracking-wide">Live Multilingual Transcript</h2>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleExport}
            title="Download Transcript as Text File"
            className="p-1.5 rounded-lg text-silver-matte hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition active:scale-95"
          >
            <Download className="w-4 h-4" />
          </button>
          {/* Explicit Clear Collapse Control */}
          <button
            onClick={onClose}
            title="Collapse Transcript to Bottom Overlay"
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-silver-matte hover:text-white hover:bg-neutral-900 border border-neutral-800/90 transition active:scale-95"
          >
            <Minimize2 className="w-3.5 h-3.5 text-silver-300" />
            <span className="hidden sm:inline">Collapse</span>
          </button>
        </div>
      </div>

      {/* Language Selector Bar */}
      <div className="px-4 py-2.5 bg-obsidian-900 border-b border-neutral-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-xs text-silver-matte">
          <Globe className="w-3.5 h-3.5 text-silver-300" />
          <span className="font-medium">Translate to:</span>
        </div>
        <select
          value={selectedLanguage}
          onChange={(e) => onChangeLanguage(e.target.value)}
          className="bg-black text-xs text-silver-100 font-semibold px-2 py-1 rounded-lg border border-neutral-800 outline-none cursor-pointer hover:border-neutral-700 transition"
        >
          {supportedLanguages.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-black text-silver-100">
              {lang.name} ({lang.native})
            </option>
          ))}
        </select>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-neutral-800/80 bg-obsidian-900/60">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black text-xs text-silver-100 pl-9 pr-3 py-2 rounded-lg border border-neutral-800 focus:outline-none focus:border-neutral-600 transition placeholder:text-neutral-600"
          />
        </div>
      </div>

      {/* Continuous Speaker-Attributed Captions Stream */}
      <div
        ref={scrollContainerRef}
        className="flex-1 p-4 overflow-y-auto space-y-3 scroll-smooth"
      >
        {filteredCaptions.length === 0 ? (
          <div className="text-center py-20 text-neutral-500 text-xs sm:text-sm px-4">
            {searchQuery ? 'No matching transcript lines found.' : 'Continuous live captions will appear here with speaker attribution as participants speak.'}
          </div>
        ) : (
          filteredCaptions.map((item) => {
            const timeStr = new Date(item.timestamp * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });
            const displayText = item.translations[selectedLanguage] || item.original_text;

            return (
              <div
                key={item.id}
                className="group flex flex-col space-y-1.5 p-3 rounded-xl bg-obsidian-900 border border-neutral-850 hover:border-neutral-750 transition duration-150"
              >
                <div className="flex items-center justify-between text-xs">
                  {/* Speaker Attribution */}
                  <span className="font-bold text-white tracking-wide flex items-center space-x-1.5 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-700 text-[11px] sm:text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-silver-200" />
                    <span>{item.speaker_name}</span>
                  </span>
                  <span className="text-neutral-500 font-mono text-[10px]">{timeStr}</span>
                </div>
                {/* Readable Multilingual Text */}
                <div className="text-xs sm:text-sm text-silver-100 font-normal leading-relaxed pl-1">
                  {displayText}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-obsidian-900 border-t border-neutral-800 text-[11px] text-silver-matte flex items-center justify-between">
        <span>{captions.length} total captions</span>
        <span className="text-silver-matte font-mono text-[10px]">Real-Time Multilingual</span>
      </div>
    </div>
  );
};