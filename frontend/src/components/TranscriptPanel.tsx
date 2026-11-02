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
    <div className="w-80 sm:w-96 h-full bg-black border-l border-neutral-800 flex flex-col z-30 shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Subtitles className="w-5 h-5 text-gold-400" />
          <h2 className="font-semibold text-gold-300 text-sm sm:text-base tracking-wide">Live Transcript</h2>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleExport}
            title="Download Transcript"
            className="p-1.5 rounded-lg text-silver-matte hover:text-gold-300 hover:bg-neutral-900 transition"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            title="Collapse Transcript"
            className="p-1.5 rounded-lg text-silver-matte hover:text-gold-300 hover:bg-neutral-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Language Selector Bar */}
      <div className="px-4 py-2.5 bg-obsidian-900 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-xs text-silver-matte">
          <Globe className="w-3.5 h-3.5 text-gold-400" />
          <span>My Language:</span>
        </div>
        <select
          value={selectedLanguage}
          onChange={(e) => onChangeLanguage(e.target.value)}
          className="bg-black text-xs text-gold-300 font-semibold px-2 py-1 rounded-lg border border-neutral-800 outline-none cursor-pointer hover:border-gold-champagne/40"
        >
          {supportedLanguages.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-black text-silver-100">
              {lang.name} ({lang.native})
            </option>
          ))}
        </select>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-neutral-800/80">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-600" />
          <input
            type="text"
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-obsidian-900 text-xs text-silver-200 pl-9 pr-3 py-2 rounded-lg border border-neutral-800 focus:outline-none focus:border-gold-champagne/50 focus:ring-1 focus:ring-gold-champagne/30 transition placeholder:text-neutral-600"
          />
        </div>
      </div>

      {/* Transcript Scroll Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 p-4 overflow-y-auto space-y-3.5 scroll-smooth"
      >
        {filteredCaptions.length === 0 ? (
          <div className="text-center py-16 text-neutral-600 text-xs">
            {searchQuery ? 'No matching transcript lines found.' : 'Captions will appear here continuously as participants speak.'}
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
              <div key={item.id} className="group flex flex-col space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-gold-300 tracking-wide">
                    {item.speaker_name}
                  </span>
                  <span className="text-neutral-500 font-mono text-[10px]">{timeStr}</span>
                </div>
                <div className="text-xs sm:text-sm text-silver-200 font-normal leading-relaxed bg-obsidian-900 p-2.5 rounded-xl border border-neutral-800/90 shadow-inner">
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
        <span className="text-gold-400 font-mono text-[10px]">Auto-translated</span>
      </div>
    </div>
  );
};
