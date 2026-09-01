import React, { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiCall } from "@/lib/api";
import { Bot, Send, Loader2, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface SourceCitation {
  title?: string;
  url?: string;
  score?: number;
}

interface ChatMessage {
  role: "user" | "bot";
  text: string;
  sources?: SourceCitation[];
  confidence?: "high" | "medium" | "low" | "none";
}

export default function RAGChatbot({ scopeId }: { scopeId?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: "Hi! I am your System Design Oracle. Ask me any conceptual or architectural question grounded in our verified technical curriculum.",
      confidence: "high"
    }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: (message: string) => apiCall("/study/chat", "POST", { message, scopeId }),
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        {
          role: "bot",
          text: data.reply,
          sources: data.sources || [],
          confidence: data.confidence || "medium"
        }
      ]);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to retrieve grounded answer.");
    }
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    const msg = input.trim();
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    chatMutation.mutate(msg);
    setInput("");
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-xs flex flex-col h-[520px] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-cream/30 flex items-center justify-between shrink-0">
        <div>
          <div className="text-sm font-bold text-ink">System Design Oracle</div>
          <div className="text-[11px] text-ink/50 font-medium">Grounded RAG Retrieval</div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-cream/10">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] rounded-2xl p-4 text-xs leading-relaxed space-y-2.5 ${
              m.role === "user" 
                ? "bg-ink text-white rounded-br-xs" 
                : "bg-white border border-border text-ink shadow-xs rounded-bl-xs"
            }`}>
              <div className="whitespace-pre-wrap">{m.text}</div>
              
              {/* Citations / Sources if present */}
              {m.sources && m.sources.length > 0 && (
                <div className="pt-2 border-t border-border/60 mt-2 space-y-1">
                  <div className="text-[10px] font-bold text-ink/50 uppercase tracking-wider">
                    Curated Sources:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.sources.filter(s => s.url).map((s, sIdx) => (
                      <a
                        key={sIdx}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cream/40 border border-border/80 text-[10px] font-semibold text-[#2A9D7B] hover:text-[#183A32] hover:underline"
                      >
                        <span className="truncate max-w-[160px]">{s.title || "Reference Doc"}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" strokeWidth={2} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-white border border-border text-ink rounded-2xl rounded-bl-xs p-3.5 shadow-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-ink/50" />
              <span className="text-xs text-ink/60 font-medium">Retrieving verified knowledge...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3.5 border-t border-border bg-white shrink-0 flex items-center space-x-2">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask a technical or system design doubt..."
          className="flex-1 bg-cream/20 border border-border rounded-xl px-3.5 py-2.5 focus:border-ink focus:outline-none text-xs"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || chatMutation.isPending}
          className="bg-ink text-white p-2.5 rounded-xl hover:bg-ink/90 disabled:opacity-40 transition-all cursor-pointer"
        >
          <Send className="w-4 h-4 shrink-0" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
