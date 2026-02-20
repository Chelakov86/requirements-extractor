from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.models import User

router = APIRouter()


@router.get("")
async def list_projects(current_user: User = Depends(get_current_user)) -> list:
    return []
