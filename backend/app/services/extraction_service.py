import asyncio

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models import ExtractionSession


async def run_extraction(
    session_id: str,
    file_inputs: list[tuple[str, bytes, str]],  # (filename, content, content_type)
    text_input: str | None,
    output_language: str,
    db_url: str,  # pass DATABASE_URL since BackgroundTasks run outside request context
) -> None:
    """Placeholder: sets session status to 'completed' without calling Gemini yet."""
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        session = db.get(ExtractionSession, session_id)
        if session is None:
            return

        session.status = "processing"
        db.commit()

        # TODO: parse files, call Gemini, persist items
        await asyncio.sleep(1)

        db.refresh(session)
        session.status = "completed"
        db.commit()
    except Exception:
        db.rollback()
        try:
            session = db.get(ExtractionSession, session_id)
            if session:
                session.status = "error"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()
        engine.dispose()
