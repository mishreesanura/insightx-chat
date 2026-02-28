import os
from datetime import datetime, timezone
from typing import List, Optional

import certifi
from motor.motor_asyncio import AsyncIOMotorClient

from models import ChatSession, Message, SessionSummary

from dotenv import load_dotenv
load_dotenv()

# ──────────────────────────────────────────────
# MongoDB connection management
# ──────────────────────────────────────────────

_client: Optional[AsyncIOMotorClient] = None
_db = None


async def connect_db():
    """Open the MongoDB connection (called at app startup)."""
    global _client, _db
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/insightx").strip()
    _client = AsyncIOMotorClient(
        mongo_uri,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
        socketTimeoutMS=10000,
        tlsCAFile=certifi.where(),
    )
    _db = _client.get_default_database("insightx")
    # Verify connectivity with a fast ping
    try:
        await _client.admin.command("ping")
        print(f"✅  Connected to MongoDB – database: {_db.name}")
    except Exception as e:
        print(f"⚠️  MongoDB ping failed: {e}  (operations will retry on demand)")


async def close_db():
    """Close the MongoDB connection (called at app shutdown)."""
    global _client
    if _client:
        _client.close()
        print("🔌  MongoDB connection closed")


def _get_collection():
    """Return the 'chat_sessions' collection."""
    return _db["chat_sessions"]


# ──────────────────────────────────────────────
# Helper functions
# ──────────────────────────────────────────────

async def create_session() -> ChatSession:
    """Create a new empty chat session and persist it."""
    session = ChatSession()
    await _get_collection().insert_one(session.model_dump())
    return session


async def get_all_sessions() -> List[SessionSummary]:
    """Return all sessions sorted by most-recently-updated first."""
    cursor = _get_collection().find(
        {},
        {
            "session_id": 1,
            "name": 1,
            "created_at": 1,
            "updated_at": 1,
            "messages": {"$slice": 1},  # first message for preview
            "_id": 0,
        },
    ).sort("updated_at", -1)

    sessions: List[SessionSummary] = []
    async for doc in cursor:
        preview = None
        if doc.get("messages"):
            first_msg = doc["messages"][0]
            preview = first_msg.get("text", "")[:120]
        sessions.append(
            SessionSummary(
                session_id=doc["session_id"],
                name=doc.get("name"),
                created_at=doc["created_at"],
                updated_at=doc["updated_at"],
                preview=preview,
            )
        )
    return sessions


async def get_session_by_id(session_id: str) -> Optional[ChatSession]:
    """Retrieve a full session (with all messages) by its session_id."""
    doc = await _get_collection().find_one(
        {"session_id": session_id}, {"_id": 0}
    )
    if doc is None:
        return None
    return ChatSession(**doc)


async def append_message_pair(
    session_id: str,
    user_message: Message,
    model_message: Message,
) -> bool:
    """
    Atomically append the [UserQuery, FinalUIResponse] pair to a session.
    Only the user's original query and the final rendered response are stored
    (no intermediate SQL or raw data).
    """
    now = datetime.now(timezone.utc)
    result = await _get_collection().update_one(
        {"session_id": session_id},
        {
            "$push": {
                "messages": {
                    "$each": [
                        user_message.model_dump(),
                        model_message.model_dump(),
                    ]
                }
            },
            "$set": {"updated_at": now},
        },
    )
    return result.modified_count == 1


async def update_session_name(session_id: str, name: str) -> bool:
    """Set or update the session's display name."""
    result = await _get_collection().update_one(
        {"session_id": session_id},
        {"$set": {"name": name}},
    )
    return result.modified_count == 1


async def delete_session(session_id: str) -> bool:
    """Permanently delete a chat session."""
    result = await _get_collection().delete_one({"session_id": session_id})
    return result.deleted_count == 1
