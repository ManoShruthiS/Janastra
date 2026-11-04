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
import { getApiBaseUrl } from '../config';
import { Copy, Check } from 'lucide-react';

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
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>([]);

  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [gnaniConfigured, setGnaniConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/api/languages`)
      .then((res) => res.json())
      .then((data) => setSupportedLanguages(data))
      .catch((err) => console.warn('Could not load languages list:', err));

    fetch(`${getApiBaseUrl()}/api/health`)
      .then((res) => res.json())
      .then((data) => setGnaniConfigured(Boolean(data.gnani_configured)))
      .catch((err) => {
        console.warn('Could not load Gnani health state:', err);
        setGnaniConfigured(false);
      });
  }, []);

  const signalHandlerRef = React.useRef<(senderId: string, signalData: any) => void>(() => {});

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

  useAudioStreamer({
    mediaStream: localStream,
    isMuted,
    meetingCode,
    participantId,
    displayName
  });

  const handleToggleCaptions = useCallback(() => {
    const nextState = !captionsEnabled;
    setCaptionsEnabled(nextState);
    sendCaptionPref(selectedLanguage, nextState);
  }, [captionsEnabled, selectedLanguage, sendCaptionPref]);

  const handleChangeLanguage = useCallback((newLang: string) => {
    setSelectedLanguage(newLang);
    sendCaptionPref(newLang, captionsEnabled);
  }, [captionsEnabled, sendCaptionPref]);

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

  const activeSpeaker = participants.find((p) => p.id === activeSpeakerId);

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-silver-matte overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="h-14 px-4 sm:px-6 border-b border-neutral-800/90 bg-black flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center space-x-3">
          {/* Indian Tricolor JANASTRA Brand */}
          <h1 className="text-base font-black tracking-widest text-tiranga-metallic">
            JANASTRA
          </h1>

          <div className="h-4 w-px bg-neutral-800 mx-2" />

          {/* Meeting Code Badge */}
          <button
            onClick={handleCopyMeetingCode}
            title="Click to copy meeting code"
            className="flex items-center space-x-2 bg-obsidian-900 hover:bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-800 hover:border-neutral-700 text-xs font-mono text-silver-100 transition duration-150 active:scale-95 shadow-inner"
          >
            <span>{meetingCode}</span>
            {copiedCode ? (
              <Check className="w-3.5 h-3.5 text-silver-100" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-silver-matte" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex relative overflow-hidden bg-black">
        {/* Video Area */}
        <div className="flex-1 flex flex-col relative h-full bg-black">
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
        gnaniConfigured={gnaniConfigured}
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
