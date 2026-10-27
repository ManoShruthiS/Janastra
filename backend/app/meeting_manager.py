import random
import string
import time
import logging
from typing import Dict, List, Set, Optional, Any
from fastapi import WebSocket

from app.models import Participant, CaptionItem, ChatMessage

logger = logging.getLogger("janastra.meeting")

def generate_meeting_code() -> str:
    """Generates a memorable and clean meeting code like JAN-842-195."""
    p1 = ''.join(random.choices(string.digits, k=3))
    p2 = ''.join(random.choices(string.digits, k=3))
    return f"JAN-{p1}-{p2}"

class MeetingSession:
    def __init__(self, code: str, host_id: str):
        self.code = code
        self.host_id = host_id
        self.created_at = time.time()
        self.participants: Dict[str, Participant] = {}
        self.meeting_sockets: Dict[str, WebSocket] = {}
        self.chat_messages: List[ChatMessage] = []
        self.transcript_history: List[CaptionItem] = []

    def get_active_caption_languages(self) -> Set[str]:
        """Returns the set of all unique caption languages chosen by active participants."""
        langs = set()
        for p in self.participants.values():
            if p.caption_enabled and p.caption_language:
                langs.add(p.caption_language.split("-")[0].lower())
        # Always include 'en' as standard fallback
        langs.add("en")
        return langs

    def add_caption(self, caption: CaptionItem):
        self.transcript_history.append(caption)
        # Keep transcript within memory limits (e.g. 500 lines per session)
        if len(self.transcript_history) > 500:
            self.transcript_history.pop(0)
