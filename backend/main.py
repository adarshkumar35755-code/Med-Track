import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel

from system_prompt import build_system_prompt
from trusted_sources import TRUSTED_SOURCES

SYSTEM_PROMPT = build_system_prompt()

# add to imports at top
import base64
from fastapi import File, UploadFile
from prescription_prompt import PRESCRIPTION_PROMPT

VISION_MODEL = "qwen/qwen3.6-27b"  # verify exact name in your Groq console — vision model names shift

load_dotenv()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY is not set. Get a free key at https://console.groq.com/keys "
        "and put it in backend/.env as GROQ_API_KEY=your_key_here"
    )

client = OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
GROQ_MODEL = "llama-3.1-8b-instant"

with open(os.path.join(os.path.dirname(__file__), "knowledge_base.json")) as f:
    KNOWLEDGE_BASE = json.load(f)

app = FastAPI(title="Antibiotic Awareness & Risk Checker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class Source(BaseModel):
    fact: str
    source: str
    url: str


class ChatResponse(BaseModel):
    type: str
    message: str
    quick_replies: list[str]
    sources: list[Source]
    extracted: dict
    risk_tier: str | None
    risk_flags: list[str]
    safe_advice: list[str]
    disclaimer: str
# new endpoint — add near your other routes

@app.get("/content/amr-explainer")
def amr_explainer():
    return KNOWLEDGE_BASE["amr_explainer"]


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages cannot be empty.")

    groq_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + [
        {"role": m.role, "content": m.content} for m in req.messages
    ]

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=groq_messages,
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        parsed = json.loads(response.choices[0].message.content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Model returned malformed JSON.")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Model call failed: {e}")

    flags = parsed.get("risk_flags", []) or []
    advice_map = KNOWLEDGE_BASE["safe_advice"]
    safe_advice = [advice_map[f] for f in flags if f in advice_map]
    if parsed.get("type") == "result" and not safe_advice:
        safe_advice = [advice_map["general_safe"]]

    # Deterministic, hallucination-proof mapping: only keys that genuinely
    # exist in TRUSTED_SOURCES ever become a rendered link.
    source_keys = parsed.get("source_keys", []) or []
    sources = [
        Source(**TRUSTED_SOURCES[k]) for k in source_keys if k in TRUSTED_SOURCES
    ]

    return ChatResponse(
        type=parsed.get("type", "question"),
        message=parsed.get("message", ""),
        quick_replies=parsed.get("quick_replies", []) or [],
        sources=sources,
        extracted=parsed.get("extracted", {}),
        risk_tier=parsed.get("risk_tier"),
        risk_flags=flags,
        safe_advice=safe_advice,
        disclaimer=KNOWLEDGE_BASE["disclaimer"] if parsed.get("type") == "result" else "",
    )

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/content/myths-facts")
def myths_facts():
    return KNOWLEDGE_BASE["myths_facts"]


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages cannot be empty.")

    groq_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + [
        {"role": m.role, "content": m.content} for m in req.messages
    ]

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=groq_messages,
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        parsed = json.loads(response.choices[0].message.content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Model returned malformed JSON.")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Vision model call failed (check console.groq.com for current model names): {e}")

    flags = parsed.get("risk_flags", []) or []
    advice_map = KNOWLEDGE_BASE["safe_advice"]
    safe_advice = [advice_map[f] for f in flags if f in advice_map]
    if parsed.get("type") == "result" and not safe_advice:
        safe_advice = [advice_map["general_safe"]]

    return ChatResponse(
        type=parsed.get("type", "question"),
        message=parsed.get("message", ""),
        quick_replies=parsed.get("quick_replies", []) or [],
        extracted=parsed.get("extracted", {}),
        risk_tier=parsed.get("risk_tier"),
        risk_flags=flags,
        safe_advice=safe_advice,
        disclaimer=KNOWLEDGE_BASE["disclaimer"] if parsed.get("type") == "result" else "",
    )