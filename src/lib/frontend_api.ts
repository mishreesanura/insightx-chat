// ─────────────────────────────────────────────────────────────
// InsightX – Frontend API utility
// ─────────────────────────────────────────────────────────────
// IMPORTANT:
//   When consuming `sendMessage()` or `getSessionHistory()`,
//   the `components` field in each model message is a **stringified**
//   JSON array. You MUST call:
//       JSON.parse(response.components)
//   to get the actual array of UI component objects before rendering.
// ─────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── TypeScript Interfaces ──────────────────────────────────

/** A single message stored in a chat session. */
export interface Message {
  role: "user" | "model";
  /** The user's query or the model's narrative text. */
  text: string;
  /**
   * Stringified JSON array of UI components (only on model messages).
   * **You must `JSON.parse()` this before rendering.**
   */
  components?: string;
  timestamp: string; // ISO-8601
}

/** Full chat session returned by `getSessionHistory()`. */
export interface ChatSession {
  session_id: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

/** Lightweight session summary for the sidebar / archive view. */
export interface SessionSummary {
  session_id: string;
  name: string | null;
  created_at: string;
  updated_at: string;
  preview: string | null;
}

/** The structured response returned by the LLM via `sendMessage()`. */
export interface LLMResponse {
  /** Human-readable narrative / explanation. */
  narrative: string;
  /**
   * Stringified JSON array of component objects.
   * **You must `JSON.parse()` this to get the renderable component array.**
   */
  components: string;
  /** Follow-up question suggestions the user can click. */
  suggested_follow_ups: string[];
  /** Auto-generated session name (only present on first message). */
  session_name?: string;
}

// ── API Functions ──────────────────────────────────────────

/**
 * Create a new chat session.
 * @returns The newly created session's `session_id`.
 */
export async function createSession(): Promise<{ session_id: string }> {
  const res = await fetch(`${API_BASE}/api/chat/session`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
}

/**
 * Send a user message and receive the LLM response.
 *
 * **Remember:** `response.components` is a stringified JSON string.
 * Call `JSON.parse(response.components)` to get the UI component array.
 */
export async function sendMessage(
  sessionId: string,
  query: string
): Promise<LLMResponse> {
  const res = await fetch(`${API_BASE}/api/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, query }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}

/**
 * Get all historical sessions sorted by most-recently-updated.
 * Used for the Archive / history sidebar.
 */
export async function getSessions(): Promise<SessionSummary[]> {
  const res = await fetch(`${API_BASE}/api/chat/sessions`);
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return res.json();
}

/**
 * Get the full chat history for a specific session.
 *
 * **Remember:** Each model message's `components` field is stringified JSON.
 * Call `JSON.parse(msg.components)` for every model message before rendering.
 */
export async function getSessionHistory(
  sessionId: string
): Promise<ChatSession> {
  const res = await fetch(`${API_BASE}/api/chat/session/${sessionId}`);
  if (!res.ok) throw new Error("Failed to fetch session history");
  return res.json();
}

/**
 * Rename a session.
 * @returns The updated session name.
 */
export async function renameSession(
  sessionId: string,
  name: string
): Promise<{ ok: boolean; name: string }> {
  const res = await fetch(`${API_BASE}/api/chat/session/${sessionId}/name`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to rename session");
  return res.json();
}

/**
 * Delete a session permanently.
 */
export async function deleteSession(
  sessionId: string
): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/api/chat/session/${sessionId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete session");
  return res.json();
}
