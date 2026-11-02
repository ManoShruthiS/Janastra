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
      className={`relative w-full h-full min-h-[220px] rounded-3xl overflow-hidden bg-black transition-all duration-300 flex items-center justify-center shadow-2xl ${
        isSpeaking
          ? 'border border-gold-champagne shadow-gold-glow ring-1 ring-gold-champagne/50'
          : 'border border-neutral-900 hover:border-neutral-800'
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
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-obsidian-900 border border-gold-champagne/40 flex items-center justify-center text-xl sm:text-2xl font-bold text-gold-300 uppercase shadow-gold-glow">
            {displayName.charAt(0) || 'U'}
          </div>
          <span className="text-silver-matte text-xs flex items-center space-x-1.5 font-mono">
            <VideoOff className="w-3.5 h-3.5 text-silver-matte" />
            <span>Camera Off</span>
          </span>
        </div>
      )}

      {/* Participant Badge & Status */}
      <div className="absolute bottom-3 left-3 flex items-center space-x-2 bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800/90 shadow-md">
        <span className="text-xs font-semibold text-silver-200 flex items-center space-x-1.5">
          <span className="text-gold-200 tracking-wide">{displayName}</span>
          {isMe && <span className="text-[10px] text-silver-matte font-normal">(You)</span>}
          {isHost && (
            <span title="Meeting Host">
              <Crown className="w-3.5 h-3.5 text-gold-400" />
            </span>
          )}
        </span>

        {/* Microphone indicator */}
        <span className="pl-1">
          {isMuted ? (
            <MicOff className="w-3.5 h-3.5 text-silver-matte" />
          ) : (
            <Mic className="w-3.5 h-3.5 text-gold-400" />
          )}
        </span>
      </div>

      {/* Active speaker tag */}
      {isSpeaking && (
        <div className="absolute top-3 right-3 flex items-center space-x-1.5 bg-obsidian-900 border border-gold-champagne text-gold-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-gold-glow uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-ping" />
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
    if (totalCount === 1) return 'grid-cols-1 max-w-4xl max-h-[80vh]';
    if (totalCount === 2) return 'grid-cols-1 md:grid-cols-2 max-w-6xl';
    if (totalCount <= 4) return 'grid-cols-1 sm:grid-cols-2 max-w-6xl';
    if (totalCount <= 6) return 'grid-cols-2 sm:grid-cols-3 max-w-7xl';
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-w-7xl';
  };

  return (
    <div className="flex-1 w-full h-full p-4 flex items-center justify-center overflow-hidden bg-black">
      <div className={`grid gap-4 w-full h-full items-center justify-center ${getGridClass()}`}>
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
