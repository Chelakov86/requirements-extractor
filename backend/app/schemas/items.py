from typing import Literal

from pydantic import BaseModel


class UserStoryUpdate(BaseModel):
    title: str | None = None
    as_who: str | None = None
    i_want: str | None = None
    so_that: str | None = None
    acceptance_criteria: list[str] | None = None
    priority: Literal["low", "medium", "high", "critical"] | None = None
    labels: list[str] | None = None


class UserStoryCreate(BaseModel):
    title: str
    as_who: str
    i_want: str
    so_that: str
    acceptance_criteria: list[str] = []
    priority: Literal["low", "medium", "high", "critical"] = "medium"
    labels: list[str] = []


_NFR_CATEGORIES = Literal[
    "performance",
    "security",
    "usability",
    "reliability",
    "maintainability",
    "compliance",
]


class NFRUpdate(BaseModel):
    title: str | None = None
    category: _NFR_CATEGORIES | None = None
    description: str | None = None
    metric: str | None = None
    priority: Literal["low", "medium", "high", "critical"] | None = None


class NFRCreate(BaseModel):
    title: str
    category: _NFR_CATEGORIES
    description: str | None = None
    metric: str | None = None
    priority: Literal["low", "medium", "high", "critical"] = "medium"


class OpenQuestionUpdate(BaseModel):
    question_text: str | None = None
    owner: str | None = None
    status: Literal["open", "resolved"] | None = None


class OpenQuestionCreate(BaseModel):
    question_text: str
    owner: str | None = None
