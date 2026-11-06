# JANASTRA 🎙️

> **Multilingual Online Meeting Platform with Speaker-Attributed Real-Time Captions**  
> Powered by **Gnani AI Prisma v3.0** speech recognition and low-latency translation.

[![GitHub Repository](https://img.shields.io/badge/GitHub-ManoShruthiS%2FJanastra-blue?logo=github)](https://github.com/ManoShruthiS/Janastra)
[![Engine](https://img.shields.io/badge/STT%20Engine-Gnani%20Prisma%20v3.0-emerald)](#gnani-ai-prisma-v30-integration)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20WebSockets-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20TypeScript-61DAFB?logo=react)](https://react.dev)

---

## 📌 Project Objective

**JANASTRA** is a purpose-built multilingual online meeting platform whose core mission is to provide **accurate, real-time, speaker-attributed captions in each participant's individually selected language**.

Unlike general-purpose conferencing suites cluttered with non-essential tools, JANASTRA concentrates engineering precision on:
1. **Low-Latency Speech Recognition** via Gnani AI Prisma v3.0 with specialized Indic acoustic modeling.
2. **True Language Isolation**: One participant's caption settings never affect another. A speaker can speak in English or Tamil, while Participant A reads captions in Hindi, Participant B in Kannada, and Participant C in English.
3. **Continuous Speaker Attribution & Language Badges**: Every single subtitle line identifies the speaker and language transition (`[Speaker] [EN → HI] Translated text`).
4. **Frictionless Access**: Zero login, registration, or permanent profiles. Participants join instantly with a unique meeting code and display name.

---

## 🏛️ System Architecture

```
                                  ┌────────────────────────────────┐
                                  │   Browser Client (Speaker)     │
                                  │   - WebRTC Audio & Video Mesh  │
                                  │   - 16kHz PCM Audio Streamer   │
                                  └───────────────┬────────────────┘
                                                  │
                       Raw 16-bit 16kHz PCM       │ WebSocket: /ws/audio/{code}/{id}
                                                  ▼
                                  ┌────────────────────────────────┐
                                  │      FastAPI Audio Engine      │
                                  │   - Noise-Tuned VAD Buffer     │
                                  │   - Pre-roll Syllable Guard    │
                                  └───────────────┬────────────────┘
                                                  │
                 Targeted Language Code (e.g. en-IN, ta-IN, hi-IN)
                 POST https://api.vachana.ai/stt/v3 (Gnani Prisma v3.0)
                                                  ▼
                                  ┌────────────────────────────────┐
                                  │     Gnani AI Prisma v3.0       │
                                  │     Unified Indic+English      │
                                  │      Speech Recognition        │
                                  └───────────────┬────────────────┘
                                                  │ Recognized Text + Source Lang
                                                  ▼
                                  ┌────────────────────────────────┐
                                  │ Multilingual Translation Pool  │
                                  │ (Parallelized per active lang) │
                                  └───────────────┬────────────────┘
                                                  │ Broadcast JSON with all active translations
                                                  │ WebSocket: /ws/meeting/{code}/{id}
                                                  ▼
               ┌──────────────────────────────────┴──────────────────────────────────┐
               │                                                                     │
               ▼                                                                     ▼
┌─────────────────────────────┐                                     ┌─────────────────────────────┐
│ Participant A (Target: ta)  │                                     │ Participant B (Target: hi)  │
│ Display:                    │                                     │ Display:                    │
│ "Mahi [EN → TA] வணக்கம்..." │                                     │ "Mahi [EN → HI] नमस्ते..."   │
└─────────────────────────────┘                                     └─────────────────────────────┘
```

---

## ⚙️ Meeting Interface Controls

JANASTRA features a distraction-free, language-first interface focused strictly on Indic speech understanding:

| Control | Location | Description |
| :--- | :--- | :--- |
| **Speaking Selector** | Bottom Left Dock | Select your spoken microphone language (`English`, `Tamil`, `Hindi`, `Auto`) for acoustic accuracy |
| **Caption Toggle (`CC`)** | Bottom Left Dock | One-click toggle to show or hide live floating captions |
| **Caption Language** | Bottom Left Dock | Select your independent subtitle target language (English + 9 Indian languages) |
| **Microphone** | Center Dock | Toggle mute / unmute with anti-aliasing 16kHz PCM streaming to Gnani |
| **Camera** | Center Dock | Toggle video on / off with minimal frosted privacy avatar fallback |
| **Participants** | Center Dock | Auto-fitting floating card showing active attendees and their current caption languages |
| **Gnani AI Status** | Bottom Right Dock | Live indicator of Gnani Prisma v3.0 STT engine authentication state |
| **Live Subtitle Pill** | Center Overlay | Single active floating subtitle showing speaker, language badge (`[EN → HI]`), and translation |
| **Leave Meeting** | Top Right Header | Graceful departure, peer disconnection, and session cleanup |

---

## 💬 Supported Languages

Gnani Prisma v3.0 natively handles English + 9 major Indian languages:
- **English** (`en`)
- **Hindi** (`hi` - हिन्दी)
- **Tamil** (`ta` - தமிழ்)
- **Kannada** (`kn` - ಕನ್ನಡ)
- **Telugu** (`te` - తెలుగు)
- **Bengali** (`bn` - বাংলা)
- **Marathi** (`mr` - मराठी)
- **Gujarati** (`gu` - ગુજરાતી)
- **Malayalam** (`ml` - മലയാളം)
- **Punjabi** (`pa` - ਪੰਜਾਬੀ)

---

## 🤖 Gnani AI Prisma v3.0 Integration

- **Endpoint**: `https://api.vachana.ai/stt/v3` (REST chunk endpoint) & `wss://api.vachana.ai/stt/v3/stream` (Streaming WebSocket).
- **Authentication**: `X-API-Key-ID: <GNANI_API_KEY>`
- **Model**: `prisma-v3.0`
- **Audio Specification**: 16-bit Linear PCM, 16 kHz sample rate, mono.
- **VAD & Audio Pre-roll**: 480 RMS energy threshold (noise rejection), 1.2s silence turn completion, and 350ms pre-speech rolling buffer.
- **Security**: The Gnani API key is securely stored in `backend/.env` and **never** exposed to client-side code.

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & npm

---

### 1. Backend Setup

```bash
cd backend

# Create and activate Python virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Edit `backend/.env`:
```env
GNANI_API_KEY=your_actual_gnani_api_key_here
GNANI_BASE_URL=https://api.vachana.ai
GNANI_WS_URL=wss://api.vachana.ai/stt/v3/stream
GNANI_MODEL=prisma-v3.0
GNANI_LANGUAGE_CODE=indic-auto
```

Start the backend server:
```bash
python run.py
# Backend runs on http://localhost:8001
```

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

---

### 3. Automated End-to-End Verification Test

To verify speech recognition with Gnani Prisma v3.0 and real-time translation automatically:

```bash
python test_e2e_audio_translation.py
```

This streams audio directly into the live WebSocket pipeline and verifies the live caption broadcast with Hindi and Tamil translations.

---

## 📋 User Flow

1. **Host Meeting**: Enter your display name and click **"Start New Meeting"**.
2. **Share Code**: The platform generates a unique code (e.g. `JAN-842-195`). Share it with participants or copy the direct link.
3. **Join Meeting**: Other participants enter the code and their display names (no registration, password, or permanent profile).
4. **Choose Languages**:
   - Set **Speaking** to your spoken language (e.g. `English` or `Tamil`).
   - Set **Captions** to your desired reading language (e.g. `Hindi` or `Tamil`).
5. **Speak Naturally**: Live translated subtitles float gracefully on screen with speaker attribution and direction badges like `[Mahi] [EN → HI] नमस्ते...`.

---

## 🔒 Security & Privacy

- All API credentials remain isolated in the server-side environment.
- Ephemeral in-memory state: No audio is recorded or stored on disk; meetings are automatically cleaned up when all participants disconnect.
- Direct peer-to-peer WebRTC video and audio channels.

---

## 📄 License
MIT License
