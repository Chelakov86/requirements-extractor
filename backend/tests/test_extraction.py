"""Tests for the Gemini AI extraction pipeline."""

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy.orm import Session

from app.auth.utils import hash_password
from app.config import settings
from app.models import (
    ExtractionSession,
    NonFunctionalRequirement,
    OpenQuestion,
    Project,
    User,
    UserStory,
)
from app.services.prompt_builder import build_extraction_prompt
from app.services.response_parser import ResponseParseError, parse_gemini_response

# Derive the same test DATABASE_URL used by conftest
_url_base, _db_name = settings.DATABASE_URL.rsplit("/", 1)
TEST_DATABASE_URL = f"{_url_base}/{_db_name}_test"

# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------


def test_prompt_builder_german() -> None:
    prompt = build_extraction_prompt("Some requirements text", "de")
    assert "Als" in prompt
    assert "möchte ich" in prompt
    assert "damit" in prompt
    # Should instruct German output
    assert "Deutsch" in prompt or "German" in prompt


def test_prompt_builder_english() -> None:
    prompt = build_extraction_prompt("Some requirements text", "en")
    assert "As a" in prompt
    assert "I want to" in prompt
    assert "so that" in prompt
    # Should NOT contain German-specific phrasing at the template level
    assert "möchte ich" not in prompt


# ---------------------------------------------------------------------------
# Response parser
# ---------------------------------------------------------------------------

_VALID_RESPONSE = """{
  "user_stories": [
    {
      "title": "Login",
      "as_who": "Als Benutzer",
      "i_want": "möchte ich mich einloggen",
      "so_that": "damit ich Zugang habe",
      "acceptance_criteria": ["Login form exists"],
      "priority": "high",
      "labels": ["auth"],
      "source_snippet": "User can log in"
    }
  ],
  "non_functional_requirements": [
    {
      "title": "Response time",
      "category": "performance",
      "description": "Fast response",
      "metric": "< 2s",
      "priority": "high",
      "source_snippet": "fast response"
    }
  ],
  "open_questions": [
    {
      "question_text": "Which auth provider?",
      "owner": null,
      "source_snippet": "auth provider"
    }
  ]
}"""


def test_response_parser_valid() -> None:
    parsed = parse_gemini_response(_VALID_RESPONSE)
    assert set(parsed.keys()) == {"user_stories", "non_functional_requirements", "open_questions"}
    assert len(parsed["user_stories"]) == 1
    assert parsed["user_stories"][0]["title"] == "Login"
    assert len(parsed["non_functional_requirements"]) == 1
    assert len(parsed["open_questions"]) == 1


def test_response_parser_strips_fences() -> None:
    fenced = f"```json\n{_VALID_RESPONSE}\n```"
    parsed = parse_gemini_response(fenced)
    assert "user_stories" in parsed

    fenced_no_lang = f"```\n{_VALID_RESPONSE}\n```"
    parsed2 = parse_gemini_response(fenced_no_lang)
    assert "user_stories" in parsed2


def test_response_parser_invalid_json() -> None:
    with pytest.raises(ResponseParseError, match="Invalid JSON"):
        parse_gemini_response("this is not json at all }{")


def test_response_parser_missing_keys() -> None:
    with pytest.raises(ResponseParseError, match="Missing required keys"):
        parse_gemini_response('{"user_stories": []}')


# ---------------------------------------------------------------------------
# Full extraction (mocked Gemini)
# ---------------------------------------------------------------------------

_SAMPLE_GEMINI_RESPONSE = {
    "user_stories": [
        {
            "title": "Login",
            "as_who": "Als Benutzer",
            "i_want": "möchte ich mich einloggen",
            "so_that": "damit ich Zugang habe",
            "acceptance_criteria": ["Login form displayed", "JWT token returned"],
            "priority": "high",
            "labels": ["auth"],
            "source_snippet": "Users must be able to log in.",
        }
    ],
    "non_functional_requirements": [
        {
            "title": "Response time",
            "category": "performance",
            "description": "System must respond quickly",
            "metric": "< 2s",
            "priority": "high",
            "source_snippet": "The system must respond within 2 seconds.",
        }
    ],
    "open_questions": [
        {
            "question_text": "Which authentication provider should be used?",
            "owner": None,
            "source_snippet": "auth provider",
        }
    ],
}


async def test_full_extraction_mocked(db_session: Session) -> None:
    """End-to-end extraction with Gemini mocked: verifies DB rows are created correctly."""
    from app.services.extraction_service import run_extraction

    # Set up test data
    user = User(email="extractor@example.com", password_hash=hash_password("pass"))
    db_session.add(user)
    db_session.commit()

    project = Project(user_id=user.id, name="Extraction Test Project")
    db_session.add(project)
    db_session.commit()

    session = ExtractionSession(project_id=project.id, output_language="de", status="pending")
    db_session.add(session)
    db_session.commit()
    session_id = str(session.id)

    with patch("app.services.extraction_service.GeminiClient") as MockGeminiClient:
        mock_instance = MockGeminiClient.return_value
        mock_instance.extract_requirements = AsyncMock(return_value=_SAMPLE_GEMINI_RESPONSE)

        await run_extraction(
            session_id=session_id,
            file_inputs=[],
            text_input="Users must be able to log in. The system must respond within 2 seconds.",
            output_language="de",
            db_url=TEST_DATABASE_URL,
        )

    # Refresh session cache so we see data committed by run_extraction
    db_session.expire_all()

    # Verify session status
    updated_session = db_session.get(ExtractionSession, session.id)
    assert updated_session.status == "completed"

    # Verify UserStory rows
    stories = (
        db_session.query(UserStory)
        .filter(UserStory.session_id == session.id)
        .all()
    )
    assert len(stories) == 1
    assert stories[0].title == "Login"
    assert stories[0].priority == "high"
    assert stories[0].sort_order == 0

    # Verify NFR rows
    nfrs = (
        db_session.query(NonFunctionalRequirement)
        .filter(NonFunctionalRequirement.session_id == session.id)
        .all()
    )
    assert len(nfrs) == 1
    assert nfrs[0].category == "performance"
    assert nfrs[0].metric == "< 2s"

    # Verify OpenQuestion rows
    questions = (
        db_session.query(OpenQuestion)
        .filter(OpenQuestion.session_id == session.id)
        .all()
    )
    assert len(questions) == 1
    assert "authentication provider" in questions[0].question_text
