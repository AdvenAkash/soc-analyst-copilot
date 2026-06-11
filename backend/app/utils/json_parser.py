"""Robust JSON extraction from LLM output."""
import json
import re
import logging

logger = logging.getLogger(__name__)


def extract_json(text: str) -> dict:
    """Extract JSON from LLM response using multiple fallback strategies."""
    cleaned = re.sub(r"```(?:json)?\s*", "", text)
    cleaned = re.sub(r"```\s*", "", cleaned).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    logger.error("JSON extraction failed. Raw output:\n%s", text[:500])
    raise ValueError(
        f"Could not extract valid JSON from LLM response. First 200 chars: {text[:200]}"
    )
