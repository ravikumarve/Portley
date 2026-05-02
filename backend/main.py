"""
Portley Backend - FastAPI Application
White-label client portal for solo consultants and small agencies
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print("🚀 Portley Backend Starting...")
    yield
    # Shutdown
    print("👋 Portley Backend Shutting Down...")

# Initialize FastAPI app
app = FastAPI(
    title="Portley API",
    description="White-label client portal for solo consultants and small agencies",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
localhost_urls = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, *localhost_urls],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc) if os.getenv("DEBUG") == "true" else "An unexpected error occurred"
        }
    )

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "portley-backend",
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Portley API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# Include routers
from backend.routers import (
    projects,
    clients,
    files,
    messages,
    approvals,
    invoices,
    ai,
    webhooks,
    admin,
    whitelabel
)

app.include_router(projects.router, prefix="/api", tags=["Projects"])
app.include_router(clients.router, prefix="/api", tags=["Clients"])
app.include_router(files.router, prefix="/api", tags=["Files"])
app.include_router(messages.router, prefix="/api", tags=["Messages"])
app.include_router(approvals.router, prefix="/api", tags=["Approvals"])
app.include_router(invoices.router, prefix="/api", tags=["Invoices"])
app.include_router(ai.router, prefix="/api", tags=["AI"])
app.include_router(webhooks.router, prefix="/api", tags=["Webhooks"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])
app.include_router(whitelabel.router, prefix="/api", tags=["Whitelabel"])

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True if os.getenv("ENVIRONMENT") == "development" else False
    )
