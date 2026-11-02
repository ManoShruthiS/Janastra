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

    fetch(`${getApiBaseUrl()}/api/health`)
      .then((res) => res.json())
      .then((data) => setHealthStatus(data))
      .catch((err) => console.warn('Backend health check error:', err));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-black border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gold-400" />
            <h2 className="font-semibold text-gold-300 text-base tracking-wide">Meeting Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-silver-matte hover:text-gold-300 hover:bg-neutral-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Captions Settings Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-gold-300 uppercase tracking-widest">
              <Subtitles className="w-4 h-4 text-gold-400" />
              <span>Multilingual Caption Preferences</span>
            </div>

            <div className="bg-obsidian-900 p-4 rounded-2xl border border-neutral-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-silver-200">Enable Captions</div>
                  <div className="text-xs text-silver-matte">
                    Display real-time continuous captions on your screen
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleCaptions}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors border ${
                    captionsEnabled ? 'bg-black border-gold-champagne shadow-gold-glow' : 'bg-neutral-900 border-neutral-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      captionsEnabled ? 'translate-x-5 bg-gold-champagne' : 'translate-x-0 bg-silver-matte'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-silver-300 mb-1.5">
                  My Preferred Caption Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => onChangeLanguage(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl p-2.5 text-xs sm:text-sm text-gold-300 focus:outline-none focus:border-gold-champagne/60 transition cursor-pointer"
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-black text-silver-100">
                      {lang.name} ({lang.native})
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-neutral-500 italic">
                  Note: Captions are isolated per participant. Your selected language applies only to your screen.
                </p>
              </div>
            </div>
          </div>

          {/* Audio & Video Devices Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-gold-300 uppercase tracking-widest">
              <Mic className="w-4 h-4 text-gold-400" />
              <span>Devices</span>
            </div>

            <div className="bg-obsidian-900 p-4 rounded-2xl border border-neutral-800 space-y-3">
              <div>
                <label className="block text-xs font-medium text-silver-300 mb-1.5 flex items-center space-x-1.5">
                  <Mic className="w-3.5 h-3.5 text-gold-400" />
                  <span>Microphone</span>
                </label>
                <select
                  value={selectedAudioDevice}
                  onChange={(e) => setSelectedAudioDevice(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl p-2.5 text-xs text-silver-200 focus:outline-none focus:border-gold-champagne/60 transition"
                >
                  {audioDevices.length > 0 ? (
                    audioDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId} className="bg-black text-silver-100">
                        {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                      </option>
                    ))
                  ) : (
                    <option value="" className="bg-black text-silver-100">Default Microphone</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-silver-300 mb-1.5 flex items-center space-x-1.5">
                  <Video className="w-3.5 h-3.5 text-gold-400" />
                  <span>Camera</span>
                </label>
                <select
                  value={selectedVideoDevice}
                  onChange={(e) => setSelectedVideoDevice(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl p-2.5 text-xs text-silver-200 focus:outline-none focus:border-gold-champagne/60 transition"
                >
                  {videoDevices.length > 0 ? (
                    videoDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId} className="bg-black text-silver-100">
                        {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                      </option>
                    ))
                  ) : (
                    <option value="" className="bg-black text-silver-100">Default Camera</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Engine Status Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-gold-300 uppercase tracking-widest">
              <Server className="w-4 h-4 text-gold-400" />
              <span>AI Speech & Translation Engine</span>
            </div>

            <div className="bg-obsidian-900 p-4 rounded-2xl border border-neutral-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-silver-matte">Speech Recognition:</span>
                <span className="font-semibold text-gold-300">Gnani Prisma v3.0 (STT)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-silver-matte">Gnani API Connection:</span>
                <span className="flex items-center space-x-1 font-semibold">
                  {healthStatus?.gnani_configured ? (
                    <span className="text-gold-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Configured</span>
                    </span>
                  ) : (
                    <span className="text-silver-matte flex items-center space-x-1" title="Set GNANI_API_KEY in backend/.env">
                      <AlertCircle className="w-3.5 h-3.5 text-gold-400" />
                      <span className="text-gold-300">Pending API Key</span>
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-silver-matte">Translation Service:</span>
                <span className="text-gold-400 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Multilingual Engine Active</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-obsidian-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-obsidian-850 hover:bg-neutral-900 text-gold-300 text-xs font-semibold border border-gold-champagne/40 shadow-gold-glow transition uppercase tracking-wider"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
