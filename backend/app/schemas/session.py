from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SessionCreateResponse(BaseModel):
    session_id: UUID
    status: str  # "processing"


class SessionStatusResponse(BaseModel):
    status: str
    progress_message: str | None = None
    error_message: str | None = None


class UserStoryResponse(BaseModel):
    id: UUID
    title: str
    as_who: str
    i_want: str
    so_that: str
    acceptance_criteria: list[str] | None = []
    priority: str
    labels: list[str] | None = []
    source_snippet: str | None = None
    sort_order: int | None = None
    created_at: datetime
    updated_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


class NFRResponse(BaseModel):
    id: UUID
    title: str
    category: str
    description: str | None = None
    metric: str | None = None
    priority: str
    source_snippet: str | None = None
    sort_order: int | None = None
    created_at: datetime
    updated_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


class OpenQuestionResponse(BaseModel):
    id: UUID
    question_text: str
    owner: str | None = None
    status: str
    source_snippet: str | None = None
    sort_order: int | None = None
    created_at: datetime
    updated_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


class SessionSummaryResponse(BaseModel):
    id: UUID
    project_id: UUID
    title: str | None
    output_language: str
    status: str
    user_story_count: int
    nfr_count: int
    open_question_count: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SessionDetailResponse(BaseModel):
    id: UUID
    project_id: UUID
    title: str | None
    output_language: str
    status: str
    user_stories: list[UserStoryResponse]
    non_functional_requirements: list[NFRResponse]
    open_questions: list[OpenQuestionResponse]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
