import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Clock,
  ArrowLeft,
  Loader2,
  Upload,
  Film,
  Maximize2,
  Minimize2,
  VolumeX,
  Volume2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/interview/$roomKey/replay")({
  component: InterviewReplayPage,
});

/* ═══════════════════════════════════════════════════════════════════════════
 *  TYPES
 * ═══════════════════════════════════════════════════════════════════════════ */

interface CheckpointFile {
  path: string;
  name: string;
  content: string;
  language: string;
}

interface Checkpoint {
  _id: string;
  sequenceNumber: number;
  triggerType: "EXECUTION" | "STAGE_TRANSITION" | "AUTO_SAVE" | "MANUAL";
  triggerLabel: string;
  filesSnapshot: CheckpointFile[];
  createdAt: string;
  offsetMs?: number;
}

/** A single replay frame — represents a distinct code state at a point in time */
interface ReplayFrame {
  /** Normalized time 0–1 within the total replay duration */
  t: number;
  /** Lines of code to display */
  lines: string[];
  /** Which line indices were just added or changed (for highlight) */
  changedLines: number[];
  /** Language for syntax hint */
  language: string;
  /** File path */
  filePath: string;
  /** Source checkpoint index (-1 for interpolated) */
  checkpointIndex: number;
  /** Label */
  label: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  LINE-LEVEL DIFF ENGINE
 *  Computes which lines were added, removed, or changed between two states.
 *  Generates intermediate frames that progressively apply the diff.
 * ═══════════════════════════════════════════════════════════════════════════ */

function getPrimarySnapshotFile(cp: Checkpoint): CheckpointFile | null {
  if (!cp.filesSnapshot || cp.filesSnapshot.length === 0) return null;
  const solWithContent = cp.filesSnapshot.find(
    (f) => f.path?.includes("solution") && f.content && f.content.trim().length > 0
  );
  if (solWithContent) return solWithContent;
  const anyWithContent = cp.filesSnapshot.find((f) => f.content && f.content.trim().length > 0);
  if (anyWithContent) return anyWithContent;
  const sol = cp.filesSnapshot.find((f) => f.path?.includes("solution"));
  if (sol) return sol;
  return cp.filesSnapshot[0];
}

function computeReplayFrames(checkpoints: Checkpoint[]): ReplayFrame[] {
  if (checkpoints.length === 0) return [];

  const frames: ReplayFrame[] = [];
  const totalCheckpoints = checkpoints.length;

  for (let i = 0; i < totalCheckpoints; i++) {
    const cp = checkpoints[i];
    const file = getPrimarySnapshotFile(cp);
    const content = file?.content || "";
    const currentLines = content.split("\n");
    const language = file?.language || "python";
    const filePath = file?.path || "/src/solution.py";

    // Time proportion: each checkpoint gets an equal slice of 0–1
    const tStart = i / totalCheckpoints;
    const tEnd = (i + 1) / totalCheckpoints;

    if (i === 0) {
      // For the first checkpoint, progressively reveal lines
      const lineCount = currentLines.length;
      const stepCount = Math.max(1, lineCount);

      for (let step = 0; step < stepCount; step++) {
        const visibleLines = currentLines.slice(0, step + 1);
        const t = tStart + ((step / stepCount) * (tEnd - tStart));
        frames.push({
          t,
          lines: visibleLines,
          changedLines: [step],
          language,
          filePath,
          checkpointIndex: i,
          label: step === 0 ? cp.triggerLabel : "",
        });
      }
    } else {
      // For subsequent checkpoints, compute diff from previous
      const prevCp = checkpoints[i - 1];
      const prevFile = getPrimarySnapshotFile(prevCp);
      const prevContent = prevFile?.content || "";
      const prevLines = prevContent.split("\n");

      // Find the diff operations needed
      const diffSteps = computeLineLevelDiff(prevLines, currentLines);

      if (diffSteps.length === 0) {
        // No changes — just add one frame at the checkpoint time
        frames.push({
          t: tStart,
          lines: currentLines,
          changedLines: [],
          language,
          filePath,
          checkpointIndex: i,
          label: cp.triggerLabel,
        });
      } else {
        // Distribute diff steps across the time slice
        for (let step = 0; step < diffSteps.length; step++) {
          const t = tStart + ((step / diffSteps.length) * (tEnd - tStart));
          frames.push({
            t,
            lines: diffSteps[step].lines,
            changedLines: diffSteps[step].changedLineIndices,
            language,
            filePath,
            checkpointIndex: i,
            label: step === 0 ? cp.triggerLabel : "",
          });
        }
      }
    }
  }

  return frames;
}

interface DiffStep {
  lines: string[];
  changedLineIndices: number[];
}

/**
 * Compute intermediate steps to morph prevLines into nextLines.
 * Strategy: apply changes line-by-line. Each step represents the state
 * after one more line change has been applied.
 */
function computeLineLevelDiff(prevLines: string[], nextLines: string[]): DiffStep[] {
  const maxLen = Math.max(prevLines.length, nextLines.length);
  const steps: DiffStep[] = [];

  // Find all lines that differ
  const diffIndices: number[] = [];
  for (let i = 0; i < maxLen; i++) {
    const prev = i < prevLines.length ? prevLines[i] : undefined;
    const next = i < nextLines.length ? nextLines[i] : undefined;
    if (prev !== next) {
      diffIndices.push(i);
    }
  }

  if (diffIndices.length === 0) return [];

  // Group consecutive diff indices into batches of up to 3 lines
  // This prevents too many frames for large diffs while keeping it granular
  const batches: number[][] = [];
  let currentBatch: number[] = [];
  for (const idx of diffIndices) {
    if (currentBatch.length > 0 && (idx - currentBatch[currentBatch.length - 1] > 1 || currentBatch.length >= 3)) {
      batches.push(currentBatch);
      currentBatch = [];
    }
    currentBatch.push(idx);
  }
  if (currentBatch.length > 0) batches.push(currentBatch);

  // Cap total steps to avoid performance issues
  const maxSteps = 40;
  const useBatches = batches.length > maxSteps
    ? batches.reduce((acc: number[][], batch, i) => {
        const targetIdx = Math.floor(i / (batches.length / maxSteps));
        if (!acc[targetIdx]) acc[targetIdx] = [];
        acc[targetIdx].push(...batch);
        return acc;
      }, [])
    : batches;

  // Build progressive states
  let workingLines = [...prevLines];
  for (const batch of useBatches) {
    // Apply this batch of changes
    for (const lineIdx of batch) {
      if (lineIdx < nextLines.length) {
        // Add or modify line
        while (workingLines.length <= lineIdx) workingLines.push("");
        workingLines[lineIdx] = nextLines[lineIdx];
      }
    }
    // Trim or extend to match target length if we're at the last batch
    if (batch === useBatches[useBatches.length - 1]) {
      if (nextLines.length < workingLines.length) {
        workingLines = workingLines.slice(0, nextLines.length);
      }
      while (workingLines.length < nextLines.length) {
        workingLines.push(nextLines[workingLines.length]);
      }
    }
    steps.push({
      lines: [...workingLines],
      changedLineIndices: batch.filter((i) => i < workingLines.length),
    });
  }

  return steps;
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════ */

function InterviewReplayPage() {
  const { roomKey } = Route.useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  // Data state
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [replayFrames, setReplayFrames] = useState<ReplayFrame[]>([]);
  const [recordingSource, setRecordingSource] = useState<string | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [recentlyChanged, setRecentlyChanged] = useState<Set<number>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const codeViewerRef = useRef<HTMLDivElement>(null);

  // Current frame
  const frame = replayFrames[currentFrameIdx] || null;

  /* ─── Data Loading ──────────────────────────────────────────────────── */

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);

        // 1. Get session info
        const sessionData = await apiCall<{ session: any }>(
          `/interviews/room/${roomKey}`,
          "GET",
          null,
          token,
        );
        if (cancelled || !sessionData?.session) return;
        setSession(sessionData.session);

        // Check for recording URL
        if (sessionData.session.recordingUrl) {
          const rawUrl = sessionData.session.recordingUrl;
          const fullUrl = rawUrl.startsWith("http")
            ? rawUrl
            : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${rawUrl}`;
          setRecordingSource(fullUrl);
        }

        // 2. Fetch all checkpoints
        const cpData = await apiCall<{ checkpoints: Checkpoint[] }>(
          `/coding/${sessionData.session._id}/checkpoints`,
          "GET",
          null,
          token,
        );
        if (cancelled) return;

        const cps = cpData?.checkpoints || [];
        // Sort by sequence number
        cps.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
        setCheckpoints(cps);

        // 3. Build replay frames
        const frames = computeReplayFrames(cps);
        setReplayFrames(frames);
      } catch (err: any) {
        if (!cancelled) toast.error(err.message || "Failed loading replay data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [roomKey, token]);

  /* ─── Playback Engine ───────────────────────────────────────────────── */

  const totalFrames = replayFrames.length;

  const stopPlayback = useCallback(() => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  }, []);

  const startPlayback = useCallback(() => {
    stopPlayback();

    // Base interval: ~150ms per frame at 1x speed
    // With speed multiplier, faster speeds = shorter interval
    const baseIntervalMs = 150;
    const intervalMs = Math.max(20, baseIntervalMs / playbackSpeed);

    playIntervalRef.current = setInterval(() => {
      setCurrentFrameIdx((prev) => {
        if (prev >= totalFrames - 1) {
          stopPlayback();
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);
  }, [playbackSpeed, totalFrames, stopPlayback]);

  useEffect(() => {
    if (isPlaying && totalFrames > 0) {
      startPlayback();
    } else {
      stopPlayback();
    }
    return stopPlayback;
  }, [isPlaying, startPlayback, stopPlayback, totalFrames]);

  // Track recently changed lines for highlight animation
  useEffect(() => {
    if (!frame) return;
    if (frame.changedLines.length > 0) {
      setRecentlyChanged(new Set(frame.changedLines));
      const timer = setTimeout(() => setRecentlyChanged(new Set()), 600);
      return () => clearTimeout(timer);
    }
  }, [currentFrameIdx]);

  // Auto-scroll to changed lines
  useEffect(() => {
    if (!frame || frame.changedLines.length === 0 || !codeViewerRef.current) return;
    const firstChanged = frame.changedLines[0];
    const lineEl = codeViewerRef.current.querySelector(`[data-line="${firstChanged}"]`);
    if (lineEl) {
      lineEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentFrameIdx]);

  /* ─── Controls ──────────────────────────────────────────────────────── */

  const togglePlay = useCallback(() => {
    if (currentFrameIdx >= totalFrames - 1 && !isPlaying) {
      // Restart from beginning if at end
      setCurrentFrameIdx(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [currentFrameIdx, totalFrames, isPlaying]);

  const seekToFrame = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(totalFrames - 1, idx));
    setCurrentFrameIdx(clamped);
  }, [totalFrames]);

  const seekToCheckpoint = useCallback((cpIndex: number) => {
    // Find the first frame for this checkpoint
    const frameIdx = replayFrames.findIndex((f) => f.checkpointIndex === cpIndex);
    if (frameIdx >= 0) {
      seekToFrame(frameIdx);
      setIsPlaying(false);
    }
  }, [replayFrames, seekToFrame]);

  const seekRelativeFrames = useCallback((delta: number) => {
    seekToFrame(currentFrameIdx + delta);
  }, [currentFrameIdx, seekToFrame]);

  const restart = useCallback(() => {
    setCurrentFrameIdx(0);
    setIsPlaying(false);
  }, []);

  /* ─── Keyboard Shortcuts ────────────────────────────────────────────── */

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        seekRelativeFrames(Math.max(1, Math.floor(totalFrames * 0.02)));
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        seekRelativeFrames(-Math.max(1, Math.floor(totalFrames * 0.02)));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [togglePlay, seekRelativeFrames, totalFrames]);

  /* ─── Video Upload ──────────────────────────────────────────────────── */

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?._id || !token) return;

    setUploadingRecording(true);
    const formData = new FormData();
    formData.append("video", file);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/interviews/${session._id}/recording`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData },
      );
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      toast.success("Recording uploaded!");
      const rawUrl = data.recordingUrl;
      setRecordingSource(rawUrl.startsWith("http") ? rawUrl : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${rawUrl}`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingRecording(false);
    }
  };

  /* ─── Fullscreen ────────────────────────────────────────────────────── */

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  /* ─── Derived Values ────────────────────────────────────────────────── */

  const progressPercent = totalFrames > 0 ? (currentFrameIdx / (totalFrames - 1)) * 100 : 0;

  // Find which checkpoint we're currently in
  const activeCheckpointIdx = frame?.checkpointIndex ?? -1;

  // Format time based on frame progress
  const formatProgress = (fraction: number) => {
    // Estimate total replay seconds based on frame count and speed
    const estimatedTotalSec = Math.max(10, (totalFrames * 150) / 1000);
    const currentSec = Math.floor(fraction * estimatedTotalSec);
    const m = Math.floor(currentSec / 60).toString().padStart(2, "0");
    const s = (currentSec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  /* ─── Loading State ─────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0A0A0A] text-white">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#2A9D7B]" />
        <p className="font-mono text-xs text-[#888888]">Loading replay data and checkpoints...</p>
      </div>
    );
  }

  if (!session || checkpoints.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0A0A0A] text-white gap-4">
        <div className="rounded-2xl border border-[#2A2A2A] bg-[#141414] p-8 text-center max-w-md">
          <h2 className="text-lg font-bold text-white mb-2">No Replay Data Available</h2>
          <p className="text-sm text-[#888888] mb-6">
            {!session
              ? "This interview session could not be found."
              : "No code checkpoints were recorded during this session. Checkpoints are created when code is executed, stages change, or manual snapshots are taken."}
          </p>
          <button
            onClick={() => navigate({ to: "/interviews" })}
            className="rounded-lg bg-[#2A9D7B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#238266] transition"
          >
            Back to Interviews
          </button>
        </div>
      </div>
    );
  }

  /* ─── Render ────────────────────────────────────────────────────────── */

  return (
    <div
      ref={containerRef}
      className="flex h-screen flex-col bg-[#0A0A0A] text-white select-none overflow-hidden"
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*,.webm,.mp4,.mkv,.ogg"
        onChange={handleVideoUpload}
        className="hidden"
      />

      {/* ─── Header ────────────────────────────────────────────────────── */}
      <header className="flex h-10 flex-shrink-0 items-center justify-between border-b border-[#1F1F1F] bg-[#111111] px-3 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate({ to: "/interviews" })}
            className="flex items-center gap-1 rounded-md border border-[#262626] bg-[#181818] px-2.5 py-1 text-[11px] text-[#888888] hover:border-[#2A9D7B] hover:text-white transition"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Exit</span>
          </button>

          <span className="font-semibold text-white truncate max-w-[200px]">
            {session?.title || "Interview Replay"}
          </span>

          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-400">
            REPLAY
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingRecording}
            className="flex items-center gap-1 rounded-md border border-[#2A2A2A] bg-[#1A1A1A] px-2 py-1 text-[11px] text-[#CCCCCC] hover:border-[#2A9D7B] hover:text-white transition"
            title="Attach recorded video"
          >
            {uploadingRecording ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            <span className="hidden sm:inline">Attach Video</span>
          </button>

          <button
            onClick={() => navigate({ to: `/interview/${roomKey}/evaluation` })}
            className="rounded-md bg-[#2A9D7B] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#238266] transition"
          >
            Scorecard
          </button>
        </div>
      </header>

      {/* ─── Main Content ──────────────────────────────────────────────── */}
      <div className="grid flex-1 grid-cols-12 overflow-hidden">
        {/* Left: Code Replay Viewer */}
        <div className="col-span-12 lg:col-span-9 flex flex-col overflow-hidden border-r border-[#1F1F1F]">
          {/* File bar */}
          <div className="flex h-8 items-center justify-between border-b border-[#222222] bg-[#181818] px-3 text-[11px] flex-shrink-0">
            <div className="flex items-center gap-2 text-[#CCCCCC]">
              <span className="font-semibold">{frame?.filePath || "/solution.py"}</span>
              {frame?.label && (
                <span className="rounded bg-[#2A9D7B]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#2A9D7B]">
                  {frame.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[#777777]">
              <span className="uppercase">{frame?.language || "python"}</span>
              <span>·</span>
              <span>{frame?.lines.length || 0} lines</span>
            </div>
          </div>

          {/* Code content */}
          <div
            ref={codeViewerRef}
            className="flex-1 overflow-auto bg-[#0D1117] font-mono text-[13px] leading-6"
          >
            {frame ? (
              <table className="w-full border-collapse">
                <tbody>
                  {frame.lines.map((line, idx) => {
                    const isChanged = recentlyChanged.has(idx);
                    return (
                      <tr
                        key={idx}
                        data-line={idx}
                        className={`transition-colors duration-500 ${
                          isChanged ? "bg-[#2A9D7B]/15" : "hover:bg-[#161B22]"
                        }`}
                      >
                        <td className="w-12 select-none px-3 text-right text-[11px] text-[#484F58] align-top">
                          {idx + 1}
                        </td>
                        <td className="pl-4 pr-6 whitespace-pre text-[#E6EDF3] select-text">
                          {isChanged && (
                            <span className="inline-block w-0.5 h-4 bg-[#2A9D7B] mr-2 rounded-full align-middle" />
                          )}
                          {line || "\u00A0"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex h-full items-center justify-center text-[#555555] text-sm">
                No code to display
              </div>
            )}
          </div>

          {/* Video PiP (if recording exists) */}
          {recordingSource && (
            <div className="absolute bottom-20 right-8 z-30 w-64 rounded-xl overflow-hidden border border-[#333333] shadow-2xl bg-black">
              <video
                ref={videoRef}
                src={recordingSource}
                playsInline
                muted={isMuted}
                className="w-full h-auto"
              />
              <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400 backdrop-blur-sm">
                <Film className="h-2.5 w-2.5" />
                Recording
              </div>
              <button
                onClick={() => setIsMuted((m) => !m)}
                className="absolute top-1.5 right-1.5 rounded bg-black/70 p-1 text-white hover:bg-black/90 transition"
              >
                {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
              </button>
            </div>
          )}
        </div>

        {/* Right: Checkpoint List */}
        <div className="col-span-12 lg:col-span-3 flex flex-col overflow-hidden bg-[#0E0E0E]">
          <div className="flex h-8 items-center justify-between border-b border-[#222222] bg-[#141414] px-3 text-[11px] flex-shrink-0">
            <span className="font-semibold text-[#CCCCCC]">Checkpoints</span>
            <span className="text-[#666666]">{checkpoints.length} snapshots</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {checkpoints.map((cp, idx) => {
              const isActive = activeCheckpointIdx === idx;
              const isPassed = activeCheckpointIdx > idx;
              return (
                <button
                  key={cp._id}
                  type="button"
                  onClick={() => seekToCheckpoint(idx)}
                  className={`w-full rounded-lg p-2.5 text-left border transition-all text-[11px] ${
                    isActive
                      ? "border-[#2A9D7B] bg-[#2A9D7B]/10 shadow-sm"
                      : isPassed
                        ? "border-[#222222] bg-[#181818] opacity-70 hover:opacity-100 hover:border-[#333333]"
                        : "border-[#1A1A1A] bg-[#141414] opacity-50 hover:opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        isActive ? "bg-[#2A9D7B] text-white" : "bg-[#2A9D7B]/20 text-[#2A9D7B]"
                      }`}>
                        #{cp.sequenceNumber}
                      </span>
                      <span className={`rounded px-1.5 py-0.5 text-[9px] uppercase ${
                        cp.triggerType === "EXECUTION"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : cp.triggerType === "STAGE_TRANSITION"
                            ? "bg-purple-500/15 text-purple-400"
                            : cp.triggerType === "AUTO_SAVE"
                              ? "bg-blue-500/15 text-blue-400"
                              : "bg-amber-500/15 text-amber-400"
                      }`}>
                        {cp.triggerType.replace("_", " ")}
                      </span>
                    </div>
                    {isActive && <ChevronRight className="h-3 w-3 text-[#2A9D7B]" />}
                  </div>

                  <p className="text-[#CCCCCC] font-medium truncate">{cp.triggerLabel}</p>

                  <div className="flex items-center gap-2 mt-1 text-[9px] text-[#666666]">
                    <span>{new Date(cp.createdAt).toLocaleTimeString()}</span>
                    <span>·</span>
                    <span>{cp.filesSnapshot?.length || 1} file(s)</span>
                    <span>·</span>
                    <span>{cp.filesSnapshot?.[0]?.content?.split("\n").length || 0} lines</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Scrubber Bar ──────────────────────────────────────────────── */}
      <footer className="border-t border-[#222222] bg-[#111111] px-4 py-2.5 flex-shrink-0 space-y-2">
        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] font-bold text-[#2A9D7B] min-w-[40px]">
            {formatProgress(currentFrameIdx / Math.max(1, totalFrames - 1))}
          </span>

          <div className="flex-1 relative">
            <input
              type="range"
              min={0}
              max={Math.max(0, totalFrames - 1)}
              step={1}
              value={currentFrameIdx}
              onChange={(e) => {
                seekToFrame(Number(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full h-1.5 rounded-lg bg-[#222222] accent-[#2A9D7B] cursor-pointer"
            />

            {/* Checkpoint markers on scrubber */}
            {checkpoints.map((_, cpIdx) => {
              const firstFrame = replayFrames.findIndex((f) => f.checkpointIndex === cpIdx);
              if (firstFrame < 0) return null;
              const leftPct = (firstFrame / Math.max(1, totalFrames - 1)) * 100;
              return (
                <div
                  key={cpIdx}
                  style={{ left: `${Math.min(98, Math.max(1, leftPct))}%` }}
                  className="absolute top-0 h-1.5 w-0.5 rounded bg-purple-400/70 pointer-events-none"
                />
              );
            })}
          </div>

          <span className="font-mono text-[11px] text-[#666666] min-w-[40px] text-right">
            {formatProgress(1)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={togglePlay}
              className="flex items-center gap-1.5 rounded-lg bg-[#2A9D7B] px-3.5 py-1.5 text-[11px] font-bold text-white shadow hover:bg-[#238266] transition"
            >
              {isPlaying ? (
                <><Pause className="h-3.5 w-3.5" /> Pause</>
              ) : (
                <><Play className="h-3.5 w-3.5 fill-current" /> {currentFrameIdx >= totalFrames - 1 ? "Replay" : "Play"}</>
              )}
            </button>

            <button
              type="button"
              onClick={() => seekRelativeFrames(-Math.max(1, Math.floor(totalFrames * 0.05)))}
              className="rounded-md border border-[#262626] bg-[#181818] p-1.5 text-[#888888] hover:text-white transition"
              title="Rewind 5%"
            >
              <Rewind className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => seekRelativeFrames(Math.max(1, Math.floor(totalFrames * 0.05)))}
              className="rounded-md border border-[#262626] bg-[#181818] p-1.5 text-[#888888] hover:text-white transition"
              title="Forward 5%"
            >
              <FastForward className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={restart}
              className="rounded-md border border-[#262626] bg-[#181818] p-1.5 text-[#888888] hover:text-white transition"
              title="Restart"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Frame counter */}
            <span className="text-[10px] text-[#555555] font-mono hidden sm:inline">
              Frame {currentFrameIdx + 1} / {totalFrames}
            </span>

            {/* Speed selector */}
            <div className="flex items-center gap-0.5 rounded-md border border-[#262626] bg-[#181818] p-0.5">
              {[0.5, 1, 2, 4].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`rounded px-2 py-0.5 text-[10px] font-bold transition ${
                    playbackSpeed === speed
                      ? "bg-[#2A9D7B] text-white"
                      : "text-[#888888] hover:text-white"
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded-md border border-[#262626] bg-[#181818] p-1.5 text-[#888888] hover:text-white transition"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
