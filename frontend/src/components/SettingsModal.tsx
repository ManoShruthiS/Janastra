import React, { useState, useEffect } from 'react';
import { X, Subtitles, Mic, Video, Settings } from 'lucide-react';
import { SupportedLanguage } from '../types/meeting';

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
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');

  const fallbackLanguages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  ];

  const langs =
    Array.isArray(supportedLanguages) && supportedLanguages.length > 0
      ? supportedLanguages
      : fallbackLanguages;

  useEffect(() => {
    if (!isOpen) return;

    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const audio = devices.filter((d) => d.kind === 'audioinput');
        const video = devices.filter((d) => d.kind === 'videoinput');
        setAudioDevices(audio);
        setVideoDevices(video);
        if (audio.length > 0 && !selectedAudioDevice) {
          setSelectedAudioDevice(audio[0].deviceId);
        }
        if (video.length > 0 && !selectedVideoDevice) {
          setSelectedVideoDevice(video[0].deviceId);
        }
      }).catch((err) => console.warn('Enumerate devices error:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-obsidian-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-black">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-silver-200" />
            <h2 className="font-bold text-white text-base tracking-wide">Meeting Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-silver-matte hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Captions Settings Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-silver-200 uppercase tracking-widest">
              <Subtitles className="w-4 h-4 text-silver-300" />
              <span>Multilingual Caption Preferences</span>
            </div>

            <div className="bg-obsidian-900 p-4 rounded-xl border border-neutral-800/90 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-silver-100">Enable Captions</div>
                <button
                  type="button"
                  onClick={onToggleCaptions}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors border ${
                    captionsEnabled ? 'bg-obsidian-800 border-neutral-600' : 'bg-neutral-900 border-neutral-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      captionsEnabled ? 'translate-x-5 bg-white' : 'translate-x-0 bg-neutral-600'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-silver-matte mb-1.5">
                  My Preferred Caption Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => onChangeLanguage(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-lg p-2.5 text-xs sm:text-sm text-silver-100 focus:outline-none focus:border-neutral-600 transition cursor-pointer"
                >
                  {langs.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-black text-silver-100">
                      {lang.name} ({lang.native})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Audio & Video Devices Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-silver-200 uppercase tracking-widest">
              <Mic className="w-4 h-4 text-silver-300" />
              <span>Connected Devices</span>
            </div>

            <div className="bg-obsidian-900 p-4 rounded-xl border border-neutral-800/90 space-y-3">
              <div>
                <label className="block text-xs font-medium text-silver-matte mb-1.5 flex items-center space-x-1.5">
                  <Mic className="w-3.5 h-3.5 text-silver-300" />
                  <span>Microphone</span>
                </label>
                <select
                  value={selectedAudioDevice}
                  onChange={(e) => setSelectedAudioDevice(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-lg p-2.5 text-xs text-silver-100 focus:outline-none focus:border-neutral-600 transition cursor-pointer"
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
                <label className="block text-xs font-medium text-silver-matte mb-1.5 flex items-center space-x-1.5">
                  <Video className="w-3.5 h-3.5 text-silver-300" />
                  <span>Camera</span>
                </label>
                <select
                  value={selectedVideoDevice}
                  onChange={(e) => setSelectedVideoDevice(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-lg p-2.5 text-xs text-silver-100 focus:outline-none focus:border-neutral-600 transition cursor-pointer"
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
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-black flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-obsidian-850 hover:bg-neutral-850 text-white text-xs font-semibold border border-neutral-700 transition active:scale-95 uppercase tracking-wider"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};