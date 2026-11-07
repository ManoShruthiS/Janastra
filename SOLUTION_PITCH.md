# JANASTRA — One-Page Solution Pitch

**Project:** JANASTRA — Multilingual Video Meeting Platform with Speaker-Attributed Live Captions  
**Developer:** Mano Shruthi S  
**Competition:** The Great Indian Internship Challenge 2026 (Gnani.ai)  
**Repository:** [github.com/ManoShruthiS/Janastra](https://github.com/ManoShruthiS/Janastra)

---

### 1. The Problem
India is home to 22 official languages and hundreds of dialects. In virtual collaboration—from corporate teams and universities to rural telemedicine and panchayat governance—participants are forced to communicate in a shared second language (often English or Hindi) where nuance, clarity, and confidence are lost. Mainstream meeting tools (Zoom, Google Meet) offer global or English-centric subtitles that force a single language choice across all participants.

### 2. The Solution: JANASTRA
**JANASTRA** (जन + अस्त्र, *The People's Voice Instrument*) is an Indic-first, distraction-free online meeting platform engineered for frictionless cross-linguistic collaboration. Every attendee speaks naturally in their native tongue, while each participant independently selects their own preferred reading language. Subtitles are personalized, ephemeral, and strictly isolated: Speaker A speaking Punjabi appears as Tamil to Participant B and as Hindi to Participant C.

### 3. Powered by Gnani AI Prisma v3.0
- **Acoustic Engineering**: Client browsers stream 16-bit 16 kHz Linear PCM audio over WebSockets to an asynchronous FastAPI backend.
- **Noise-Tuned VAD Buffer**: An RMS energy detector (480 threshold) with a 350 ms pre-roll syllable ring buffer eliminates clipped words and background hiss.
- **Gnani Prisma v3.0 STT**: High-accuracy acoustic and phonetic modeling recognizes conversational Indic speech across 10 languages (Hindi, Tamil, Kannada, Telugu, Bengali, Marathi, Gujarati, Malayalam, Punjabi, and English).
- **Concurrent Translation Engine**: Recognized transcripts are translated asynchronously into all actively subscribed room languages in parallel (sub-200 ms latency).

### 4. Key Architectural Highlights
- **Individual Caption Isolation**: Zero cross-talk between user preferences; toggling or switching subtitle languages affects only the requesting participant.
- **Speaker Attribution & Context Badges**: Floating subtitle pills display real-time badges (`[Speaker] [EN → HI] Translated text`) preventing confusion in multi-speaker dialogues.
- **Frictionless WebRTC Architecture**: Direct peer-to-peer mesh video; instant meeting room creation with 6-character access codes—no mandatory sign-ups, passwords, or stored user data.

### 5. Impact & Scalability
JANASTRA democratizes real-time knowledge sharing across India's linguistic diversity. By bridging grassroots communication for rural banking (agritech credit), district administration, and vernacular tech teams, JANASTRA transforms Gnani AI's state-of-the-art Indic voice models into an everyday collaborative utility.
