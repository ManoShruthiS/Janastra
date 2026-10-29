import { useEffect, useRef, useState, useCallback } from 'react';
import { Participant, CaptionItem, ChatMessage } from '../types/meeting';

interface UseMeetingSocketProps {
  meetingCode: string;
  participantId: string;
  displayName: string;
  onSignalReceived: (senderId: string, signalData: any) => void;
}

export function useMeetingSocket({
  meetingCode,
  participantId,
  displayName,
  onSignalReceived
}: UseMeetingSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [captions, setCaptions] = useState<CaptionItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  const onSignalRef = useRef(onSignalReceived);
  onSignalRef.current = onSignalReceived;

  useEffect(() => {
    if (!meetingCode || !participantId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Backend runs on port 8000
    const host = window.location.hostname || 'localhost';
    const wsUrl = `${protocol}//${host}:8000/ws/meeting/${encodeURIComponent(meetingCode)}/${encodeURIComponent(participantId)}?display_name=${encodeURIComponent(displayName)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      console.error('Meeting WebSocket error:', err);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'init_sync':
            setParticipants(data.participants || []);
            setCaptions(data.transcript_history || []);
            setChatMessages(data.chat_history || []);
            setIsHost(data.is_host || false);
            break;

          case 'participant_joined':
            setParticipants(data.all_participants || []);
            break;

          case 'participant_left':
            setParticipants(data.all_participants || []);
            break;

          case 'participant_state_updated':
            setParticipants(prev =>
              prev.map(p => p.id === data.participant.id ? data.participant : p)
            );
            break;

          case 'caption':
            if (data.caption) {
              setCaptions(prev => [...prev, data.caption]);
            }
            break;

