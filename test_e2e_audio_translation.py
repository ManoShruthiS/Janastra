import asyncio
import json
import time
import wave
import websockets

async def run_end_to_end_test():
    meeting_code = "JAN-AUTO-TEST"
    user_id = "tester_1"
    display_name = "TesterBot"
    
    meeting_ws_url = f"ws://127.0.0.1:8001/ws/meeting/{meeting_code}/{user_id}?display_name={display_name}"
    audio_ws_url = f"ws://127.0.0.1:8001/ws/audio/{meeting_code}/{user_id}?display_name={display_name}&spoken_lang=en"
    
    print("\n" + "="*60)
    print(" JANASTRA END-TO-END SPEECH & TRANSLATION VERIFICATION")
    print("="*60)
    print(f"Connecting to Meeting Room: {meeting_code}...")
    
    async with websockets.connect(meeting_ws_url) as meeting_ws:
        init_msg = await meeting_ws.recv()
        print(f"[OK] Meeting socket connected. Initial sync received.")
        
        # Set caption preferences: want captions in Tamil (ta)
        await meeting_ws.send(json.dumps({
            "type": "caption_pref",
            "caption_language": "ta",
            "spoken_language": "en",
            "caption_enabled": True
        }))
        ack = await meeting_ws.recv()
        print(f"[OK] Caption preference acknowledged: Spoken=en, Target=ta")
        
        print(f"Connecting to Audio Streamer Socket: {audio_ws_url}...")
        async with websockets.connect(audio_ws_url) as audio_ws:
            print(f"[OK] Audio socket connected.")
            
            # Read test_audio.wav (16kHz 16-bit mono)
            wf = wave.open("test_audio.wav", "rb")
            print(f"Streaming speech audio ({wf.getnframes()/wf.getframerate():.2f}s) to Gnani STT...")
            
            chunk_size = 4096 * 2  # 4096 samples @ 16-bit
            while True:
                data = wf.readframes(4096)
                if not data:
                    break
                await audio_ws.send(data)
                await asyncio.sleep(0.08)  # Simulate real-time mic streaming
            wf.close()
            
            print("[OK] Finished audio playback. Waiting for silence duration to conclude segment...")
            # Send 1.4s of silence to trigger VAD speech segment completion
            silence_chunk = b'\x00' * (16000 * 2 // 10)  # 100ms of silence
            for _ in range(14):
                await audio_ws.send(silence_chunk)
                await asyncio.sleep(0.1)
                
            print("Audio turn concluded. Listening for live caption broadcast from JANASTRA...")
            
            caption_received = None
            start_wait = time.time()
            while time.time() - start_wait < 30.0:
                try:
                    raw_msg = await asyncio.wait_for(meeting_ws.recv(), timeout=2.0)
                    msg = json.loads(raw_msg)
                    if msg.get("type") == "caption":
                        caption_received = msg.get("caption")
                        break
                    elif msg.get("type") == "speaker_active":
                        print(f" -> Speaker active state: {msg.get('is_speaking')}")
                except asyncio.TimeoutError:
                    continue
                    
            print("\n" + "-"*60)
            if caption_received:
                print("TEST PASSED! Caption Event Successfully Generated & Broadcast:")
                print(f"  Speaker:         {caption_received.get('speaker_name')}")
                print(f"  Source Language: {caption_received.get('source_language')}")
                print(f"  Original Text:   '{caption_received.get('original_text')}'")
                print(f"  Translations:    {json.dumps(caption_received.get('translations'), ensure_ascii=False, indent=4)}")
                print("-"*60 + "\n")
                return True
            else:
                print("FAILED: No caption received within 15 seconds.")
                print("-"*60 + "\n")
                return False

if __name__ == "__main__":
    success = asyncio.run(run_end_to_end_test())
    exit(0 if success else 1)
