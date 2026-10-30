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
