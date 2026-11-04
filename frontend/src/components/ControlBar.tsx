import React from 'react';
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

        {/* 6. Captions Toggle */}
        <button
          onClick={onToggleCaptions}
          title="Toggle Captions"
          className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 ${
            captionsEnabled
              ? 'bg-white/[0.12] text-white border border-white/25 shadow-sm'
              : 'bg-obsidian-900 text-silver-matte border border-white/[0.08] hover:border-white/20 hover:text-white'
          }`}
        >
          <Subtitles className="w-5 h-5" />
        </button>

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