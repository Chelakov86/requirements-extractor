import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import (
    ExtractionSession,
    NonFunctionalRequirement,
    OpenQuestion,
    Project,
    User,
    UserStory,
)
from app.schemas.items import (
    NFRCreate,
    NFRUpdate,
    OpenQuestionCreate,
    OpenQuestionUpdate,
    UserStoryCreate,
    UserStoryUpdate,
)
from app.schemas.session import NFRResponse, OpenQuestionResponse, UserStoryResponse

router = APIRouter()

CurrentUser = Annotated[User, Depends(get_current_user)]
DB = Annotated[Session, Depends(get_db)]


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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SESSION_NOT_FOUND")
    return session


def _get_item_or_404(model, item_id: uuid.UUID, session_id: uuid.UUID, db: Session):
    item = (
        db.query(model)
        .filter(model.id == item_id, model.session_id == session_id)
        .first()
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ITEM_NOT_FOUND")
    return item


def _next_sort_order(model, session_id: uuid.UUID, db: Session) -> int:
    max_order = (
        db.query(func.max(model.sort_order))
        .filter(model.session_id == session_id)
        .scalar()
    )
    return (max_order + 1) if max_order is not None else 0


# ── User Stories ──────────────────────────────────────────────────────────────


@router.post(
    "/{session_id}/user-stories",
    response_model=UserStoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user_story(
    session_id: uuid.UUID,
    body: UserStoryCreate,
    current_user: CurrentUser,
    db: DB,
) -> UserStoryResponse:
    session = _get_session_or_404(session_id, current_user, db)
    item = UserStory(
        session_id=session.id,
        sort_order=_next_sort_order(UserStory, session.id, db),
        **body.model_dump(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return UserStoryResponse.model_validate(item)


@router.patch(
    "/{session_id}/user-stories/{item_id}",
    response_model=UserStoryResponse,
)
def update_user_story(
    session_id: uuid.UUID,
    item_id: uuid.UUID,
    body: UserStoryUpdate,
    current_user: CurrentUser,
    db: DB,
) -> UserStoryResponse:
    _get_session_or_404(session_id, current_user, db)
    item = _get_item_or_404(UserStory, item_id, session_id, db)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return UserStoryResponse.model_validate(item)


@router.delete(
    "/{session_id}/user-stories/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_user_story(
    session_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
) -> None:
    _get_session_or_404(session_id, current_user, db)
    item = _get_item_or_404(UserStory, item_id, session_id, db)
    item.is_deleted = True
    item.updated_at = datetime.now(timezone.utc)
    db.commit()


@router.post(
    "/{session_id}/user-stories/{item_id}/restore",
    response_model=UserStoryResponse,
)
def restore_user_story(
    session_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
) -> UserStoryResponse:
    _get_session_or_404(session_id, current_user, db)
    item = _get_item_or_404(UserStory, item_id, session_id, db)
    item.is_deleted = False
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return UserStoryResponse.model_validate(item)


# ── NFRs ──────────────────────────────────────────────────────────────────────


@router.post(
    "/{session_id}/nfrs",
    response_model=NFRResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_nfr(
    session_id: uuid.UUID,
    body: NFRCreate,
    current_user: CurrentUser,
    db: DB,
) -> NFRResponse:
    session = _get_session_or_404(session_id, current_user, db)
    item = NonFunctionalRequirement(
        session_id=session.id,
        sort_order=_next_sort_order(NonFunctionalRequirement, session.id, db),
        **body.model_dump(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return NFRResponse.model_validate(item)


@router.patch(
    "/{session_id}/nfrs/{item_id}",
    response_model=NFRResponse,
)
def update_nfr(
    session_id: uuid.UUID,
    item_id: uuid.UUID,
    body: NFRUpdate,
    current_user: CurrentUser,
    db: DB,
) -> NFRResponse:
    _get_session_or_404(session_id, current_user, db)
    item = _get_item_or_404(NonFunctionalRequirement, item_id, session_id, db)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return NFRResponse.model_validate(item)


@router.delete(
    "/{session_id}/nfrs/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_nfr(
    session_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
) -> None:
    _get_session_or_404(session_id, current_user, db)
    item = _get_item_or_404(NonFunctionalRequirement, item_id, session_id, db)
    item.is_deleted = True
    item.updated_at = datetime.now(timezone.utc)
    db.commit()


@router.post(
    "/{session_id}/nfrs/{item_id}/restore",
    response_model=NFRResponse,
)
def restore_nfr(
    session_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
) -> NFRResponse:
    _get_session_or_404(session_id, current_user, db)
    item = _get_item_or_404(NonFunctionalRequirement, item_id, session_id, db)
    item.is_deleted = False
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return NFRResponse.model_validate(item)


# ── Open Questions ────────────────────────────────────────────────────────────


@router.post(
    "/{session_id}/questions",
    response_model=OpenQuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_open_question(
    session_id: uuid.UUID,
    body: OpenQuestionCreate,
    current_user: CurrentUser,
    db: DB,
) -> OpenQuestionResponse:
    session = _get_session_or_404(session_id, current_user, db)
    item = OpenQuestion(
        session_id=session.id,
        sort_order=_next_sort_order(OpenQuestion, session.id, db),
        **body.model_dump(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return OpenQuestionResponse.model_validate(item)


@router.patch(
    "/{session_id}/questions/{item_id}",
    response_model=OpenQuestionResponse,
)
def update_open_question(
    session_id: uuid.UUID,
    item_id: uuid.UUID,
    body: OpenQuestionUpdate,
    current_user: CurrentUser,
    db: DB,
) -> OpenQuestionResponse:
    _get_session_or_404(session_id, current_user, db)
    item = _get_item_or_404(OpenQuestion, item_id, session_id, db)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return OpenQuestionResponse.model_validate(item)


@router.delete(
    "/{session_id}/questions/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_open_question(
    session_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
) -> None:
    _get_session_or_404(session_id, current_user, db)
    item = _get_item_or_404(OpenQuestion, item_id, session_id, db)
    item.is_deleted = True
    item.updated_at = datetime.now(timezone.utc)
    db.commit()


@router.post(
    "/{session_id}/questions/{item_id}/restore",
    response_model=OpenQuestionResponse,
)
def restore_open_question(
    session_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
) -> OpenQuestionResponse:
    _get_session_or_404(session_id, current_user, db)
    item = _get_item_or_404(OpenQuestion, item_id, session_id, db)
    item.is_deleted = False
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return OpenQuestionResponse.model_validate(item)
