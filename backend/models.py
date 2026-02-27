from datetime import datetime, timezone
from typing import List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


# ──────────────────────────────────────────────
# Core domain models
# ──────────────────────────────────────────────

class Message(BaseModel):
    """A single message inside a chat session."""
    role: str = Field(..., pattern="^(user|model)$", description="Either 'user' or 'model'")
    text: str = Field(..., description="The query (user) or narrative text (model)")
    components: Optional[str] = Field(
        None,
        description="Stringified JSON array of UI components (only present for model messages)",
    )
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChatSession(BaseModel):
    """Represents one conversation thread."""
    session_id: str = Field(default_factory=lambda: str(uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    messages: List[Message] = Field(default_factory=list)


# ──────────────────────────────────────────────
# Request / Response schemas for the API
# ──────────────────────────────────────────────

class SendMessageRequest(BaseModel):
    session_id: str
    query: str


class LLMResponse(BaseModel):
    """What the Gemini LLM returns (and what we forward to the frontend)."""
    narrative: str
    components: str  # stringified JSON array – frontend must JSON.parse() this
    suggested_follow_ups: List[str] = []


class SessionSummary(BaseModel):
    """Lightweight session object returned for the history sidebar / archive."""
    session_id: str
    created_at: datetime
    updated_at: datetime
    preview: Optional[str] = None  # first user message text, if any
