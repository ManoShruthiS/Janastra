export interface Participant {
  id: string;
  display_name: string;
  caption_language: string;
  caption_enabled: boolean;
  is_muted: boolean;
  is_video_off: boolean;
  is_screen_sharing: boolean;
  is_host: boolean;
  joined_at: number;
}

export interface CaptionItem {
  id: string;
  speaker_id: string;
  speaker_name: string;
  original_text: string;
  source_language: string;
  translations: Record<string, string>;
  timestamp: number;
  is_final: boolean;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  timestamp: number;
}

export interface SupportedLanguage {
