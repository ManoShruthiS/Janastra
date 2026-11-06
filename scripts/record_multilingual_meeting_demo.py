import asyncio
import json
import logging
import os
import sys
import subprocess
import time
import urllib.parse
import wave
import httpx
import websockets

backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from playwright.async_api import async_playwright

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("janastra.demo")

MEETING_CODE = "JAN-DEMO-2026"
DEMO_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "recorded_demos")
AUDIO_CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "demo_audio")
FFMPEG_PATH = r"C:\Users\manos\AppData\Local\ms-playwright\ffmpeg-1013\ffmpeg-win64.exe"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

PARTICIPANTS = [
    {
        "id": "user_gurpreet",
        "name": "Gurpreet Singh",
        "role": "Host",
        "spoken_lang": "pa",
        "tts_lang": "pa-IN",
        "caption_lang": "pa",
        "text": "ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਸਾਰਿਆਂ ਨੂੰ! ਮੈਂ ਗੁਰਪ੍ਰੀਤ ਸਿੰਘ ਹਾਂ। ਅੱਜ ਅਸੀਂ ਜਨਾਸਤਰਾ ਬਹੁ-ਭਾਸ਼ਾਈ ਮੀਟਿੰਗ ਸ਼ੁਰੂ ਕਰ ਰਹੇ ਹਾਂ।",
        "wav_file": "gurpreet_pa.wav"
    },
    {
        "id": "user_sudharsan",
        "name": "Sudharsan",
        "role": "Participant",
        "spoken_lang": "ta",
        "tts_lang": "ta-IN",
        "caption_lang": "ta",
        "text": "வணக்கம் குர்பிரீத், நான் சுதர்சன். தமிழ் மொழியில் பேசுவதை ஜனஸ்த்ரா உடனடியாக மொழிபெயர்ப்பது மிகவும் மகிழ்ச்சி அளிக்கிறது.",
        "wav_file": "sudharsan_ta.wav"
    },
    {
        "id": "user_ayan",
        "name": "Ayan Ishaan",
        "role": "Participant",
        "spoken_lang": "hi",
        "tts_lang": "hi-IN",
        "caption_lang": "hi",
        "text": "नमस्ते सुदर्शन और सभी दोस्तों, मैं अयान ईशान हूँ। यह तकनीक सचमुच भारत की भाषाई दूरियों को मिटा रही है।",
        "wav_file": "ayan_hi.wav"
    },
    {
        "id": "user_maya",
        "name": "Maya Mehrotra",
        "role": "Participant",
        "spoken_lang": "gu",
        "tts_lang": "gu-IN",
        "caption_lang": "gu",
        "text": "નમસ્તે અયાન અને સૌ મિત્રો, હું માયા મેહરોત્રા છું. બધા પોતાની માતૃભાષામાં વાત કરી શકે છે તે અદ્ભુત છે.",
        "wav_file": "maya_gu.wav"
    }
]

def ensure_tts_audio_files():
    """Synthesizes and caches genuine Gnani Timbre 16kHz WAV audio files for all 4 participants."""
    os.makedirs(AUDIO_CACHE_DIR, exist_ok=True)
    from app.config import settings

    for p in PARTICIPANTS:
        path = os.path.join(AUDIO_CACHE_DIR, p["wav_file"])
        if os.path.exists(path) and os.path.getsize(path) > 10000:
            logger.info(f"Cached audio found for {p['name']}: {path}")
            continue

        logger.info(f"Synthesizing speech via Gnani Timbre for {p['name']} ({p['tts_lang']})...")
        url = f"{settings.GNANI_BASE_URL.rstrip('/')}/api/v1/tts/inference"
        headers = {
            "X-API-Key-ID": settings.GNANI_API_KEY,
            "Content-Type": "application/json"
        }
        payload = {
            "text": p["text"],
            "voice": "Nalini",
            "model": "timbre-v2.5",
            "language": p["tts_lang"],
            "speed": 1,
            "audio_config": {
                "encoding": "linear_pcm",
                "container": "wav",
                "num_channels": 1,
                "sample_rate": 16000,
                "sample_width": 2
            }
        }
        with httpx.Client(timeout=30.0) as client:
            res = client.post(url, headers=headers, json=payload)
            if res.status_code == 200 and len(res.content) > 1000:
                with open(path, "wb") as f:
                    f.write(res.content)
                logger.info(f"Saved {len(res.content)} bytes to {path}")
            else:
                raise RuntimeError(f"Failed to synthesize audio for {p['name']}: {res.status_code} {res.text}")

