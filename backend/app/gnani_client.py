import asyncio
import json
import logging
import io
import wave
from typing import Optional, AsyncGenerator, Callable, Dict, Any
import httpx
import websockets

from app.config import settings

logger = logging.getLogger("janastra.gnani")

class GnaniPrismaClient:
    """
    Client for Gnani AI Prisma v3.0 Speech-to-Text.
    Supports:
    1. Real-time bi-directional streaming via WebSocket (wss://api.vachana.ai/stt/v3/stream)
    2. Segmented chunk recognition via REST endpoint (https://api.vachana.ai/stt/v3)
    """

    def __init__(self):
        self.api_key = settings.GNANI_API_KEY
        self.ws_url = settings.GNANI_WS_URL
        self.base_url = settings.GNANI_BASE_URL
        self.model = settings.GNANI_MODEL or "prisma-v3.0"
        self.language_code = settings.GNANI_LANGUAGE_CODE or "indic-auto"

    def has_api_key(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def transcribe_wav_bytes(
        self,
        wav_bytes: bytes,
        language_code: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Transcribes a WAV/PCM audio chunk via Gnani Prisma v3.0 REST API.
        Endpoint: POST https://api.vachana.ai/stt/v3
        Headers: X-API-Key-ID
        """
        if not self.has_api_key():
            logger.warning(
                "Gnani API key not configured. Please set GNANI_API_KEY in backend/.env to connect to Prisma v3.0."
            )
            return None

        lang = language_code or self.language_code
        url = f"{self.base_url.rstrip('/')}/stt/v3"
        headers = {
            "X-API-Key-ID": self.api_key
        }

        data = {
            "model": self.model,
            "language_code": lang,
            "format": "transcribe"
        }
        files = {
            "audio_file": ("speech.wav", wav_bytes, "audio/wav")
