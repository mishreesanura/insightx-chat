import json

from fastapi import APIRouter, HTTPException

import data_engine
from database import (
    create_session,
    get_all_sessions,
    get_session_by_id,
    append_message_pair,
    update_session_name,
    delete_session,
)
from models import Message, SendMessageRequest, RenameSessionRequest
from llm_service import generate_sql, generate_ui_response, generate_session_name

router = APIRouter(prefix="/api/chat", tags=["Chat"])

# ──────────────────────────────────────────────
# Hardcoded fallback when the self-healing loop exhausts all retries
# ──────────────────────────────────────────────
FALLBACK_RESPONSE: dict = {
    "narrative": (
        "I'm sorry, I wasn't able to process that query after multiple attempts. "
        "The question may be too complex or ambiguous for me to translate into a "
        "database query right now. Please try rephrasing your question or breaking "
        "it into simpler parts."
    ),
    "components": json.dumps([
        {
            "type": "card_carousel",
            "cards": [
                {
                    "title": "Query Failed",
                    "description": "Unable to generate a valid SQL query after 3 attempts.",
                    "content": "Try rephrasing your question or asking something simpler.",
                    "trend": {"direction": "neutral", "value": "N/A"},
                    "badges": [{"label": "Error", "variant": "destructive"}],
                }
            ],
        }
    ]),
    "suggested_follow_ups": [
        "Show me total transaction volume by bank",
        "What is the fraud flag rate by device type?",
        "Show me a breakdown of transaction types",
    ],
}


# ──────────────────────────────────────────────
# POST /api/chat/session  – create a new session
# ──────────────────────────────────────────────
@router.post("/session")
async def new_session():
    session = await create_session()
    return {"session_id": session.session_id}


# ──────────────────────────────────────────────
# GET /api/chat/sessions  – list all sessions (archive / sidebar)
# ──────────────────────────────────────────────
@router.get("/sessions")
async def list_sessions():
    sessions = await get_all_sessions()
    return sessions


# ──────────────────────────────────────────────
# PUT /api/chat/session/{session_id}/name  – rename a session
# ──────────────────────────────────────────────
@router.put("/session/{session_id}/name")
async def rename_session(session_id: str, payload: RenameSessionRequest):
    updated = await update_session_name(session_id, payload.name)
    if not updated:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"ok": True, "name": payload.name}


# ──────────────────────────────────────────────
# DELETE /api/chat/session/{session_id}  – delete a session
# ──────────────────────────────────────────────
@router.delete("/session/{session_id}")
async def remove_session(session_id: str):
    deleted = await delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"ok": True}


# ──────────────────────────────────────────────
# GET /api/chat/session/{session_id}  – full history for one session
# ──────────────────────────────────────────────
@router.get("/session/{session_id}")
async def get_session(session_id: str):
    session = await get_session_by_id(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


# ──────────────────────────────────────────────
# POST /api/chat/message  – Two-Pass Self-Healing pipeline
# ──────────────────────────────────────────────
@router.post("/message")
async def send_message(payload: SendMessageRequest):
    session_id = payload.session_id
    query = payload.query

    # 1. Verify session exists & fetch history
    session = await get_session_by_id(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    chat_history = [{"role": m.role, "text": m.text} for m in session.messages]

    # ── 2. Self-Healing Retry Loop (max 3 attempts) ──────────
    MAX_RETRIES = 3
    errors: list[str] = []
    sql_data: list[dict] | None = None

    for attempt in range(MAX_RETRIES):
        try:
            # Pass 1 – Text-to-SQL
            sql_query = await generate_sql(query, chat_history, errors or None)
        except Exception as e:
            errors.append(f"LLM SQL generation error: {str(e)}")
            continue

        try:
            # Execute against DuckDB
            sql_data = data_engine.execute_query(sql_query)
            break  # Success – exit the retry loop
        except Exception as e:
            errors.append(str(e))
            # Loop continues → LLM will receive the error on next attempt

    # ── 3. Build the final response ───────────────────────────
    if sql_data is None:
        # All retries exhausted – return graceful fallback
        final_response = FALLBACK_RESPONSE
    else:
        try:
            # Pass 2 – Data-to-UI
            final_response = await generate_ui_response(query, sql_data, chat_history)
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail=f"UI generation error: {str(e)}",
            )

    # ── 4. Persist ONLY query + final response to MongoDB ─────
    user_message = Message(role="user", text=query)
    model_message = Message(
        role="model",
        text=final_response.get("narrative", ""),
        components=final_response.get("components"),
    )
    await append_message_pair(session_id, user_message, model_message)

    # ── 4b. Auto-generate session name on first message ───────
    if len(chat_history) == 0:
        try:
            name = await generate_session_name(query)
            await update_session_name(session_id, name)
            final_response["session_name"] = name
        except Exception:
            pass  # Non-critical – skip if generation fails

    # ── 5. Return to frontend ─────────────────────────────────
    return final_response
