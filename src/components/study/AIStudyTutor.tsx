import React, { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiCall } from "@/lib/api";
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Trash2, 
  Bot, 
  User, 
  Lightbulb, 
  Code2, 
  Cpu, 
  Database,
  HelpCircle,
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  text: string;
  timestamp?: string;
}

const STARTER_PROMPTS = [
  { text: "What is ASID in Operating Systems?" },
  { text: "Explain B-Tree vs B+ Tree in database indexing" },
  { text: "How does std::move and rvalue references work in C++?" },
  { text: "Explain how to solve the LRU Cache problem in O(1)" }
];

export default function AIStudyTutor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hello! I am your **AI Master Study Tutor** powered by Gemini. You can ask me **any** question across Computer Science, Operating Systems, System Design, Data Structures & Algorithms, Language Internals, and Technical Interview Preparation.\n\nWhat would you like to explore or clarify today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const tutorMutation = useMutation({
    mutationFn: (message: string) => {
      const history = messages.slice(-8).map(m => ({ role: m.role, text: m.text }));
      return apiCall("/study/tutor", "POST", { message, history });
    },
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to get tutor response. Please try again.");
    }
  });

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || tutorMutation.isPending) return;

    setMessages(prev => [
      ...prev,
      {
        role: "user",
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    tutorMutation.mutate(text);
    if (!textToSend) setInput("");
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        text: "Chat cleared! What technical concept or problem would you like to explore next?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-ink/70 mb-1">
            Unlimited AI Knowledge Engine
          </div>
          <h2 className="text-xl font-bold text-ink">Jobly AI Master Study Tutor</h2>
          <p className="text-xs text-ink/65 mt-0.5 max-w-xl">
            Ask any technical, algorithmic, or architectural question without database limitations. Powered by Gemini.
          </p>
        </div>

        <button
          onClick={clearChat}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-ink/60 hover:text-ink hover:bg-cream/40 border border-border transition-colors cursor-pointer self-start sm:self-center shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Main Chat Box */}
      <div className="bg-white rounded-2xl border border-border shadow-xs flex flex-col h-[640px] overflow-hidden">
        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-cream/10">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-ink text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <Bot className="w-4 h-4" strokeWidth={2} />
                </div>
              )}

              <div className={`max-w-[85%] rounded-2xl p-4.5 text-xs leading-relaxed space-y-2 relative group ${
                m.role === "user"
                  ? "bg-ink text-white rounded-br-xs"
                  : "bg-white border border-border text-ink shadow-xs rounded-bl-xs"
              }`}>
                {/* Header info / copy */}
                <div className="flex items-center justify-between gap-4 pb-1 border-b border-border/40 text-[10px] text-ink/45">
                  <span className="font-semibold">{m.role === "user" ? "You" : "AI Master Tutor"}</span>
                  <div className="flex items-center gap-2">
                    {m.timestamp && <span>{m.timestamp}</span>}
                    {m.role === "assistant" && (
                      <button
                        onClick={() => handleCopy(m.text, i)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-ink cursor-pointer p-0.5"
                        title="Copy text"
                      >
                        {copiedIdx === i ? <Check className="w-3 h-3 text-[#2A9D7B]" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] leading-relaxed pt-1 space-y-2">
                  {m.text}
                </div>
              </div>

              {m.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-[#2A9D7B] text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <User className="w-4 h-4" strokeWidth={2} />
                </div>
              )}
            </div>
          ))}

          {tutorMutation.isPending && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-ink text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                <Bot className="w-4 h-4" strokeWidth={2} />
              </div>
              <div className="bg-white border border-border text-ink rounded-2xl rounded-bl-xs p-4 shadow-xs flex items-center gap-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-[#2A9D7B]" />
                <span className="text-xs text-ink/65 font-medium">Generating comprehensive technical breakdown...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Starter Prompts */}
        {messages.length <= 2 && (
          <div className="p-3 bg-white border-t border-border/60">
            <div className="text-[10px] font-bold text-ink/40 uppercase tracking-wider mb-2 px-2">
              Suggested Technical Queries:
            </div>
            <div className="flex flex-wrap gap-2 px-2">
              {STARTER_PROMPTS.map((p, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleSend(p.text)}
                  className="inline-flex items-center px-3 py-1.5 rounded-xl bg-cream/30 hover:bg-cream/70 border border-border text-xs text-ink/80 hover:text-ink transition-colors cursor-pointer"
                >
                  <span>{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-border bg-white shrink-0 flex items-center gap-3">
          <textarea
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask any question about OS, DSA, System Design, C++, Java, DBMS, Networks, or Interviews..."
            className="flex-1 bg-cream/20 border border-border rounded-xl px-4 py-3 focus:border-ink focus:outline-none text-xs sm:text-sm resize-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || tutorMutation.isPending}
            className="bg-ink text-white px-5 py-3 rounded-xl hover:bg-ink/90 disabled:opacity-40 transition-all font-bold text-xs inline-flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
