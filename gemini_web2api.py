import os
import time
import json
from typing import List, Dict, Any, Optional

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Load environment variables (optionally from a .env file)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("[WARN] GEMINI_API_KEY not set – requests will fail with authentication error.")

GEMINI_API_BASE = os.getenv(
    "GEMINI_API_BASE_URL",
    "https://generativelanguage.googleapis.com/v1beta/models",
)

DEFAULT_MODEL = os.getenv("GEMINI_DEFAULT_MODEL", "gemini-3.8-flash")

app = FastAPI(title="Gemini OpenAI‑compatible proxy")

# ISS-018: Restrict CORS to explicit origin allowlist instead of wildcard.
# Wildcard + credentials is rejected by browsers and creates CSRF risk.
_cors_origins_raw = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3001,http://localhost:5000,http://localhost:5173,http://127.0.0.1:3001,http://127.0.0.1:5000"
)
_allowed_origins = [o.strip() for o in _cors_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)

class Message(BaseModel):
    role: str = Field(..., description="One of 'system', 'user', 'assistant'")
    content: str = Field(..., description="Message content")

class ChatCompletionRequest(BaseModel):
    model: Optional[str] = Field(None, description="Gemini model name – defaults to env or gemini‑1.5‑flash")
    messages: List[Message]
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    max_tokens: Optional[int] = None
    stream: Optional[bool] = False

class ChatChoice(BaseModel):
    index: int = 0
    message: Message
    finish_reason: str = "stop"

class ChatCompletionResponse(BaseModel):
    id: str = "gemini-proxy"
    object: str = "chat.completion"
    created: int
    model: str
    choices: List[ChatChoice]

def translate_to_gemini(payload: ChatCompletionRequest) -> Dict[str, Any]:
    model_name = payload.model or DEFAULT_MODEL
    contents = []
    for msg in payload.messages:
        contents.append({
            "role": msg.role,
            "parts": [{"text": msg.content}],
        })
    params = {"key": GEMINI_API_KEY} if GEMINI_API_KEY else {}
    gemini_payload: Dict[str, Any] = {
        "contents": contents,
        "generationConfig": {},
    }
    if payload.temperature is not None:
        gemini_payload["generationConfig"]["temperature"] = payload.temperature
    if payload.max_tokens is not None:
        gemini_payload["generationConfig"]["maxOutputTokens"] = payload.max_tokens
    if payload.top_p is not None:
        gemini_payload["generationConfig"]["topP"] = payload.top_p
    if not gemini_payload["generationConfig"]:
        del gemini_payload["generationConfig"]
    if payload.stream:
        return {"url": f"{GEMINI_API_BASE}/{model_name}:streamGenerateContent?alt=sse", "params": params, "json": gemini_payload}
    return {"url": f"{GEMINI_API_BASE}/{model_name}:generateContent", "params": params, "json": gemini_payload}

@app.get("/v1/models")
async def list_models():
    models_list = [
        "gemini-3.8-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.1-pro-preview",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
    ]
    return {
        "object": "list",
        "data": [
            {
                "id": m,
                "object": "model",
                "created": int(time.time()),
                "owned_by": "google",
            }
            for m in models_list
        ],
    }

@app.post("/v1/chat/completions")
async def chat_completions(request: Request, body: ChatCompletionRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=401, detail="GEMINI_API_KEY not configured")
    try:
        gemini_req = translate_to_gemini(body)
        if body.stream:
            async def generate_sse():
                async with httpx.AsyncClient(timeout=30.0) as client:
                    async with client.stream("POST", gemini_req["url"], params=gemini_req["params"], json=gemini_req["json"]) as response:
                        response.raise_for_status()
                        async for chunk in response.aiter_lines():
                            if chunk:
                                if chunk.startswith("data: "):
                                    try:
                                        chunk_data = json.loads(chunk[6:])
                                        text = chunk_data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                                        out_chunk = {
                                            "id": "gemini-proxy",
                                            "object": "chat.completion.chunk",
                                            "created": int(time.time()),
                                            "model": body.model or DEFAULT_MODEL,
                                            "choices": [{"index": 0, "delta": {"content": text}, "finish_reason": None}]
                                        }
                                        yield f"data: {json.dumps(out_chunk)}\n\n"
                                    except Exception:
                                        pass
                yield "data: [DONE]\n\n"
            return StreamingResponse(generate_sse(), media_type="text/event-stream")

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(gemini_req["url"], params=gemini_req["params"], json=gemini_req["json"]) 
        resp.raise_for_status()
        data = resp.json()
        candidate_text = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
        )
        out = ChatCompletionResponse(
            created=int(time.time()),
            model=body.model or DEFAULT_MODEL,
            choices=[
                ChatChoice(
                    index=0,
                    message=Message(role="assistant", content=candidate_text),
                    finish_reason="stop",
                )
            ],
        )
        return JSONResponse(content=out.dict())
    except httpx.HTTPStatusError as exc:
        try:
            err_detail = exc.response.json()
        except Exception:
            err_detail = exc.response.text
        raise HTTPException(status_code=exc.response.status_code, detail=err_detail)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "gemini_web2api:app",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8081")),
        log_level="info",
    )
