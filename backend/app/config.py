import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "LANDGUARD AI"
    VERSION: str = "1.0.0"
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Open-Meteo API (100% Free, No API Key Required)
    OPEN_METEO_BASE_URL: str = os.getenv("OPEN_METEO_BASE_URL", "https://api.open-meteo.com/v1/forecast")
    
    # Supabase PostgreSQL
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_PUBLISHABLE_KEY: str = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
    SUPABASE_SECRET_KEY: str = os.getenv("SUPABASE_SECRET_KEY", "")
    
    # Scheduler interval in minutes
    UPDATE_INTERVAL_MINUTES: int = int(os.getenv("UPDATE_INTERVAL_MINUTES", "15"))
    
    # Demo Mode
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    
    # Optional Gemini / AI Assistant Key (Works cleanly without key using deterministic engine)
    AI_API_KEY: str = os.getenv("AI_API_KEY", os.getenv("GEMINI_API_KEY", ""))
    
    # Risk Engine Thresholds (Configurable)
    THRESHOLD_LOW_MAX: float = 25.0
    THRESHOLD_MODERATE_MAX: float = 50.0
    THRESHOLD_HIGH_MAX: float = 75.0
    
    # Factor Weights (Sum = 1.0)
    WEIGHT_RAINFALL: float = 0.35
    WEIGHT_SLOPE: float = 0.30
    WEIGHT_HISTORICAL: float = 0.20
    WEIGHT_TERRAIN: float = 0.15

settings = Settings()
