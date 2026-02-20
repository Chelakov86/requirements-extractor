import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import ExtractionSession, Project, User
from app.schemas.project import ProjectCreate, ProjectResponse

router = APIRouter()

CurrentUser = Annotated[User, Depends(get_current_user)]
DB = Annotated[Session, Depends(get_db)]


def _session_count_subquery():
    return (
        select(func.count())
        .where(ExtractionSession.project_id == Project.id)
        .correlate(Project)
        .scalar_subquery()
    )


def _get_project_or_404(
    project_id: uuid.UUID, current_user: User, db: Session
) -> tuple[Project, int]:
    count_sq = _session_count_subquery()
    row = (
        db.query(Project, count_sq.label("session_count"))
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return row


def _to_response(project: Project, session_count: int) -> ProjectResponse:
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        session_count=session_count,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.get("", response_model=list[ProjectResponse])
async def list_projects(current_user: CurrentUser, db: DB) -> list[ProjectResponse]:
    count_sq = _session_count_subquery()
    rows = (
        db.query(Project, count_sq.label("session_count"))
        .filter(Project.user_id == current_user.id)
        .order_by(Project.created_at.desc())
        .all()
    )
    return [_to_response(p, count) for p, count in rows]


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate, current_user: CurrentUser, db: DB
) -> ProjectResponse:
    project = Project(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return _to_response(project, session_count=0)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID, current_user: CurrentUser, db: DB
) -> ProjectResponse:
    project, count = _get_project_or_404(project_id, current_user, db)
    return _to_response(project, count)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID, current_user: CurrentUser, db: DB
) -> None:
    project, _ = _get_project_or_404(project_id, current_user, db)
    db.delete(project)
    db.commit()
