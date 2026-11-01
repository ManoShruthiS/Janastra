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
