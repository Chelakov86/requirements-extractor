import json
import uuid
from datetime import datetime, timezone

from app.models import ExtractionSession


class SessionExporter:
    def to_json(self, session: ExtractionSession) -> dict:
        exported_at = datetime.now(timezone.utc).isoformat()

        user_stories = [
            {
                "id": str(us.id),
                "title": us.title,
                "as_who": us.as_who,
                "i_want": us.i_want,
                "so_that": us.so_that,
                "acceptance_criteria": us.acceptance_criteria or [],
                "priority": us.priority,
                "labels": us.labels or [],
                "source_snippet": us.source_snippet,
                "sort_order": us.sort_order,
                "created_at": us.created_at.isoformat(),
                "updated_at": us.updated_at.isoformat() if us.updated_at else None,
            }
            for us in session.user_stories
            if not us.is_deleted
        ]

        non_functional_requirements = [
            {
                "id": str(nfr.id),
                "title": nfr.title,
                "category": nfr.category,
                "description": nfr.description,
                "metric": nfr.metric,
                "priority": nfr.priority,
                "source_snippet": nfr.source_snippet,
                "sort_order": nfr.sort_order,
                "created_at": nfr.created_at.isoformat(),
                "updated_at": nfr.updated_at.isoformat() if nfr.updated_at else None,
            }
            for nfr in session.nfrs
            if not nfr.is_deleted
        ]

        open_questions = [
            {
                "id": str(oq.id),
                "question_text": oq.question_text,
                "owner": oq.owner,
                "status": oq.status,
                "source_snippet": oq.source_snippet,
                "sort_order": oq.sort_order,
                "created_at": oq.created_at.isoformat(),
                "updated_at": oq.updated_at.isoformat() if oq.updated_at else None,
            }
            for oq in session.open_questions
            if not oq.is_deleted
        ]

        return {
            "meta": {
                "session_id": str(session.id),
                "project_id": str(session.project_id),
                "title": session.title,
                "output_language": session.output_language,
                "exported_at": exported_at,
            },
            "user_stories": user_stories,
            "non_functional_requirements": non_functional_requirements,
            "open_questions": open_questions,
        }

    def to_markdown(self, session: ExtractionSession) -> str:
        title = session.title or "Extraction Session"
        exported_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        lines = [
            f"# {title}",
            f"*Exported: {exported_at}*",
            "",
        ]

        # User Stories
        lines.append("## User Stories")
        lines.append("")
        active_stories = [us for us in session.user_stories if not us.is_deleted]
        if active_stories:
            for i, us in enumerate(active_stories, start=1):
                lines.append(f"### US-{i}: {us.title}")
                lines.append(f"**Als** {us.as_who}")
                lines.append(f"**möchte ich** {us.i_want}")
                lines.append(f"**damit** {us.so_that}")
                lines.append("")
                lines.append(f"**Priority:** {us.priority}")
                if us.labels:
                    lines.append(f"**Labels:** {', '.join(us.labels)}")
                lines.append("")
                if us.acceptance_criteria:
                    lines.append("**Acceptance Criteria:**")
                    for criterion in us.acceptance_criteria:
                        lines.append(f"- {criterion}")
                    lines.append("")
                if us.source_snippet:
                    lines.append(f"<details><summary>Source</summary>{us.source_snippet}</details>")
                    lines.append("")
                lines.append("---")
                lines.append("")
        else:
            lines.append("*No user stories.*")
            lines.append("")

        # Non-Functional Requirements
        lines.append("## Non-Functional Requirements")
        lines.append("")
        active_nfrs = [nfr for nfr in session.nfrs if not nfr.is_deleted]
        if active_nfrs:
            lines.append("| # | Title | Category | Metric | Priority |")
            lines.append("|---|-------|----------|--------|----------|")
            for i, nfr in enumerate(active_nfrs, start=1):
                metric = nfr.metric or "—"
                lines.append(f"| {i} | {nfr.title} | {nfr.category} | {metric} | {nfr.priority} |")
            lines.append("")
        else:
            lines.append("*No non-functional requirements.*")
            lines.append("")

        # Open Questions
        lines.append("## Open Questions")
        lines.append("")
        active_questions = [oq for oq in session.open_questions if not oq.is_deleted]
        if active_questions:
            for i, oq in enumerate(active_questions, start=1):
                owner_part = f" *(Owner: {oq.owner})*" if oq.owner else ""
                lines.append(f"{i}. {oq.question_text}{owner_part} — **{oq.status}**")
            lines.append("")
        else:
            lines.append("*No open questions.*")
            lines.append("")

        return "\n".join(lines)
