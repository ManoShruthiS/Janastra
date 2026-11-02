import React, { useState } from 'react';
import { Video, Plus, LogIn, Languages, ShieldCheck } from 'lucide-react';
import { getApiBaseUrl } from '../config';

interface LobbyProps {
  onJoinMeeting: (meetingCode: string, displayName: string, isHost: boolean) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onJoinMeeting }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [displayName, setDisplayName] = useState('');
  const [meetingCode, setMeetingCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-black text-silver-matte flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Luxury Ambient Lighting */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gold-champagne/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-zinc-800/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2.5 bg-obsidian-900 border border-gold-champagne/30 px-4 py-1.5 rounded-full mb-4 shadow-gold-glow">
            <Languages className="w-4 h-4 text-gold-400" />
            <span className="text-xs font-semibold tracking-wider uppercase text-gold-300">
              Multilingual Real-Time Captions
            </span>
          </div>

          <h1 className="text-5xl font-black tracking-tight mb-2 text-gold-metallic">
            JANASTRA
          </h1>
          <p className="text-xs sm:text-sm text-silver-400 max-w-sm mx-auto leading-relaxed">
            Live speaker-attributed speech recognition &amp; translation powered by{' '}
            <span className="text-gold-300 font-semibold">Gnani Prisma v3.0</span>.
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-obsidian-900/90 border border-neutral-800 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl">
          {/* Tabs */}
          <div className="flex bg-black p-1 rounded-2xl mb-6 border border-neutral-800/90">
            <button
              onClick={() => { setActiveTab('create'); setError(null); }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'create'
                  ? 'bg-obsidian-800 text-gold-300 border border-gold-champagne/40 shadow-gold-glow'
                  : 'text-silver-matte hover:text-silver-200'
              }`}
            >
              <Plus className="w-4 h-4 text-gold-400" />
              <span>Host Meeting</span>
            </button>
            <button
              onClick={() => { setActiveTab('join'); setError(null); }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'join'
                  ? 'bg-obsidian-800 text-gold-300 border border-gold-champagne/40 shadow-gold-glow'
                  : 'text-silver-matte hover:text-silver-200'
              }`}
            >
              <LogIn className="w-4 h-4 text-gold-400" />
              <span>Join Meeting</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-obsidian-850 border border-gold-500/40 text-gold-300 text-xs flex items-center space-x-2">
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'create' ? (
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-silver-300 mb-1.5 uppercase tracking-wide">
                  Your Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ram"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-black text-silver-100 text-sm px-4 py-3 rounded-xl border border-neutral-800 focus:outline-none focus:border-gold-champagne/60 focus:ring-1 focus:ring-gold-champagne/40 transition placeholder:text-zinc-600"
                  required
                />
              </div>

              <div className="p-3 bg-black rounded-xl border border-neutral-800/80 text-[11px] text-silver-matte space-y-1">
                <div className="flex items-center space-x-1.5 text-gold-300 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
                  <span>Instant Premium Access</span>
                </div>
                <div className="text-zinc-400">A unique meeting code will be generated. No sign-up required.</div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 disabled:opacity-50 text-gold-300 text-sm font-semibold border border-gold-champagne/50 shadow-gold-glow transition-all flex items-center justify-center space-x-2 uppercase tracking-wide"
              >
                <Video className="w-4 h-4 text-gold-400" />
                <span>{isLoading ? 'Creating Room...' : 'Start New Meeting'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-silver-300 mb-1.5 uppercase tracking-wide">
                  Meeting Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. JAN-842-195"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  className="w-full bg-black text-gold-300 text-sm uppercase px-4 py-3 rounded-xl border border-neutral-800 focus:outline-none focus:border-gold-champagne/60 focus:ring-1 focus:ring-gold-champagne/40 transition font-mono tracking-widest placeholder:text-zinc-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-silver-300 mb-1.5 uppercase tracking-wide">
                  Your Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mahi"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-black text-silver-100 text-sm px-4 py-3 rounded-xl border border-neutral-800 focus:outline-none focus:border-gold-champagne/60 focus:ring-1 focus:ring-gold-champagne/40 transition placeholder:text-zinc-600"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-gold-300 text-sm font-semibold border border-gold-champagne/50 shadow-gold-glow transition-all flex items-center justify-center space-x-2 uppercase tracking-wide"
              >
                <LogIn className="w-4 h-4 text-gold-400" />
                <span>Enter Meeting</span>
              </button>
            </form>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-2 gap-3 w-full text-center text-xs">
          <div className="p-3 bg-obsidian-900/60 rounded-2xl border border-neutral-800/80">
            <span className="font-semibold text-gold-300 block mb-0.5">Isolated Captions</span>
            <span className="text-silver-matte">Independent language per user</span>
          </div>
          <div className="p-3 bg-obsidian-900/60 rounded-2xl border border-neutral-800/80">
            <span className="font-semibold text-gold-300 block mb-0.5">Speaker Attributed</span>
            <span className="text-silver-matte">Preserves who is speaking</span>
          </div>
        </div>
      </div>
    </div>
  );
};
