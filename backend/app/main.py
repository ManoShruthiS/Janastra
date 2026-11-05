import logging
import uuid
import time
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings, SUPPORTED_LANGUAGES
from app.meeting_manager import meeting_manager
from app.audio_processor import audio_processor_manager
from app.gnani_client import gnani_client
from app.models import (
    CreateMeetingRequest,
    CreateMeetingResponse,
    MeetingInfoResponse,
    ChatMessage
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("janastra.main")

app = FastAPI(
    title="JANASTRA API",
    description="Multilingual meeting platform with Gnani AI Prisma v3.0 Speech Recognition & Real-Time Captions",
    version="1.0.0"
)

# Enable CORS for frontend clients
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "app": "JANASTRA",
        "description": "Multilingual online meeting platform with Gnani AI Prisma v3.0 captions",
        "status": "online"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "gnani_configured": gnani_client.has_api_key(),
        "gnani_model": settings.GNANI_MODEL,
        "translation_engine": settings.TRANSLATION_ENGINE,
        "supported_languages_count": len(SUPPORTED_LANGUAGES)
    }

@app.get("/api/languages")
def get_languages():
    return SUPPORTED_LANGUAGES

@app.post("/api/meetings/create", response_model=CreateMeetingResponse)
def create_meeting(request: CreateMeetingRequest):
    code, host_id = meeting_manager.create_meeting(request.host_display_name)
    return CreateMeetingResponse(meeting_code=code, host_id=host_id)

@app.get("/api/meetings/{meeting_code}", response_model=MeetingInfoResponse)
def get_meeting_info(meeting_code: str):
    session = meeting_manager.get_meeting(meeting_code)
    if not session:
        # If code matches pattern, allow it so participants can connect directly
        clean_code = meeting_code.upper().strip()
        return MeetingInfoResponse(
            meeting_code=clean_code,
            active_participants_count=0,
            created_at=time.time()
        )
    return MeetingInfoResponse(
        meeting_code=session.code,
        active_participants_count=len(session.participants),
        created_at=session.created_at
    )

# -------------------------------------------------------------
# WebSocket: Meeting Room Control, Signaling & Captions
# -------------------------------------------------------------
@app.websocket("/ws/meeting/{meeting_code}/{participant_id}")
async def meeting_websocket_endpoint(
    websocket: WebSocket,
    meeting_code: str,
    participant_id: str,
    display_name: str = Query("Participant")
):
    await websocket.accept()
    meeting_code_clean = meeting_code.upper().strip()
    session = await meeting_manager.register_meeting_socket(
        meeting_code_clean,
        participant_id,
        display_name,
        websocket
    )

    try:
        # Send initial sync payload to joining participant
        participant_list = [p.model_dump() for p in session.participants.values()]
        transcript_history = [c.model_dump() for c in session.transcript_history]
        chat_history = [m.model_dump() for m in session.chat_messages]

        await websocket.send_json({
            "type": "init_sync",
            "participant_id": participant_id,
            "meeting_code": meeting_code_clean,
            "participants": participant_list,
            "transcript_history": transcript_history,
            "chat_history": chat_history,
            "is_host": session.participants[participant_id].is_host
        })

        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "signal":
                # WebRTC Signaling (offer / answer / ice-candidate)
                # target_id is the recipient peer
                target_id = data.get("target_id")
                if target_id:
                    await meeting_manager.send_to_participant(
                        meeting_code_clean,
                        target_id,
                        {
                            "type": "signal",
                            "sender_id": participant_id,
                            "signal_data": data.get("signal_data")
                        }
                    )

            elif msg_type == "caption_pref":
                # Participant updates their independent caption language, spoken language or toggle
                p = session.participants.get(participant_id)
                if p:
                    if "caption_language" in data:
                        p.caption_language = data["caption_language"]
                    if "spoken_language" in data:
                        p.spoken_language = data["spoken_language"]
                        stream = audio_processor_manager.get_stream(meeting_code_clean, participant_id)
                        if stream:
                            stream.spoken_language = data["spoken_language"]
                    if "caption_enabled" in data:
                        p.caption_enabled = bool(data["caption_enabled"])
                    # Acknowledge to sender
                    await websocket.send_json({
                        "type": "caption_pref_ack",
                        "caption_language": p.caption_language,
                        "spoken_language": p.spoken_language,
                        "caption_enabled": p.caption_enabled
                    })

            elif msg_type == "chat":
                # Text chat message
                content = data.get("content", "").strip()
                if content:
                    chat_msg = ChatMessage(
                        id=str(uuid.uuid4()),
                        sender_id=participant_id,
                        sender_name=display_name,
                        content=content,
                        timestamp=time.time()
                    )
                    session.chat_messages.append(chat_msg)
                    if len(session.chat_messages) > 300:
                        session.chat_messages.pop(0)

                    await meeting_manager.broadcast_to_room(
                        meeting_code_clean,
                        {
                            "type": "chat",
                            "message": chat_msg.model_dump()
                        }
                    )

            elif msg_type == "media_state":
                # Micro/Cam/Screen toggle notifications
                p = session.participants.get(participant_id)
                if p:
                    if "is_muted" in data:
                        p.is_muted = data["is_muted"]
                    if "is_video_off" in data:
                        p.is_video_off = data["is_video_off"]
                    if "is_screen_sharing" in data:
                        p.is_screen_sharing = data["is_screen_sharing"]

                    await meeting_manager.broadcast_to_room(
                        meeting_code_clean,
                        {
                            "type": "participant_state_updated",
                            "participant": p.model_dump()
                        },
                        exclude_id=participant_id
                    )

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for {participant_id} in {meeting_code_clean}")
    except Exception as e:
        logger.error(f"Error in meeting websocket for {participant_id}: {e}")
    finally:
        await meeting_manager.unregister_meeting_socket(meeting_code_clean, participant_id)
        await audio_processor_manager.remove_stream(meeting_code_clean, participant_id)

# -------------------------------------------------------------
# WebSocket: Real-time Audio Stream from Participant to Server
# -------------------------------------------------------------
@app.websocket("/ws/audio/{meeting_code}/{participant_id}")
async def audio_websocket_endpoint(
    websocket: WebSocket,
    meeting_code: str,
    participant_id: str,
    display_name: str = Query("Participant"),
    spoken_lang: str = Query("auto")
):
    await websocket.accept()
    meeting_code_clean = meeting_code.upper().strip()
    stream = audio_processor_manager.get_or_create_stream(
        meeting_code_clean,
        participant_id,
        display_name,
        spoken_language=spoken_lang
    )

    try:
        while True:
            # Client sends binary raw 16-bit 16kHz PCM chunks
            message = await websocket.receive()
            if "bytes" in message and message["bytes"]:
                await stream.feed_pcm_chunk(message["bytes"])
            elif "text" in message:
                # Text command (e.g. flush / mute)
                if message["text"] == "flush":
                    await stream.flush()
    except WebSocketDisconnect:
        logger.debug(f"Audio socket disconnected for {participant_id}")
    except Exception as e:
        logger.error(f"Error in audio websocket for {participant_id}: {e}")
    finally:
        await stream.flush()
