import re
from fastapi import HTTPException

GMAIL_REGEX = r"^[a-zA-Z0-9._%+-]+@gmail\.com$"

def validate_gmail(email: str):
    if not re.match(GMAIL_REGEX, email):
        raise HTTPException(
            status_code=400,
            detail="Only @gmail.com email addresses are allowed"
        )
