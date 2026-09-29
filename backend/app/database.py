import logging
from typing import Optional
from backend.app.config import settings

logger = logging.getLogger("landguard.database")

supabase_client = None

def get_supabase_client():
    global supabase_client
    if supabase_client is not None:
        return supabase_client
        
    if not settings.SUPABASE_URL or not settings.SUPABASE_SECRET_KEY:
        logger.warning(
            "Supabase credentials not configured in environment (SUPABASE_URL or SUPABASE_SECRET_KEY). "
            "Running with in-memory state and local persistence."
        )
        return None
        
    try:
        from supabase import create_client, Client
        supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)
        logger.info("Supabase PostgreSQL client connected successfully.")
        return supabase_client
    except Exception as exc:
        logger.error(f"Failed to initialize Supabase client: {exc}")
        return None
