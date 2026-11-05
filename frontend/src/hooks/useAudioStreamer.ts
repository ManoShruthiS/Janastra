import { useEffect, useRef } from 'react';
import { getWsBaseUrl } from '../config';

interface UseAudioStreamerProps {
  mediaStream: MediaStream | null;
  isMuted: boolean;
  meetingCode: string;
  participantId: string;
  displayName: string;
}

/**
 * Downsamples audio from any input sample rate (e.g. 48000Hz, 44100Hz) to exact 16000Hz 16-bit PCM.
 * Uses windowed averaging (anti-aliasing) to ensure crystal clear human voice pitch for Gnani STT.
 */
function downsampleTo16kHz(input: Float32Array, inputSampleRate: number): Int16Array {
  if (inputSampleRate === 16000) {
    const pcm16 = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm16;
  }

  const ratio = inputSampleRate / 16000;
  const newLength = Math.floor(input.length / ratio);
  const result = new Int16Array(newLength);
  let offsetResult = 0;
  let offsetInput = 0;

  while (offsetResult < result.length) {
    const nextOffsetInput = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetInput; i < nextOffsetInput && i < input.length; i++) {
      accum += input[i];
      count++;
    }
    const val = count > 0 ? accum / count : 0;
    const s = Math.max(-1, Math.min(1, val));
    result[offsetResult] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    offsetResult++;
    offsetInput = nextOffsetInput;
  }
  return result;
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

    const wsBase = getWsBaseUrl();
    const wsUrl = `${wsBase}/ws/audio/${encodeURIComponent(meetingCode)}/${encodeURIComponent(participantId)}?display_name=${encodeURIComponent(displayName)}`;

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

  // Capture audio from local MediaStream and convert to 16kHz 16-bit PCM
  useEffect(() => {
    if (!mediaStream) return;

    const audioTracks = mediaStream.getAudioTracks();
    if (audioTracks.length === 0) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const sourceNode = audioCtx.createMediaStreamSource(mediaStream);
      sourceNodeRef.current = sourceNode;

      // ScriptProcessor with 4096 buffer size
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMuted) return;
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const actualSampleRate = e.inputBuffer.sampleRate || (audioContextRef.current?.sampleRate ?? 16000);
        const pcm16 = downsampleTo16kHz(inputData, actualSampleRate);

        if (pcm16.length > 0) {
          // Send raw PCM binary frame at exact 16kHz
          wsRef.current.send(pcm16.buffer);
        }
      };

      sourceNode.connect(processor);
      // Connect to destination to keep processor alive
      processor.connect(audioCtx.destination);
    } catch (err) {
      console.error('Error starting audio stream capture:', err);
    }

    return () => {
      if (processorNodeRef.current) {
        processorNodeRef.current.disconnect();
        processorNodeRef.current = null;
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    };
  }, [mediaStream, isMuted]);
}
