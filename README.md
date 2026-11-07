# JANASTRA 🎙️🇮🇳

> **Real-Time Multilingual Meeting Platform with Speaker-Attributed Indic Captions**  
> Built for **The Great Indian Internship Challenge 2026** by **[Gnani.ai](https://www.gnani.ai/)**  
> Powered by **Gnani AI Prisma v3.0** Speech Recognition Engine.

[![Solution Pitch](https://img.shields.io/badge/📄%20One--Page-Solution%20Pitch-blueviolet?style=for-the-badge)](./SOLUTION_PITCH.md)
[![GitHub Repository](https://img.shields.io/badge/GitHub-ManoShruthiS%2FJanastra-blue?style=for-the-badge&logo=github)](https://github.com/ManoShruthiS/Janastra)
[![STT Engine](https://img.shields.io/badge/ASR-Gnani%20Prisma%20v3.0-emerald?style=for-the-badge)](https://www.gnani.ai/speech-to-text/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)

---

## 📄 Executive Solution Pitch

Per the official competition submission guidelines, a concise 1-page executive summary is available here:  
👉 **[Read the 1-Page Solution Pitch (SOLUTION_PITCH.md)](./SOLUTION_PITCH.md)**

---

## 📌 Project Overview

**JANASTRA** (*जन + अस्त्र*, The People's Voice Instrument) is a high-performance, language-first video conferencing platform designed to dissolve language barriers across India.

Traditional meeting platforms (Zoom, Teams, Google Meet) either treat English as the primary lingua franca or impose a single global subtitle language across all participants. In a multilingual nation of 1.4 billion people and 22 official languages, this design creates communication exclusion.

JANASTRA flips the model:
1. **Speak Naturally**: Each participant speaks in their native Indic language.
2. **Individual Subtitle Isolation**: Every participant independently selects their desired subtitle language. One participant's language choice never overrides another's.
3. **Speaker Attribution & Context Badges**: Subtitles explicitly attribute who spoke and illustrate language transitions (`[Gurpreet] [PA → HI] ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ...`).
4. **Zero Friction**: Join instantly with an ephemeral 6-character room code. No mandatory logins, no user tracking, and no permanent audio storage.

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
                  Targeted Indic Language (e.g. pa-IN, ta-IN, hi-IN, gu-IN)
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
 │ Live Display:               │                                     │ Live Display:               │
 │ "Gurpreet [PA → TA] வணக்கம்" │                                     │ "Gurpreet [PA → HI] नमस्ते"  │
 └─────────────────────────────┘                                     └─────────────────────────────┘
```

---

## 💬 Supported Indic Languages

JANASTRA integrates Gnani Prisma v3.0 across 10 languages:

| Language | Code | Native Script | Spoken Engine Support |
| :--- | :--- | :--- | :--- |
| **Hindi** | `hi` | हिन्दी | Gnani Prisma v3.0 ASR |
| **Tamil** | `ta` | தமிழ் | Gnani Prisma v3.0 ASR |
| **Punjabi** | `pa` | ਪੰਜਾਬੀ | Gnani Prisma v3.0 ASR |
| **Gujarati** | `gu` | ગુજરાતી | Gnani Prisma v3.0 ASR |
| **Kannada** | `kn` | ಕನ್ನಡ | Gnani Prisma v3.0 ASR |
| **Telugu** | `te` | తెలుగు | Gnani Prisma v3.0 ASR |
| **Bengali** | `bn` | বাংলা | Gnani Prisma v3.0 ASR |
| **Marathi** | `mr` | मराठी | Gnani Prisma v3.0 ASR |
| **Malayalam** | `ml` | മലയാളം | Gnani Prisma v3.0 ASR |
| **English** | `en` | English | Gnani Prisma v3.0 ASR |

---

## ⚙️ Meeting Controls & User Experience

- **Minimalist Control Dock**: Pure black (`#000000`), frosted acrylic blur, and silver accents (`#C0C0C0`) styled after premium modern operating systems.
- **Microphone & Camera**: Instant toggle with audio level visualizer and camera privacy fallback avatar.
- **Speaking Language Selector**: Allows speakers to specify their exact spoken dialect or let the pipeline adapt.
- **Caption Toggle & Language Selector**: Individualized dropdown to choose any target subtitle language instantly.
- **Single Subtitle Overlay**: Centered, non-intrusive subtitle pill displaying the latest speaker and their translated speech.
- **Peer-to-Peer Video Grid**: Responsive WebRTC mesh layout dynamically supporting multi-party meetings.

---

## 🤖 Gnani AI Prisma v3.0 Engine Integration

- **Speech-to-Text Endpoint**: `https://api.vachana.ai/stt/v3`
- **Streaming Audio Protocol**: 16-bit Linear PCM, 16 kHz sample rate, single mono channel.
- **Acoustic Pre-Processing**:
  - RMS VAD (Voice Activity Detection) threshold set to **480** to prevent low-energy ambient noise triggers.
  - **350 ms rolling pre-roll buffer** captures the critical initial consonant/syllable of spoken sentences.
  - Turn-completion detection at **1.2s silence** for conversational turn-taking.
- **Credential Protection**: Gnani API keys are strictly housed in server-side environment variables and are **never** exposed to browser clients.

---

## 🚀 Quickstart & Installation

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & npm

---

### 1. Backend Setup

```bash
cd backend

# Create and activate Python virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux / macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create `backend/.env` (refer to `backend/.env.example`):
```env
GNANI_API_KEY=your_gnani_api_key_here
GNANI_BASE_URL=https://api.vachana.ai
GNANI_WS_URL=wss://api.vachana.ai/stt/v3/stream
GNANI_MODEL=prisma-v3.0
GNANI_LANGUAGE_CODE=indic-auto
```

Start the backend:
```bash
python run.py
# Server runs on http://localhost:8001
```

---

### 2. Frontend Setup

```bash
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
# Application accessible at http://localhost:5173
```

---

## 🔒 Security & Privacy

1. **Zero Credential Exposure**: Client-side code never touches the Gnani API key. All transcription requests are signed and dispatched securely by the FastAPI backend.
2. **Ephemeral Memory Architecture**: Transcribed audio and subtitles exist only during the active meeting session; no audio streams or conversation logs are persisted to disk.
3. **P2P Video Streaming**: Direct WebRTC peer-to-peer mesh networking keeps video streams private between participants.

---

## 👥 Authors & Acknowledgments

- **Author**: Mano Shruthi S
- **Event**: The Great Indian Internship Challenge
- **Technology Partner**: [Gnani.ai](https://www.gnani.ai/)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
