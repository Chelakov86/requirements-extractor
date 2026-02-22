import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.config import settings
from app.database import get_db
from app.models import (
    ExtractionSession,
    NonFunctionalRequirement,
    OpenQuestion,
    Project,
    SourceDocument,
    User,
    UserStory,
)
from app.schemas.session import (
    NFRResponse,
    OpenQuestionResponse,
    SessionCreateResponse,
    SessionDetailResponse,
    SessionStatusResponse,
    SessionSummaryResponse,
    UserStoryResponse,
)
from app.services.extraction_service import run_extraction
from app.services.file_parser import FileParser, validate_total_size

from sqlalchemy import func, select

# POST /projects/{project_id}/sessions lives under the projects prefix
router_projects = APIRouter()
# GET /sessions/{session_id}[/status] lives under a separate sessions prefix
router_sessions = APIRouter()

CurrentUser = Annotated[User, Depends(get_current_user)]
DB = Annotated[Session, Depends(get_db)]

_file_parser = FileParser()


def _get_session_or_404(
    session_id: uuid.UUID, current_user: User, db: Session
) -> ExtractionSession:
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


def _count_sq(model, session_id_col):
    """Scalar subquery: count non-deleted items for a correlated session."""
    return (
        select(func.count())
        .where(session_id_col == ExtractionSession.id, model.is_deleted == False)  # noqa: E712
        .correlate(ExtractionSession)
        .scalar_subquery()
    )


@router_projects.get("", response_model=list[SessionSummaryResponse])
async def list_sessions(
    project_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
) -> list[SessionSummaryResponse]:
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    us_count = _count_sq(UserStory, UserStory.session_id)
    nfr_count = _count_sq(NonFunctionalRequirement, NonFunctionalRequirement.session_id)
    oq_count = _count_sq(OpenQuestion, OpenQuestion.session_id)

    rows = (
        db.query(
            ExtractionSession,
            us_count.label("user_story_count"),
            nfr_count.label("nfr_count"),
            oq_count.label("open_question_count"),
        )
        .filter(ExtractionSession.project_id == project_id)
        .order_by(ExtractionSession.created_at.desc())
        .all()
    )

    return [
        SessionSummaryResponse(
            id=s.id,
            project_id=s.project_id,
            title=s.title,
            output_language=s.output_language,
            status=s.status,
            user_story_count=us_c,
            nfr_count=nfr_c,
            open_question_count=oq_c,
            created_at=s.created_at,
        )
        for s, us_c, nfr_c, oq_c in rows
    ]


@router_projects.post(
    "",
    response_model=SessionCreateResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def create_session(
    project_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    db: DB,
    text_input: Annotated[str | None, Form()] = None,
    output_language: Annotated[str, Form()] = "de",
    title: Annotated[str | None, Form()] = None,
    files: list[UploadFile] = File(default=[]),
) -> SessionCreateResponse:
    # Validate project ownership
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if output_language not in ("de", "en"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="output_language must be 'de' or 'en'",
        )

    has_files = bool(files and any(f.filename for f in files))
    has_text = bool(text_input and text_input.strip())

    if not has_files and not has_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one of text_input or files is required",
        )

    # Validate and read files before persisting the session
    file_inputs: list[tuple[str, bytes, str]] = []
    if has_files:
        validate_total_size(files)
        for f in files:
            content = await f.read()
            _file_parser.validate_file(f.filename, f.content_type, len(content))
            file_inputs.append((f.filename, content, f.content_type))

    # Create the session record
    session = ExtractionSession(
        project_id=project_id,
        title=title,
        output_language=output_language,
        status="pending",
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Persist direct text as a SourceDocument immediately
    if has_text:
        source_doc = SourceDocument(
            session_id=session.id,
            filename="direct_input",
            file_type="text",
            raw_text=text_input.strip(),
        )
        db.add(source_doc)
        db.commit()

    background_tasks.add_task(
        run_extraction,
        str(session.id),
        file_inputs,
        text_input,
        output_language,
        settings.DATABASE_URL,
    )

    return SessionCreateResponse(session_id=session.id, status="processing")


@router_sessions.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session(
    session_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
) -> SessionDetailResponse:
    session = _get_session_or_404(session_id, current_user, db)

    user_stories = (
        db.query(UserStory)
        .filter(UserStory.session_id == session.id, UserStory.is_deleted == False)  # noqa: E712
        .order_by(UserStory.sort_order.asc(), UserStory.created_at.asc())
        .all()
    )
    nfrs = (
        db.query(NonFunctionalRequirement)
        .filter(
            NonFunctionalRequirement.session_id == session.id,
            NonFunctionalRequirement.is_deleted == False,  # noqa: E712
        )
        .order_by(
            NonFunctionalRequirement.sort_order.asc(),
            NonFunctionalRequirement.created_at.asc(),
        )
        .all()
    )
    open_questions = (
        db.query(OpenQuestion)
        .filter(
            OpenQuestion.session_id == session.id,
            OpenQuestion.is_deleted == False,  # noqa: E712
        )
        .order_by(OpenQuestion.sort_order.asc(), OpenQuestion.created_at.asc())
        .all()
    )

    return SessionDetailResponse(
        id=session.id,
        project_id=session.project_id,
        title=session.title,
        output_language=session.output_language,
        status=session.status,
        user_stories=[UserStoryResponse.model_validate(us) for us in user_stories],
        non_functional_requirements=[NFRResponse.model_validate(nfr) for nfr in nfrs],
        open_questions=[OpenQuestionResponse.model_validate(oq) for oq in open_questions],
        created_at=session.created_at,
    )


@router_sessions.get("/{session_id}/status", response_model=SessionStatusResponse)
async def get_session_status(
    session_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
) -> SessionStatusResponse:
    session = _get_session_or_404(session_id, current_user, db)
    return SessionStatusResponse(
        status=session.status,
        progress_message=None,
        error_message=session.error_message,
    )
