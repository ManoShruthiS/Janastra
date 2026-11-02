import os
import sys
import json
import time
import asyncio
import io
import wave
import struct
import math
import httpx
from typing import Dict, Any

# Ensure stdout handles UTF-8 on Windows
if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Ensure backend root is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from app.config import settings, SUPPORTED_LANGUAGES
from app.models import (
    Participant,
    CaptionItem,
    ChatMessage,
    CreateMeetingRequest,
    CreateMeetingResponse,
    MeetingInfoResponse
)
from app.meeting_manager import meeting_manager, generate_meeting_code
from app.translation_service import translation_service
from app.audio_processor import (
    ParticipantAudioStream,
    audio_processor_manager,
    pcm_to_wav,
    SAMPLE_RATE,
    BYTES_PER_SAMPLE,
    BYTES_PER_SECOND
)
from app.gnani_client import gnani_client
from app.main import (
    read_root,
    health_check,
    get_languages,
    create_meeting,
    get_meeting_info
)

report = {
    "endpoints": {},
    "audio_streaming": {},
    "translation": {},
    "captions_and_attribution": {},
    "gnani_prisma_v3": {}
}

# -------------------------------------------------------------
# 1. API Endpoints Verification
# -------------------------------------------------------------
def test_api_endpoints():
    print("\n--- 1. Testing API Endpoints ---")
    try:
        root_res = read_root()
        assert root_res.get("app") == "JANASTRA"
        report["endpoints"]["GET /"] = {"status": "PASS", "data": root_res}
        print("  [PASS] GET /")
    except Exception as e:
        report["endpoints"]["GET /"] = {"status": "FAIL", "error": str(e)}
        print(f"  [FAIL] GET /: {e}")

    try:
        health_res = health_check()
        assert "status" in health_res
        report["endpoints"]["GET /api/health"] = {"status": "PASS", "data": health_res}
        print("  [PASS] GET /api/health")
    except Exception as e:
        report["endpoints"]["GET /api/health"] = {"status": "FAIL", "error": str(e)}
        print(f"  [FAIL] GET /api/health: {e}")

    try:
        langs_res = get_languages()
        assert len(langs_res) == 10
        codes = [l["code"] for l in langs_res]
        assert "en" in codes and "hi" in codes and "ta" in codes and "kn" in codes
        report["endpoints"]["GET /api/languages"] = {"status": "PASS", "count": len(langs_res), "codes": codes}
        print(f"  [PASS] GET /api/languages ({len(langs_res)} languages verified)")
    except Exception as e:
        report["endpoints"]["GET /api/languages"] = {"status": "FAIL", "error": str(e)}
        print(f"  [FAIL] GET /api/languages: {e}")

    test_code = ""
    try:
        req = CreateMeetingRequest(host_display_name="Ram")
        created = create_meeting(req)
        assert created.meeting_code.startswith("JAN-")
        assert created.host_id.startswith("user_")
        test_code = created.meeting_code
        report["endpoints"]["POST /api/meetings/create"] = {"status": "PASS", "code": created.meeting_code, "host_id": created.host_id}
        print(f"  [PASS] POST /api/meetings/create (Created: {created.meeting_code})")
    except Exception as e:
        report["endpoints"]["POST /api/meetings/create"] = {"status": "FAIL", "error": str(e)}
        print(f"  [FAIL] POST /api/meetings/create: {e}")

    try:
        info = get_meeting_info(test_code)
        assert info.meeting_code == test_code
        assert info.active_participants_count == 1
        report["endpoints"]["GET /api/meetings/{code}"] = {"status": "PASS", "data": info.model_dump()}
        print(f"  [PASS] GET /api/meetings/{test_code} (Verified)")
    except Exception as e:
        report["endpoints"]["GET /api/meetings/{code}"] = {"status": "FAIL", "error": str(e)}
        print(f"  [FAIL] GET /api/meetings/{test_code}: {e}")

