import { useEffect, useRef, useState, useCallback } from 'react';
import { Participant } from '../types/meeting';

interface UseWebRTCProps {
  myParticipantId: string;
  participants: Participant[];
  sendSignal: (targetId: string, signalData: any) => void;
  sendMediaState: (state: { is_muted?: boolean; is_video_off?: boolean; is_screen_sharing?: boolean }) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useWebRTC({
  myParticipantId,
  participants,
  sendSignal,
  sendMediaState
}: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const webcamVideoTrackRef = useRef<MediaStreamTrack | null>(null);

  // Initialize local webcam & microphone
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true }
        });

        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          webcamVideoTrackRef.current = videoTrack;
        }
      } catch (err) {
        console.warn('Could not acquire camera/microphone with ideal constraints, trying audio only or fallback:', err);
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (active) {
            localStreamRef.current = fallbackStream;
            setLocalStream(fallbackStream);
            setIsVideoOff(true);
          }
        } catch (audioErr) {
          console.error('Microphone access also failed:', audioErr);
        }
      }
    }

    initMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
    };
  }, []);

  const getOrCreatePeerConnection = useCallback((remoteId: string) => {
    let pc = peerConnectionsRef.current.get(remoteId);
    if (pc) return pc;

    pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(remoteId, pc);

    // Add local tracks to this connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc!.addTrack(track, localStreamRef.current!);
      });
    }

    // ICE Candidate event
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(remoteId, { candidate: event.candidate });
      }
    };

    // Remote track arrived
    pc.ontrack = (event) => {
      const remoteMediaStream = event.streams[0] || new MediaStream([event.track]);
      setRemoteStreams(prev => {
        const next = new Map(prev);
        next.set(remoteId, remoteMediaStream);
        return next;
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc!.connectionState === 'disconnected' || pc!.connectionState === 'failed' || pc!.connectionState === 'closed') {
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.delete(remoteId);
          return next;
        });
      }
    };

    return pc;
  }, [sendSignal]);

  // Handle incoming signals from peers
  const handleSignal = useCallback(async (senderId: string, signalData: any) => {
    const pc = getOrCreatePeerConnection(senderId);

    try {
      if (signalData.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal(senderId, { type: 'answer', sdp: answer });
      } else if (signalData.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
