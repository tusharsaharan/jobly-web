import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  ArrowLeft,
  Briefcase,
  Check,
  CheckCheck,
  ExternalLink,
  Loader2,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getInterviewSocket } from "@/lib/socket";
import { getSuggestedReplies } from "@/lib/smartReply";

type ConversationSummary = {
  applicationId: string;
  status: "applied" | "shortlisted" | "rejected";
  atsScore?: number;
  createdAt: string;
  updatedAt: string;
  job?: {
    _id: string;
    title: string;
    company: string;
    location?: string;
    type?: string;
  };
  counterpart: {
    _id: string;
    name: string;
    email?: string;
    role: "seeker" | "recruiter";
  };
  lastMessage?: {
    _id: string;
    text: string;
    createdAt: string;
    sender: string | { _id: string; name: string };
    readAt?: string | null;
  } | null;
  unreadCount: number;
  interviewSession?: {
    _id: string;
    roomKey: string;
    status: string;
    scheduledStart?: string;
  } | null;
};

type ChatMessage = {
  _id: string;
  application: string;
  sender: { _id: string; id?: string; name: string; role?: string } | string;
  recipient: string;
  text: string;
  readAt?: string | null;
  createdAt: string;
};

type ConversationSummaryResult = {
  summary: string;
  highlights: string[];
  messageCount: number;
  generatedAt?: string;
};