# -------------------------------------------------------------
# 2. Audio Format and Streaming Implementation Verification
# -------------------------------------------------------------
async def test_audio_streaming():
    print("\n--- 2. Testing Audio Format & Streaming Implementation ---")
    try:
        # Check audio parameters
        assert SAMPLE_RATE == 16000
        assert BYTES_PER_SAMPLE == 2  # 16-bit
        assert BYTES_PER_SECOND == 32000

        # Generate 1.0 second of synthetic 440Hz sine wave PCM 16-bit mono
        duration_sec = 1.0
        num_samples = int(SAMPLE_RATE * duration_sec)
        pcm_bytes = bytearray()
        for i in range(num_samples):
            # 440 Hz tone at 0.5 amplitude
            sample = int(0.5 * 32767.0 * math.sin(2.0 * math.pi * 440.0 * i / SAMPLE_RATE))
            pcm_bytes.extend(struct.pack("<h", sample))

        assert len(pcm_bytes) == 32000

        # Test pcm_to_wav conversion
        wav_bytes = pcm_to_wav(bytes(pcm_bytes), sample_rate=16000, channels=1, sample_width=2)
        assert len(wav_bytes) == 32000 + 44  # 44 bytes standard RIFF header

        with io.BytesIO(wav_bytes) as bio:
            with wave.open(bio, 'rb') as wf:
                assert wf.getnchannels() == 1
                assert wf.getsampwidth() == 2
                assert wf.getframerate() == 16000
                assert wf.getnframes() == 16000

        # Test ParticipantAudioStream feeding
        stream = ParticipantAudioStream("JAN-TEST-001", "user_1", "Ram")
        chunk_size = 4096 * 2  # 4096 16-bit samples = 8192 bytes (~256ms chunk)
        for offset in range(0, len(pcm_bytes), chunk_size):
            await stream.feed_pcm_chunk(bytes(pcm_bytes[offset:offset + chunk_size]))

        assert stream.is_speaking == True
        assert len(stream.buffer) > 0

        # Test flush
        await stream.flush()
        assert len(stream.buffer) == 0

        report["audio_streaming"]["format_spec"] = {
            "status": "PASS",
            "sample_rate": 16000,
            "channels": 1,
            "bit_depth": 16,
            "encoding": "Linear PCM Little-Endian",
            "wav_header_verified": True
        }
        print("  [PASS] Audio format: 16kHz, 16-bit Mono PCM verified")
        print("  [PASS] PCM-to-WAV 44-byte RIFF header validated")
        print("  [PASS] ParticipantAudioStream chunk buffering & VAD energy detection verified")
    except Exception as e:
        report["audio_streaming"]["format_spec"] = {"status": "FAIL", "error": str(e)}
        print(f"  [FAIL] Audio streaming test: {e}")

# -------------------------------------------------------------
# 3. Translation Service Verification
# -------------------------------------------------------------
async def test_translation_service():
    print("\n--- 3. Testing Translation Service ---")
    test_phrase = "Hello, let us start the meeting"
    target_langs = {"hi", "ta", "kn", "te", "bn"}

    try:
        t0 = time.time()
        translations = await translation_service.translate_for_room(
            text=test_phrase,
            detected_source_lang="en",
            target_languages=target_langs
        )
        duration = round(time.time() - t0, 3)

        assert "hi" in translations and len(translations["hi"]) > 0
        assert "ta" in translations and len(translations["ta"]) > 0
        assert "kn" in translations and len(translations["kn"]) > 0

        report["translation"]["live_translation"] = {
            "status": "PASS",
            "source_phrase": test_phrase,
            "duration_sec": duration,
            "translations": {k: translations[k] for k in target_langs if k in translations}
        }
        print(f"  [PASS] Live Translation ({duration}s):")
        for k in ["hi", "ta", "kn"]:
            print(f"    - {k}: {repr(translations.get(k))}")

        # Edge case: Same language (en -> en)
        same_lang = await translation_service.translate_single(test_phrase, "en", "en")
        assert same_lang == test_phrase
        print("  [PASS] Edge case: identical source/target returns original text")

        # Edge case: empty string
        empty = await translation_service.translate_single("", "en", "ta")
        assert empty == ""
        print("  [PASS] Edge case: empty string handled")

    except Exception as e:
        report["translation"]["live_translation"] = {"status": "FAIL", "error": str(e)}
        print(f"  [FAIL] Translation service: {e}")

