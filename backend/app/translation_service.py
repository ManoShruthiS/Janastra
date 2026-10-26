import asyncio
import logging
import time
from typing import Dict, Set, Optional
from app.config import settings

logger = logging.getLogger("janastra.translation")

# Mapping of short language codes to MyMemory language codes
MYMEMORY_MAP = {
    "en": "en-US",
    "hi": "hi-IN",
    "ta": "ta-IN",
    "kn": "kn-IN",
    "te": "te-IN",
    "bn": "bn-IN",
    "mr": "mr-IN",
    "gu": "gu-IN",
    "ml": "ml-IN",
    "pa": "pa-IN",
}

class TranslationService:
    def __init__(self):
        # In-memory translation cache: (text, src_lang, tgt_lang) -> translated_text
        self._cache: Dict[str, str] = {}
        self._max_cache_size = 5000
        self._lock = asyncio.Lock()
