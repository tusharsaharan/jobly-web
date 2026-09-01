import React, { useEffect, useState, useCallback } from "react";
import { History, Camera, RotateCcw, Clock, CheckCircle, Tag, Loader2, X } from "lucide-react";
import { apiCall } from "@/lib/api";
import { getInterviewSocket } from "@/lib/socket";
import { toast } from "sonner";

export interface CheckpointItem {
  _id: string;
  sequenceNumber: number;
  triggerType: "EXECUTION" | "STAGE_TRANSITION" | "AUTO_SAVE" | "MANUAL";
  triggerLabel: string;
  filesSnapshot: Array<{ path: string; name: string; content: string; language: string }>;
  createdAt: string;
}

interface CheckpointTimelineProps {
  sessionId: string;
  token?: string;
  onRestoreComplete: (cp: CheckpointItem) => void;
  readOnly?: boolean;
}

const SW = 1.75;

export function CheckpointTimeline({
  sessionId,
  token,
  onRestoreComplete,
  readOnly = false,
}: CheckpointTimelineProps) {
  const [checkpoints, setCheckpoints] = useState<CheckpointItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchCheckpoints = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiCall<{ checkpoints: CheckpointItem[] }>(
        `/coding/${sessionId}/checkpoints`,
        "GET",
        null,
        token
      );
      if (data && data.checkpoints) {
        setCheckpoints(data.checkpoints);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [sessionId, token]);

  useEffect(() => {
    setRestoringId(null);
    setConfirmingId(null);
    fetchCheckpoints();

    if (token) {
      const socket = getInterviewSocket(token);
      const handleCheckpointCreated = (cp: any) => {
        setCheckpoints((prev) => {
          if (prev.some((item) => item._id === cp._id)) return prev;
          return [cp, ...prev].sort((a, b) => b.sequenceNumber - a.sequenceNumber);
        });
      };
      const handleCheckpointRestored = () => {
        fetchCheckpoints();
      };

      socket.on("checkpoint_created", handleCheckpointCreated);
      socket.on("checkpoint_restored", handleCheckpointRestored);

      return () => {
        socket.off("checkpoint_created", handleCheckpointCreated);
        socket.off("checkpoint_restored", handleCheckpointRestored);
      };
    }
  }, [sessionId, token, fetchCheckpoints]);

  const handleTakeSnapshot = async () => {
    try {
      await apiCall(
        `/coding/${sessionId}/checkpoints`,
        "POST",
        { label: "Manual user snapshot" },
        token
      );
      toast.success("Code checkpoint snapshot saved.");
      fetchCheckpoints();
    } catch (err: any) {
      toast.error(err.message || "Failed saving snapshot");
    }
  };

  const handleRestore = async (cp: CheckpointItem) => {
    if (readOnly) return;
    try {
      setRestoringId(cp._id);
      setConfirmingId(null);
      const res = await apiCall<{ msg: string; checkpoint?: CheckpointItem }>(
        `/coding/${sessionId}/checkpoints/${cp._id}/restore`,
        "POST",
        null,
        token
      );
      toast.success(`Workspace restored to Checkpoint #${cp.sequenceNumber}`);
      onRestoreComplete(res?.checkpoint || cp);
    } catch (err: any) {
      toast.error(err.message || "Failed restoring checkpoint");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="flex h-full flex-col border-t border-iv-line bg-iv-surface text-iv-text">
      {/* Header */}
      <div className="iv-header-panel h-9 shrink-0 justify-between px-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-iv-muted">
          Version Checkpoints
        </span>

        {!readOnly && (
          <button onClick={handleTakeSnapshot} className="iv-btn iv-btn-ghost iv-btn-sm">
            <Camera strokeWidth={SW} className="h-3 w-3" />
            Snapshot
          </button>
        )}
      </div>

      {/* Checkpoints list */}
      <div className="iv-scroll flex-1 space-y-1.5 overflow-y-auto p-2">
        {loading && checkpoints.length === 0 ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 strokeWidth={SW} className="h-4 w-4 animate-spin text-iv-accent" />
          </div>
        ) : checkpoints.length === 0 ? (
          <div className="p-3 text-center text-xs text-iv-dim">
            No code checkpoints recorded yet. Click &ldquo;Snapshot&rdquo; or execute code to create
            one.
          </div>
        ) : (
          checkpoints.map((cp) => (
            <div
              key={cp._id}
              className="flex items-center justify-between rounded-lg border border-iv-line bg-iv-surface-alt p-2 transition hover:border-iv-elevated"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="iv-badge iv-badge-accent">#{cp.sequenceNumber}</span>
                  <span className="max-w-[180px] truncate text-xs font-semibold">{cp.triggerLabel}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-iv-dim">
                  <span className="flex items-center gap-1">
                    <Clock strokeWidth={SW} className="h-3 w-3" />
                    {new Date(cp.createdAt).toLocaleTimeString()}
                  </span>
                  <span>• {cp.filesSnapshot?.length || 1} file(s)</span>
                </div>
              </div>

              {!readOnly && (
                <div className="flex shrink-0 items-center gap-1">
                  {confirmingId === cp._id ? (
                    <>
                      <button
                        onClick={() => handleRestore(cp)}
                        disabled={restoringId === cp._id}
                        className="iv-btn iv-btn-primary iv-btn-sm"
                      >
                        {restoringId === cp._id ? (
                          <Loader2 strokeWidth={SW} className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle strokeWidth={SW} className="h-3 w-3" />
                        )}
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        className="iv-icon-btn iv-icon-btn-sm"
                      >
                        <X strokeWidth={SW} className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmingId(cp._id)}
                      disabled={restoringId === cp._id}
                      className="iv-btn iv-btn-ghost iv-btn-sm"
                    >
                      {restoringId === cp._id ? (
                        <Loader2 strokeWidth={SW} className="h-3 w-3 animate-spin" />
                      ) : (
                        <RotateCcw strokeWidth={SW} className="h-3 w-3" />
                      )}
                      Restore
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