export const Route = createFileRoute("/_app/messages")({
  validateSearch: (search: Record<string, unknown>): { applicationId?: string } => ({
    applicationId: typeof search.applicationId === "string" ? search.applicationId : undefined,
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const { user, token } = useAuth();
  const search = useSearch({ from: "/_app/messages" });
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(search.applicationId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "interviews">("all");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [summary, setSummary] = useState<ConversationSummaryResult | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Strictly lock window/body scrolling on the messages full-screen workspace
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  // Sync selectedAppId from URL search param
  useEffect(() => {
    if (search.applicationId && search.applicationId !== selectedAppId) {
      setSelectedAppId(search.applicationId);
    }
  }, [search.applicationId]);

  // Load conversation list
  useEffect(() => {
    if (!token) return;
    setLoadingList(true);
    apiCall<ConversationSummary[]>("/messages/conversations", "GET", null, token)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setConversations(list);
        if (!selectedAppId && list.length > 0) {
          setSelectedAppId(list[0].applicationId);
        }
      })
      .catch((err) => {
        toast.error(err.message || "Failed loading conversations");
      })
      .finally(() => {
        setLoadingList(false);
      });
  }, [token]);

  // Active conversation object
  const activeConversation = useMemo(
    () => conversations.find((c) => c.applicationId === selectedAppId) || null,
    [conversations, selectedAppId]
  );

  // Load messages for selected conversation & mark read
  useEffect(() => {
    if (!selectedAppId || !token) return;
    setLoadingChat(true);
    setSummary(null);
    setSummaryLoading(false);
    apiCall<ChatMessage[]>(`/messages/application/${selectedAppId}`, "GET", null, token)
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
        setConversations((prev) =>
          prev.map((c) => (c.applicationId === selectedAppId ? { ...c, unreadCount: 0 } : c))
        );
      })
      .catch((err) => {
        toast.error(err.message || "Failed loading conversation history");
      })
      .finally(() => {
        setLoadingChat(false);
      });
  }, [selectedAppId, token]);

  // Real-Time Socket.IO Synchronization
  useEffect(() => {
    if (!token) return;
    const socket = getInterviewSocket(token);

    if (selectedAppId) {
      socket.emit("join_conversation", selectedAppId);
    }

    const handleNewMessage = (newMsg: ChatMessage) => {
      const msgAppId =
        typeof newMsg.application === "object"
          ? (newMsg.application as any)?._id
          : newMsg.application;

      if (String(msgAppId) === String(selectedAppId)) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(newMsg._id))) return prev;
          return [...prev, newMsg];
        });
        apiCall(`/messages/application/${selectedAppId}/read`, "PATCH", null, token).catch(() => {});
      }

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.applicationId === newMsg.application) {
            const isMine =
              typeof newMsg.sender === "object"
                ? newMsg.sender._id === user?._id
                : newMsg.sender === user?._id;
            return {
              ...conv,
              updatedAt: newMsg.createdAt,
              lastMessage: {
                _id: newMsg._id,
                text: newMsg.text,
                createdAt: newMsg.createdAt,
                sender: newMsg.sender,
                readAt: newMsg.readAt,
              },
              unreadCount:
                conv.applicationId === selectedAppId || isMine ? 0 : conv.unreadCount + 1,
            };
          }
          return conv;
        })
      );
    };

    const handleUserTyping = (data: { applicationId: string; name: string }) => {
      if (data.applicationId === selectedAppId) {
        setIsTyping(true);
        setTypingUser(data.name);
      }
    };

    const handleUserStopTyping = (data: { applicationId: string }) => {
      if (data.applicationId === selectedAppId) {
        setIsTyping(false);
        setTypingUser(null);
      }
    };

    const handleMessagesRead = (data: { applicationId: string; readAt: string }) => {
      if (data.applicationId === selectedAppId) {
        setMessages((prev) =>
          prev.map((m) => (m.readAt ? m : { ...m, readAt: data.readAt }))
        );
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      if (selectedAppId) {
        socket.emit("leave_conversation", selectedAppId);
      }
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [selectedAppId, token, user?._id]);

  // Scroll message stream to bottom within container
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Handle typing debounce — throttle typing_start to once per 2s to avoid socket flood
  const handleTextChange = (val: string) => {
    setText(val);
    if (!selectedAppId || !token) return;
    const socket = getInterviewSocket(token);

    const now = Date.now();
    const last = (handleTextChange as any)._lastTypingAt || 0;
    if (now - last > 2000) {
      socket.emit("typing_start", { applicationId: selectedAppId });
      (handleTextChange as any)._lastTypingAt = now;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", { applicationId: selectedAppId });
    }, 1400);
  };

  // Send message
  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = text.trim();
    if (!cleanText || sending || !selectedAppId || !token) return;

    setSending(true);
    try {
      const socket = getInterviewSocket(token);
      socket.emit("typing_stop", { applicationId: selectedAppId });

      const sent = await apiCall<ChatMessage>(
        `/messages/application/${selectedAppId}`,
        "POST",
        { text: cleanText },
        token
      );
      setMessages((prev) => {
        if (prev.some((m) => String(m._id) === String(sent._id))) return prev;
        return [...prev, sent];
      });
      setText("");

      setConversations((prev) =>
        prev.map((c) =>
          c.applicationId === selectedAppId
            ? {
                ...c,
                updatedAt: sent.createdAt,
                lastMessage: {
                  _id: sent._id,
                  text: sent.text,
                  createdAt: sent.createdAt,
                  sender: user?._id || "",
                  readAt: null,
                },
              }
            : c
        )
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Summarize the active conversation (Instagram-style)
  const handleSummarize = async () => {
    if (!selectedAppId || !token || summaryLoading) return;
    setSummaryLoading(true);
    try {
      const data = await apiCall<ConversationSummaryResult>(
        `/messages/application/${selectedAppId}/summary`,
        "GET",
        null,
        token,
      );
      setSummary(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to summarize conversation");
    } finally {
      setSummaryLoading(false);
    }
  };

  // Dynamic Contextual Smart Replies
  const cannedReplies = useMemo(() => {
    return getSuggestedReplies({
      messages,
      userRole: user?.role === "recruiter" ? "recruiter" : "seeker",
      currentUserId: (user as any)?._id || (user as any)?.id,
      counterpart: activeConversation?.counterpart,
      job: activeConversation?.job,
      applicationStatus: activeConversation?.status,
    });
  }, [messages, user, activeConversation]);

  // Filtered conversation list
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const matchSearch =
        c.counterpart.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.job?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.job?.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.lastMessage?.text || "").toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;
      if (filterTab === "unread") return c.unreadCount > 0;
      if (filterTab === "interviews") return Boolean(c.interviewSession?.roomKey);
      return true;
    });
  }, [conversations, searchQuery, filterTab]);

  const formatMessageTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatListDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <main className="fixed inset-x-0 bottom-0 top-16 sm:top-[68px] flex h-[calc(100vh-4.25rem)] w-screen flex-col overflow-hidden bg-[#FAFCFB] font-sans select-none z-10">
      <div className="flex-1 flex overflow-hidden w-full">
        {/* ========================================================================= */}
        {/* LEFT PANE: Conversations Inbox Sidebar (Balanced width: 320px - 340px)    */}
        {/* ========================================================================= */}
        <aside className="w-[320px] lg:w-[340px] flex flex-col border-r border-border bg-white shrink-0 overflow-hidden">
          {/* Top Header - Exact height matched with right pane (h-16) with proper vertical centering */}
          <div className="h-16 shrink-0 flex items-center justify-between border-b border-border px-4 sm:px-5 bg-[#F8FAF9]">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    navigate({ to: user?.role === "recruiter" ? "/applicants" : "/applications" });
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-ink hover:border-[#2A9D7B] hover:bg-[#E9FBF2] hover:text-[#1E7058] transition-colors shadow-2xs"
                title="Go back"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
              <h1 className="text-sm font-bold text-ink tracking-tight">Messages</h1>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#8DDCBE] bg-[#E9FBF2] px-2.5 py-1 text-[11px] font-semibold text-[#1E7058]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2A9D7B] animate-pulse" />
              Live
            </span>
          </div>

          {/* Search Bar & Filter Row */}
          <div className="shrink-0 border-b border-border p-3 space-y-2.5 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                placeholder="Search messages, roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-border bg-[#F8FAF9] py-1.5 pl-8 pr-7 text-xs placeholder:text-ink/40 focus:border-[#2A9D7B] focus:bg-white focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#EEF2F0] p-1 rounded-md">
              {(
                [
                  { id: "all", label: `All (${conversations.length})` },
                  {
                    id: "unread",
                    label: "Unread",
                    badge: conversations.reduce((acc, c) => acc + c.unreadCount, 0),
                  },
                  { id: "interviews", label: "Interviews" },
                ] as const
              ).map((tab) => {
                const isActive = filterTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterTab(tab.id)}
                    className={`relative flex-1 rounded py-1 text-[11px] font-semibold transition-colors text-center ${
                      isActive ? "text-[#183A32]" : "text-ink/60 hover:text-ink"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeFilterPill"
                        className="absolute inset-0 bg-white rounded shadow-xs"
                        transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10 inline-flex items-center justify-center gap-1">
                      {tab.label}
                      {tab.id === "unread" && tab.badge > 0 && (
                        <span className="rounded-full bg-[#2A9D7B] px-1.5 py-0.2 text-[9px] text-white font-bold">
                          {tab.badge}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conversations List Feed */}
          <div className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-1">
            {loadingList ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-ink/50">
                <Loader2 className="h-5 w-5 animate-spin text-[#2A9D7B]" />
                <span className="text-xs">Loading conversations...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex h-60 flex-col items-center justify-center p-6 text-center text-ink/50">
                <MessageSquare className="h-7 w-7 text-ink/30 mb-2" />
                <p className="text-xs font-semibold text-ink/70">No conversations found</p>
                <p className="mt-1 text-[11px] text-ink/50">
                  {searchQuery ? "Try a different search term" : "Messages will appear here."}
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredConversations.map((conv) => {
                  const isSelected = conv.applicationId === selectedAppId;
                  const initials = (conv.counterpart.name || "C")
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0].toUpperCase())
                    .join("");

                  return (
                    <motion.button
                      key={conv.applicationId}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      type="button"
                      onClick={() => {
                        setSelectedAppId(conv.applicationId);
                        navigate({
                          to: "/messages",
                          search: { applicationId: conv.applicationId },
                        });
                      }}
                      className={`relative flex w-full items-start gap-3 p-3 rounded-lg text-left transition-all ${
                        isSelected
                          ? "bg-[#E9FBF2] ring-1 ring-[#8DDCBE]/60 text-[#1E7058]"
                          : "hover:bg-[#F8FAF9] text-ink"
                      }`}
                    >
                      {/* Counterpart Avatar */}
                      <div className="relative shrink-0 mt-0.5">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-md text-xs font-bold text-white shadow-xs ${
                            isSelected ? "bg-[#1E7058]" : "bg-[#2A9D7B]"
                          }`}
                        >
                          {initials}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-[#2A9D7B]" />
                      </div>

                      {/* Meta & Snippet */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-1">
                          <h3 className={`truncate text-xs font-bold ${isSelected ? "text-[#183A32]" : "text-ink"}`}>
                            {conv.counterpart.name}
                          </h3>
                          <span className="shrink-0 text-[10px] font-medium text-ink/45">
                            {formatListDate(conv.updatedAt)}
                          </span>
                        </div>

                        <p className="mt-0.5 truncate text-[11px] font-medium text-[#2A9D7B]">
                          {conv.job?.title || "Role"} • {conv.job?.company || "Company"}
                        </p>

                        <p className="mt-1 truncate text-xs text-ink/65">
                          {conv.lastMessage?.text || "No messages yet. Start the conversation!"}
                        </p>
                      </div>

                      {/* Unread Pill Badge */}
                      {conv.unreadCount > 0 && (
                        <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-[#2A9D7B] px-1 text-[9px] font-bold text-white shadow-xs">
                          {conv.unreadCount}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* RIGHT PANE: Active Conversation Screen (Proportionate & Balanced)        */}
        {/* ========================================================================= */}
        <section className="flex-1 min-w-0 flex flex-col overflow-hidden bg-white">
          {activeConversation ? (
            <>
              {/* Active Conversation Top Header - Exact height matched with left pane (h-16) */}
              <header className="h-16 shrink-0 flex items-center justify-between border-b border-border bg-[#F8FAF9] px-6">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2A9D7B] text-xs font-bold text-white shadow-xs">
                    {(activeConversation.counterpart.name || "C")
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-ink truncate">
                        {activeConversation.counterpart.name}
                      </h2>
                      <span className="rounded-md border border-[#8DDCBE] bg-[#E9FBF2] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#1E7058]">
                        {activeConversation.counterpart.role === "recruiter" ? "Recruiter" : "Candidate"}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink/55 truncate">
                      {activeConversation.job?.title} at {activeConversation.job?.company}
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {activeConversation.interviewSession?.roomKey ? (
                    <button
                      type="button"
                      onClick={() =>
                        navigate({
                          to: "/interview/$roomKey",
                          params: { roomKey: activeConversation.interviewSession!.roomKey },
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-md bg-[#2A9D7B] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#238266] transition-colors"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Join Interview Room
                    </button>
                  ) : activeConversation.status === "shortlisted" && user?.role === "recruiter" ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await apiCall<{ session: any }>(
                            "/interviews/schedule",
                            "POST",
                            {
                              applicationId: activeConversation.applicationId,
                              title: `Technical Interview: ${activeConversation.job?.title || "Engineering"}`,
                              scheduledStart: new Date(Date.now() + 3600000).toISOString(),
                              allowedLanguages: ["python", "javascript", "typescript", "cpp", "java"],
                            },
                            token
                          );
                          toast.success("Technical Interview Room created!");
                          if (res.session?.roomKey) {
                            navigate({
                              to: "/interview/$roomKey",
                              params: { roomKey: res.session.roomKey },
                            });
                          }
                        } catch (err: any) {
                          toast.error(err.message || "Failed creating interview");
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md bg-[#2A9D7B] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#238266] transition-colors"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Launch Technical Interview
                    </button>
                  ) : null}

                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSummarize}
                      disabled={summaryLoading}
                      title="Summarize this conversation"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-[#2A9D7B] hover:bg-[#E9FBF2] hover:text-[#1E7058] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {summaryLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      <span className="hidden sm:inline">Summarize</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (user?.role === "recruiter") {
                        navigate({ to: "/applicants" });
                      } else {
                        navigate({ to: "/applications" });
                      }
                    }}
                    title="View Application Details"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-[#2A9D7B] hover:bg-[#E9FBF2] hover:text-[#1E7058] transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Application</span>
                  </button>
                </div>
              </header>

              {/* Message Feed Area (Centered, Clean Proportion) */}
              <div
                ref={messagesContainerRef}
                className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-3 bg-[#FAFCFB]"
              >
                <div className="max-w-3xl mx-auto space-y-3">
                  {summary && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative rounded-xl border border-[#8DDCBE] bg-[#E9FBF2] px-4 py-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-[#1E7058]" />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E7058]">
                            AI Summary
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSummary(null)}
                          title="Dismiss summary"
                          className="text-ink/40 hover:text-ink transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {summary.summary && (
                        <p className="mt-1.5 text-xs font-semibold leading-relaxed text-ink">
                          {summary.summary}
                        </p>
                      )}

                      {summary.highlights.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {summary.highlights.map((item, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-1.5 text-xs leading-relaxed text-ink/75"
                            >
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#2A9D7B]" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  )}

                  {loadingChat ? (
                    <div className="flex h-60 items-center justify-center gap-2 text-ink/50">
                      <Loader2 className="h-5 w-5 animate-spin text-[#2A9D7B]" />
                      <span className="text-xs">Loading message stream...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-80 flex-col items-center justify-center text-center text-ink/50">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E9FBF2] text-[#2A9D7B] mb-3">
                        <MessageSquare className="h-6 w-6 stroke-[1.75]" />
                      </div>
                      <h4 className="text-sm font-bold text-ink">Start the conversation</h4>
                      <p className="mt-1 max-w-xs text-xs text-ink/55">
                        Send a message or schedule a live technical interview studio.
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {messages.map((msg) => {
                        const senderId =
                          typeof msg.sender === "object"
                            ? msg.sender._id ?? msg.sender.id
                            : msg.sender;
                        const isMine = Boolean(user?._id && String(senderId) === String(user._id));

                        return (
                          <motion.div
                            key={msg._id}
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className={`flex items-end gap-2.5 ${isMine ? "justify-end" : "justify-start"}`}
                          >
                            {!isMine && (
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#E9FBF2] text-[11px] font-bold text-[#1E7058] border border-[#8DDCBE]/40">
                                {(typeof msg.sender === "object" ? msg.sender.name : "C")[0]}
                              </div>
                            )}

                            <div
                              className={`group relative max-w-[80%] sm:max-w-[70%] rounded-xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                                isMine
                                  ? "bg-[#2A9D7B] text-white rounded-br-xs"
                                  : "bg-white text-ink border border-border rounded-bl-xs"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.text}</p>

                              <div
                                className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                                  isMine ? "text-white/75" : "text-ink/45"
                                }`}
                              >
                                <span>{formatMessageTime(msg.createdAt)}</span>
                                {isMine && (
                                  <span>
                                    {msg.readAt ? (
                                      <CheckCheck className="h-3 w-3 text-white" title="Read" />
                                    ) : (
                                      <Check className="h-3 w-3 text-white/75" title="Sent" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}

                  {/* Animated Typing Indicator */}
                  {isTyping && typingUser && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="flex items-center gap-2 text-xs text-ink/55 py-1"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E9FBF2] text-[#2A9D7B]">
                        <Loader2 className="h-3 w-3 animate-spin" />
                      </span>
                      <span className="text-[11px] font-medium">{typingUser} is typing</span>
                      <span className="flex gap-1">
                        <span className="h-1 w-1 rounded-full bg-[#2A9D7B] animate-bounce" />
                        <span className="h-1 w-1 rounded-full bg-[#2A9D7B] animate-bounce [animation-delay:0.15s]" />
                        <span className="h-1 w-1 rounded-full bg-[#2A9D7B] animate-bounce [animation-delay:0.3s]" />
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Dynamic Contextual Smart Replies (Centered) */}
              {cannedReplies.length > 0 && (
                <div className="shrink-0 border-t border-border bg-[#F8FAF9] px-6 py-2">
                  <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-[#1E7058] mr-1 shrink-0">
                      Smart replies:
                    </span>
                    {cannedReplies.map((reply) => (
                      <motion.button
                        key={reply}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setText(reply)}
                        className="rounded-full border border-[#8DDCBE] bg-[#E9FBF2] px-3 py-1 text-xs font-medium text-[#1E7058] shadow-2xs hover:bg-[#D7F5E8] transition-colors"
                      >
                        {reply}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Message Composer (Centered) */}
              <footer className="shrink-0 border-t border-border bg-white px-6 py-3">
                <div className="max-w-3xl mx-auto">
                  <form onSubmit={handleSendMessage} className="flex items-end gap-2.5">
                    <div className="relative flex-1">
                      <textarea
                        value={text}
                        onChange={(e) => handleTextChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        rows={2}
                        maxLength={2000}
                        placeholder="Write a message... (Press Enter to send, Shift+Enter for new line)"
                        className="w-full resize-none rounded-lg border border-border bg-[#F8FAF9] px-3.5 py-2 text-xs placeholder:text-ink/40 focus:border-[#2A9D7B] focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      disabled={sending || !text.trim()}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#2A9D7B] px-4 text-xs font-bold text-white shadow-xs hover:bg-[#238266] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {sending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>Send</span>
                        </>
                      )}
                    </motion.button>
                  </form>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-ink/50 bg-[#FAFCFB]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E9FBF2] text-[#2A9D7B] mb-3 shadow-xs">
                <MessageSquare className="h-7 w-7 stroke-[1.75]" />
              </div>
              <h3 className="text-base font-bold text-ink">Jobly Real-Time Messenger</h3>
              <p className="mt-1.5 max-w-sm text-xs text-ink/60 leading-relaxed">
                Select a conversation from the left inbox to review chat history, schedule technical interviews, or collaborate with candidates.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
