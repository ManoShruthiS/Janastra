import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, VideoOff, Crown } from 'lucide-react';
import { Participant } from '../types/meeting';

interface VideoTileProps {
  stream?: MediaStream | null;
  displayName: string;
  isMe?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isHost?: boolean;
  isSpeaking?: boolean;
  isScreenSharing?: boolean;
}

const VideoTile: React.FC<VideoTileProps> = ({
  stream,
  displayName,
  isMe,
  isMuted,
  isVideoOff,
  isHost,
  isSpeaking,
  isScreenSharing
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={`relative w-full h-full min-h-[160px] sm:min-h-[190px] max-h-[48vh] rounded-2xl overflow-hidden bg-obsidian-950 transition-all duration-300 flex items-center justify-center shadow-xl ${
        isSpeaking
          ? 'border border-silver-300 ring-1 ring-silver-400/40'
          : 'hairline-border-subtle hover:border-white/15'
      }`}
    >
      {/* Video Element */}
      {stream && !isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMe} // Always mute local video playback to prevent feedback
          className={`w-full h-full ${
            isScreenSharing ? 'object-contain bg-black' : 'object-cover'
          } ${isMe && !isScreenSharing ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2.5">
          {/* Avatar with Concentric Voice Pulse when Speaking */}
          <div className="relative flex items-center justify-center">
            {isSpeaking && (
              <div className="absolute -inset-1 rounded-full animate-voice-pulse pointer-events-none" />
            )}
            <div
              className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-obsidian-900 flex items-center justify-center text-lg sm:text-xl font-bold text-white uppercase shadow-sm transition-all duration-200 ${
                isSpeaking ? 'border-2 border-white' : 'border border-neutral-700'
              }`}
            >
              {displayName.charAt(0) || 'U'}
            </div>
          </div>
          <span className="text-silver-matte text-[11px] sm:text-xs flex items-center space-x-1.5 font-mono">
            <VideoOff className="w-3 h-3 text-silver-matte" />
            <span>Camera Off</span>
          </span>
        </div>
      )}

      {/* Participant Badge: Minimal Frosted Glass Pill */}
      <div className="absolute bottom-3 left-3 flex items-center space-x-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shadow-sm">
        <span className="text-xs font-semibold text-silver-200 flex items-center space-x-1.5">
          <span className="text-white tracking-wide">{displayName}</span>
          {isMe && <span className="text-[10px] text-silver-matte font-normal">(You)</span>}
          {isHost && (
            <span title="Meeting Host">
              <Crown className="w-3.5 h-3.5 text-silver-300" />
            </span>
          )}
        </span>

        {/* Microphone indicator */}
        <span className="pl-1">
          {isMuted ? (
            <MicOff className="w-3.5 h-3.5 text-silver-matte" />
          ) : (
            <Mic className="w-3.5 h-3.5 text-white" />
          )}
        </span>
      </div>

      {/* Speaking Indicator: Minimalist Silver Dot Tag */}
      {isSpeaking && (
        <div className="absolute top-3 right-3 flex items-center space-x-1.5 bg-black/75 backdrop-blur-md border border-white/15 text-silver-100 text-[10px] font-mono px-2 py-0.5 rounded-full shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>Speaking</span>
        </div>
      )}
    </div>
  );
};

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  myDisplayName: string;
  isHost: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  activeSpeakerId: string | null;
  myParticipantId: string;
  participants: Participant[];
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  localStream,
  remoteStreams,
  myDisplayName,
  isHost,
  isMuted,
  isVideoOff,
  isScreenSharing,
  activeSpeakerId,
  myParticipantId,
  participants
}) => {
  const otherParticipants = participants.filter((p) => p.id !== myParticipantId);
  const totalCount = otherParticipants.length + 1;

  const getGridClass = () => {
    if (totalCount === 1) return 'grid-cols-1 max-w-2xl max-h-[50vh]';
    if (totalCount === 2) return 'grid-cols-1 sm:grid-cols-2 max-w-4xl max-h-[52vh]';
    if (totalCount <= 4) return 'grid-cols-1 sm:grid-cols-2 max-w-5xl max-h-[54vh]';
    if (totalCount <= 6) return 'grid-cols-2 sm:grid-cols-3 max-w-6xl max-h-[54vh]';
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-w-6xl max-h-[55vh]';
  };

  return (
    <div className="w-full flex-1 p-3 sm:p-4 flex items-center justify-center overflow-hidden bg-black">
      <div className={`grid gap-3 sm:gap-4 w-full items-center justify-center ${getGridClass()}`}>
        {/* Local Participant Tile */}
        <VideoTile
          stream={localStream}
          displayName={myDisplayName}
          isMe={true}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isHost={isHost}
          isSpeaking={activeSpeakerId === myParticipantId}
          isScreenSharing={isScreenSharing}
        />

        {/* Remote Participants Tiles */}
        {otherParticipants.map((p) => {
          const stream = remoteStreams.get(p.id) || null;

          return (
            <VideoTile
              key={p.id}
              stream={stream}
              displayName={p.display_name}
              isMe={false}
              isMuted={p.is_muted}
              isVideoOff={p.is_video_off}
              isHost={p.is_host}
              isSpeaking={activeSpeakerId === p.id}
              isScreenSharing={p.is_screen_sharing}
            />
          );
        })}
      </div>
    </div>
  );
};