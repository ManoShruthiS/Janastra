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
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=headers, data=data, files=files)
                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"Gnani REST response: {result}")
                    return result
                else:
                    logger.error(f"Gnani API returned {response.status_code}: {response.text}")
                    return None
        except Exception as e:
            logger.error(f"Error calling Gnani Prisma REST API: {e}")
            return None

    async def open_stream_session(
        self,
        language_code: Optional[str] = None,
        on_transcript: Optional[Callable[[str, bool, Optional[str]], Any]] = None
    ):
        """
        Connects to Gnani Prisma v3.0 WebSocket streaming endpoint (wss://api.vachana.ai/stt/v3/stream)
        """
        if not self.has_api_key():
            logger.warning("Cannot start Gnani WebSocket stream: GNANI_API_KEY is not configured.")
            return None

        lang = language_code or self.language_code
        # WebSocket upgrade headers
        headers = {
            "X-API-Key-ID": self.api_key,
            "language_code": lang,
            "model": self.model,
            "format": "transcribe"
        }

        try:
            ws = await websockets.connect(
                self.ws_url,
                extra_headers=headers,
                ping_interval=20,
                ping_timeout=20
            )
            logger.info("Connected to Gnani Prisma v3.0 WebSocket stream successfully.")
            return ws
        except Exception as e:
            logger.error(f"Failed to connect to Gnani WebSocket stream: {e}")
            return None

def pcm_to_wav(pcm_data: bytes, sample_rate: int = 16000, channels: int = 1, sample_width: int = 2) -> bytes:
    """Converts raw 16-bit PCM bytes to a valid WAV file in memory."""
    with io.BytesIO() as wav_io:
        with wave.open(wav_io, 'wb') as wav_file:
            wav_file.setnchannels(channels)
            wav_file.setsampwidth(sample_width)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(pcm_data)
        return wav_io.getvalue()

gnani_client = GnaniPrismaClient()
