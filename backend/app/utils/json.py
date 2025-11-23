import json
from typing import Any, Optional

def json_loads(value: Optional[str]) -> Optional[dict]:
    """Parse JSON string to dict"""
    if value is None:
        return None
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return None

def json_dumps(value: Optional[dict]) -> Optional[str]:
    """Serialize dict to JSON string"""
    if value is None:
        return None
    try:
        return json.dumps(value)
    except (TypeError, ValueError):
        return None

