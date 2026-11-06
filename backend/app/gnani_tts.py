import os
import logging
import httpx
from typing import Optional, Dict
from app.config import settings

logger = logging.getLogger("janastra.tts")

DEMO_DIALOGUE = [
    {
        "id": "user_gurpreet",
        "name": "Gurpreet Singh",
        "lang_name": "Punjabi",
        "spoken_lang": "pa",
        "tts_lang": "pa-IN",
        "caption_lang": "pa",
        "text": "ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਸਾਰਿਆਂ ਨੂੰ! ਮੈਂ ਗੁਰਪ੍ਰੀਤ ਸਿੰਘ ਹਾਂ। ਅੱਜ ਅਸੀਂ ਜਨਾਸਤਰਾ ਬਹੁ-ਭਾਸ਼ਾਈ ਮੀਟਿੰਗ ਸ਼ੁਰੂ ਕਰ ਰਹੇ ਹਾਂ।",
        "voice": "Nalini"
    },
    {
        "id": "user_sudharsan",
        "name": "Sudharsan",
        "lang_name": "Tamil",
        "spoken_lang": "ta",
        "tts_lang": "ta-IN",
        "caption_lang": "ta",
        "text": "வணக்கம் குர்பிரீத், நான் சுதர்சன். தமிழ் மொழியில் பேசுவதை ஜனஸ்த்ரா உடனடியாக மொழிபெயர்ப்பது மிகவும் மகிழ்ச்சி அளிக்கிறது.",
        "voice": "Nalini"
    },
    {
        "id": "user_ayan",
        "name": "Ayan Ishaan",
        "lang_name": "Hindi",
        "spoken_lang": "hi",
        "tts_lang": "hi-IN",
        "caption_lang": "hi",
        "text": "नमस्ते सुदर्शन और सभी दोस्तों, मैं अयान ईशान हूँ। यह तकनीक सचमुच भारत की भाषाई दूरियों को मिटा रही है।",
        "voice": "Nalini"
    },
    {
        "id": "user_maya",
        "name": "Maya Mehrotra",
        "lang_name": "Gujarati",
        "spoken_lang": "gu",
        "tts_lang": "gu-IN",
        "caption_lang": "gu",
        "text": "નમસ્તે અયાન અને સૌ મિત્રો, હું માયા મેહરોત્રા છું. બધા પોતાની માતૃભાષામાં વાત કરી શકે છે તે અદ્ભુત છે.",
        "voice": "Nalini"
    }
]

def synthesize_gnani_timbre_wav(
    text: str,
    language_code: str,
    voice: str = "Nalini"
) -> Optional[bytes]:
    """
    Synthesizes authentic 16kHz Linear PCM WAV speech audio via Gnani Timbre TTS.
    Endpoint: POST https://api.vachana.ai/api/v1/tts/inference
    """
    if not settings.GNANI_API_KEY:
        logger.error("Cannot synthesize speech: GNANI_API_KEY is not configured.")
        return None

    url = f"{settings.GNANI_BASE_URL.rstrip('/')}/api/v1/tts/inference"
    headers = {
        "X-API-Key-ID": settings.GNANI_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "text": text,
        "voice": voice,
        "model": "timbre-v2.5",
        "language": language_code,
        "speed": 1,
        "audio_config": {
            "encoding": "linear_pcm",
            "container": "wav",
            "num_channels": 1,
            "sample_rate": 16000,
            "sample_width": 2
        }
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            res = client.post(url, headers=headers, json=payload)
            if res.status_code == 200 and len(res.content) > 1000:
                logger.info(f"Synthesized {len(res.content)} bytes of WAV via Gnani Timbre ({language_code})")
                return res.content
            else:
                logger.error(f"Gnani Timbre API returned {res.status_code}: {res.text}")
                return None
    except Exception as e:
        logger.error(f"Error calling Gnani Timbre TTS API: {e}")
        return None
