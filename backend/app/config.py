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
    PORT: int = 8001
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

# Supported languages in Janastra
# Gnani Prisma v3.0 natively handles English + 9 major Indian languages
SUPPORTED_LANGUAGES: List[Dict[str, str]] = [
    {"code": "en", "name": "English", "native": "English", "gnani_code": "en-IN"},
    {"code": "hi", "name": "Hindi", "native": "हिन्दी", "gnani_code": "hi-IN"},
    {"code": "ta", "name": "Tamil", "native": "தமிழ்", "gnani_code": "ta-IN"},
    {"code": "kn", "name": "Kannada", "native": "ಕನ್ನಡ", "gnani_code": "kn-IN"},
    {"code": "te", "name": "Telugu", "native": "తెలుగు", "gnani_code": "te-IN"},
    {"code": "bn", "name": "Bengali", "native": "বাংলা", "gnani_code": "bn-IN"},
    {"code": "mr", "name": "Marathi", "native": "मराठी", "gnani_code": "mr-IN"},
    {"code": "gu", "name": "Gujarati", "native": "ગુજરાતી", "gnani_code": "gu-IN"},
    {"code": "ml", "name": "Malayalam", "native": "മലയാളം", "gnani_code": "ml-IN"},
    {"code": "pa", "name": "Punjabi", "native": "ਪੰਜਾਬੀ", "gnani_code": "pa-IN"},
]
