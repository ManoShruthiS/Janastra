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
    <div className="flex items-center justify-between px-6 py-3 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 shadow-2xl z-30 select-none">
      {/* Left side: Caption quick language pill & status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700/60 shadow-inner">
          <button
            onClick={onToggleCaptions}
            title={captionsEnabled ? 'Turn Captions Off' : 'Turn Captions On'}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              captionsEnabled
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <Subtitles className="w-4 h-4" />
            <span>{captionsEnabled ? 'CC ON' : 'CC OFF'}</span>
          </button>

          {captionsEnabled && (
            <select
              value={selectedLanguage}
              onChange={(e) => onChangeLanguage(e.target.value)}
              title="Select your personal caption language"
              className="bg-transparent text-xs text-blue-300 font-medium px-2 py-1 outline-none cursor-pointer border-l border-slate-700 hover:text-white"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-100">
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
          className={`relative p-3 rounded-full transition-all duration-150 shadow-md ${
            isMuted
              ? 'bg-rose-600/90 hover:bg-rose-500 text-white ring-2 ring-rose-500/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-100 ring-1 ring-slate-700'
          }`}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-400" />}
        </button>

        {/* 2. Camera */}
        <button
          onClick={onToggleCam}
          title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          className={`relative p-3 rounded-full transition-all duration-150 shadow-md ${
            isVideoOff
              ? 'bg-rose-600/90 hover:bg-rose-500 text-white ring-2 ring-rose-500/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-100 ring-1 ring-slate-700'
          }`}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5 text-blue-400" />}
        </button>

        {/* 3. Screen Sharing */}
        <button
          onClick={onToggleScreenShare}
          title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
          className={`relative p-3 rounded-full transition-all duration-150 shadow-md ${
            isScreenSharing
              ? 'bg-blue-600 hover:bg-blue-500 text-white ring-2 ring-blue-400/50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 ring-1 ring-slate-700'
          }`}
        >
          <ScreenShare className="w-5 h-5" />
        </button>

        {/* 4. Chat */}
        <button
          onClick={onToggleChat}
          title="Meeting Chat"
          className={`relative p-3 rounded-full transition-all duration-150 shadow-md ${
            isChatOpen
              ? 'bg-blue-600 text-white ring-2 ring-blue-400/50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 ring-1 ring-slate-700'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          {unreadChatCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {unreadChatCount > 9 ? '9+' : unreadChatCount}
            </span>
          )}
        </button>

        {/* 5. Participants */}
        <button
          onClick={onToggleParticipants}
          title="Participants List"
          className={`relative p-3 rounded-full transition-all duration-150 shadow-md ${
            isParticipantsOpen
