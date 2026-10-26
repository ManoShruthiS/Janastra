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

        return cleaned

    def _execute_translation(self, text: str, src: str, tgt: str) -> str:
        """Attempts translation with Google, falling back to MyMemory or configured provider."""
        # 1. Try Google Translator via deep_translator
        try:
            from deep_translator import GoogleTranslator
            source = "auto" if src == "auto" else src
            translator = GoogleTranslator(source=source, target=tgt)
            res = translator.translate(text)
            if res and res.strip():
                return res
        except Exception as e:
            logger.debug(f"GoogleTranslator attempt failed, falling back to MyMemory: {e}")

        # 2. Fallback: MyMemory Translator
        try:
            from deep_translator import MyMemoryTranslator
            mm_src = MYMEMORY_MAP.get(src, "en-US") if src != "auto" else "en-US"
            mm_tgt = MYMEMORY_MAP.get(tgt, f"{tgt}-IN")
            mm_translator = MyMemoryTranslator(source=mm_src, target=mm_tgt)
            res = mm_translator.translate(text)
            if res and res.strip():
                return res
        except Exception as e2:
            logger.error(f"MyMemoryTranslator also failed: {e2}")

        return text

    async def translate_for_room(
        self,
        text: str,
        detected_source_lang: str,
        target_languages: Set[str]
    ) -> Dict[str, str]:
        """Translates text for all unique target languages in the meeting room."""
        if not text.strip():
            return {}

        results: Dict[str, str] = {}
        target_list = list(target_languages)

        # Sequential translation across distinct target languages to avoid bursting free endpoints
        for lang in target_list:
            clean_code = lang.split("-")[0].lower()
            try:
                translated = await self.translate_single(text, detected_source_lang, clean_code)
                results[clean_code] = translated
            except Exception as e:
                logger.error(f"Error translating for {lang}: {e}")
                results[clean_code] = text

        return results

translation_service = TranslationService()
