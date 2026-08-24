import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiCall } from "@/lib/api";
import { toast } from "sonner";
import { Gamepad2, BrainCircuit, Code2, Users, Loader2, KeyRound } from "lucide-react";

export const Route = createFileRoute("/_app/compete")({
  component: CompeteDashboard,
});

function CompeteDashboard() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<"QUIZ" | "CP">("QUIZ");

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!pin) throw new Error("PIN is required");
      const { lobby } = await apiCall("/compete/join", {
        method: "POST",
        body: { pin },
      });
      return lobby;
    },
    onSuccess: (lobby) => {
      navigate({ to: "/compete/$lobbyId", params: { lobbyId: lobby._id } });
    },
    onError: (err: any) => toast.error(err.message || "Failed to join lobby"),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!topic) throw new Error("Topic is required");
      toast.info(`Generating ${mode === "QUIZ" ? "AI Quiz" : "CP Problem"}...`, { duration: 5000 });
      const { lobby } = await apiCall("/compete/create", {
        method: "POST",
        body: { topic, mode },
      });
      return lobby;
    },
    onSuccess: (lobby) => {
      navigate({ to: "/compete/$lobbyId", params: { lobbyId: lobby._id } });
    },
    onError: (err: any) => toast.error(err.message || "Failed to create lobby"),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32">
      <header className="mb-10 text-center space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-ink/70">
          Multiplayer Hub
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink">
          Arena Competitions
        </h1>
        <p className="text-sm text-ink/65 max-w-xl mx-auto">
          Challenge your peers in real-time. Join a live technical quiz lobby or a fast-paced competitive programming match.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        
        {/* Join Panel */}
        <div className="rounded-2xl border border-border bg-white p-7 shadow-xs">
          <h2 className="text-lg font-bold text-ink mb-1">Join Match</h2>
          <p className="text-xs text-ink/65 mb-6">Enter the 6-digit Game PIN provided by the host.</p>
          
          <div className="space-y-4">
            <input 
              type="text" 
              maxLength={6}
              className="w-full text-center text-2xl font-bold tracking-widest rounded-xl border border-border px-4 py-3 bg-cream/20 focus:border-ink focus:outline-none placeholder:text-border"
              placeholder="000000"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && joinMutation.mutate()}
            />
            
            <button
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending || pin.length < 6}
              className="w-full rounded-xl bg-ink py-3 text-xs font-bold text-white tracking-wide hover:bg-ink/90 transition-all disabled:opacity-50 cursor-pointer"
            >
              {joinMutation.isPending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "ENTER ARENA"}
            </button>
          </div>
        </div>

        {/* Create Panel */}
        <div className="rounded-2xl border border-border bg-white p-7 shadow-xs">
          <h2 className="text-lg font-bold text-ink mb-1">Host a Match</h2>
          <p className="text-xs text-ink/65 mb-6">Create a room and invite peers to compete.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1.5">Topic</label>
              <input 
                type="text" 
                className="w-full rounded-xl border border-border px-3.5 py-2.5 bg-cream/20 text-sm focus:border-ink focus:outline-none placeholder:text-ink/40"
                placeholder="e.g. GraphQL, Two Pointers, React"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1.5">Mode</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("QUIZ")}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-semibold border transition-all text-center cursor-pointer ${
                    mode === "QUIZ" 
                      ? "border-ink bg-ink text-white" 
                      : "border-border bg-transparent text-ink/70 hover:border-ink/30"
                  }`}
                >
                  Live Quiz
                </button>
                <button
                  type="button"
                  onClick={() => setMode("CP")}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-semibold border transition-all text-center cursor-pointer ${
                    mode === "CP" 
                      ? "border-ink bg-ink text-white" 
                      : "border-border bg-transparent text-ink/70 hover:border-ink/30"
                  }`}
                >
                  Code Battle
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !topic.trim()}
              className="w-full rounded-xl bg-ink py-3 text-xs font-bold text-white tracking-wide hover:bg-ink/90 transition-all disabled:opacity-50 mt-1 flex items-center justify-center cursor-pointer"
            >
              {createMutation.isPending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "CREATE MATCH"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