# -------------------------------------------------------------
# 4. Multi-Participant Caption Isolation & Speaker Attribution
# -------------------------------------------------------------
async def test_captions_and_speaker_attribution():
    print("\n--- 4. Testing Multi-Participant Caption Isolation & Speaker Attribution ---")
    try:
        # Create a test session
        code = "JAN-VERIFY-999"
        meeting_manager.create_meeting("Ram")
        session = meeting_manager.get_meeting(code)
        if not session:
            from app.meeting_manager import MeetingSession
            session = MeetingSession(code, "host_ram")
            meeting_manager.meetings[code] = session

        # Add 3 participants with isolated language preferences
        p1 = Participant(id="p1", display_name="Ram", caption_language="en", caption_enabled=True, is_host=True)
        p2 = Participant(id="p2", display_name="Mahi", caption_language="ta", caption_enabled=True)
        p3 = Participant(id="p3", display_name="Priya", caption_language="kn", caption_enabled=True)

        session.participants = {"p1": p1, "p2": p2, "p3": p3}

        # Verify active languages collected
        active_langs = session.get_active_caption_languages()
        assert "en" in active_langs and "ta" in active_langs and "kn" in active_langs
        print(f"  [PASS] Collected room target languages: {active_langs}")

        # Translate spoken phrase from Ram
        spoken_text = "Hello, let us start the meeting"
        translations = await translation_service.translate_for_room(spoken_text, "en", active_langs)

        caption = CaptionItem(
            id="cap_001",
            speaker_id="p1",
            speaker_name="Ram",
            original_text=spoken_text,
            source_language="en",
            translations=translations,
            timestamp=time.time(),
            is_final=True
        )

        session.add_caption(caption)

        # 1. Verify speaker attribution preserved
        assert caption.speaker_name == "Ram"
        assert caption.speaker_id == "p1"
        print(f"  [PASS] Speaker attribution verified: Speaker is '{caption.speaker_name}'")

        # 2. Verify each participant's isolated view
        ram_view = f"{caption.speaker_name}: {caption.translations.get(p1.caption_language, caption.original_text)}"
        mahi_view = f"{caption.speaker_name}: {caption.translations.get(p2.caption_language, caption.original_text)}"
        priya_view = f"{caption.speaker_name}: {caption.translations.get(p3.caption_language, caption.original_text)}"

        assert "Ram:" in ram_view
        assert "Ram:" in mahi_view
        assert "Ram:" in priya_view
        # Views must be in distinct scripts/languages
        assert mahi_view != priya_view
        assert mahi_view != ram_view

        report["captions_and_attribution"] = {
            "status": "PASS",
            "speaker_name": caption.speaker_name,
            "ram_view_en": ram_view,
            "mahi_view_ta": mahi_view,
            "priya_view_kn": priya_view,
            "isolation_confirmed": True
        }
        print("  [PASS] Isolated Participant Views:")
        print(f"    - Ram (English):  {repr(ram_view)}")
        print(f"    - Mahi (Tamil):   {repr(mahi_view)}")
        print(f"    - Priya (Kannada):{repr(priya_view)}")

    except Exception as e:
        report["captions_and_attribution"] = {"status": "FAIL", "error": str(e)}
        print(f"  [FAIL] Captions & Attribution test: {e}")

# -------------------------------------------------------------
# 5. Gnani Prisma v3.0 Official Specification & Actual API Access
# -------------------------------------------------------------
async def test_gnani_prisma_v3():
    print("\n--- 5. Testing Gnani Prisma v3.0 Integration & Actual API Access ---")
    api_key = settings.GNANI_API_KEY
    base_url = settings.GNANI_BASE_URL
    model = settings.GNANI_MODEL
    lang = settings.GNANI_LANGUAGE_CODE
    ws_url = settings.GNANI_WS_URL

    report["gnani_prisma_v3"]["configuration"] = {
        "base_url": base_url,
        "ws_url": ws_url,
        "model": model,
        "language_code": lang,
        "has_api_key": bool(api_key and api_key.strip())
    }

    print(f"  - Endpoint URL: {base_url}/stt/v3")
    print(f"  - WebSocket URL: {ws_url}")
    print(f"  - Model: {model}")
    print(f"  - Language Code: {lang}")
    print(f"  - Has GNANI_API_KEY: {bool(api_key and api_key.strip())}")

    # Generate small 16kHz test WAV to probe endpoint
    duration_sec = 0.5
    num_samples = int(16000 * duration_sec)
    test_pcm = bytearray(num_samples * 2)
    test_wav = pcm_to_wav(bytes(test_pcm), sample_rate=16000, channels=1, sample_width=2)

    # Actual HTTP probe to https://api.vachana.ai/stt/v3
    url = f"{base_url.rstrip('/')}/stt/v3"
    headers = {"X-API-Key-ID": api_key if api_key else "TEST_PLACEHOLDER_KEY"}
    files = {"audio_file": ("test.wav", test_wav, "audio/wav")}
    data = {"model": model, "language_code": lang, "format": "transcribe"}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, headers=headers, data=data, files=files)
            status_code = response.status_code
            resp_body = response.text[:300]

            print(f"  - Actual API Response Code: {status_code}")
            print(f"  - Actual API Response Body: {resp_body}")

            if status_code == 200:
                report["gnani_prisma_v3"]["actual_api_access"] = {
                    "status": "PASS",
                    "http_status": 200,
                    "response": response.json()
                }
            elif status_code in (401, 403):
                report["gnani_prisma_v3"]["actual_api_access"] = {
                    "status": "UNVERIFIED_KEY_REQUIRED",
                    "http_status": status_code,
                    "reason": "Official Gnani endpoint responded but rejected authentication. A valid GNANI_API_KEY must be provided by the user in backend/.env.",
                    "response_body": resp_body
                }
            else:
                report["gnani_prisma_v3"]["actual_api_access"] = {
                    "status": "API_ERROR",
                    "http_status": status_code,
                    "response_body": resp_body
                }
    except Exception as e:
        report["gnani_prisma_v3"]["actual_api_access"] = {
            "status": "CONNECTION_FAILED",
            "error": str(e)
        }
        print(f"  - Actual API Call Error: {e}")

async def main():
    test_api_endpoints()
    await test_audio_streaming()
    await test_translation_service()
    await test_captions_and_speaker_attribution()
    await test_gnani_prisma_v3()

    # Save verification JSON result
    with open("tests/verification_result.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print("\nVerification suite completed. Results saved to tests/verification_result.json.")

if __name__ == "__main__":
    asyncio.run(main())
