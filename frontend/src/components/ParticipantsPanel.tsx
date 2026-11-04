import React from 'react';
import { X, Users, Mic, MicOff, Video, VideoOff, Crown, Globe } from 'lucide-react';
import { Participant, SupportedLanguage } from '../types/meeting';

interface ParticipantsPanelProps {
  participants: Participant[];
  currentUserId: string;
  supportedLanguages: SupportedLanguage[];
  onClose: () => void;
}

export const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  participants,
  currentUserId,
  supportedLanguages,
  onClose
}) => {
  const getLanguageName = (code: string) => {
    const found = supportedLanguages.find(l => l.code === code);
    return found ? `${found.name} (${found.native})` : code;
  };

  return (
    <div className="w-80 sm:w-96 h-full bg-obsidian-950 border-l border-neutral-800/90 flex flex-col z-30 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800/90 flex items-center justify-between bg-black">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-silver-200" />
          <h2 className="font-bold text-white text-sm sm:text-base tracking-wide">
            Participants ({participants.length})
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-silver-matte hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Participants List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {participants.map((p) => {
          const isMe = p.id === currentUserId;

          return (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-xl bg-obsidian-900 border border-neutral-850 hover:border-neutral-750 transition"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-black border border-neutral-700 flex items-center justify-center font-bold text-white text-xs uppercase shadow-inner">
                  {p.display_name.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5 text-xs sm:text-sm font-medium text-silver-100">
                    <span>{p.display_name}</span>
                    {isMe && (
                      <span className="text-[10px] text-silver-200 bg-obsidian-850 px-1.5 py-0.5 rounded border border-neutral-700">
                        You
                      </span>
                    )}
                    {p.is_host && (
                      <span title="Meeting Host">
                        <Crown className="w-3.5 h-3.5 text-silver-300" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] text-neutral-500 mt-0.5">
                    <Globe className="w-3 h-3 text-neutral-400" />
                    <span>CC: {getLanguageName(p.caption_language || 'en')}</span>
                  </div>
                </div>
              </div>

              {/* Status Icons */}
              <div className="flex items-center space-x-2">
                <span title={p.is_muted ? 'Muted' : 'Microphone Active'}>
                  {p.is_muted ? (
                    <MicOff className="w-4 h-4 text-silver-matte" />
                  ) : (
                    <Mic className="w-4 h-4 text-white" />
                  )}
                </span>
                <span title={p.is_video_off ? 'Camera Off' : 'Camera Active'}>
                  {p.is_video_off ? (
                    <VideoOff className="w-4 h-4 text-silver-matte" />
                  ) : (
                    <Video className="w-4 h-4 text-white" />
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};