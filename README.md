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
1. **Low-Latency Speech Recognition** via Gnani AI Prisma v3.0.
2. **True Language Isolation**: One participant's caption settings never affect another. A speaker can speak in Hindi or English, while Participant A reads captions in Tamil, Participant B in Kannada, and Participant C in Hindi.
3. **Continuous Speaker Attribution**: Every single caption line preserves the original speaker's display name (`Speaker: <Translated Text>`).
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
                                  │   - Real-time VAD & Buffering  │
                                  └───────────────┬────────────────┘
                                                  │
                 wss://api.vachana.ai/stt/v3/stream (or REST fallback)
                 Header: X-API-Key-ID, Model: prisma-v3.0, Lang: indic-auto
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
│ Participant A (Target: ta)  │                                     │ Participant B (Target: kn)  │
│ Display:                    │                                     │ Display:                    │
│ "Ram: வணக்கம், கூட்டத்தைத்..." │                                     │ "Ram: ನಮಸ್ಕಾರ, ಸಭೆಯನ್ನು..."  │
└─────────────────────────────┘                                     └─────────────────────────────┘
```

---

## ⚙️ Meeting Interface Controls

JANASTRA strictly implements the 8 essential in-call meeting controls without superfluous bloat:

| Control | Description |
| :--- | :--- |
| **Microphone** | Toggle mute / unmute state with audio streaming control |
| **Camera** | Toggle video on / off with camera privacy fallback |
| **Screen Sharing** | Stream desktop display / application window to peers |
| **Chat** | Ephemeral, in-meeting text messaging for all participants |
| **Participants** | Real-time participant roster showing host badge, mic/cam states, and caption language |
| **Captions** | Toggle live captions ON/OFF and switch personal caption language |
| **Settings** | Device selection (mic, camera), caption language selector, and engine status |
| **Leave Meeting** | Graceful departure, peer disconnection, and session cleanup |

---

## 💬 Caption & Translation Capabilities

- **Isolated Preferences**: Captions are controlled locally per participant. Turning captions off or switching language on your screen has **zero** effect on other participants.
- **Continuous Scroll**: Captions continuously render and scroll at the bottom overlay of the video screen.
- **Expandable Transcript**: Click **"Full Transcript"** or the transcript toggle to view the entire timestamped meeting history with full-text search and `.txt` export.
- **Supported Languages**:
  - English (`en`)
  - Hindi (`hi` - हिन्दी)
  - Tamil (`ta` - தமிழ்)
  - Kannada (`kn` - ಕನ್ನಡ)
  - Telugu (`te` - తెలుగు)
  - Bengali (`bn` - বাংলা)
  - Marathi (`mr` - मराठी)
  - Gujarati (`gu` - ગુજરાતી)
  - Malayalam (`ml` - മലയാളം)
  - Punjabi (`pa` - ਪੰਜਾਬੀ)

---

## 🤖 Gnani AI Prisma v3.0 Integration

- **Endpoint**: `wss://api.vachana.ai/stt/v3/stream` (Streaming WebSocket) & `https://api.vachana.ai/stt/v3` (REST chunk endpoint).
- **Authentication**: `X-API-Key-ID: <GNANI_API_KEY>`
- **Model**: `prisma-v3.0`
- **Language Detection**: `indic-auto` (automated language identification across 9 Indic languages + English with code-mixed support).
- **Audio Specification**: 16-bit Linear PCM, 16 kHz sample rate, mono.
- **Security**: The Gnani API key is securely stored in `backend/.env` and **never** exposed to client-side code.

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+** (tested on Python 3.14)
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

# Configure environment variables
# Copy .env.example to .env and configure your Gnani credentials:
copy .env.example .env
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
# Backend runs on http://localhost:8000
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

## 📋 User Flow

1. **Host Meeting**: Enter your display name and click **"Start New Meeting"**.
2. **Share Code**: The platform generates a unique code (e.g. `JAN-842-195`). Share it with participants or copy the direct link.
3. **Join Meeting**: Other participants enter the code and their display names (no registration, password, or permanent profile).
4. **Select Language**: Once joined, participants can independently toggle captions and select their preferred language from the bottom control bar or settings.

---

## 🔒 Security & Privacy

- All API credentials remain isolated in the server-side environment.
- Temporary session state: No audio is stored to disk; transcripts and participant lists are cleared when the meeting ends.
- Direct peer-to-peer WebRTC video and audio channels.

---

## 📄 License
MIT License
