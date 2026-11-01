import React, { useState, useEffect, useCallback } from 'react';
import { VideoGrid } from './VideoGrid';
import { ControlBar } from './ControlBar';
import { CaptionOverlay } from './CaptionOverlay';
import { TranscriptPanel } from './TranscriptPanel';
import { ChatPanel } from './ChatPanel';
import { ParticipantsPanel } from './ParticipantsPanel';
import { SettingsModal } from './SettingsModal';
import { useMeetingSocket } from '../hooks/useMeetingSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { useAudioStreamer } from '../hooks/useAudioStreamer';
import { SupportedLanguage } from '../types/meeting';
import { Copy, Check, Subtitles } from 'lucide-react';

interface MeetingRoomProps {
  meetingCode: string;
  participantId: string;
  displayName: string;
  initialIsHost: boolean;
  onLeave: () => void;
}

export const MeetingRoom: React.FC<MeetingRoomProps> = ({
  meetingCode,
  participantId,
  displayName,
  initialIsHost,
  onLeave
}) => {
  // Caption state (isolated per participant)
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>([]);

  // Panels & Modals
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Unread chat counter
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch supported languages from backend on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/languages')
      .then((res) => res.json())
      .then((data) => setSupportedLanguages(data))
      .catch((err) => console.warn('Could not load languages list:', err));
  }, []);

  // WebRTC Signal handler forwarder ref
  const signalHandlerRef = React.useRef<(senderId: string, signalData: any) => void>(() => {});

  // 1. Meeting Control Socket (signaling, chat, participant list, captions)
  const {
    isConnected,
    isHost,
    participants,
    captions,
    chatMessages,
    activeSpeakerId,
    sendSignal,
    sendCaptionPref,
    sendChatMessage,
    sendMediaState
  } = useMeetingSocket({
    meetingCode,
    participantId,
    displayName,
    onSignalReceived: (senderId, signalData) => {
      signalHandlerRef.current(senderId, signalData);
    }
  });

  // 2. WebRTC Peer Connections & Local Media
  const {
    localStream,
    remoteStreams,
    isMuted,
    isVideoOff,
    isScreenSharing,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    handleSignal
  } = useWebRTC({
    myParticipantId: participantId,
    participants,
    sendSignal,
    sendMediaState
  });

  signalHandlerRef.current = handleSignal;

  // 3. Audio Streamer (pipes 16kHz PCM directly to backend for Gnani Prisma v3.0 recognition)
  useAudioStreamer({
    mediaStream: localStream,
    isMuted,
    meetingCode,
    participantId,
    displayName
  });

  // Inform backend when participant toggles caption or changes language
  const handleToggleCaptions = useCallback(() => {
    const nextState = !captionsEnabled;
    setCaptionsEnabled(nextState);
    sendCaptionPref(selectedLanguage, nextState);
  }, [captionsEnabled, selectedLanguage, sendCaptionPref]);

  const handleChangeLanguage = useCallback((newLang: string) => {
    setSelectedLanguage(newLang);
    sendCaptionPref(newLang, captionsEnabled);
  }, [captionsEnabled, sendCaptionPref]);

  // Handle chat unread badge
  useEffect(() => {
    if (!isChatOpen && chatMessages.length > 0) {
      setUnreadChatCount((prev) => prev + 1);
    }
  }, [chatMessages.length, isChatOpen]);

  const handleOpenChat = () => {
    setIsChatOpen((prev) => {
      if (!prev) setUnreadChatCount(0);
      return !prev;
    });
    setIsParticipantsOpen(false);
  };

  const handleOpenParticipants = () => {
    setIsParticipantsOpen((prev) => !prev);
    setIsChatOpen(false);
  };

  const handleCopyMeetingCode = () => {
    navigator.clipboard.writeText(meetingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Find active speaker display name
  const activeSpeaker = participants.find((p) => p.id === activeSpeakerId);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="h-14 px-5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            <h1 className="text-base font-extrabold tracking-tight text-white">
              JANASTRA
            </h1>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-2" />

          {/* Meeting Code Badge */}
          <button
            onClick={handleCopyMeetingCode}
            title="Click to copy meeting code"
            className="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-700/80 px-2.5 py-1 rounded-lg border border-slate-700 text-xs font-mono text-slate-200 transition"
          >
            <span>{meetingCode}</span>
            {copiedCode ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>

        {/* Right Info: Current caption language & status */}
        <div className="flex items-center space-x-3 text-xs">
          {captionsEnabled && (
            <div className="flex items-center space-x-1.5 bg-blue-950/60 border border-blue-800/50 px-2.5 py-1 rounded-md text-blue-300">
              <Subtitles className="w-3.5 h-3.5 text-blue-400" />
              <span>CC: {selectedLanguage.toUpperCase()}</span>
            </div>
          )}

          <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700 text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col relative h-full">
          <VideoGrid
            localStream={localStream}
            remoteStreams={remoteStreams}
            myDisplayName={displayName}
            isHost={isHost || initialIsHost}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isScreenSharing={isScreenSharing}
            activeSpeakerId={activeSpeakerId}
            myParticipantId={participantId}
            participants={participants}
          />

          {/* Continuous Bottom Caption Overlay */}
          {captionsEnabled && !isTranscriptOpen && (
            <CaptionOverlay
              captions={captions}
              selectedLanguage={selectedLanguage}
              onExpandTranscript={() => setIsTranscriptOpen(true)}
              activeSpeakerName={activeSpeaker?.display_name}
            />
          )}
        </div>

        {/* Expandable / Collapsible Side Panels */}
        {isTranscriptOpen && (
          <TranscriptPanel
            captions={captions}
            selectedLanguage={selectedLanguage}
            supportedLanguages={supportedLanguages}
            onClose={() => setIsTranscriptOpen(false)}
            onChangeLanguage={handleChangeLanguage}
          />
        )}

        {isChatOpen && (
          <ChatPanel
            messages={chatMessages}
            currentUserId={participantId}
            onSendMessage={sendChatMessage}
            onClose={() => setIsChatOpen(false)}
          />
        )}

        {isParticipantsOpen && (
          <ParticipantsPanel
            participants={participants}
            currentUserId={participantId}
            supportedLanguages={supportedLanguages}
            onClose={() => setIsParticipantsOpen(false)}
          />
        )}
      </div>

      {/* Control Bar: exactly the 8 specified meeting controls */}
      <ControlBar
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        isChatOpen={isChatOpen}
        isParticipantsOpen={isParticipantsOpen}
        captionsEnabled={captionsEnabled}
        selectedLanguage={selectedLanguage}
        supportedLanguages={supportedLanguages}
        participantCount={participants.length}
        unreadChatCount={unreadChatCount}
        onToggleMic={toggleMic}
        onToggleCam={toggleCam}
        onToggleScreenShare={toggleScreenShare}
        onToggleChat={handleOpenChat}
        onToggleParticipants={handleOpenParticipants}
        onToggleCaptions={handleToggleCaptions}
        onChangeLanguage={handleChangeLanguage}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLeaveMeeting={onLeave}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        captionsEnabled={captionsEnabled}
        selectedLanguage={selectedLanguage}
        supportedLanguages={supportedLanguages}
        onToggleCaptions={handleToggleCaptions}
        onChangeLanguage={handleChangeLanguage}
      />
    </div>
  );
};
