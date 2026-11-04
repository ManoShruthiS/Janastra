import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  MessageSquare,
  Users,
  Subtitles,
  Settings
} from 'lucide-react';
import { SupportedLanguage } from '../types/meeting';

interface ControlBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  captionsEnabled: boolean;
  selectedLanguage: string;
  supportedLanguages: SupportedLanguage[];
  participantCount: number;
  unreadChatCount: number;
  gnaniConfigured: boolean | null;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleCaptions: () => void;
  onChangeLanguage: (lang: string) => void;
  onOpenSettings: () => void;
  onLeaveMeeting?: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isMuted,
  isVideoOff,
  isScreenSharing,
  isChatOpen,
  isParticipantsOpen,
  captionsEnabled,
  selectedLanguage,
  supportedLanguages,
  participantCount,
  unreadChatCount,
  gnaniConfigured,
  onToggleMic,
  onToggleCam,
  onToggleScreenShare,
  onToggleChat,
  onToggleParticipants,
  onToggleCaptions,
  onChangeLanguage,
  onOpenSettings,
  onLeaveMeeting
}) => {
  const [isFabHovered, setIsFabHovered] = useState(false);

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

  const langsToDisplay = supportedLanguages.length > 0 ? supportedLanguages : fallbackLanguages;
  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-black/95 backdrop-blur-2xl border-t border-white/[0.08] shadow-2xl z-30 select-none">
      {/* Left side: Caption quick language pill & individual language selector */}
      <div className="flex items-center space-x-3 flex-1 min-w-0 justify-start">
        <div className="flex items-center bg-obsidian-900/90 rounded-xl p-1 border border-white/[0.08] shadow-inner">
          <button
            onClick={onToggleCaptions}
            title={captionsEnabled ? 'Turn Captions Off (T)' : 'Turn Captions On (T)'}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all duration-150 active:scale-95 ${
              captionsEnabled
                ? 'bg-white/[0.12] text-white border border-white/20 shadow-sm'
                : 'text-silver-matte hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Subtitles className={`w-4 h-4 ${captionsEnabled ? 'text-white' : 'text-silver-matte'}`} />
            <span>{captionsEnabled ? 'CC ON' : 'CC OFF'}</span>
          </button>

          {captionsEnabled && (
            <select
              value={selectedLanguage}
              onChange={(e) => onChangeLanguage(e.target.value)}
              title="Select your personal caption language"
              className="bg-transparent text-xs text-silver-100 font-medium px-2 py-1 outline-none cursor-pointer border-l border-neutral-800 hover:text-white transition"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-black text-silver-100">
                  {lang.name} ({lang.native})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Center: The EXACT 8 Meeting Controls (Modern Minimalist Dock) */}
      <div className="flex items-center justify-center space-x-2 sm:space-x-3 flex-shrink-0">
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

        {/* 3. Screen Sharing */}
        <button
          onClick={onToggleScreenShare}
          title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
          className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 ${
            isScreenSharing
              ? 'bg-white/[0.12] text-white border border-white/30 shadow-sm'
              : 'bg-obsidian-900 text-silver-matte border border-white/[0.08] hover:border-white/20 hover:text-white'
          }`}
        >
          <ScreenShare className="w-5 h-5" />
        </button>

        {/* 4. Chat */}
        <button
          onClick={onToggleChat}
          title="Meeting Chat"
          className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 ${
            isChatOpen
              ? 'bg-white/[0.12] text-white border border-white/25 shadow-sm'
              : 'bg-obsidian-900 text-silver-matte border border-white/[0.08] hover:border-white/20 hover:text-white'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          {unreadChatCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-md">
              {unreadChatCount > 9 ? '9+' : unreadChatCount}
            </span>
          )}
        </button>

        {/* 5. Participants */}
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

        {/* 6. Captions FAB Radial Language Selector */}
        <div
          className="relative flex items-center justify-center"
          onMouseEnter={() => setIsFabHovered(true)}
          onMouseLeave={() => setIsFabHovered(false)}
        >
          {/* Radial Floating Language Buttons */}
          {langsToDisplay.map((lang, idx) => {
            const count = langsToDisplay.length;
            const t = count > 1 ? idx / (count - 1) : 0.5;
            const deg = 170 - t * 160; // Upward arc from 170° to 10°
            const rad = deg * (Math.PI / 180);
            const radius = 95; // Radius distance
            const x = Math.round(radius * Math.cos(rad));
            const y = Math.round(-radius * Math.sin(rad));

            const isSelected = selectedLanguage === lang.code;
            const label = lang.code.toUpperCase();

            return (
              <button
                key={lang.code}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeLanguage(lang.code);
                  if (!captionsEnabled) onToggleCaptions();
                }}
                title={`${lang.name} (${lang.native})`}
                style={{
                  transform: isFabHovered
                    ? `translate3d(${x}px, ${y}px, 0) scale(1)`
                    : 'translate3d(0, 0, 0) scale(0.3)',
                  opacity: isFabHovered ? 1 : 0,
                  pointerEvents: isFabHovered ? 'auto' : 'none',
                  transition: `all 0.28s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 18}ms`
                }}
                className={`group/lang absolute z-40 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-mono tracking-tight font-bold transition-transform hover:scale-125 active:scale-95 shadow-xl ${
                  isSelected
                    ? 'bg-white text-black border border-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                    : 'bg-obsidian-950 text-silver-300 hover:text-white hover:bg-neutral-800 border border-white/15'
                }`}
              >
                <span>{label}</span>

                {/* Sleek Tooltip */}
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md border border-white/15 px-2 py-0.5 rounded text-[10px] font-sans text-white whitespace-nowrap opacity-0 group-hover/lang:opacity-100 pointer-events-none transition-opacity duration-150 shadow-lg">
                  {lang.name} ({lang.native})
                </span>
              </button>
            );
          })}

          {/* Main Caption Trigger Button */}
          <button
            onClick={onToggleCaptions}
            title={captionsEnabled ? 'Toggle Captions Off (T)' : 'Toggle Captions On (T)'}
            className={`relative z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 ${
              captionsEnabled
                ? 'bg-white/[0.12] text-white border border-white/25 shadow-sm'
                : 'bg-obsidian-900 text-silver-matte border border-white/[0.08] hover:border-white/20 hover:text-white'
            }`}
          >
            <Subtitles className={`w-5 h-5 transition-transform duration-200 ${isFabHovered ? 'scale-110' : ''}`} />
          </button>
        </div>

        {/* 7. Settings */}
        <button
          onClick={onOpenSettings}
          title="Settings"
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-obsidian-900 text-silver-matte border border-white/[0.08] hover:border-white/20 hover:text-white transition-all duration-150 active:scale-95"
        >
          <Settings className="w-5 h-5" />
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