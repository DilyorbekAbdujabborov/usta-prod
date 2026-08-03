import os
import json
import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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

TARGET_URL = os.getenv("TARGET_URL", "https://demo-test.bsa.uz/api/get-passport-data")
TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "15.0"))


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
        if not re.fullmatch(r"^[A-Za-z]{2}[0-9]{7}$", v):
            raise ValueError(
                "Passport must be 2 Latin letters + 7 digits (e.g., AA1234567)"
            )
        return v


@app.post("/api/get-passport-data")
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
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"Upstream API error: {exc.response.status_code}",
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Upstream API request timed out")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Upstream API unreachable: {str(exc)}")
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Invalid JSON from upstream API")

    return JSONResponse(content=raw_data)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))