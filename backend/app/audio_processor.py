import asyncio
import logging
import time
import uuid
from typing import Dict, Optional
import numpy as np

from app.gnani_client import gnani_client, pcm_to_wav
from app.translation_service import translation_service
from app.meeting_manager import meeting_manager
from app.models import CaptionItem

logger = logging.getLogger("janastra.audio")

# Energy threshold for silence detection (16-bit PCM scale is -32768 to 32767)
# 480 filters out ambient laptop fan hiss, keyboard clicks, and breathing
ENERGY_THRESHOLD = 480
# Max duration of a speech segment in seconds before forcing transcription
MAX_SPEECH_DURATION_SEC = 6.5
# Silence duration in seconds to consider a speech turn finished (natural sentence completion)
SILENCE_DURATION_SEC = 1.2
# Min audio duration to send for ASR (filters out tiny noise blips)
MIN_AUDIO_DURATION_SEC = 0.75
SAMPLE_RATE = 16000
BYTES_PER_SAMPLE = 2  # 16-bit mono
BYTES_PER_SECOND = SAMPLE_RATE * BYTES_PER_SAMPLE
PRE_BUFFER_DURATION_SEC = 0.35  # ~350ms pre-roll to prevent cutting the first syllable

# Gnani Prisma v3.0 language mapping
LANG_TO_GNANI = {
    "en": "en-IN",
    "hi": "hi-IN",
    "ta": "ta-IN",
    "kn": "kn-IN",
    "te": "te-IN",
    "bn": "bn-IN",
    "mr": "mr-IN",
    "gu": "gu-IN",
    "ml": "ml-IN",
    "pa": "pa-IN",
    "auto": "indic-auto"
}

