import React, { useEffect, useState } from "react";
import { Activity, Zap, CheckCircle2, AlertTriangle, Cpu, MessageSquare, Terminal, Eye, Layers } from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface SignalItem {
  id: string;
  category: "coding" | "communication" | "whiteboard" | "attention" | "execution";
  name: string;
  indicator: "positive" | "neutral" | "concern";
  weight: number;
  offsetMs: number;
  payload: Record<string, any>;
  createdAt: string;
}

interface SignalHUDProps {
  sessionId: string;
  roomKey: string;
}

export function SignalHUD({ sessionId, roomKey }: SignalHUDProps) {
  const { token } = useAuth();
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSignals = async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const res = await apiCall<{ success: boolean; count: number; signals: SignalItem[] }>(
        `/signals/session/${sessionId}`,
        "GET",
        null,
        token
      );
      if (res.success && Array.isArray(res.signals)) {
        setSignals(res.signals.slice(-12).reverse());
      }
    } catch (e) {
      // silent fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 10000);
    return () => clearInterval(interval);
  }, [sessionId, token]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "coding":
        return <Cpu className="h-3 w-3 text-blue-400" />;
      case "communication":
        return <MessageSquare className="h-3 w-3 text-emerald-400" />;
      case "execution":
        return <Terminal className="h-3 w-3 text-amber-400" />;
      case "whiteboard":
        return <Layers className="h-3 w-3 text-purple-400" />;
      case "attention":
      default:
        return <Eye className="h-3 w-3 text-cyan-400" />;
    }
  };

  const getIndicatorBadge = (indicator: string) => {
    if (indicator === "positive") {
      return (
        <span className="flex items-center gap-1 rounded bg-emerald-950/40 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="h-2.5 w-2.5" /> Positive
        </span>
      );
    }
    if (indicator === "concern") {
      return (
        <span className="flex items-center gap-1 rounded bg-rose-950/40 px-1.5 py-0.5 text-[9px] font-medium text-rose-300 border border-rose-500/30">
          <AlertTriangle className="h-2.5 w-2.5" /> Note
        </span>
      );
    }
    return (
      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400">
        Observed
      </span>
    );
  };

  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/90 p-3 text-xs text-zinc-100 backdrop-blur-md">
      <div className="mb-2.5 flex items-center justify-between border-b border-zinc-800/80 pb-2">
        <div className="flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span className="font-semibold text-zinc-200">Live Interview Signals</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
          <Zap className="h-3 w-3 text-amber-400" />
          <span>Real-Time Ingestion</span>
        </div>
      </div>

      <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
        {signals.length === 0 ? (
          <div className="py-4 text-center text-zinc-500 text-[11px]">
            No signals emitted yet. Signals stream as the candidate codes, runs tests, and explains their solution.
          </div>
        ) : (
          signals.map((sig) => (
            <div
              key={sig.id}
              className="flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-900/60 px-2.5 py-1.5 transition hover:bg-zinc-900"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {getCategoryIcon(sig.category)}
                <span className="truncate font-medium text-zinc-300 text-[11px]">
                  {sig.name.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {getIndicatorBadge(sig.indicator)}
                <span className="text-[10px] text-zinc-500">
                  {Math.floor(sig.offsetMs / 1000)}s
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
