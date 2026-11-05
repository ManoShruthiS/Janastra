import React, { useState, useEffect, useCallback } from 'react';
import { VideoGrid } from './VideoGrid';
import { ControlBar } from './ControlBar';
import { CaptionOverlay } from './CaptionOverlay';
import { ParticipantsPanel } from './ParticipantsPanel';
import { useMeetingSocket } from '../hooks/useMeetingSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { useAudioStreamer } from '../hooks/useAudioStreamer';
import { SupportedLanguage } from '../types/meeting';
import { getApiBaseUrl } from '../config';
import { Copy, Check, PhoneOff } from 'lucide-react';

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
  const [spokenLanguage, setSpokenLanguage] = useState('en');
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>([]);

  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  const [copiedCode, setCopiedCode] = useState(false);
  const [gnaniConfigured, setGnaniConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/api/languages`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSupportedLanguages(data);
        }
      })
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
    activeSpeakerId,
    sendSignal,
    sendCaptionPref,
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
    toggleMic,
    toggleCam,
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
    displayName,
    spokenLanguage
  });

  const handleToggleCaptions = useCallback(() => {
    const nextState = !captionsEnabled;
    setCaptionsEnabled(nextState);
    sendCaptionPref(selectedLanguage, nextState, spokenLanguage);
  }, [captionsEnabled, selectedLanguage, spokenLanguage, sendCaptionPref]);

  const handleChangeLanguage = useCallback((newLang: string) => {
    setSelectedLanguage(newLang);
    sendCaptionPref(newLang, captionsEnabled, spokenLanguage);
  }, [captionsEnabled, spokenLanguage, sendCaptionPref]);

  const handleChangeSpokenLanguage = useCallback((newSpoken: string) => {
    setSpokenLanguage(newSpoken);
    sendCaptionPref(selectedLanguage, captionsEnabled, newSpoken);
  }, [selectedLanguage, captionsEnabled, sendCaptionPref]);

  const handleOpenParticipants = () => {
    setIsParticipantsOpen((prev) => !prev);
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

        {/* Right Top Corner: Leave Meeting Button */}
        <button
          onClick={onLeave}
          title="Leave Meeting"
          className="h-9 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white border border-white/15 hover:border-white/30 transition-all duration-150 active:scale-95 flex items-center space-x-2 shadow-sm"
        >
          <PhoneOff className="w-4 h-4 text-neutral-300" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">Leave</span>
        </button>
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
            activeSpeakerId={activeSpeakerId}
            myParticipantId={participantId}
            participants={participants}
          />

          {/* Clean Live Multilingual Caption Subtitle (Single Active Line, No Scrollable Backlog) */}
          {captionsEnabled && (
            <CaptionOverlay
              captions={captions}
              selectedLanguage={selectedLanguage}
              activeSpeakerName={activeSpeaker?.display_name}
            />
          )}
        </div>

        {/* Compact Auto-Fitting Floating Participants Card */}
        {isParticipantsOpen && (
          <ParticipantsPanel
            participants={participants}
            currentUserId={participantId}
            supportedLanguages={supportedLanguages}
            onClose={() => setIsParticipantsOpen(false)}
          />
        )}
      </div>

      {/* Control Bar: Pure Essential Indic Meeting Tools */}
      <ControlBar
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isParticipantsOpen={isParticipantsOpen}
        captionsEnabled={captionsEnabled}
        selectedLanguage={selectedLanguage}
        spokenLanguage={spokenLanguage}
        supportedLanguages={supportedLanguages}
        participantCount={participants.length}
        gnaniConfigured={gnaniConfigured}
        onToggleMic={toggleMic}
        onToggleCam={toggleCam}
        onToggleParticipants={handleOpenParticipants}
        onToggleCaptions={handleToggleCaptions}
        onChangeLanguage={handleChangeLanguage}
        onChangeSpokenLanguage={handleChangeSpokenLanguage}
      />
    </div>
  );
};
