import uuid

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.models import (
    ExtractionSession,
    NonFunctionalRequirement,
    OpenQuestion,
    SourceDocument,
    UserStory,
)
from app.services.file_parser import FileParser, ParsedDocument
from app.services.gemini_client import GeminiClient


async def run_extraction(
    session_id: str,
    file_inputs: list[tuple[str, bytes, str]],  # (filename, content, content_type)
    text_input: str | None,
    output_language: str,
    db_url: str,  # pass DATABASE_URL since BackgroundTasks run outside request context
) -> None:
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    session = None
    try:
        session_uuid = uuid.UUID(session_id)
        session = db.get(ExtractionSession, session_uuid)
        if session is None:
            return

        session.status = "processing"
        db.commit()

        # 1. Parse all files
        parser = FileParser()
        documents: list[ParsedDocument] = []
        warnings: list[str] = []
        for filename, content, content_type in file_inputs:
            try:
                doc = parser.parse(filename, content, content_type)
                documents.append(doc)
            except HTTPException as e:
                detail = e.detail if isinstance(e.detail, dict) else {}
                warnings.append(detail.get("message", str(e.detail)))

        # 2. Add text input
        if text_input and text_input.strip():
            stripped = text_input.strip()
            documents.append(ParsedDocument("direct_input", "text", stripped, len(stripped)))

        # 3. Persist SourceDocuments
        for doc in documents:
            db.add(
                SourceDocument(
                    session_id=session_uuid,
                    filename=doc.filename,
                    file_type=doc.file_type,
                    raw_text=doc.raw_text,
                )
            )
        db.commit()

        # 4. Build combined text (truncate to ~150,000 chars to stay within token limits)
        combined_text = "\n\n---\n\n".join(doc.raw_text for doc in documents)[:150_000]

        # 5. Call Gemini
        client = GeminiClient(settings.GEMINI_API_KEY)
        response = await client.extract_requirements(combined_text, output_language)

        # 6. Persist items
        for i, story in enumerate(response.get("user_stories", [])):
            db.add(UserStory(session_id=session_uuid, sort_order=i, **story))
        for i, nfr in enumerate(response.get("non_functional_requirements", [])):
            db.add(NonFunctionalRequirement(session_id=session_uuid, sort_order=i, **nfr))
        for i, q in enumerate(response.get("open_questions", [])):
            db.add(OpenQuestion(session_id=session_uuid, sort_order=i, **q))

        session.status = "completed"
        if warnings:
            session.error_message = "Warnings: " + "; ".join(warnings)
        db.commit()

    except Exception as e:
        if session is not None:
            try:
                db.refresh(session)
                session.status = "failed"
                session.error_message = str(e)
                db.commit()
            except Exception:
                db.rollback()
        raise
    finally:
        db.close()
        engine.dispose()
