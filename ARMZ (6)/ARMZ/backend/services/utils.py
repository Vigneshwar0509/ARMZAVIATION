import bleach
from django.utils.text import slugify


def build_plan_code(value: str) -> str:
    slug = slugify((value or "").strip()).replace("-", "_")
    return slug or "plan"


def sanitize_text(value: str) -> str:
    return bleach.clean((value or "").strip(), tags=[], attributes={}, strip=True)
