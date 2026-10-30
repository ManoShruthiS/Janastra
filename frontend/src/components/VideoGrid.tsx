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
      className={`relative w-full h-full min-h-[220px] rounded-2xl overflow-hidden bg-slate-900 border transition-all duration-200 flex items-center justify-center shadow-lg ${
        isSpeaking
          ? 'border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-400/50'
          : 'border-slate-800'
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
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-600/30 border-2 border-blue-500/50 flex items-center justify-center text-xl sm:text-2xl font-bold text-blue-300 uppercase shadow-inner">
            {displayName.charAt(0) || 'U'}
          </div>
          <span className="text-slate-400 text-xs flex items-center space-x-1">
            <VideoOff className="w-3.5 h-3.5" />
            <span>Camera Off</span>
          </span>
        </div>
      )}

      {/* Participant Badge & Status */}
      <div className="absolute bottom-3 left-3 flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-md">
        <span className="text-xs font-semibold text-slate-100 flex items-center space-x-1.5">
          <span>{displayName}</span>
          {isMe && <span className="text-[10px] text-blue-400 font-normal">(You)</span>}
          {isHost && (
            <span title="Meeting Host">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
            </span>
          )}
        </span>

        {/* Microphone indicator */}
        <span className="pl-1">
          {isMuted ? (
            <MicOff className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
          )}
        </span>
      </div>

