import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import ExtractionSession, Project, User
from app.services.exporter import SessionExporter

router = APIRouter()

CurrentUser = Annotated[User, Depends(get_current_user)]
DB = Annotated[Session, Depends(get_db)]

_exporter = SessionExporter()


ExportFormat = Annotated[Literal["json", "markdown"], Query(...)]


@router.get("/sessions/{session_id}/export")
def export_session(
    session_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
    format: ExportFormat,
) -> Response:
    session = (
        db.query(ExtractionSession)
        .join(Project)
        .filter(
            ExtractionSession.id == session_id,
            Project.user_id == current_user.id,
        )
        .first()
    )
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SESSION_NOT_FOUND")

    if format == "json":
        data = _exporter.to_json(session)
        return JSONResponse(
            content=data,
            headers={"Content-Disposition": f'attachment; filename="session_{session_id}.json"'},
        )
    elif format == "markdown":
        content = _exporter.to_markdown(session)
        return Response(
            content=content,
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="session_{session_id}.md"'},
        )
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="UNSUPPORTED_FORMAT")
