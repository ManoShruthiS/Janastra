from pydantic_settings import BaseSettings
from typing import List, Dict
import os

class Settings(BaseSettings):
    # Gnani AI Prisma v3.0
    GNANI_API_KEY: str = ""
    GNANI_BASE_URL: str = "https://api.vachana.ai"
    GNANI_WS_URL: str = "wss://api.vachana.ai/stt/v3/stream"
    GNANI_MODEL: str = "prisma-v3.0"
    GNANI_LANGUAGE_CODE: str = "indic-auto"

    # Translation
    TRANSLATION_ENGINE: str = "deep_translator"
    GOOGLE_TRANSLATE_API_KEY: str = ""
    BHASHINI_API_KEY: str = ""
    BHASHINI_USER_ID: str = ""
    OPENAI_API_KEY: str = ""

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
