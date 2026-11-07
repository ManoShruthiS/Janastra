# JANASTRA — One-Page Solution Pitch

**Project:** JANASTRA — Multilingual Online Meetings with Speaker-Attributed Captions  
**Creator:** Mano Shruthi S | **Challenge:** The Great Indian AI Internship Challenge 2026

## The problem
People across India often join the same online meeting while speaking and understanding different languages. When participants are expected to communicate in a language they are less comfortable with, ideas can be missed and participation becomes harder. Most meeting tools do not make individually preferred, multilingual captions the central experience.

## The solution
JANASTRA is a language-first online meeting platform designed to help participants communicate in the language they are comfortable speaking and read captions in a language they understand. Each participant can choose their own caption language, so one person's preference does not determine what everyone else sees.

## How it works
1. A host starts a meeting and shares a meeting code; participants join with a display name, without creating an account.
2. Participants choose their spoken-language setting and preferred caption language, and can turn captions on or off independently.
3. Meeting audio is streamed to the server-side speech-processing pipeline.
4. **Gnani AI Prisma** is used for speech-to-text recognition. Prisma provides the recognized speech text; it is not presented as the translation engine.
5. JANASTRA's separate translation component prepares caption text for the active target languages.
6. Captions are associated with the speaker and delivered to meeting participants according to their individual caption preferences.

## Technology
**Frontend:** React, Vite, TypeScript  
**Backend:** Python, FastAPI, WebSockets  
**Real-time meeting:** WebRTC  
**Speech recognition:** Gnani AI Prisma (STT)  
**Translation:** Separate translation service/component

## What makes JANASTRA different
- **Personalised captions:** participants can read the same conversation in different target languages.
- **Speaker attribution:** captions are designed to identify who is speaking and show language direction.
- **Low-friction access:** meeting-code entry without account registration.
- **India-focused inclusion:** designed around multilingual communication and Indic-language participation.

## Current implementation and honest status
The repository contains the React/TypeScript frontend, FastAPI backend, meeting and audio WebSocket routes, a Gnani Prisma client, a separate translation service, and an end-to-end test script. The live Prisma call requires a valid API credential in the server environment. A successful authenticated, live speech-to-translated-caption run must be verified with a valid key before claiming that the complete live pipeline is operational. Any demo using sample or simulated captions should be clearly identified as such.

## Intended impact and next steps
JANASTRA aims to make online discussions more inclusive for students, teams, communities, and people who prefer communicating in regional languages. Next steps include validating the authenticated live speech pipeline, testing multiple participants and language preferences, measuring caption latency and translation quality, and improving robustness for code-mixed speech and noisy audio.
