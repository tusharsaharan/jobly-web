import { Check, CheckCheck, ExternalLink, Loader2, Send, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { apiCall } from "@/lib/api";
import { getInterviewSocket } from "@/lib/socket";
import { getSuggestedReplies } from "@/lib/smartReply";

type ConversationMessage = {
  _id: string;
  application?: string;
  text: string;
  createdAt?: string;
  readAt?: string | null;
  sender?: { _id?: string; id?: string; name?: string; role?: string } | string;
};

export function ApplicationConversation({
  applicationId,
  token,
  currentUserId,
  counterpartName,
}: {
  applicationId: string;
  token: string | null;
  currentUserId?: string;
  counterpartName: string;
}) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const suggestedReplies = useMemo(() => {
    return getSuggestedReplies({
      messages,
      userRole: "seeker",
      currentUserId,
      counterpart: { name: counterpartName },
    });
  }, [messages, currentUserId, counterpartName]);

  // Load message history
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    apiCall<ConversationMessage[]>(`/messages/application/${applicationId}`, "GET", null, token)
      .then((response) => {
        if (active) setMessages(Array.isArray(response) ? response : []);
      })
      .catch((requestError: Error) => {
        if (active) setError(requestError.message || "Could not load this conversation.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applicationId, token]);

  // Real-time Socket.IO Sync
  useEffect(() => {
    if (!token || !applicationId) return;
    const socket = getInterviewSocket(token);

    socket.emit("join_conversation", applicationId);

    const handleNewMessage = (newMsg: ConversationMessage) => {
      const msgAppId =
        typeof newMsg.application === "object"
          ? (newMsg.application as any)?._id
          : newMsg.application;

      if (String(msgAppId) === String(applicationId) || !newMsg.application) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(newMsg._id))) return prev;
          return [...prev, newMsg];
        });
        apiCall(`/messages/application/${applicationId}/read`, "PATCH", null, token).catch(() => {});
      }
    };

    const handleUserTyping = (data: { applicationId: string }) => {
      if (data.applicationId === applicationId) setIsTyping(true);
    };

    const handleUserStopTyping = (data: { applicationId: string }) => {
      if (data.applicationId === applicationId) setIsTyping(false);
    };

    const handleMessagesRead = (data: { applicationId: string; readAt: string }) => {
      if (data.applicationId === applicationId) {
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
      socket.emit("leave_conversation", applicationId);
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [applicationId, token]);

  // Auto-scroll within container on new message
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleTextChange = (val: string) => {
    setText(val);
    if (!token || !applicationId) return;
    const socket = getInterviewSocket(token);
    socket.emit("typing_start", { applicationId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", { applicationId });
    }, 1200);
  };

  async function send(event?: FormEvent) {
    if (event) event.preventDefault();
    const message = text.trim();
    if (!message || sending || !token) return;

    setSending(true);
    setError("");
    try {
      const socket = getInterviewSocket(token);
      socket.emit("typing_stop", { applicationId });

      const sent = await apiCall<ConversationMessage>(
        `/messages/application/${applicationId}`,
        "POST",
        { text: message },
        token
      );
      setMessages((current) => {
        if (current.some((m) => String(m._id) === String(sent._id))) return current;
        return [...current, sent];
      });
      setText("");
    } catch (requestError: any) {
      setError(requestError?.message ?? "Could not send the message.");
    } finally {
      setSending(false);
    }
  }

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <section
      aria-label={`Conversation with ${counterpartName}`}
      className="mt-5 rounded-2xl border border-border bg-panel/60 p-4 sm:p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white shadow-sm">
            {(counterpartName || "C")[0]}
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink">Chat with {counterpartName}</h2>
            <p className="text-[11px] text-emerald-700 font-semibold">Real-Time Connected</p>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        aria-live="polite"
        className="mt-4 max-h-80 min-h-36 space-y-3 overflow-y-auto pr-1 py-1"
      >
        {loading ? (
          <div className="flex min-h-28 items-center justify-center gap-2 text-sm text-ink/60">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" aria-hidden="true" />
            <span>Loading message thread...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex min-h-28 flex-col items-center justify-center text-center text-ink/55">
            <p className="text-sm font-medium">Start the conversation with {counterpartName}.</p>
            <p className="text-xs text-ink/45">Ask a question or discuss interview scheduling.</p>
          </div>
        ) : (
          messages.map((message) => {
            const senderId =
              typeof message.sender === "object"
                ? message.sender?._id ?? message.sender?.id
                : message.sender;
            const mine = Boolean(currentUserId && String(senderId) === String(currentUserId));

            return (
              <div key={message._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                    mine
                      ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-br-xs"
                      : "bg-cream/80 text-ink border border-border rounded-bl-xs dark:bg-zinc-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  <div
                    className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${
                      mine ? "text-emerald-100" : "text-ink/45"
                    }`}
                  >
                    <span>{formatTime(message.createdAt)}</span>
                    {mine && (
                      <span>
                        {message.readAt ? (
                          <CheckCheck className="h-3.5 w-3.5 text-emerald-200" title="Read" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-emerald-100" title="Sent" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex items-center gap-1.5 text-xs text-ink/50 italic">
            <span>{counterpartName} is typing...</span>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs font-semibold text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Dynamic Contextual Smart Replies (LinkedIn Style) */}
      {suggestedReplies.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-2">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            <Sparkles className="h-3 w-3" />
            <span>Smart replies:</span>
          </span>
          {suggestedReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => setText(reply)}
              className="rounded-full border border-border/80 bg-panel px-3 py-1 text-xs font-medium text-ink/80 shadow-xs transition-all hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-700 active:scale-98 dark:hover:bg-emerald-950/30"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={send} className="mt-2.5 flex items-end gap-2">
        <label className="sr-only" htmlFor={`message-${applicationId}`}>
          Message {counterpartName}
        </label>
        <textarea
          id={`message-${applicationId}`}
          value={text}
          onChange={(event) => handleTextChange(event.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          maxLength={2000}
          rows={2}
          disabled={sending}
          placeholder="Write a message... (Enter to send)"
          className="w-full resize-none rounded-xl border border-border bg-panel px-3.5 py-2 text-sm placeholder:text-ink/40 focus:border-emerald-600 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </section>
  );
}
