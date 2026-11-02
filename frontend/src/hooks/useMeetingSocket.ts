import { useEffect, useRef, useState, useCallback } from 'react';
import { Participant, CaptionItem, ChatMessage } from '../types/meeting';
import { getWsBaseUrl } from '../config';

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

    const wsBase = getWsBaseUrl();
    const wsUrl = `${wsBase}/ws/meeting/${encodeURIComponent(meetingCode)}/${encodeURIComponent(participantId)}?display_name=${encodeURIComponent(displayName)}`;

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

          case 'chat':
            if (data.message) {
              setChatMessages(prev => [...prev, data.message]);
            }
            break;

          case 'speaker_active':
            setActiveSpeakerId(data.is_speaking ? data.speaker_id : null);
            break;

          case 'signal':
            if (data.sender_id && data.signal_data) {
              onSignalRef.current(data.sender_id, data.signal_data);
            }
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [meetingCode, participantId, displayName]);

  const sendSignal = useCallback((targetId: string, signalData: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'signal',
        target_id: targetId,
        signal_data: signalData
      }));
    }
  }, []);

  const sendCaptionPref = useCallback((language: string, enabled: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'caption_pref',
        caption_language: language,
        caption_enabled: enabled
      }));
    }
  }, []);

  const sendChatMessage = useCallback((content: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        content
      }));
    }
  }, []);

  const sendMediaState = useCallback((state: { is_muted?: boolean; is_video_off?: boolean; is_screen_sharing?: boolean }) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'media_state',
        ...state
      }));
    }
  }, []);

  return {
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
  };
}
