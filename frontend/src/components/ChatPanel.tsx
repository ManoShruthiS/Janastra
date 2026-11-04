import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { ChatMessage } from '../types/meeting';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onClose: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentUserId,
  onSendMessage,
  onClose
}) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="w-80 sm:w-96 h-full bg-obsidian-950 border-l border-neutral-800/90 flex flex-col z-30 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800/90 flex items-center justify-between bg-black">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-silver-200" />
          <h2 className="font-bold text-white text-sm sm:text-base tracking-wide">In-Call Messages</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-silver-matte hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-20 text-neutral-600 text-xs font-mono">
            No messages yet.
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === currentUserId;
            const timeStr = new Date(m.timestamp * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-1.5 text-[11px] mb-1">
                  <span className={`font-semibold ${isMe ? 'text-white' : 'text-silver-300'}`}>
                    {isMe ? 'You' : m.sender_name}
                  </span>
                  <span className="text-neutral-500 font-mono text-[10px]">{timeStr}</span>
                </div>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm break-words leading-relaxed shadow-md ${
                    isMe
                      ? 'bg-obsidian-800 text-white border border-neutral-700 rounded-tr-none'
                      : 'bg-obsidian-900 text-silver-200 border border-neutral-800/90 rounded-tl-none'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-neutral-800/90 bg-obsidian-900 flex items-center space-x-2">
        <input
          type="text"
          placeholder="Send a message to everyone..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-black text-xs sm:text-sm text-silver-100 px-3.5 py-2.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-neutral-600 transition placeholder:text-neutral-600"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-obsidian-850 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white border border-neutral-700 transition active:scale-95 shadow-md"
        >
          <Send className="w-4 h-4 text-silver-200" />
        </button>
      </form>
    </div>
  );
};