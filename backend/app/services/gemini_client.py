from google import genai

from app.services.prompt_builder import build_extraction_prompt
from app.services.response_parser import ResponseParseError, parse_gemini_response


class ExtractionError(Exception):
    pass


class GeminiClient:
    def __init__(self, api_key: str):
        self._client = genai.Client(api_key=api_key)

    async def extract_requirements(self, text: str, output_language: str) -> dict:
        """
        Call Gemini with a structured output prompt.

        Returns a parsed dict with keys: user_stories, non_functional_requirements,
        open_questions. Raises ExtractionError on API failure or parse error.
        """
        prompt = build_extraction_prompt(text, output_language)
        try:
            response = await self._client.aio.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config={"response_mime_type": "application/json"},
            )
            return parse_gemini_response(response.text)
        except ResponseParseError as e:
            raise ExtractionError(f"Failed to parse Gemini response: {e}") from e
        except ExtractionError:
            raise
        except Exception as e:
            raise ExtractionError(f"Gemini API call failed: {e}") from e
