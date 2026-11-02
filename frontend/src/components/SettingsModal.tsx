import React, { useState, useEffect } from 'react';
import { X, Settings, Subtitles, Mic, Video, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import { SupportedLanguage } from '../types/meeting';
import { getApiBaseUrl } from '../config';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  captionsEnabled: boolean;
  selectedLanguage: string;
  supportedLanguages: SupportedLanguage[];
  onToggleCaptions: () => void;
  onChangeLanguage: (lang: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  captionsEnabled,
  selectedLanguage,
  supportedLanguages,
  onToggleCaptions,
  onChangeLanguage
}) => {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [healthStatus, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Enumerate media devices
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          const audio = devices.filter((d) => d.kind === 'audioinput');
          const video = devices.filter((d) => d.kind === 'videoinput');
          setAudioDevices(audio);
          setVideoDevices(video);
          if (audio.length > 0 && !selectedAudioDevice) setSelectedAudioDevice(audio[0].deviceId);
          if (video.length > 0 && !selectedVideoDevice) setSelectedVideoDevice(video[0].deviceId);
        })
        .catch(console.error);
    }

    // Check backend health
    fetch(`${getApiBaseUrl()}/api/health`)
      .then((res) => res.json())
      .then((data) => setHealthStatus(data))
      .catch((err) => console.warn('Backend health check error:', err));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold text-slate-100 text-base">Meeting Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Captions Settings Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-semibold text-blue-400 uppercase tracking-wide">
              <Subtitles className="w-4 h-4" />
              <span>Multilingual Caption Preferences</span>
            </div>

            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-200">Enable Captions</div>
                  <div className="text-xs text-slate-400">
                    Display real-time continuous captions on your screen
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleCaptions}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    captionsEnabled ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      captionsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  My Preferred Caption Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => onChangeLanguage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} ({lang.native})
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-slate-500 italic">
                  Note: Captions are isolated per participant. Your selected language applies only to your screen.
                </p>
              </div>
            </div>
          </div>

          {/* Audio & Video Devices Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-semibold text-blue-400 uppercase tracking-wide">
              <Mic className="w-4 h-4" />
              <span>Devices</span>
            </div>

            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center space-x-1.5">
                  <Mic className="w-3.5 h-3.5 text-slate-400" />
                  <span>Microphone</span>
                </label>
                <select
                  value={selectedAudioDevice}
                  onChange={(e) => setSelectedAudioDevice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  {audioDevices.length > 0 ? (
                    audioDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                      </option>
                    ))
                  ) : (
                    <option value="">Default Microphone</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center space-x-1.5">
                  <Video className="w-3.5 h-3.5 text-slate-400" />
                  <span>Camera</span>
                </label>
                <select
                  value={selectedVideoDevice}
                  onChange={(e) => setSelectedVideoDevice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  {videoDevices.length > 0 ? (
                    videoDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                      </option>
                    ))
                  ) : (
                    <option value="">Default Camera</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Engine Status Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm font-semibold text-blue-400 uppercase tracking-wide">
              <Server className="w-4 h-4" />
              <span>AI Speech & Translation Engine</span>
            </div>

            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Speech Recognition:</span>
                <span className="font-semibold text-slate-200">Gnani Prisma v3.0 (STT)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Gnani API Connection:</span>
                <span className="flex items-center space-x-1 font-semibold">
                  {healthStatus?.gnani_configured ? (
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Configured</span>
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center space-x-1" title="Set GNANI_API_KEY in backend/.env">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Pending API Key</span>
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Translation Service:</span>
                <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Multilingual Engine Active</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
