from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.db import init_db
from app.api.v1.endpoints import admin_stats, auth, user, token, admin, payment
from dotenv import load_dotenv

load_dotenv()

# Create the main FastAPI application
app = FastAPI(
    openapi_url="/api/v1/openapi.json",  # Serve OpenAPI schema under /api
    docs_url="/api/v1/docs",  # Serve Swagger UI under /api/docs
    redoc_url="/api/v1/redoc",  # Serve ReDoc UI under /api/redoc
)

# CORS Configuration
origins = [
    "http://localhost:3000",  # Add your frontend URL or domains allowed to access the API
    "https://thamerweb.com",
]
app.add_middleware(
    CORSMiddleware,
    #allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origins=["*"],  # Change this for production
)

# Mount the static directory
app.mount("/api/v1/static", StaticFiles(directory="app/static"), name="static")

@app.on_event("startup")
def on_startup():
    init_db()

# Include Routers
app.include_router(token.router, prefix="/api/v1", tags=["Token"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(user.router, prefix="/api/v1", tags=["User"])
app.include_router(admin.router, prefix="/api/v1", tags=["Admin"])
app.include_router(payment.router, prefix="/api/v1/payment", tags=["Payment"])
app.include_router(admin_stats.router, prefix="/api/v1", tags=["AdminStats"])
