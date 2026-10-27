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

class MeetingManager:
    def __init__(self):
        # In-memory storage for active meetings (temporary session only)
        self.meetings: Dict[str, MeetingSession] = {}

    def create_meeting(self, host_display_name: str) -> tuple[str, str]:
        code = generate_meeting_code()
        while code in self.meetings:
            code = generate_meeting_code()

        host_id = f"user_{int(time.time()*1000)}_{random.randint(100, 999)}"
        session = MeetingSession(code, host_id)
        
        # Add host as first participant
        host_participant = Participant(
            id=host_id,
            display_name=host_display_name or "Host",
            is_host=True
        )
        session.participants[host_id] = host_participant
        self.meetings[code] = session
        logger.info(f"Created meeting {code} with host {host_id} ({host_display_name})")
        return code, host_id

    def get_meeting(self, code: str) -> Optional[MeetingSession]:
        return self.meetings.get(code.upper().strip())

    async def register_meeting_socket(
        self,
        meeting_code: str,
        participant_id: str,
        display_name: str,
        websocket: WebSocket
    ) -> Optional[MeetingSession]:
        session = self.get_meeting(meeting_code)
        if not session:
            # If meeting code doesn't exist yet, auto-create to allow direct joins
            session = MeetingSession(meeting_code.upper().strip(), participant_id)
            self.meetings[meeting_code.upper().strip()] = session

        # Register or update participant
        if participant_id not in session.participants:
            is_first = len(session.participants) == 0
            session.participants[participant_id] = Participant(
                id=participant_id,
                display_name=display_name or "Guest",
                is_host=is_first
            )
        else:
            session.participants[participant_id].display_name = display_name or session.participants[participant_id].display_name

        session.meeting_sockets[participant_id] = websocket
        logger.info(f"Participant {participant_id} ({display_name}) joined meeting {meeting_code}")

        # Broadcast participant-joined to other peers
        await self.broadcast_to_room(
            meeting_code,
            {
                "type": "participant_joined",
                "participant": session.participants[participant_id].model_dump(),
                "all_participants": [p.model_dump() for p in session.participants.values()]
            },
            exclude_id=participant_id
        )

        return session

    async def unregister_meeting_socket(self, meeting_code: str, participant_id: str):
        session = self.get_meeting(meeting_code)
        if not session:
            return

        session.meeting_sockets.pop(participant_id, None)
        removed_participant = session.participants.pop(participant_id, None)
        name = removed_participant.display_name if removed_participant else participant_id

        logger.info(f"Participant {participant_id} ({name}) left meeting {meeting_code}")

        if len(session.participants) == 0:
            # Clean up empty meeting session
            self.meetings.pop(meeting_code, None)
            logger.info(f"Meeting {meeting_code} empty. Session ended and cleaned up.")
        else:
            # If the leaving participant was host, pass host to next oldest participant
