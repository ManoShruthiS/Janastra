import React, { useState, useEffect } from 'react';
import { Video, Plus, LogIn } from 'lucide-react';
import { getApiBaseUrl } from '../config';
import { CursorRingField } from './originkit/cursor-ring-field';
import { ScrambleText } from './ScrambleText';
import { HandGesture } from './HandGesture';

interface LobbyProps {
  onJoinMeeting: (meetingCode: string, displayName: string, isHost: boolean) => void;
  initialMeetingCode?: string;
}

export const Lobby: React.FC<LobbyProps> = ({ onJoinMeeting, initialMeetingCode }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [displayName, setDisplayName] = useState('');
  const [meetingCode, setMeetingCode] = useState(initialMeetingCode || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Typewriter effect for tagline
  const fullTagline = "Every voice deserves to be understood.";
  const [typedTagline, setTypedTagline] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (!isDeleting && typedTagline === fullTagline) {
      timeoutId = setTimeout(() => setIsDeleting(true), 3800);
    } else if (isDeleting && typedTagline === '') {
      timeoutId = setTimeout(() => setIsDeleting(false), 500);
    } else {
      const typingSpeed = isDeleting ? 30 : 65;
      timeoutId = setTimeout(() => {
        setTypedTagline((prev) =>
          isDeleting
            ? fullTagline.substring(0, prev.length - 1)
            : fullTagline.substring(0, prev.length + 1)
        );
      }, typingSpeed);
    }

    return () => clearTimeout(timeoutId);
  }, [typedTagline, isDeleting]);

  useEffect(() => {
    if (initialMeetingCode) {
      setMeetingCode(initialMeetingCode);
      setActiveTab('join');
    }
  }, [initialMeetingCode]);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Please enter your display name.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/meetings/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host_display_name: displayName.trim() })
      });

      if (!res.ok) throw new Error('Failed to create meeting.');
      const data = await res.json();
      onJoinMeeting(data.meeting_code, displayName.trim(), true);
    } catch (err: any) {
      console.error(err);
      setError('Could not connect to JANASTRA server. Make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Please enter your display name.');
      return;
    }
    if (!meetingCode.trim()) {
      setError('Please enter a valid meeting code.');
      return;
    }

    onJoinMeeting(meetingCode.trim().toUpperCase(), displayName.trim(), false);
  };

  return (
    <div className="min-h-screen bg-black text-silver-matte flex flex-col justify-between items-center px-4 py-8 relative overflow-hidden select-none">
      {/* Subtle Dark Burgundy Radial Glow behind central content */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(74, 6, 26, 0.38) 0%, rgba(42, 2, 14, 0.18) 45%, rgba(0, 0, 0, 0) 75%)',
          filter: 'blur(40px)'
        }}
      />

      {/* OriginKit Cursor Ring Field interactive background */}
      <CursorRingField />

      {/* Top spacer to balance layout */}
      <div className="w-full h-4" />

      {/* Central Content */}
      <div className="w-full max-w-[490px] relative z-10 flex flex-col items-center my-auto">
        {/* Brand Heading & Tagline */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="mb-3 flex items-center justify-center p-2 rounded-2xl bg-obsidian-900/60 border border-neutral-800/80 shadow-silver-glow">
            <HandGesture size={32} />
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-tiranga-metallic">
            JANASTRA
          </h1>
          <p className="text-silver-300 font-light text-base sm:text-lg tracking-wide mt-3 min-h-[1.75rem] inline-flex items-center justify-center">
            <span>{typedTagline}</span>
            <span
              className="inline-block w-[2px] h-[1.15em] bg-silver-200 ml-1.5 align-middle animate-cursor-blink shadow-silver-glow"
              aria-hidden="true"
            />
          </p>
        </div>

        {/* Refined Meeting Card */}
        <div className="w-full bg-obsidian-900/90 border border-neutral-800/90 rounded-3xl p-7 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Tabs */}
          <div className="flex bg-black p-1 rounded-2xl mb-7 border border-neutral-800/80">
            <button
              type="button"
              onClick={() => { setActiveTab('create'); setError(null); }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'create'
                  ? 'bg-obsidian-800 text-silver-100 border border-neutral-700 shadow-silver-glow'
                  : 'text-silver-matte hover:text-silver-200'
              }`}
            >
              <Plus className="w-4 h-4 text-silver-200" />
              <span>Host Meeting</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('join'); setError(null); }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'join'
                  ? 'bg-obsidian-800 text-silver-100 border border-neutral-700 shadow-silver-glow'
                  : 'text-silver-matte hover:text-silver-200'
              }`}
            >
              <LogIn className="w-4 h-4 text-silver-200" />
              <span>Join Meeting</span>
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-obsidian-850 border border-neutral-700 text-silver-200 text-xs flex items-center space-x-2">
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'create' ? (
            <form onSubmit={handleCreateMeeting} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-silver-300 mb-2 uppercase tracking-wider">
                  Your Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ram"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-black text-silver-100 text-sm px-4 py-3.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-silver-400/60 focus:ring-1 focus:ring-silver-400/30 transition placeholder:text-zinc-600"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 hover:border-silver-400/60 disabled:opacity-50 text-silver-100 text-sm font-semibold border border-neutral-700 shadow-silver-glow transition-all flex items-center justify-center space-x-2 uppercase tracking-wider"
              >
                <Video className="w-4 h-4 text-silver-200" />
                <span>{isLoading ? 'Creating Room...' : 'Start New Meeting'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinMeeting} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-silver-300 mb-2 uppercase tracking-wider">
                  Meeting Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. JAN-842-195"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  className="w-full bg-black text-silver-100 text-sm uppercase px-4 py-3.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-silver-400/60 focus:ring-1 focus:ring-silver-400/30 transition font-mono tracking-widest placeholder:text-zinc-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-silver-300 mb-2 uppercase tracking-wider">
                  Your Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mahi"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-black text-silver-100 text-sm px-4 py-3.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-silver-400/60 focus:ring-1 focus:ring-silver-400/30 transition placeholder:text-zinc-600"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 hover:border-silver-400/60 text-silver-100 text-sm font-semibold border border-neutral-700 shadow-silver-glow transition-all flex items-center justify-center space-x-2 uppercase tracking-wider"
              >
                <LogIn className="w-4 h-4 text-silver-200" />
                <span>Enter Meeting</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Minimal Footer */}
      <footer className="w-full text-center relative z-10 pt-6">
        <p className="text-[11px] sm:text-xs text-neutral-500 font-mono tracking-widest uppercase">
          Powered by{' '}
          <ScrambleText
            text="GNANI AI"
            className="scramble-text px-1"
          />{' '}
          <span className="text-neutral-700 px-1">|</span> Prisma v3.0
        </p>
      </footer>
    </div>
  );
};