class ParticipantAudioStream:
    def __init__(self, meeting_code: str, participant_id: str, display_name: str, spoken_language: str = "auto"):
        self.meeting_code = meeting_code
        self.participant_id = participant_id
        self.display_name = display_name
        self.spoken_language = spoken_language
        self.buffer = bytearray()
        self.pre_buffer = bytearray()
        self.speech_start_time: Optional[float] = None
        self.last_speech_time: Optional[float] = None
        self.is_speaking = False
        self._lock = asyncio.Lock()
        self.max_pre_bytes = int(PRE_BUFFER_DURATION_SEC * BYTES_PER_SECOND)

    async def feed_pcm_chunk(self, chunk: bytes):
        async with self._lock:
            if not chunk:
                return

            now = time.time()
            # Analyze RMS energy
            try:
                samples = np.frombuffer(chunk, dtype=np.int16)
                if len(samples) > 0:
                    energy = float(np.sqrt(np.mean(np.square(samples.astype(np.float32)))))
                else:
                    energy = 0.0
            except Exception:
                energy = 0.0

            is_voice = energy > ENERGY_THRESHOLD

            if is_voice:
                if not self.is_speaking:
                    self.is_speaking = True
                    self.speech_start_time = now
                    # Prepend pre-roll buffer so the opening consonant/word is preserved
                    self.buffer.extend(self.pre_buffer)
                    self.pre_buffer.clear()
                    await meeting_manager.broadcast_to_room(
                        self.meeting_code,
                        {"type": "speaker_active", "speaker_id": self.participant_id, "is_speaking": True}
                    )
                self.last_speech_time = now
                self.buffer.extend(chunk)
            elif self.is_speaking:
                # Potential silence gap between words in the same sentence
                self.buffer.extend(chunk)
                silence_elapsed = now - (self.last_speech_time or now)
                duration = len(self.buffer) / BYTES_PER_SECOND

                if silence_elapsed >= SILENCE_DURATION_SEC or duration >= MAX_SPEECH_DURATION_SEC:
                    await self._process_current_segment()
            else:
                # Ambient silence when not speaking: maintain rolling pre-roll buffer
                self.pre_buffer.extend(chunk)
                if len(self.pre_buffer) > self.max_pre_bytes:
                    self.pre_buffer = self.pre_buffer[-self.max_pre_bytes:]

    async def flush(self):
        """Forces processing whatever speech is currently in buffer."""
        async with self._lock:
            if self.is_speaking and len(self.buffer) > (MIN_AUDIO_DURATION_SEC * BYTES_PER_SECOND):
                await self._process_current_segment()
            else:
                self.buffer.clear()
                self.pre_buffer.clear()
                self.is_speaking = False

    async def _process_current_segment(self):
        audio_bytes = bytes(self.buffer)
        self.buffer.clear()
        self.pre_buffer.clear()
        self.is_speaking = False
        self.speech_start_time = None
        self.last_speech_time = None

        # Reset speaking indicator
        await meeting_manager.broadcast_to_room(
            self.meeting_code,
            {"type": "speaker_active", "speaker_id": self.participant_id, "is_speaking": False}
        )

        duration = len(audio_bytes) / BYTES_PER_SECOND
        if duration < MIN_AUDIO_DURATION_SEC:
            return

        # Trigger transcription asynchronously
        asyncio.create_task(self._transcribe_and_dispatch(audio_bytes))

    async def _transcribe_and_dispatch(self, pcm_data: bytes):
        wav_data = pcm_to_wav(pcm_data, sample_rate=SAMPLE_RATE)

        # Select targeted Gnani language model
        gnani_lang = LANG_TO_GNANI.get(self.spoken_language, "indic-auto")
        asr_result = await gnani_client.transcribe_wav_bytes(wav_data, language_code=gnani_lang)

        text = ""
        source_lang = "auto"
        if asr_result:
            text = (
                asr_result.get("transcript")
                or asr_result.get("text")
                or (asr_result.get("data", {}).get("transcript") if isinstance(asr_result.get("data"), dict) else "")
                or ""
            ).strip()

            raw_lang = (
                asr_result.get("detected_language_code")
                or asr_result.get("language_code")
                or asr_result.get("language")
                or "en"
            )
            detected_short = raw_lang.split("-")[0].lower() if raw_lang != "auto" else "en"

            if self.spoken_language and self.spoken_language != "auto":
                source_lang = self.spoken_language
            else:
                source_lang = detected_short

        # Filter out empty text or single-character noise artifacts
        if not text or len(text) <= 1 or text in {".", ",", "?", "!"}:
            logger.debug(f"Ignored empty or trivial transcript for {self.display_name}")
            return

        logger.info(f"Recognized speech from {self.display_name}: '{text}' (lang: {source_lang}, gnani_lang: {gnani_lang})")

        session = meeting_manager.get_meeting(self.meeting_code)
        if not session:
            return

        # Collect target languages for translation
        target_languages = session.get_active_caption_languages()

        # Ensure the speaker's own caption language is included
        speaker_p = session.participants.get(self.participant_id)
        if speaker_p and speaker_p.caption_language:
            target_languages.add(speaker_p.caption_language.split("-")[0].lower())

        # If only source_lang is in target_languages, add a complementary language (Hindi for English, English for Indic)
        clean_src = source_lang.split("-")[0].lower()
        if len(target_languages) == 1 and clean_src in target_languages:
            alt = "hi" if clean_src == "en" else "en"
            target_languages.add(alt)

        # Perform translation into all target languages
        translations = await translation_service.translate_for_room(
            text=text,
            detected_source_lang=source_lang,
            target_languages=target_languages
        )
        # Always retain exact original text under source_lang
        translations[clean_src] = text
        logger.info(f"Translated captions for {self.display_name}: {translations}")

        caption_item = CaptionItem(
            id=str(uuid.uuid4()),
            speaker_id=self.participant_id,
            speaker_name=self.display_name,
            original_text=text,
            source_language=source_lang,
            translations=translations,
            timestamp=time.time(),
            is_final=True
        )

        session.add_caption(caption_item)

        # Broadcast caption event to all room participants
        await meeting_manager.broadcast_to_room(
            self.meeting_code,
            {
                "type": "caption",
                "caption": caption_item.model_dump()
            }
        )

class AudioProcessorManager:
    def __init__(self):
        self.streams: Dict[str, ParticipantAudioStream] = {}

    def get_or_create_stream(
        self,
        meeting_code: str,
        participant_id: str,
        display_name: str,
        spoken_language: str = "auto"
    ) -> ParticipantAudioStream:
        key = f"{meeting_code}:{participant_id}"
        if key not in self.streams:
            self.streams[key] = ParticipantAudioStream(meeting_code, participant_id, display_name, spoken_language)
        else:
            self.streams[key].display_name = display_name
            if spoken_language and spoken_language != "auto":
                self.streams[key].spoken_language = spoken_language
        return self.streams[key]

    def get_stream(self, meeting_code: str, participant_id: str) -> Optional[ParticipantAudioStream]:
        key = f"{meeting_code}:{participant_id}"
        return self.streams.get(key)

    async def remove_stream(self, meeting_code: str, participant_id: str):
        key = f"{meeting_code}:{participant_id}"
        stream = self.streams.pop(key, None)
        if stream:
            await stream.flush()

audio_processor_manager = AudioProcessorManager()
