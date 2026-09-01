import React, { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { EvaluationForm } from "@/components/interview/evaluation/EvaluationForm";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/interview/$roomKey/evaluation")({
  component: EvaluationPageRoute,
});

function EvaluationPageRoute() {
  const { roomKey } = Route.useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const data = await apiCall<{ session: any }>(
          `/interviews/room/${roomKey}`,
          "GET",
          null,
          token,
        );
        if (data && data.session) {
          setSession(data.session);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [roomKey, token]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0E0E0E] text-white">
        <Loader2 className="h-6 w-6 animate-spin text-[#2A9D7B]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#0E0E0E]">
      {/* Top Breadcrumb Header */}
      <div className="flex h-12 items-center justify-between border-b border-[#2A2A2A] bg-[#161616] px-4 text-xs font-mono">
        <button
          onClick={() => navigate({ to: `/interview/${roomKey}` })}
          className="flex items-center gap-1 text-[#888888] hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Live Interview Room</span>
        </button>

        {session && (
          <span className="text-[#AAAAAA]">
            Evaluating:{" "}
            <strong className="text-white">{session.seeker?.name || "Candidate"}</strong> (
            {session.job?.title || "Technical Role"})
          </span>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {session && (
          <EvaluationForm
            sessionId={session._id}
            token={token ?? undefined}
            onSaved={() => navigate({ to: "/interviews" })}
          />
        )}
      </div>
    </div>
  );
}
