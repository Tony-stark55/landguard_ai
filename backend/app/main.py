import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.api.routes import router as api_router, SAMPLE_LOCATIONS
from backend.app.services.weather_service import fetch_weather_open_meteo
from backend.app.services.terrain_service import get_terrain_features
from backend.app.services.risk_engine import calculate_risk
from backend.app.services.alert_service import evaluate_and_create_alert
from backend.app.services.historical_service import VERIFIED_HISTORICAL_EVENTS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("landguard.main")

async def run_scheduled_pipeline():
    """
    Periodic task executed every UPDATE_INTERVAL_MINUTES:
      1. Get monitored locations
      2. Fetch weather via Open-Meteo
      3. Calculate current risk
      4. Check alert thresholds (51 -> HIGH, 76 -> CRITICAL)
      5. Emit alerts / updates
    """
    logger.info(f"Running automated risk assessment pipeline across {len(SAMPLE_LOCATIONS)} NER sectors...")
    for loc in SAMPLE_LOCATIONS:
        try:
            weather = fetch_weather_open_meteo(loc["latitude"], loc["longitude"], loc["id"])
            terrain = get_terrain_features(loc["id"])
            merged = {**loc, **terrain}
            risk = calculate_risk(merged, weather, VERIFIED_HISTORICAL_EVENTS)
            evaluate_and_create_alert(loc, risk)
        except Exception as e:
            logger.error(f"Error during scheduled run for {loc.get('id')}: {e}")
    logger.info("Pipeline cycle complete.")

async def scheduler_loop():
    """Background scheduler respecting UPDATE_INTERVAL_MINUTES (default: 15 mins)."""
    interval_seconds = max(60, settings.UPDATE_INTERVAL_MINUTES * 60)
    logger.info(f"Background scheduler started. Cycle interval: {settings.UPDATE_INTERVAL_MINUTES} minutes ({interval_seconds}s).")
    
    # Run initial cycle at startup
    await run_scheduled_pipeline()

    while True:
        try:
            await asyncio.sleep(interval_seconds)
            await run_scheduled_pipeline()
        except asyncio.CancelledError:
            logger.info("Scheduler task cancelled.")
            break
        except Exception as exc:
            logger.error(f"Unexpected error in scheduler loop: {exc}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: spawn background scheduler
    task = asyncio.create_task(scheduler_loop())
    yield
    # Shutdown
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Operational Landslide Early Warning & Risk Intelligence System for North Eastern India",
    lifespan=lifespan
)

# CORS middleware for secure cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
