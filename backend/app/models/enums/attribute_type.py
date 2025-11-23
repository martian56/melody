import enum

class AttributeType(str, enum.Enum):
    TEXT = "text"
    SELECT = "select"  # Single select
    MULTI_SELECT = "multi_select"  # Multiple values
    BOOLEAN = "boolean"
    NUMBER = "number"

