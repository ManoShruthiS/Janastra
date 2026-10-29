import { useEffect, useRef } from 'react';

interface UseAudioStreamerProps {
  mediaStream: MediaStream | null;
  isMuted: boolean;
  meetingCode: string;
  participantId: string;
  displayName: string;
}

export function useAudioStreamer({
  mediaStream,
  isMuted,
  meetingCode,
  participantId,
  displayName
}: UseAudioStreamerProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);

  // Maintain WebSocket connection to audio endpoint
  useEffect(() => {
    if (!meetingCode || !participantId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const wsUrl = `${protocol}//${host}:8000/ws/audio/${encodeURIComponent(meetingCode)}/${encodeURIComponent(participantId)}?display_name=${encodeURIComponent(displayName)}`;

    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Audio streamer WebSocket connected.');
    };

    ws.onerror = (err) => {
      console.error('Audio streamer WebSocket error:', err);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('flush');
      }
      ws.close();
      wsRef.current = null;
    };
  }, [meetingCode, participantId, displayName]);

  // Handle mute changes: flush pending buffer if muted
  useEffect(() => {
    if (isMuted && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send('flush');
    }
  }, [isMuted]);

