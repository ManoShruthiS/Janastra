import React from 'react';
import { X, Users } from 'lucide-react';
import { Participant, SupportedLanguage } from '../types/meeting';

interface ParticipantsPanelProps {
  participants: Participant[];
  currentUserId: string;
  supportedLanguages?: SupportedLanguage[];
  onClose: () => void;
}

export const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  participants,
  currentUserId,
  onClose
}) => {
  return (
    <div className="absolute bottom-4 right-4 sm:right-20 z-40 w-auto min-w-[190px] max-w-[280px] bg-black/90 backdrop-blur-2xl hairline-border rounded-2xl shadow-2xl p-2.5 flex flex-col select-none animate-caption-glide">
      {/* Compact Header */}
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/[0.08] px-1">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-white">
          <Users className="w-3.5 h-3.5 text-silver-300" />
          <span>Participants ({participants.length})</span>
        </div>
        <button
          onClick={onClose}
          title="Close"
          className="p-1 rounded-md text-silver-matte hover:text-white hover:bg-neutral-800 transition active:scale-95"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating List - Tightly fits the exact count and width of names */}
      <div className="space-y-1 max-h-56 overflow-y-auto">
        {participants.map((p) => {
          const isMe = p.id === currentUserId;

          return (
            <div
              key={p.id}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-obsidian-900/90 hairline-border-subtle hover:border-white/10 transition"
            >
              <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[180px]">
                {p.display_name}
              </span>
              {isMe && (
                <span className="text-[10px] text-silver-matte font-mono ml-2 shrink-0">
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