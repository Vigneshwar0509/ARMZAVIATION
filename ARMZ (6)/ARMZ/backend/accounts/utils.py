import bleach


def sanitize_text(value: str) -> str:
    return bleach.clean((value or "").strip(), tags=[], attributes={}, strip=True)
