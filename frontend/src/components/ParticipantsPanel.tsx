import React from 'react';
import { X, Users } from 'lucide-react';
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
  onClose
}) => {
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

      {/* Participants List - Just Clean Participant Names */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1.5">
        {participants.map((p) => {
          const isMe = p.id === currentUserId;

          return (
            <div
              key={p.id}
              className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-obsidian-900 hairline-border-subtle hover:border-white/10 transition"
            >
              <span className="text-sm font-medium text-white tracking-wide">
                {p.display_name}
              </span>
              {isMe && (
                <span className="text-xs text-silver-matte font-mono">
                  You
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};