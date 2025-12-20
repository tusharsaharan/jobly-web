import { Loader2, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { apiCall } from "@/lib/api";

type ConversationMessage = {
  _id: string;
  text: string;
  createdAt?: string;
  sender?: { _id?: string; id?: string; name?: string; role?: string } | string;
};

export function ApplicationConversation({ applicationId, token, currentUserId, counterpartName }: { applicationId: string; token: string | null; currentUserId?: string; counterpartName: string }) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

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
    return () => { active = false; };
  }, [applicationId, token]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = text.trim();
    if (!message || sending) return;

    setSending(true);
    setError("");
    try {
      const sent = await apiCall<ConversationMessage>(`/messages/application/${applicationId}`, "POST", { text: message }, token);
      setMessages((current) => [...current, sent]);
      setText("");
    } catch (requestError: any) {
      setError(requestError?.message ?? "Could not send the message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section aria-label={`Conversation with ${counterpartName}`} className="mt-5 border-t border-border pt-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-semibold text-ink">Conversation with {counterpartName}</h2>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink/50">Application thread</span>
      </div>
      <div aria-live="polite" className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex min-h-20 items-center gap-2 text-sm text-ink/60"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading messages</div>
        ) : messages.length === 0 ? (
          <p className="min-h-20 text-sm leading-6 text-ink/60">Start the conversation with a clear next step or question.</p>
        ) : (
          messages.map((message) => {
            const senderId = typeof message.sender === "object" ? message.sender?._id ?? message.sender?.id : message.sender;
            const mine = Boolean(currentUserId && senderId === currentUserId);
            return (
              <div key={message._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-md px-4 py-2.5 text-sm leading-6 ${mine ? "bg-ink text-cream" : "bg-panel text-ink"}`}>
                  <p>{message.text}</p>
                  <p className={`mt-1 font-mono text-[10px] uppercase tracking-widest ${mine ? "text-cream/60" : "text-ink/45"}`}>
                    {mine ? "You" : message.sender && typeof message.sender === "object" ? message.sender.name : counterpartName}
                    {message.createdAt ? ` | ${new Date(message.createdAt).toLocaleDateString()}` : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}
      <form onSubmit={send} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="sr-only" htmlFor={`message-${applicationId}`}>Message {counterpartName}</label>
        <textarea id={`message-${applicationId}`} value={text} onChange={(event) => setText(event.target.value)} maxLength={2000} rows={2} disabled={sending} placeholder="Write a message..." className="control-surface resize-y px-4 py-3 text-sm placeholder:text-ink/40 focus:border-ink focus:outline-none disabled:opacity-50" />
        <button type="submit" disabled={sending || !text.trim()} className="pill-mint inline-flex cursor-pointer gap-2 disabled:cursor-not-allowed disabled:opacity-50 sm:self-end">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          Send
        </button>
      </form>
    </section>
  );
}
