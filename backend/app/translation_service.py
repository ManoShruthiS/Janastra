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
        """Fast, robust translation with latency logging and multi-engine fallback."""
        start_t = time.time()
        
        # 1. Primary: Direct high-speed Google GTX endpoint (sub-200ms latency)
        try:
            import httpx
            source = "auto" if src == "auto" else src
            url = "https://translate.googleapis.com/translate_a/single"
            params = {
                "client": "gtx",
                "sl": source,
                "tl": tgt,
                "dt": "t",
                "q": text
            }
            with httpx.Client(timeout=8.0) as client:
                res = client.get(url, params=params)
                if res.status_code == 200:
                    data = res.json()
                    translated = "".join([part[0] for part in data[0] if part and part[0]])
                    if translated and translated.strip():
                        duration_ms = (time.time() - start_t) * 1000
                        logger.info(f"Translated '{text[:30]}...' ({src} -> {tgt}) in {duration_ms:.1f}ms: '{translated[:30]}...'")
                        return translated
        except Exception as e:
            logger.debug(f"Direct Google GTX failed: {e}")

        # 2. Secondary fallback: deep_translator GoogleTranslator
        try:
            from deep_translator import GoogleTranslator
            source = "auto" if src == "auto" else src
            translator = GoogleTranslator(source=source, target=tgt)
            res = translator.translate(text)
            if res and res.strip():
                duration_ms = (time.time() - start_t) * 1000
                logger.info(f"GoogleTranslator fallback ({src} -> {tgt}) in {duration_ms:.1f}ms: '{res[:30]}...'")
                return res
        except Exception as e:
            logger.debug(f"GoogleTranslator fallback failed: {e}")

        # 3. Tertiary fallback: MyMemory Translator
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
        """Translates text for all unique target languages in the meeting room concurrently."""
        if not text.strip():
            return {}

        results: Dict[str, str] = {}
        clean_src = detected_source_lang.split("-")[0].lower() if detected_source_lang != "auto" else "auto"

        # Translate in parallel for low latency across all participant languages
        tasks = []
        target_codes = []
        for lang in target_languages:
            clean_code = lang.split("-")[0].lower()
            if clean_code == clean_src:
                results[clean_code] = text
            else:
                tasks.append(self.translate_single(text, clean_src, clean_code))
                target_codes.append(clean_code)

        if tasks:
            translated_list = await asyncio.gather(*tasks, return_exceptions=True)
            for code, trans in zip(target_codes, translated_list):
                if isinstance(trans, str) and trans.strip():
                    results[code] = trans
                else:
                    results[code] = text

        results[clean_src] = text
        return results

translation_service = TranslationService()
