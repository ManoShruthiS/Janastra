from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
import time

class Participant(BaseModel):
    id: str
    display_name: str
    caption_language: str = "en"
    caption_enabled: bool = True
    is_muted: bool = False
    is_video_off: bool = False
    is_screen_sharing: bool = False
    is_host: bool = False
    joined_at: float = Field(default_factory=time.time)

class CaptionItem(BaseModel):
    id: str
    speaker_id: str
    speaker_name: str
    original_text: str
    source_language: str = "auto"
    # Mapping of language_code (e.g., 'en', 'ta', 'kn', 'hi') to translated text
