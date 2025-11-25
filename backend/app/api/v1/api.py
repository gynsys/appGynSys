"""
Main API router that aggregates all v1 endpoints.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, profiles, users, appointments, uploads, testimonials, gallery

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["profiles"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(testimonials.router, prefix="/testimonials", tags=["testimonials"])
api_router.include_router(gallery.router, prefix="/gallery", tags=["gallery"])

