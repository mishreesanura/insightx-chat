import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import connect_db, close_db
from routers import chat

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: connect to MongoDB. Shutdown: close the connection."""
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="InsightX API",
    description="Chat-to-Data analytics backend for InsightX",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS – allow the React frontend (any origin during development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(chat.router)


@app.get("/")
async def root():
    return {"message": "InsightX API is running"}
