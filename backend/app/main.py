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

