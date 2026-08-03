import os
import json
import re
import hashlib
import secrets
from fastapi import Depends, FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, Field, field_validator
import httpx

app = FastAPI(
    title="OurID Passport Data API",
    description="Proxy wrapper for the BSA passport data API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def hide_server_errors(request, exc: Exception):
    # Never leak stack traces / upstream details to the caller - anything
    # unexpected just looks like a missing route.
    return JSONResponse(status_code=404, content={"detail": "Not Found"})

TARGET_URL = os.getenv("TARGET_URL", "https://demo-test.bsa.uz/api/get-passport-data")
GET_PIN_URL = os.getenv("GET_PIN_URL", "https://api.birdarcha.uz/v1/oauth/face-id/get-pin")
TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "15.0"))

# Only the sha256 hash is ever stored (in .env, via API_KEY_HASH) - the raw
# key is shown once at provisioning time and cannot be recovered from this.
API_KEY_HASH = os.getenv("API_KEY_HASH", "")

PASSPORT_RE = r"^[A-Za-z]{2}[0-9]{7}$"

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def require_api_key(key: str | None = Depends(api_key_header)) -> None:
    # 404 instead of 401/403 so an unauthenticated caller can't even tell
    # these endpoints exist.
    if not key or not API_KEY_HASH:
        raise HTTPException(status_code=404, detail="Not Found")
    key_hash = hashlib.sha256(key.encode()).hexdigest()
    if not secrets.compare_digest(key_hash, API_KEY_HASH):
        raise HTTPException(status_code=404, detail="Not Found")


class PassportRequest(BaseModel):
    user_pin: str = Field(..., min_length=14, max_length=14, alias="user_pin")
    passport: str = Field(..., min_length=9, max_length=9, alias="passport")

    @field_validator("user_pin", mode="before")
    @classmethod
    def validate_pin(cls, v: str) -> str:
        v = v.strip()
        if not re.fullmatch(r"^[0-9]{14}$", v):
            raise ValueError("JShShIR must be exactly 14 digits")
        return v

    @field_validator("passport", mode="before")
    @classmethod
    def validate_passport(cls, v: str) -> str:
        v = v.strip()
        if not re.fullmatch(PASSPORT_RE, v):
            raise ValueError(
                "Passport must be 2 Latin letters + 7 digits (e.g., AA1234567)"
            )
        return v


@app.post("/api/get-passport-data", dependencies=[Depends(require_api_key)])
async def get_passport_data(request: PassportRequest):
    body = {"user_pin": request.user_pin, "passport": request.passport}
    headers = {
        "accept": "application/json, text/plain, */*",
        "content-type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.post(TARGET_URL, json=body, headers=headers)
            response.raise_for_status()
            raw_data = response.json()
    except httpx.HTTPStatusError as exc:
        # A 4xx from upstream means the passport/PIN itself was rejected -
        # that's useful to the caller. Anything else (5xx, network,
        # malformed JSON) is our/upstream's problem, not theirs: hide it.
        if 400 <= exc.response.status_code < 500:
            raise HTTPException(
                status_code=exc.response.status_code,
                detail="Passport data not found or invalid",
            )
        raise HTTPException(status_code=404, detail="Not Found")
    except (httpx.TimeoutException, httpx.RequestError, json.JSONDecodeError):
        raise HTTPException(status_code=404, detail="Not Found")

    return JSONResponse(content=raw_data)


@app.get("/api/get-pin/{passport}", dependencies=[Depends(require_api_key)])
async def get_pin(passport: str = Path(..., pattern=PASSPORT_RE)):
    headers = {"accept": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(f"{GET_PIN_URL}/{passport}", headers=headers)
            response.raise_for_status()
            raw_data = response.json()
    except httpx.HTTPStatusError as exc:
        # A 4xx from upstream means the passport/PIN itself was rejected -
        # that's useful to the caller. Anything else (5xx, network,
        # malformed JSON) is our/upstream's problem, not theirs: hide it.
        if 400 <= exc.response.status_code < 500:
            raise HTTPException(
                status_code=exc.response.status_code,
                detail="Passport data not found or invalid",
            )
        raise HTTPException(status_code=404, detail="Not Found")
    except (httpx.TimeoutException, httpx.RequestError, json.JSONDecodeError):
        raise HTTPException(status_code=404, detail="Not Found")

    return JSONResponse(content=raw_data)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))