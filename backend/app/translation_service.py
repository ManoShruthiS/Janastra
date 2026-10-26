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

    def _cache_key(self, text: str, src: str, tgt: str) -> str:
        return f"{src}:{tgt}:{text.strip().lower()}"

    async def translate_single(self, text: str, src_lang: str, tgt_lang: str) -> str:
        cleaned = text.strip()
        if not cleaned:
            return ""

        src = src_lang.split("-")[0].lower() if src_lang != "auto" else "auto"
        tgt = tgt_lang.split("-")[0].lower()

        if src != "auto" and src == tgt:
            return cleaned

        cache_key = self._cache_key(cleaned, src, tgt)
        if cache_key in self._cache:
            return self._cache[cache_key]

        try:
            translated = await asyncio.to_thread(self._execute_translation, cleaned, src, tgt)
            if translated and translated.strip():
                if len(self._cache) > self._max_cache_size:
                    self._cache.clear()
                self._cache[cache_key] = translated
                return translated
        except Exception as e:
            logger.warning(f"Translation failed for '{cleaned}' from {src} to {tgt}: {e}")
