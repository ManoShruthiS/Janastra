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
  Settings,
  PhoneOff
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
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleCaptions: () => void;
  onChangeLanguage: (lang: string) => void;
  onOpenSettings: () => void;
  onLeaveMeeting: () => void;
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
    <div className="flex items-center justify-between px-6 py-3.5 bg-black border-t border-neutral-800/90 shadow-2xl z-30 select-none">
      {/* Left side: Caption quick language pill & status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center bg-obsidian-900 rounded-xl p-1 border border-neutral-800 shadow-inner">
          <button
            onClick={onToggleCaptions}
            title={captionsEnabled ? 'Turn Captions Off' : 'Turn Captions On'}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${
              captionsEnabled
                ? 'bg-obsidian-800 text-gold-300 border border-gold-champagne/40 shadow-gold-glow'
                : 'text-silver-matte hover:text-silver-100 hover:bg-neutral-900'
            }`}
          >
            <Subtitles className={`w-4 h-4 ${captionsEnabled ? 'text-gold-400' : 'text-silver-matte'}`} />
            <span>{captionsEnabled ? 'CC ON' : 'CC OFF'}</span>
          </button>

          {captionsEnabled && (
            <select
              value={selectedLanguage}
              onChange={(e) => onChangeLanguage(e.target.value)}
              title="Select your personal caption language"
              className="bg-transparent text-xs text-gold-300 font-medium px-2 py-1 outline-none cursor-pointer border-l border-neutral-800 hover:text-gold-200"
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

      {/* Center: The EXACT 8 Meeting Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* 1. Microphone */}
        <button
          onClick={onToggleMic}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          className={`relative p-3 rounded-full transition-all duration-150 ${
            isMuted
              ? 'bg-obsidian-900 text-silver-matte border border-neutral-800 hover:border-gold-champagne/40 hover:text-gold-300'
              : 'bg-obsidian-850 text-gold-300 border border-gold-champagne/50 shadow-gold-glow'
          }`}
        >
          {isMuted ? <MicOff className="w-5 h-5 text-silver-matte" /> : <Mic className="w-5 h-5 text-gold-400" />}
        </button>

        {/* 2. Camera */}
        <button
          onClick={onToggleCam}
          title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          className={`relative p-3 rounded-full transition-all duration-150 ${
            isVideoOff
              ? 'bg-obsidian-900 text-silver-matte border border-neutral-800 hover:border-gold-champagne/40 hover:text-gold-300'
              : 'bg-obsidian-850 text-gold-300 border border-gold-champagne/50 shadow-gold-glow'
          }`}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5 text-silver-matte" /> : <Video className="w-5 h-5 text-gold-400" />}
        </button>

        {/* 3. Screen Sharing */}
        <button
          onClick={onToggleScreenShare}
          title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
          className={`relative p-3 rounded-full transition-all duration-150 ${
            isScreenSharing
              ? 'bg-obsidian-800 text-gold-300 border border-gold-champagne shadow-gold-glow'
              : 'bg-obsidian-900 text-silver-matte border border-neutral-800 hover:border-gold-champagne/40 hover:text-gold-300'
          }`}
        >
          <ScreenShare className="w-5 h-5" />
        </button>

        {/* 4. Chat */}
        <button
          onClick={onToggleChat}
          title="Meeting Chat"
          className={`relative p-3 rounded-full transition-all duration-150 ${
            isChatOpen
              ? 'bg-obsidian-800 text-gold-300 border border-gold-champagne/60 shadow-gold-glow'
              : 'bg-obsidian-900 text-silver-matte border border-neutral-800 hover:border-gold-champagne/40 hover:text-gold-300'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          {unreadChatCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 bg-gold-champagne text-black text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-md">
              {unreadChatCount > 9 ? '9+' : unreadChatCount}
            </span>
          )}
        </button>

        {/* 5. Participants */}
        <button
          onClick={onToggleParticipants}
          title="Participants List"
          className={`relative p-3 rounded-full transition-all duration-150 ${
            isParticipantsOpen
              ? 'bg-obsidian-800 text-gold-300 border border-gold-champagne/60 shadow-gold-glow'
              : 'bg-obsidian-900 text-silver-matte border border-neutral-800 hover:border-gold-champagne/40 hover:text-gold-300'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-obsidian-850 text-gold-300 text-[10px] font-bold rounded-full px-1.5 py-0.5 border border-gold-champagne/30">
            {participantCount}
          </span>
        </button>

        {/* 6. Captions Toggle */}
        <button
          onClick={onToggleCaptions}
          title="Captions"
          className={`relative p-3 rounded-full transition-all duration-150 ${
            captionsEnabled
              ? 'bg-obsidian-800 text-gold-300 border border-gold-champagne shadow-gold-glow'
              : 'bg-obsidian-900 text-silver-matte border border-neutral-800 hover:border-gold-champagne/40 hover:text-gold-300'
          }`}
        >
          <Subtitles className="w-5 h-5" />
        </button>

        {/* 7. Settings */}
        <button
          onClick={onOpenSettings}
          title="Settings"
          className="p-3 rounded-full bg-obsidian-900 text-silver-matte border border-neutral-800 hover:border-gold-champagne/40 hover:text-gold-300 transition-all duration-150"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* 8. Leave Meeting */}
        <button
          onClick={onLeaveMeeting}
          title="Leave Meeting"
          className="px-4 py-3 rounded-full bg-black hover:bg-neutral-900 text-gold-300 border border-gold-champagne/50 hover:border-gold-300 transition-all duration-150 shadow-gold-glow flex items-center space-x-2"
        >
          <PhoneOff className="w-5 h-5 text-gold-400" />
          <span className="hidden md:inline text-xs font-bold uppercase tracking-wider text-gold-300">Leave</span>
        </button>
      </div>

      {/* Right side: Branding & Live indicator */}
      <div className="hidden sm:flex items-center space-x-3 text-xs">
        <span className="flex items-center space-x-2 bg-obsidian-900 px-3 py-1.5 rounded-xl border border-neutral-800 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-gold-400 animate-ping" />
          <span className="text-gold-300 font-mono tracking-wide">Gnani Prisma v3.0</span>
        </span>
      </div>
    </div>
  );
};
