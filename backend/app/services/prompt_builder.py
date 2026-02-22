def build_extraction_prompt(text: str, output_language: str) -> str:
    """Return the full prompt string for Gemini requirements extraction."""
    if output_language == "de":
        language_instruction = (
            "Antworte auf Deutsch. User-Story-Felder müssen in deutscher Sprache formuliert sein."
        )
        as_who_example = '"Als [Rolle]", z.B. "Als angemeldeter Benutzer"'
        i_want_example = '"möchte ich [Aktion]", z.B. "möchte ich mein Passwort zurücksetzen"'
        so_that_example = '"damit [Nutzen]", z.B. "damit ich wieder Zugang zu meinem Konto bekomme"'
    else:
        language_instruction = (
            "Respond in English. User Story fields must use English phrasing."
        )
        as_who_example = '"As a [role]", e.g. "As a logged-in user"'
        i_want_example = '"I want to [action]", e.g. "I want to reset my password"'
        so_that_example = '"so that [benefit]", e.g. "so that I can regain access to my account"'

    return f"""You are a requirements engineering expert. Analyze the following document(s) and extract all requirements.

{language_instruction}

Return ONLY a valid JSON object. Do NOT include any explanation, markdown formatting, or code fences (no ```json).

Required JSON structure:
{{
  "user_stories": [
    {{
      "title": "short descriptive title",
      "as_who": {as_who_example},
      "i_want": {i_want_example},
      "so_that": {so_that_example},
      "acceptance_criteria": ["specific testable criterion 1", "criterion 2"],
      "priority": "medium",
      "labels": ["tag1"],
      "source_snippet": "verbatim excerpt from source text, maximum 500 characters"
    }}
  ],
  "non_functional_requirements": [
    {{
      "title": "short descriptive title",
      "category": "performance",
      "description": "detailed description of the requirement",
      "metric": "measurable criterion e.g. < 2s response time, or null if not specified",
      "priority": "medium",
      "source_snippet": "verbatim excerpt from source text, maximum 500 characters"
    }}
  ],
  "open_questions": [
    {{
      "question_text": "question that needs clarification",
      "owner": "responsible person or role if mentioned, or null",
      "source_snippet": "verbatim excerpt from source text, maximum 500 characters"
    }}
  ]
}}

Field constraints (STRICTLY enforce):
- priority: MUST be exactly one of "low", "medium", "high", "critical"
- category: MUST be exactly one of "performance", "security", "usability", "reliability", "maintainability", "compliance"
- source_snippet: verbatim text copied from the document, maximum 500 characters
- acceptance_criteria: array of strings; use empty array [] if none explicitly stated
- labels: array of strings; use empty array [] if none applicable
- metric: string or null
- owner: string or null
- If no items of a category are found, use an empty array []

Document content:
---
{text}
---

Return ONLY the JSON object, nothing else."""
