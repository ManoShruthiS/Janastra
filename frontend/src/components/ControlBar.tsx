import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  Subtitles
} from 'lucide-react';
import { SupportedLanguage } from '../types/meeting';

interface ControlBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isParticipantsOpen: boolean;
  captionsEnabled: boolean;
  selectedLanguage: string;
  spokenLanguage: string;
  supportedLanguages: SupportedLanguage[];
  participantCount: number;
  gnaniConfigured: boolean | null;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleParticipants: () => void;
  onToggleCaptions: () => void;
  onChangeLanguage: (lang: string) => void;
  onChangeSpokenLanguage: (lang: string) => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isMuted,
  isVideoOff,
  isParticipantsOpen,
  captionsEnabled,
  selectedLanguage,
  spokenLanguage,
  supportedLanguages,
  participantCount,
  gnaniConfigured,
  onToggleMic,
  onToggleCam,
  onToggleParticipants,
  onToggleCaptions,
  onChangeLanguage,
  onChangeSpokenLanguage
}) => {
  // Fallback if languages are still fetching from backend
  const fallbackLanguages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  ];

  const langsToDisplay =
    Array.isArray(supportedLanguages) && supportedLanguages.length > 0
      ? supportedLanguages
      : fallbackLanguages;

  return (
    <div className="shrink-0 flex items-center justify-between px-3 sm:px-6 py-3 bg-black/95 backdrop-blur-2xl border-t border-white/[0.08] shadow-2xl z-30 select-none gap-2">
      {/* Left side: Speaking Language & Captions */}
      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0 justify-start">
        {/* Speaking Language Selector */}
        <div className="flex items-center bg-obsidian-900/90 rounded-xl px-2.5 py-1.5 border border-white/[0.08] shadow-inner text-xs">
          <span className="text-silver-matte mr-1.5 hidden lg:inline text-[11px] font-medium uppercase tracking-wider">
            Speaking:
          </span>
          <select
            value={spokenLanguage}
            onChange={(e) => onChangeSpokenLanguage(e.target.value)}
            title="Language you are speaking into your microphone"
            className="bg-transparent text-xs text-silver-100 font-medium outline-none cursor-pointer hover:text-white transition"
          >
            <option value="auto" className="bg-black text-silver-100">Auto (Indic)</option>
            {langsToDisplay.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-black text-silver-100">
                {lang.name} ({lang.native})
              </option>
            ))}
          </select>
        </div>

        {/* Caption Toggle & Language Selector */}
        <div className="flex items-center bg-obsidian-900/90 rounded-xl p-1 border border-white/[0.08] shadow-inner">
          <button
            onClick={onToggleCaptions}
            title={captionsEnabled ? 'Turn Captions Off' : 'Turn Captions On'}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all duration-150 active:scale-95 ${
              captionsEnabled
                ? 'bg-white/[0.12] text-white border border-white/20 shadow-sm'
                : 'text-silver-matte hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Subtitles className={`w-3.5 h-3.5 ${captionsEnabled ? 'text-white' : 'text-silver-matte'}`} />
            <span>{captionsEnabled ? 'CC ON' : 'CC OFF'}</span>
          </button>

          {captionsEnabled && (
            <select
              value={selectedLanguage}
              onChange={(e) => onChangeLanguage(e.target.value)}
              title="Select caption language to read"
              className="bg-transparent text-xs text-silver-100 font-medium px-2 py-1 outline-none cursor-pointer border-l border-neutral-800 hover:text-white transition"
            >
              {langsToDisplay.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-black text-silver-100">
                  {lang.name} ({lang.native})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Center: The Core Essential Controls (Minimalist Indic Dock) */}
      <div className="flex items-center justify-center space-x-3 flex-shrink-0">
        {/* 1. Microphone */}
        <button
          onClick={onToggleMic}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 ${
            isMuted
              ? 'bg-obsidian-900 text-silver-matte border border-white/[0.08] hover:border-white/20 hover:text-white'
              : 'bg-white/[0.12] text-white border border-white/25 shadow-sm hover:border-white/40'
          }`}
        >
          {isMuted ? <MicOff className="w-5 h-5 text-silver-matte" /> : <Mic className="w-5 h-5 text-white" />}
        </button>

        {/* 2. Camera */}
        <button
          onClick={onToggleCam}
          title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 ${
            isVideoOff
              ? 'bg-obsidian-900 text-silver-matte border border-white/[0.08] hover:border-white/20 hover:text-white'
              : 'bg-white/[0.12] text-white border border-white/25 shadow-sm hover:border-white/40'
          }`}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5 text-silver-matte" /> : <Video className="w-5 h-5 text-white" />}
        </button>

        {/* 3. Participants (Opens Auto-Fitting Floating Card) */}
        <button
          onClick={onToggleParticipants}
          title="Participants List"
          className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 ${
            isParticipantsOpen
              ? 'bg-white/[0.12] text-white border border-white/25 shadow-sm'
              : 'bg-obsidian-900 text-silver-matte border border-white/[0.08] hover:border-white/20 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-neutral-800 text-silver-100 text-[10px] font-bold rounded-full px-1.5 py-0.5 border border-white/10">
            {participantCount}
          </span>
        </button>
      </div>

      {/* Right side: Real Gnani STT Status (Silver/Monochrome) */}
      <div className="hidden md:flex items-center space-x-3 text-xs flex-1 justify-end">
        <span
          title={
            gnaniConfigured === true
              ? 'Gnani Prisma v3.0 STT Connected & Authenticated'
              : gnaniConfigured === false
              ? 'Gnani API key is not configured in backend/.env'
              : 'Checking backend Gnani connection status...'
          }
          className="flex items-center space-x-2 bg-obsidian-900/90 px-3 py-1.5 rounded-xl border border-white/[0.08] shadow-inner"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              gnaniConfigured === true
                ? 'bg-white'
                : gnaniConfigured === false
                ? 'bg-neutral-600'
                : 'bg-neutral-500 animate-pulse'
            }`}
          />
          <span className="font-mono text-[11px] tracking-wide text-silver-matte">
            {gnaniConfigured === true
              ? 'Gnani Prisma: Active'
              : gnaniConfigured === false
              ? 'Gnani: Not Authenticated'
              : 'Gnani: Checking...'}
          </span>
        </span>
      </div>
    </div>
  );
};
