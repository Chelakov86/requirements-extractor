import json
import re
import uuid

from app.models import NonFunctionalRequirement, OpenQuestion, UserStory


class ResponseParseError(Exception):
    pass


def parse_gemini_response(response_text: str) -> dict:
    """
    Parse JSON from a Gemini response string.

    Strips accidental markdown code fences, parses JSON, validates that all
    three required top-level keys are present, and returns the dict.
    Raises ResponseParseError on any failure.
    """
    text = response_text.strip()

    # Strip leading ```json or ``` fence
    text = re.sub(r"^```(?:json)?\s*\n?", "", text)
    # Strip trailing ``` fence
    text = re.sub(r"\n?```\s*$", "", text)
    text = text.strip()

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as e:
        raise ResponseParseError(f"Invalid JSON in Gemini response: {e}") from e

    if not isinstance(parsed, dict):
        raise ResponseParseError("Gemini response JSON is not an object")

    required_keys = {"user_stories", "non_functional_requirements", "open_questions"}
    missing = required_keys - set(parsed.keys())
    if missing:
        raise ResponseParseError(
            f"Missing required keys in Gemini response: {sorted(missing)}"
        )

    return parsed


def map_to_db_models(parsed: dict, session_id: str) -> dict:
    """
    Convert a parsed Gemini response dict into lists of SQLAlchemy model instances.

    Returns a dict with keys "user_stories", "nfrs", and "questions", each
    holding a list of (unsaved) model instances ready to be added to a session.
    """
    session_uuid = uuid.UUID(session_id) if isinstance(session_id, str) else session_id

    user_stories = [
        UserStory(session_id=session_uuid, sort_order=i, **story)
        for i, story in enumerate(parsed.get("user_stories", []))
    ]
    nfrs = [
        NonFunctionalRequirement(session_id=session_uuid, sort_order=i, **nfr)
        for i, nfr in enumerate(parsed.get("non_functional_requirements", []))
    ]
    questions = [
        OpenQuestion(session_id=session_uuid, sort_order=i, **q)
        for i, q in enumerate(parsed.get("open_questions", []))
    ]

    return {"user_stories": user_stories, "nfrs": nfrs, "questions": questions}
