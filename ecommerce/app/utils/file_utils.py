import os
from uuid import uuid4

UPLOAD_DIR = "app/static/uploads"

# Ensure directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def save_upload_file(upload_file):
    try:
        ext = upload_file.filename.split(".")[-1]
        filename = f"{uuid4()}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)

        with open(filepath, "wb") as f:
            f.write(await upload_file.read())

        return True, filename
    except Exception as e:
        return False, str(e)
