"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  ArrowUp,
  Sparkles,
  Star,
  Settings,
  MessageSquare,
  Archive,
  Moon,
  Sun,
  BarChart3,
  TrendingUp,
  Clock,
  ShieldAlert,
  Pencil,
  Check,
  X,
  Trash2,
  Plus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DynamicComponentRenderer } from "@/components/dynamic-renderer";
import {
  createSession,
  sendMessage,
  getSessions,
  getSessionHistory,
  renameSession,
  deleteSession,
  type LLMResponse,
  type SessionSummary,
} from "@/lib/frontend_api";

/* ───────────────────────────────────────────────
   TypeScript Interfaces
   ─────────────────────────────────────────────── */
interface ChatMessage {
  role: "user" | "assistant";
  content?: string;
  narrative?: string;
  components?: any[];
  suggested_follow_ups?: string[];
}

/* ───────────────────────────────────────────────
   Message Bubble
   ─────────────────────────────────────────────── */
function MessageBubble({
  message,
  onFollowUp,
  onInteraction,
  compact = false,
}: {
  message: ChatMessage;
  onFollowUp?: (text: string) => void;
  onInteraction?: (parameterName: string, value: string) => void;
  compact?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex max-w-4xl animate-fade-in-up",
        compact ? "gap-2" : "gap-3",
        isUser ? "ml-auto flex-row-reverse" : "",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full text-xs font-bold mt-1",
          compact ? "h-6 w-6" : "h-8 w-8",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-gradient-to-br from-blue-600 to-violet-600 text-white",
        )}
      >
        {isUser ? "U" : "AI"}
      </div>

      {/* Content */}
      <div
        className={cn(
          "flex flex-col gap-1 max-w-[calc(100%-48px)]",
          isUser ? "items-end" : "items-start",
        )}
      >
        {/* User text or AI narrative */}
        {message.content && (
          <div
            className={cn(
              "rounded-2xl text-[14px] leading-relaxed",
              compact ? "px-3 py-1.5" : "px-4 py-2.5",
              isUser
                ? "bg-primary text-primary-foreground rounded-tr-md"
                : "bg-muted rounded-tl-md",
            )}
          >
            {message.content}
          </div>
        )}
        {message.narrative && (
          <div className={cn(
            "rounded-2xl bg-muted/50 rounded-tl-md text-[14px] leading-relaxed text-foreground/90",
            compact ? "px-3 py-1.5" : "px-4 py-2.5",
          )}>
            {message.narrative}
          </div>
        )}

        {/* Dynamic Components rendered via shadcn */}
        {message.components && (
          <div className="w-full mt-1">
            {message.components.map((comp: any, idx: number) => (
              <DynamicComponentRenderer
                key={idx}
                component={comp}
                onInteraction={onInteraction}
              />
            ))}
          </div>
        )}

        {/* Suggested Follow-ups */}
        {message.suggested_follow_ups &&
          message.suggested_follow_ups.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {message.suggested_follow_ups.map((q: string, i: number) => (
                <button
                  key={i}
                  onClick={() => onFollowUp?.(q)}
                  className="px-3 py-1.5 text-xs rounded-full border border-border/50 bg-card/30 text-muted-foreground hover:text-foreground hover:bg-card/60 hover:border-primary/30 transition-all duration-200"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────
   Loading Skeleton for view switching
   ─────────────────────────────────────────────── */
function ViewSkeleton() {
  return (
    <div className="p-6 max-w-4xl mx-auto w-full space-y-4 animate-pulse">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="space-y-3 mt-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────
   MAIN APP
   ─────────────────────────────────────────────── */
export default function InsightXApp() {
  const [activeView, setActiveView] = useState<"chat" | "archive" | "settings">(
    "chat",
  );
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isCompactMode, setIsCompactMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("insightx-compact") === "true";
    }
    return false;
  });
  const [isAutoScroll, setIsAutoScroll] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("insightx-autoscroll");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });
  const [isSaveChatHistory, setIsSaveChatHistory] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("insightx-save-history");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isViewTransitioning, setIsViewTransitioning] = useState(false);

  // Session management
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState(false);
  const [archiveItems, setArchiveItems] = useState<SessionSummary[]>([]);
  const [starredSessions, setStarredSessions] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("insightx-starred");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Dark mode toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isAutoScroll) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAutoScroll]);

  // Create a session on mount (with retry)
  const initSession = async () => {
    setSessionError(false);
    try {
      const res = await createSession();
      setSessionId(res.session_id);
    } catch (err) {
      console.error("Session creation failed:", err);
      setSessionError(true);
    }
  };

  useEffect(() => {
    initSession();
  }, []);

  // Load archive items
  useEffect(() => {
    if (activeView === "archive") {
      getSessions()
        .then(setArchiveItems)
        .catch(console.error);
    }
  }, [activeView]);

  // View switch with skeleton
  const switchView = (view: "chat" | "archive" | "settings") => {
    if (view === activeView) return;
    setIsViewTransitioning(true);
    setTimeout(() => {
      setActiveView(view);
      setIsViewTransitioning(false);
    }, 300);
  };

  // Load an archived session into the chat view
  const loadSession = async (sid: string) => {
    try {
      const session = await getSessionHistory(sid);
      setSessionId(sid);
      const loaded: ChatMessage[] = session.messages.map((m) => {
        if (m.role === "user") {
          return { role: "user" as const, content: m.text };
        }
        const parsed = m.components ? JSON.parse(m.components) : undefined;
        return {
          role: "assistant" as const,
          narrative: m.text,
          components: parsed,
        };
      });
      setMessages(loaded);
      switchView("chat");
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  };

  // Rename session
  const handleRename = async (sid: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditingSessionId(null);
      return;
    }
    try {
      await renameSession(sid, trimmed);
      setArchiveItems((prev) =>
        prev.map((item) =>
          item.session_id === sid ? { ...item, name: trimmed } : item,
        ),
      );
    } catch (err) {
      console.error("Failed to rename session:", err);
    } finally {
      setEditingSessionId(null);
    }
  };

  // Delete a session
  const handleDeleteSession = async (sid: string) => {
    try {
      await deleteSession(sid);
      setArchiveItems((prev) => prev.filter((i) => i.session_id !== sid));
      setStarredSessions((prev) => {
        const next = new Set(prev);
        next.delete(sid);
        localStorage.setItem("insightx-starred", JSON.stringify([...next]));
        return next;
      });
      // If we just deleted the active session, reset chat
      if (sessionId === sid) {
        setSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  // Start a brand-new chat session
  const startNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setInputValue("");
    setSessionError(false);
    switchView("chat");
  };

  // Send message
  const handleSend = async (text?: string) => {
    const msg = text || inputValue.trim();
    if (!msg) return;

    // Auto-create session if missing
    let sid = sessionId;
    if (!sid) {
      try {
        const res = await createSession();
        sid = res.session_id;
        setSessionId(sid);
        setSessionError(false);
      } catch {
        setSessionError(true);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            narrative:
              "Unable to connect to the server. Please make sure the backend is running and try again.",
          },
        ]);
        return;
      }
    }

    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response: LLMResponse = await sendMessage(sid, msg);
      const components = response.components
        ? JSON.parse(response.components)
        : undefined;

      // Update archive name if LLM generated one (first message)
      if (response.session_name) {
        setArchiveItems((prev) =>
          prev.map((item) =>
            item.session_id === sid
              ? { ...item, name: response.session_name! }
              : item,
          ),
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          narrative: response.narrative,
          components,
          suggested_follow_ups: response.suggested_follow_ups,
        },
      ]);
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          narrative:
            "Sorry, something went wrong while processing your request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle interactive component selections (select, date picker)
  const handleInteraction = (parameterName: string, value: string) => {
    handleSend(`${parameterName}: ${value}`);
  };

  // Get greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* ─── Top Navigation ─── */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between px-4 md:px-6 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          
          <span className="text-lg font-bold tracking-tight">Finsight.AI</span>
        </div>

        {/* Pill Tabs */}
        <div className="flex items-center rounded-full bg-muted/40 p-1 border border-border/50">
          {(
            [
              { key: "chat", label: "Chat", icon: MessageSquare },
              { key: "archive", label: "Archive", icon: Archive },
              { key: "settings", label: "Settings", icon: Settings },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => switchView(tab.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
                activeView === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={startNewChat}
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {isViewTransitioning ? (
          <ViewSkeleton />
        ) : (
          <>
            {/* ═══ CHAT VIEW ═══ */}
            {activeView === "chat" && (
              <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-36 pt-6">
                <div className="max-w-3xl mx-auto w-full">
                  {messages.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center pt-16 md:pt-24 animate-fade-in-up">
                      <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight text-center">
                        {getGreeting()}!
                      </h1>
                      <p className="text-lg text-muted-foreground mb-10 text-center">
                        I am ready to help you analyze your data.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                        {[
                          {
                            title: "Descriptive",
                            desc: "What happened in the last 24 hours?",
                            icon: BarChart3,
                            color: "from-blue-500/10 to-blue-600/5",
                          },
                          {
                            title: "Comparative",
                            desc: "Compare P2M vs Bill Payments",
                            icon: TrendingUp,
                            color: "from-emerald-500/10 to-emerald-600/5",
                          },
                          {
                            title: "Temporal",
                            desc: "Show me the hourly trend",
                            icon: Clock,
                            color: "from-amber-500/10 to-amber-600/5",
                          },
                          {
                            title: "Risk Analysis",
                            desc: "Identify anomalous transactions",
                            icon: ShieldAlert,
                            color: "from-red-500/10 to-red-600/5",
                          },
                        ].map((card, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(card.desc)}
                            className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/60 hover:border-primary/30 transition-all duration-200 text-left group"
                          >
                            <div
                              className={cn(
                                "h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br flex items-center justify-center",
                                card.color,
                              )}
                            >
                              <card.icon
                                size={18}
                                className="text-foreground/70 group-hover:text-foreground transition-colors"
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">
                                {card.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {card.desc}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Message Thread */
                    <div className={cn("space-y-6", isCompactMode && "space-y-3")}>
                      {messages.map((msg, idx) => (
                        <MessageBubble
                          key={idx}
                          message={msg}
                          compact={isCompactMode}
                          onFollowUp={handleSend}
                          onInteraction={handleInteraction}
                        />
                      ))}
                      {isLoading && (
                        <div className="flex gap-3 animate-fade-in-up">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white text-xs font-bold">
                            AI
                          </div>
                          <div className="flex gap-1 items-center px-4 py-3 bg-muted/50 rounded-2xl rounded-tl-md">
                            <div
                              className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            />
                            <div
                              className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            />
                            <div
                              className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══ ARCHIVE VIEW ═══ */}
            {activeView === "archive" && (
              <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-6">
                <div className="max-w-3xl mx-auto w-full animate-fade-in-up">
                  <h2 className="text-2xl font-bold mb-1">Chat Archive</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Your previous analysis sessions
                  </p>

                  {/* ── Starred Sessions ── */}
                  {(() => {
                    const starred = archiveItems.filter((i) =>
                      starredSessions.has(i.session_id),
                    );
                    if (starred.length === 0) return null;
                    return (
                      <div className="mb-8">
                        <div className="flex items-center gap-2 mb-3">
                          <Star
                            size={16}
                            className="text-yellow-500"
                            fill="currentColor"
                          />
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-yellow-500">
                            Starred
                          </h3>
                          <Separator className="flex-1 ml-1" />
                        </div>
                        <div className="space-y-2">
                          {starred.map((item) => {
                            const isEditing = editingSessionId === item.session_id;
                            const displayName = item.name || item.preview || "Untitled Session";
                            return (
                              <div
                                key={item.session_id}
                                className="flex items-center gap-3 w-full p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 hover:border-yellow-500/30 transition-all duration-200 group"
                              >
                                {isEditing ? (
                                  <div className="flex-1 min-w-0 flex items-center gap-2">
                                    <input
                                      autoFocus
                                      value={editingName}
                                      onChange={(e) => setEditingName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleRename(item.session_id);
                                        if (e.key === "Escape") setEditingSessionId(null);
                                      }}
                                      className="flex-1 bg-transparent border-b border-yellow-500/40 text-sm text-foreground outline-none py-0.5"
                                    />
                                    <button
                                      onClick={() => handleRename(item.session_id)}
                                      className="p-1 text-green-500 hover:text-green-400 transition-colors"
                                      aria-label="Confirm rename"
                                    >
                                      <Check size={16} />
                                    </button>
                                    <button
                                      onClick={() => setEditingSessionId(null)}
                                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                      aria-label="Cancel rename"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => loadSession(item.session_id)}
                                    className="flex-1 min-w-0 text-left"
                                  >
                                    <h3 className="font-medium text-sm text-foreground group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors truncate">
                                      {displayName}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {new Date(item.updated_at).toLocaleString()}
                                    </p>
                                  </button>
                                )}
                                {!isEditing && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingSessionId(item.session_id);
                                        setEditingName(displayName);
                                      }}
                                      className="p-2 rounded-lg shrink-0 text-muted-foreground/0 group-hover:text-muted-foreground/60 hover:!text-primary transition-all duration-200"
                                      aria-label="Rename session"
                                    >
                                      <Pencil size={15} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSession(item.session_id);
                                      }}
                                      className="p-2 rounded-lg shrink-0 text-muted-foreground/0 group-hover:text-muted-foreground/60 hover:!text-red-500 transition-all duration-200"
                                      aria-label="Delete session"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStarredSessions((prev) => {
                                      const next = new Set(prev);
                                      next.delete(item.session_id);
                                      localStorage.setItem(
                                        "insightx-starred",
                                        JSON.stringify([...next]),
                                      );
                                      return next;
                                    });
                                  }}
                                  className="p-2 rounded-lg shrink-0 text-yellow-500 hover:text-yellow-400 transition-all duration-200"
                                  aria-label="Unstar session"
                                >
                                  <Star
                                    size={18}
                                    fill="currentColor"
                                    className="transition-transform duration-200 hover:scale-110"
                                  />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── All Sessions ── */}
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        All Sessions
                      </h3>
                      <Separator className="flex-1 ml-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {archiveItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-10">
                        No previous sessions yet.
                      </p>
                    ) : (
                      archiveItems.map((item) => {
                        const isStarred = starredSessions.has(item.session_id);
                        const isEditing = editingSessionId === item.session_id;
                        const displayName = item.name || item.preview || "Untitled Session";
                        return (
                          <div
                            key={item.session_id}
                            className="flex items-center gap-3 w-full p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/60 hover:border-primary/20 transition-all duration-200 group"
                          >
                            {isEditing ? (
                              <div className="flex-1 min-w-0 flex items-center gap-2">
                                <input
                                  autoFocus
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleRename(item.session_id);
                                    if (e.key === "Escape") setEditingSessionId(null);
                                  }}
                                  className="flex-1 bg-transparent border-b border-primary/40 text-sm text-foreground outline-none py-0.5"
                                />
                                <button
                                  onClick={() => handleRename(item.session_id)}
                                  className="p-1 text-green-500 hover:text-green-400 transition-colors"
                                  aria-label="Confirm rename"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => setEditingSessionId(null)}
                                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                  aria-label="Cancel rename"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => loadSession(item.session_id)}
                                className="flex-1 min-w-0 text-left"
                              >
                                <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                                  {displayName}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {new Date(item.updated_at).toLocaleString()}
                                </p>
                              </button>
                            )}
                            {!isEditing && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSessionId(item.session_id);
                                    setEditingName(displayName);
                                  }}
                                  className="p-2 rounded-lg shrink-0 text-muted-foreground/0 group-hover:text-muted-foreground/60 hover:!text-primary transition-all duration-200"
                                  aria-label="Rename session"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSession(item.session_id);
                                  }}
                                  className="p-2 rounded-lg shrink-0 text-muted-foreground/0 group-hover:text-muted-foreground/60 hover:!text-red-500 transition-all duration-200"
                                  aria-label="Delete session"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setStarredSessions((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(item.session_id)) {
                                    next.delete(item.session_id);
                                  } else {
                                    next.add(item.session_id);
                                  }
                                  localStorage.setItem(
                                    "insightx-starred",
                                    JSON.stringify([...next]),
                                  );
                                  return next;
                                });
                              }}
                              className={cn(
                                "p-2 rounded-lg shrink-0 transition-all duration-200",
                                isStarred
                                  ? "text-yellow-500 hover:text-yellow-400"
                                  : "text-muted-foreground/30 hover:text-yellow-500/70",
                              )}
                              aria-label={isStarred ? "Unstar session" : "Star session"}
                            >
                              <Star
                                size={18}
                                fill={isStarred ? "currentColor" : "none"}
                                className="transition-transform duration-200 hover:scale-110"
                              />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ SETTINGS VIEW ═══ */}
            {activeView === "settings" && (
              <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-6">
                <div className="max-w-3xl mx-auto w-full animate-fade-in-up">
                  <h2 className="text-2xl font-bold mb-1">Settings</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Manage your preferences
                  </p>

                  {/* Appearance Card */}
                  <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-3">
                      <h3 className="font-semibold text-foreground">
                        Appearance
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Customize how Finsight.AI looks on your device.
                      </p>
                    </div>
                    <div className="px-5 pb-5 space-y-4">
                      {/* Dark Mode Toggle */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          {isDarkMode ? (
                            <Moon size={18} className="text-muted-foreground" />
                          ) : (
                            <Sun size={18} className="text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-medium">Dark Mode</p>
                            <p className="text-xs text-muted-foreground">
                              Toggle dark mode on or off
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsDarkMode(!isDarkMode)}
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
                            isDarkMode ? "bg-primary" : "bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transition-transform duration-200",
                              isDarkMode ? "translate-x-5" : "translate-x-0",
                            )}
                          />
                        </button>
                      </div>

                      <div className="h-px bg-border/50" />

                      {/* Compact Mode */}
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium">Compact Mode</p>
                          <p className="text-xs text-muted-foreground">
                            Reduce spacing in chat messages
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setIsCompactMode((prev) => {
                              const next = !prev;
                              localStorage.setItem("insightx-compact", String(next));
                              return next;
                            });
                          }}
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
                            isCompactMode ? "bg-primary" : "bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transition-transform duration-200",
                              isCompactMode ? "translate-x-5" : "translate-x-0",
                            )}
                          />
                        </button>
                      </div>

                      <div className="h-px bg-border/50" />

                      {/* Auto-scroll */}
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium">Auto-scroll</p>
                          <p className="text-xs text-muted-foreground">
                            Scroll to bottom on new messages
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setIsAutoScroll((prev) => {
                              const next = !prev;
                              localStorage.setItem("insightx-autoscroll", String(next));
                              return next;
                            });
                          }}
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
                            isAutoScroll ? "bg-primary" : "bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transition-transform duration-200",
                              isAutoScroll ? "translate-x-5" : "translate-x-0",
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Data Card */}
                  <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden mt-4">
                    <div className="px-5 pt-5 pb-3">
                      <h3 className="font-semibold text-foreground">
                        Data & Privacy
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Manage your data preferences
                      </p>
                    </div>
                    <div className="px-5 pb-5 space-y-4">
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium">
                            Save Chat History
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Keep your conversations for future reference
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setIsSaveChatHistory((prev) => {
                              const next = !prev;
                              localStorage.setItem("insightx-save-history", String(next));
                              return next;
                            });
                          }}
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
                            isSaveChatHistory ? "bg-primary" : "bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transition-transform duration-200",
                              isSaveChatHistory ? "translate-x-5" : "translate-x-0",
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── Input Area (Chat only) ─── */}
        {activeView === "chat" && (
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none" />
            <div className="relative max-w-3xl mx-auto">
              <div className="flex items-center gap-2 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-1.5 pl-3 shadow-2xl shadow-black/10 focus-within:border-primary/30 transition-all duration-300">
                <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 shrink-0">
                  <Mic size={18} />
                </button>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask a question about your transaction data..."
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm placeholder:text-muted-foreground/60 min-w-0"
                />
                <div className="hidden sm:flex items-center gap-0.5 px-2 py-1 rounded-md bg-muted/50 text-[10px] text-muted-foreground font-medium shrink-0">
                  <span>Press</span>
                  <kbd className="ml-0.5 font-mono">↵</kbd>
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isLoading}
                  type="button"
                  className={cn(
                    "p-2 rounded-xl transition-all duration-200 shrink-0",
                    inputValue.trim()
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed",
                  )}
                >
                  <ArrowUp size={18} />
                </button>
              </div>
              <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
                Finsight.AI may produce inaccurate information. Verify important
                data independently.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
