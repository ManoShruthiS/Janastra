import React, { useState } from 'react';
import { Video, Plus, LogIn, Sparkles, Languages, ShieldCheck } from 'lucide-react';

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
      const res = await fetch('http://localhost:8000/api/meetings/create', {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2.5 bg-blue-600/15 border border-blue-500/30 px-4 py-1.5 rounded-full mb-3 shadow-inner">
            <Languages className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-blue-300">
              Multilingual Real-Time Captions
            </span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            JANASTRA
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Live speaker-attributed speech recognition &amp; translation powered by{' '}
            <span className="text-blue-400 font-semibold">Gnani Prisma v3.0</span>.
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
          {/* Tabs */}
          <div className="flex bg-slate-950/70 p-1 rounded-2xl mb-6 border border-slate-800/80">
            <button
              onClick={() => { setActiveTab('create'); setError(null); }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'create'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Host Meeting</span>
            </button>
            <button
              onClick={() => { setActiveTab('join'); setError(null); }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'join'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Join Meeting</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'create' ? (
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ram"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-sm px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant Access</span>
                </div>
                <div>A unique meeting code will be generated. No sign-up required.</div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <Video className="w-4 h-4" />
                <span>{isLoading ? 'Creating Room...' : 'Start New Meeting'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Meeting Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. JAN-842-195"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-sm uppercase px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 transition font-mono tracking-wider"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mahi"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-sm px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Enter Meeting</span>
              </button>
            </form>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-2 gap-3 w-full text-center text-xs text-slate-400">
          <div className="p-3 bg-slate-900/50 rounded-2xl border border-slate-800/80">
            <span className="font-semibold text-slate-200 block mb-0.5">Isolated Captions</span>
            <span>Independent language per user</span>
          </div>
          <div className="p-3 bg-slate-900/50 rounded-2xl border border-slate-800/80">
            <span className="font-semibold text-slate-200 block mb-0.5">Speaker Attributed</span>
            <span>Preserves who is speaking</span>
          </div>
        </div>
      </div>
    </div>
  );
};
