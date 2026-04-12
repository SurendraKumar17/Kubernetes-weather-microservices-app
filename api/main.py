from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Weather API", version="1.0.0")

# CORS — allows UI to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Config from environment variables (K8s ConfigMap/Secret)
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "")
WEATHER_API_URL = os.getenv("WEATHER_API_URL", "https://api.openweathermap.org/data/2.5")
APP_ENV = os.getenv("APP_ENV", "development")

@app.get("/health")
async def health():
    return {"status": "healthy", "env": APP_ENV}

@app.get("/ready")
async def ready():
    return {"status": "ready"}

@app.get("/weather/{city}")
async def get_weather(city: str):
    logger.info(f"Fetching weather for city: {city}")
    
    if not WEATHER_API_KEY:
        # Return mock data if no API key — useful for testing
        logger.warning("No API key found, returning mock data")
        return {
            "city": city,
            "temperature": 28.5,
            "feels_like": 30.2,
            "humidity": 65,
            "description": "Partly cloudy",
            "wind_speed": 12.3,
            "country": "IN",
            "mock": True
        }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{WEATHER_API_URL}/weather",
                params={
                    "q": city,
                    "appid": WEATHER_API_KEY,
                    "units": "metric"
                },
                timeout=10.0
            )
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"City '{city}' not found")
            
            if response.status_code != 200:
                raise HTTPException(status_code=502, detail="Weather service unavailable")
            
            data = response.json()
            
            return {
                "city": data["name"],
                "temperature": data["main"]["temp"],
                "feels_like": data["main"]["feels_like"],
                "humidity": data["main"]["humidity"],
                "description": data["weather"][0]["description"],
                "wind_speed": data["wind"]["speed"],
                "country": data["sys"]["country"],
                "mock": False
            }
    
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Weather service timeout")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching weather: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/weather/multiple/{cities}")
async def get_multiple_weather(cities: str):
    city_list = cities.split(",")
    results = []
    
    for city in city_list[:5]:  # Max 5 cities
        try:
            weather = await get_weather(city.strip())
            results.append(weather)
        except HTTPException as e:
            results.append({"city": city, "error": e.detail})
    
    return {"cities": results}

@app.get("/metrics")
async def metrics():
    # Basic metrics endpoint for Prometheus
    return {
        "api_requests_total": 0,
        "api_errors_total": 0
    }
