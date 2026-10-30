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
