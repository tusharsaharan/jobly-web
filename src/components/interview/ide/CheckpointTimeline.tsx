import React, { useEffect, useState } from "react";
import { History, Camera, RotateCcw, Clock, CheckCircle, Tag, Loader2 } from "lucide-react";
import { apiCall } from "@/lib/api";
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
  onRestoreComplete: () => void;
  readOnly?: boolean;
}

export function CheckpointTimeline({
  sessionId,
  token,
  onRestoreComplete,
  readOnly = false,
}: CheckpointTimelineProps) {
  const [checkpoints, setCheckpoints] = useState<CheckpointItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchCheckpoints = async () => {
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
  };

  useEffect(() => {
    fetchCheckpoints();
  }, [sessionId, token]);

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
    if (!confirm(`Restore workspace back to Checkpoint #${cp.sequenceNumber}?`)) return;

    try {
      setRestoringId(cp._id);
      await apiCall(
        `/coding/${sessionId}/checkpoints/${cp._id}/restore`,
        "POST",
        null,
        token
      );
      toast.success(`Workspace restored to Checkpoint #${cp.sequenceNumber}`);
      onRestoreComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed restoring checkpoint");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="flex h-full flex-col border-t border-[#2A2A2A] bg-[#121212] text-xs font-mono text-white">
      {/* Header */}
      <div className="flex h-9 items-center justify-between border-b border-[#2A2A2A] px-3 bg-[#1A1A1A]">
        <div className="flex items-center gap-2 text-[#888888]">
          <History className="h-3.5 w-3.5 text-[#2A9D7B]" />
          <span className="font-semibold uppercase tracking-wider">Version Checkpoints</span>
        </div>

        {!readOnly && (
          <button
            onClick={handleTakeSnapshot}
            className="flex items-center gap-1 rounded bg-[#222222] px-2.5 py-1 text-[11px] font-semibold text-[#CCCCCC] hover:bg-[#2A9D7B] hover:text-white transition"
          >
            <Camera className="h-3 w-3" />
            <span>Snapshot</span>
          </button>
        )}
      </div>

      {/* Checkpoints list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {loading && checkpoints.length === 0 ? (
          <div className="flex items-center justify-center p-4 text-[#666666]">
            <Loader2 className="h-4 w-4 animate-spin text-[#2A9D7B]" />
          </div>
        ) : checkpoints.length === 0 ? (
          <div className="p-3 text-center text-[#555555]">
            No code checkpoints recorded yet. Click &ldquo;Snapshot&rdquo; or execute code to create one.
          </div>
        ) : (
          checkpoints.map((cp) => (
            <div
              key={cp._id}
              className="flex items-center justify-between rounded border border-[#222222] bg-[#181818] p-2 hover:border-[#333333] transition"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#2A9D7B]/20 px-1.5 py-0.2 text-[10px] font-bold text-[#2A9D7B]">
                    #{cp.sequenceNumber}
                  </span>
                  <span className="font-semibold text-[#E0E0E0] truncate max-w-[180px]">
                    {cp.triggerLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#777777]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(cp.createdAt).toLocaleTimeString()}
                  </span>
                  <span>• {cp.filesSnapshot?.length || 1} file(s)</span>
                </div>
              </div>

              {!readOnly && (
                <button
                  onClick={() => handleRestore(cp)}
                  disabled={restoringId === cp._id}
                  className="flex items-center gap-1 rounded bg-[#2A2A2A] px-2 py-1 text-[10px] text-[#AAAAAA] hover:bg-[#2A9D7B] hover:text-white transition disabled:opacity-50"
                >
                  {restoringId === cp._id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3 w-3" />
                  )}
                  <span>Restore</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
