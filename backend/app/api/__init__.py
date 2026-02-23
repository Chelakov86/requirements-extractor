from fastapi import APIRouter

from app.api import auth, items, projects
from app.api.sessions import router_projects as sessions_projects_router
from app.api.sessions import router_sessions as sessions_router

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(projects.router, prefix="/projects", tags=["projects"])
router.include_router(
    sessions_projects_router,
    prefix="/projects/{project_id}/sessions",
    tags=["sessions"],
)
router.include_router(sessions_router, prefix="/sessions", tags=["sessions"])
router.include_router(items.router, prefix="/sessions", tags=["items"])
