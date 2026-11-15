
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routers.items import router as items_router

app = FastAPI(
    title="WhereIsItGPT API",
    description="AI-powered personal item finder",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(items_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to WhereIsItGPT!",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": "WhereIsItGPT",
    }
