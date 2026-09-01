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
      <div className="flex h-screen items-center justify-center bg-iv-bg">
        <Loader2 strokeWidth={1.75} className="h-6 w-6 animate-spin text-iv-accent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-iv-bg text-iv-text">
      {/* Top Breadcrumb Header */}
      <div className="iv-header h-12 shrink-0 justify-between text-xs">
        <button
          onClick={() => navigate({ to: `/interview/${roomKey}` })}
          className="flex items-center gap-1 text-iv-muted transition hover:text-iv-text"
        >
          <ArrowLeft strokeWidth={1.75} className="h-4 w-4" />
          <span>Back to Live Interview Room</span>
        </button>

        {session && (
          <span className="text-iv-muted">
            Evaluating:{" "}
            <strong className="text-iv-text">{session.seeker?.name || "Candidate"}</strong> (
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