async def drain_ws(ws):
    try:
        async for _ in ws:
            pass
    except Exception:
        pass

async def stream_audio_for_participant(p_info: dict):
    """Streams a participant's 16kHz PCM audio to the backend audio endpoint."""
    wav_path = os.path.join(AUDIO_CACHE_DIR, p_info["wav_file"])
    wf = wave.open(wav_path, "rb")
    
    enc_name = urllib.parse.quote(p_info['name'])
    audio_ws_url = f"ws://127.0.0.1:8001/ws/audio/{MEETING_CODE}/{p_info['id']}?display_name={enc_name}&spoken_lang={p_info['spoken_lang']}"
    logger.info(f"Streaming speech audio for {p_info['name']} ({p_info['spoken_lang']}) to Gnani STT...")
    
    async with websockets.connect(audio_ws_url) as audio_ws:
        # Stream 4096-sample PCM frames
        while True:
            frame = wf.readframes(4096)
            if not frame:
                break
            await audio_ws.send(frame)
            await asyncio.sleep(0.06)
        wf.close()
        
        # Send 1.4s of silence frames to trigger VAD sentence completion
        silence_chunk = b'\x00' * (16000 * 2 // 10)
        for _ in range(14):
            await audio_ws.send(silence_chunk)
            await asyncio.sleep(0.1)
            
    logger.info(f"Finished audio streaming for {p_info['name']}")

async def run_full_recorded_demo():
    os.makedirs(DEMO_DIR, exist_ok=True)
    ensure_tts_audio_files()

    print("\n" + "="*70)
    print(" JANASTRA 4-PARTICIPANT MULTILINGUAL MEETING VIDEO DEMO RECORDING")
    print("="*70)

    # 1. Connect Simulated Participants via WebSockets to the Meeting Room
    simulated_sockets = {}
    
    # We will simulate Gurpreet Singh, Sudharsan, and Maya Mehrotra via WebSocket.
    # Ayan Ishaan will be the live viewer in the browser!
    remote_participants = [p for p in PARTICIPANTS if p["id"] != "user_ayan"]
    
    logger.info(f"Connecting 3 participants to meeting room {MEETING_CODE}...")
    for p in remote_participants:
        enc_name = urllib.parse.quote(p['name'])
        ws_url = f"ws://127.0.0.1:8001/ws/meeting/{MEETING_CODE}/{p['id']}?display_name={enc_name}"
        ws = await websockets.connect(ws_url)
        # Receive init_sync
        await ws.recv()
        # Send caption and spoken language preference
        await ws.send(json.dumps({
            "type": "caption_pref",
            "caption_language": p["caption_lang"],
            "spoken_language": p["spoken_lang"],
            "caption_enabled": True
        }))
        simulated_sockets[p["id"]] = ws
        asyncio.create_task(drain_ws(ws))
        logger.info(f"Connected: {p['name']} (Speaking: {p['spoken_lang']}, Captions: {p['caption_lang']})")

    # 2. Launch Playwright Chrome to record high-resolution video of the meeting UI
    logger.info("Launching Chrome with Playwright video recorder...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"]
        )
        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            record_video_dir=DEMO_DIR,
            record_video_size={"width": 1280, "height": 720},
            permissions=["microphone", "camera"]
        )
        page = await context.new_page()

        # Navigate to meeting room lobby
        logger.info(f"Navigating to meeting lobby: http://localhost:5173/?code={MEETING_CODE}")
        await page.goto(f"http://localhost:5173/?code={MEETING_CODE}")
        await page.wait_for_timeout(2000)

        # Fill display name for Ayan Ishaan (Hindi participant)
        name_input = page.locator('input[placeholder="e.g. Mahi"]')
        await name_input.fill("Ayan Ishaan")
        await page.wait_for_timeout(1000)

        # Enter meeting
        logger.info("Entering meeting room as Ayan Ishaan...")
        await page.click('button:has-text("Enter Meeting")')
        await page.wait_for_timeout(3500)

        # Set Ayan's caption language to Hindi (हिन्दी) so he reads all other speakers in Hindi!
        try:
            # Change language dropdown in control dock
            captions_select = page.locator('select[title="Select caption language to read"]')
            if await captions_select.count() > 0:
                await captions_select.select_option("hi")
                logger.info("Ayan set Caption Language to Hindi (हिन्दी)")
        except Exception as e:
            logger.warning(f"Could not select caption dropdown: {e}")

        await page.wait_for_timeout(2000)

        # 3. Execute Speech Turns Sequentially
        # Turn 1: Gurpreet Singh speaks Punjabi (pa) -> Captions translate to Hindi for Ayan
        logger.info("=== TURN 1: Gurpreet Singh (Punjabi) ===")
        await stream_audio_for_participant(PARTICIPANTS[0])
        # Wait for ASR + Translation + Caption display
        await page.wait_for_timeout(6000)

        # Turn 2: Sudharsan speaks Tamil (ta) -> Captions translate to Hindi for Ayan
        logger.info("=== TURN 2: Sudharsan (Tamil) ===")
        await stream_audio_for_participant(PARTICIPANTS[1])
        await page.wait_for_timeout(6000)

        # Turn 3: Ayan Ishaan speaks Hindi (hi) -> Captions show Hindi
        logger.info("=== TURN 3: Ayan Ishaan (Hindi) ===")
        await stream_audio_for_participant(PARTICIPANTS[2])
        await page.wait_for_timeout(6000)

        # Switch caption dropdown to English or Tamil to demonstrate live language switching!
        try:
            captions_select = page.locator('select[title="Select caption language to read"]')
            if await captions_select.count() > 0:
                await captions_select.select_option("en")
                logger.info("Ayan dynamically switched Caption Language to English (en)")
                await page.wait_for_timeout(1500)
        except Exception:
            pass

        # Turn 4: Maya Mehrotra speaks Gujarati (gu) -> Captions translate to English for Ayan
        logger.info("=== TURN 4: Maya Mehrotra (Gujarati) ===")
        await stream_audio_for_participant(PARTICIPANTS[3])
        await page.wait_for_timeout(6500)

        # Final showcase view of the full 4-person meeting
        logger.info("Capturing concluding meeting view with all 4 participants...")
        await page.wait_for_timeout(3000)

        # Close page and context to finalize video recording
        video_path = await page.video.path()
        logger.info(f"Closing browser. Video recorded to: {video_path}")
        await context.close()
        await browser.close()

    # Disconnect simulated participants
    for ws in simulated_sockets.values():
        await ws.close()

    # Convert recorded WebM video to MP4 using FFmpeg
    output_mp4 = os.path.join(DEMO_DIR, "janastra_multilingual_demo.mp4")
    logger.info(f"Converting {video_path} to MP4: {output_mp4}...")
    
    cmd = [
        FFMPEG_PATH,
        "-y",
        "-i", video_path,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        output_mp4
    ]
    subprocess.run(cmd, check=True)
    
    print("\n" + "="*70)
    print(" DEMONSTRATION RECORDING COMPLETE!")
    print(f" Video Output MP4: {output_mp4}")
    print(f" File Size:       {os.path.getsize(output_mp4) / 1024 / 1024:.2f} MB")
    print("="*70 + "\n")

if __name__ == "__main__":
    asyncio.run(run_full_recorded_demo())
