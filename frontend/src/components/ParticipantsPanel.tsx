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
    <div className="w-80 sm:w-96 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-30 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-400" />
          <h2 className="font-semibold text-slate-100 text-sm sm:text-base">
            Participants ({participants.length})
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
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
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center font-bold text-blue-400 text-xs uppercase">
                  {p.display_name.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5 text-xs sm:text-sm font-medium text-slate-200">
                    <span>{p.display_name}</span>
                    {isMe && (
                      <span className="text-[10px] text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800/50">
                        You
                      </span>
                    )}
                    {p.is_host && (
                      <span title="Host">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] text-slate-400 mt-0.5">
                    <Globe className="w-3 h-3 text-slate-500" />
                    <span>CC: {getLanguageName(p.caption_language || 'en')}</span>
                  </div>
                </div>
              </div>

              {/* Status Icons */}
              <div className="flex items-center space-x-2">
                <span title={p.is_muted ? 'Muted' : 'Microphone Active'}>
                  {p.is_muted ? (
                    <MicOff className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Mic className="w-4 h-4 text-emerald-400" />
                  )}
                </span>
                <span title={p.is_video_off ? 'Camera Off' : 'Camera Active'}>
                  {p.is_video_off ? (
                    <VideoOff className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Video className="w-4 h-4 text-blue-400" />
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 text-center">
        No login or registration required. Names are temporary.
      </div>
    </div>
  );
};
