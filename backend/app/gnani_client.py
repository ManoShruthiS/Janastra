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
