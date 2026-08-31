import React, { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiCall } from "@/lib/api";
import {
  Bot,
  Send,
  Loader2,
  ExternalLink,
  Sparkles,
  BookMarked,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

type Mode = "grounded" | "tutor";

interface Citation {
  title?: string;
  url?: string;
  score?: number;
  confidence?: string;
}

function relevanceMeta(score?: number, confidence?: string) {
  const s = typeof score === "number" ? score : 0;
  const pct = Math.round(Math.min(0.98, Math.max(0, s)) * 100);
  const conf = confidence || (s > 0.55 ? "high" : s > 0.30 ? "medium" : s > 0.15 ? "low" : "none");
  const color =
    conf === "high"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
      : conf === "medium"
        ? "bg-amber-500/10 text-amber-700 border-amber-200"
        : conf === "low"
          ? "bg-slate-500/10 text-slate-600 border-slate-200"
          : "bg-cream/40 text-ink/55 border-border/60";
  const label = conf === "high" ? "High relevance" : conf === "medium" ? "Medium relevance" : conf === "low" ? "Low relevance" : "No signal";
  return { pct, conf, color, label };
}

interface ChatMsg {
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
  confidence?: "high" | "medium" | "low" | "none";
  timestamp?: string;
}

const GROUNDED_WELCOME: ChatMsg = {
  role: "assistant",
  text: "Hi — I'm your grounded Study Assistant. Ask any system-design or CS question and I'll answer strictly from our verified curriculum (with citations). Switch to Tutor mode for unrestricted brainstorming.",
  confidence: "high",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

const TUTOR_WELCOME: ChatMsg = {
  role: "assistant",
  text: "Hello! I'm your AI Master Tutor (Gemini). Ask anything across DSA, OS, DBMS, Networks, OOP & interview prep — I'll give you deep, example-rich answers. Switch to Grounded mode when you want strictly cited curriculum answers.",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

const STARTER_PROMPTS: Record<Mode, string[]> = {
  grounded: [
    "How does Spotify stream audio at scale?",
    "Explain CAP theorem tradeoffs",
    "Design URL shortener architecture",
  ],
  tutor: [
    "What is ASID in Operating Systems?",
    "Explain B-Tree vs B+ Tree in DB indexing",
    "How does std::move work in C++?",
  ],
};

export default function UnifiedStudyAssistant({
  defaultMode = "grounded",
  compact = false,
  scopeId,
}: {
  defaultMode?: Mode;
  compact?: boolean;
  scopeId?: string;
}) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [messages, setMessages] = useState<ChatMsg[]>([defaultMode === "tutor" ? TUTOR_WELCOME : GROUNDED_WELCOME]);
  const [input, setInput] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Keep welcome aligned with mode on first switch if only welcome is present
  const handleModeSwitch = (next: Mode) => {
    setMode(next);
    if (messages.length === 1 && messages[0].role === "assistant") {
      setMessages([next === "tutor" ? TUTOR_WELCOME : GROUNDED_WELCOME]);
    }
  };

  const groundedMutation = useMutation({
    mutationFn: (message: string) => apiCall("/study/chat", "POST", { message, scopeId }),
    onSuccess: (data: any) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply,
          citations: data.sources || [],
          confidence: data.confidence || "medium",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    },
    onError: (err: any) => toast.error(err?.message || "Grounded retrieval failed."),
  });

  const tutorMutation = useMutation({
    mutationFn: (message: string) => {
      const history = messages.slice(-8).map((m) => ({ role: m.role === "assistant" ? "assistant" as const : "user" as const, text: m.text }));
      return apiCall("/study/tutor", "POST", { message, history });
    },
    onSuccess: (data: any) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    },
    onError: (err: any) => toast.error(err?.message || "Tutor failed. Try again."),
  });

  const isPending = groundedMutation.isPending || tutorMutation.isPending;

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isPending) return;
    setMessages((prev) => [...prev, { role: "user", text, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    if (mode === "grounded") groundedMutation.mutate(text);
    else tutorMutation.mutate(text);
    if (!textToSend) setInput("");
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Copied!");
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const clearChat = () => setMessages([mode === "tutor" ? TUTOR_WELCOME : GROUNDED_WELCOME]);

  return (
    <div className={`bg-white rounded-2xl border border-border shadow-xs flex flex-col overflow-hidden ${compact ? "h-[520px]" : "h-[640px]"}`}>
      {/* Header with mode toggle */}
      <div className="p-3.5 border-b border-border bg-cream/30 flex items-center justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <div className="text-sm font-bold text-ink flex items-center gap-1.5">
            {mode === "grounded" ? <ShieldCheck className="w-4 h-4 text-[#2A9D7B]" /> : <Sparkles className="w-4 h-4 text-amber-600" />}
            <span>{mode === "grounded" ? "Grounded · Citations" : "Tutor · Unrestricted"}</span>
          </div>
          <div className="text-[11px] text-ink/55 font-medium truncate">
            {mode === "grounded" ? "Answers from verified curriculum with sources" : "Any CS topic — deep, example-rich"}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex bg-cream/50 p-1 rounded-xl border border-border">
            <button
              onClick={() => handleModeSwitch("grounded")}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${mode === "grounded" ? "bg-white text-ink shadow-xs border border-border/80" : "text-ink/60 hover:text-ink"}`}
            >
              <BookMarked className="w-3 h-3" /> Grounded
            </button>
            <button
              onClick={() => handleModeSwitch("tutor")}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${mode === "tutor" ? "bg-ink text-white shadow-xs" : "text-ink/60 hover:text-ink"}`}
            >
              <Sparkles className="w-3 h-3" /> Tutor
            </button>
          </div>
          <button onClick={clearChat} className="p-2 rounded-xl border border-border hover:bg-white text-ink/60 hover:text-ink cursor-pointer" title="Clear chat">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-cream/10">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${mode === "grounded" ? "bg-[#2A9D7B] text-white" : "bg-ink text-white"}`}>
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div className={`max-w-[86%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2 group relative ${m.role === "user" ? "bg-ink text-white rounded-br-xs" : "bg-white border border-border text-ink shadow-xs rounded-bl-xs"}`}>
              {m.role === "assistant" && m.timestamp && (
                <div className="flex items-center justify-between gap-3 pb-1 border-b border-border/40 text-[10px] text-ink/45">
                  <span className="font-semibold">{mode === "grounded" && m.confidence ? `Oracle · ${m.confidence}` : "AI Master Tutor"}</span>
                  <div className="flex items-center gap-1.5">
                    <span>{m.timestamp}</span>
                    <button onClick={() => handleCopy(m.text, i)} className="opacity-0 group-hover:opacity-100 hover:text-ink cursor-pointer p-0.5" title="Copy">
                      {copiedIdx === i ? <Check className="w-3 h-3 text-[#2A9D7B]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )}
              <div className="whitespace-pre-wrap break-words">{m.text}</div>
              {m.citations && m.citations.length > 0 && (
                <div className="pt-2 border-t border-border/60 mt-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold text-ink/50 uppercase tracking-wider">Curated Sources — Hybrid RRF</div>
                    {m.confidence && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${relevanceMeta(m.citations[0]?.score, m.confidence).color}`}>
                        {m.confidence.toUpperCase()} · {relevanceMeta(m.citations[0]?.score, m.confidence).pct}%
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.citations.filter((s) => s.url).map((s, sIdx) => {
                      const meta = relevanceMeta(s.score, (s as any).confidence);
                      return (
                        <a key={sIdx} href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-border/80 text-[11px] font-semibold text-ink hover:border-ink/30 hover:bg-cream/40 transition-colors group/cite">
                          <span className="truncate max-w-[160px] group-hover/cite:text-[#2A9D7B]">{s.title || "Reference"}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${meta.color}`} title={`${meta.label} — Hybrid RRF score ${(s.score ?? 0).toFixed(3)}`}>
                            {meta.pct}% · {meta.conf}
                          </span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0 text-ink/40 group-hover/cite:text-ink" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isPending && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-xl bg-ink text-white flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-border rounded-2xl rounded-bl-xs p-3.5 shadow-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#2A9D7B]" />
              <span className="text-xs text-ink/60 font-medium">{mode === "grounded" ? "Retrieving verified knowledge…" : "Generating comprehensive breakdown…"}</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Starter chips */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 bg-white border-t border-border/60">
          <div className="text-[10px] font-bold text-ink/40 uppercase tracking-wider mb-1.5">Try asking</div>
          <div className="flex flex-wrap gap-1.5">
            {STARTER_PROMPTS[mode].map((p, idx) => (
              <button key={idx} onClick={() => handleSend(p)} className="px-3 py-1.5 rounded-xl bg-cream/30 hover:bg-cream/60 border border-border text-xs text-ink/75 hover:text-ink cursor-pointer">
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border bg-white shrink-0 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={mode === "grounded" ? "Ask a system design question (cited)…" : "Ask any CS / DSA / interview question…"}
          className="flex-1 bg-cream/20 border border-border rounded-xl px-3.5 py-2.5 text-xs focus:border-ink focus:outline-none"
        />
        <button onClick={() => handleSend()} disabled={!input.trim() || isPending} className="bg-ink text-white p-2.5 rounded-xl hover:bg-ink/90 disabled:opacity-40 cursor-pointer">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
