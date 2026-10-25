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
ENERGY_THRESHOLD = 350
# Max duration of a speech segment in seconds before forcing transcription
MAX_SPEECH_DURATION_SEC = 5.0
# Silence duration in seconds to consider speech turn finished
SILENCE_DURATION_SEC = 0.8
# Min audio duration to send for ASR (avoid noise blips)
MIN_AUDIO_DURATION_SEC = 0.5
SAMPLE_RATE = 16000
BYTES_PER_SAMPLE = 2  # 16-bit
BYTES_PER_SECOND = SAMPLE_RATE * BYTES_PER_SAMPLE

class ParticipantAudioStream:
    def __init__(self, meeting_code: str, participant_id: str, display_name: str):
        self.meeting_code = meeting_code
        self.participant_id = participant_id
        self.display_name = display_name
        self.buffer = bytearray()
        self.speech_start_time: Optional[float] = None
        self.last_speech_time: Optional[float] = None
        self.is_speaking = False
        self._lock = asyncio.Lock()

    async def feed_pcm_chunk(self, chunk: bytes):
        async with self._lock:
            if not chunk:
                return

            now = time.time()
            # Analyze energy
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
                    # Broadcast speaking indicator if desired
                    await meeting_manager.broadcast_to_room(
                        self.meeting_code,
                        {"type": "speaker_active", "speaker_id": self.participant_id, "is_speaking": True}
                    )
                self.last_speech_time = now
                self.buffer.extend(chunk)
            elif self.is_speaking:
                # Still within potential silence gap of the same sentence
                self.buffer.extend(chunk)
                silence_elapsed = now - (self.last_speech_time or now)
                duration = len(self.buffer) / BYTES_PER_SECOND

                if silence_elapsed >= SILENCE_DURATION_SEC or duration >= MAX_SPEECH_DURATION_SEC:
                    # Speech segment concluded
                    await self._process_current_segment()
            else:
                # Background noise / silence when not speaking - discard buffer
                if len(self.buffer) > BYTES_PER_SECOND:
                    self.buffer.clear()

    async def flush(self):
        """Forces processing whatever speech is currently in buffer."""
        async with self._lock:
            if self.is_speaking and len(self.buffer) > (MIN_AUDIO_DURATION_SEC * BYTES_PER_SECOND):
                await self._process_current_segment()
            else:
                self.buffer.clear()
                self.is_speaking = False

    async def _process_current_segment(self):
        audio_bytes = bytes(self.buffer)
        self.buffer.clear()
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

        # Trigger transcription in background task so audio streaming loop isn't stalled
        asyncio.create_task(self._transcribe_and_dispatch(audio_bytes))

    async def _transcribe_and_dispatch(self, pcm_data: bytes):
        wav_data = pcm_to_wav(pcm_data, sample_rate=SAMPLE_RATE)
        
        # Call Gnani Prisma v3.0 REST API
        asr_result = await gnani_client.transcribe_wav_bytes(wav_data)
        
        text = ""
        source_lang = "auto"
        if asr_result:
            # Parse Gnani response schema
            # Gnani STT v3 typically returns:
            # {"transcript": "..."} or {"text": "..."} or {"data": {"transcript": "..."}}
            text = (
                asr_result.get("transcript")
                or asr_result.get("text")
                or (asr_result.get("data", {}).get("transcript") if isinstance(asr_result.get("data"), dict) else "")
                or ""
            )
            source_lang = asr_result.get("language_code") or asr_result.get("language") or "auto"

        if not text.strip():
            logger.debug(f"No speech recognized for {self.display_name}")
            return

        session = meeting_manager.get_meeting(self.meeting_code)
        if not session:
            return

        # Fetch all target languages currently selected by participants
        target_languages = session.get_active_caption_languages()
        
        # Parallel translation into all active target languages
        translations = await translation_service.translate_for_room(
            text=text,
            detected_source_lang=source_lang,
            target_languages=target_languages
        )

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

        # Broadcast the caption event to all participants
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

    def get_or_create_stream(self, meeting_code: str, participant_id: str, display_name: str) -> ParticipantAudioStream:
        key = f"{meeting_code}:{participant_id}"
        if key not in self.streams:
            self.streams[key] = ParticipantAudioStream(meeting_code, participant_id, display_name)
        else:
            self.streams[key].display_name = display_name
        return self.streams[key]

    async def remove_stream(self, meeting_code: str, participant_id: str):
        key = f"{meeting_code}:{participant_id}"
        stream = self.streams.pop(key, None)
        if stream:
            await stream.flush()

audio_processor_manager = AudioProcessorManager()
