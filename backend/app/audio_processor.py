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
