import React, { useEffect, useState, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Clock,
  ArrowLeft,
  Code2,
  Layers,
  MessageSquare,
  UserCheck,
  Loader2,
  FileCode,
  ShieldCheck,
} from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/interview/$roomKey/replay")({
  component: InterviewReplayPageRoute,
});

function InterviewReplayPageRoute() {
  const { roomKey } = Route.useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [manifest, setManifest] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentFrame, setCurrentFrame] = useState<any>(null);
  const [fetchingFrame, setFetchingFrame] = useState<boolean>(false);

  // 1. Fetch complete replay manifest
  useEffect(() => {
    async function loadManifest() {
      try {
        const sessionData = await apiCall<{ session: any }>(
          `/interviews/room/${roomKey}`,
          "GET",
          null,
          token
        );
        if (sessionData && sessionData.session) {
          const manifestData = await apiCall<any>(
            `/replay/${sessionData.session._id}/manifest`,
            "GET",
            null,
            token
          );
          setManifest(manifestData);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    loadManifest();
  }, [roomKey, token]);

  // 2. Fetch point-in-time frame on timestamp scrub
  useEffect(() => {
    if (!manifest?.session?._id) return;

    let isMounted = true;
    async function loadFrame() {
      setFetchingFrame(true);
      try {
        const frame = await apiCall<any>(
          `/replay/${manifest.session._id}/frame?offsetMs=${currentTimeMs}`,
          "GET",
          null,
          token
        );
        if (isMounted) setCurrentFrame(frame);
      } catch {
        // ignore
      } finally {
        if (isMounted) setFetchingFrame(false);
      }
    }

    const timer = setTimeout(loadFrame, 50);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [currentTimeMs, manifest?.session?._id, token]);

  // 3. Playback timer tick
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTimeMs((prev) => {
        const maxTime = manifest?.totalDurationMs || 60000;
        const next = prev + 500 * playbackSpeed;
        if (next >= maxTime) {
          setIsPlaying(false);
          return maxTime;
        }
        return next;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, manifest?.totalDurationMs]);

  const formatOffset = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0E0E0E] text-white">
        <Loader2 className="h-6 w-6 animate-spin text-[#2A9D7B]" />
      </div>
    );
  }

  const activeFile = currentFrame?.codeWorkspace?.files?.[0];

  return (
    <div className="flex h-screen flex-col bg-[#0E0E0E] text-white font-mono text-xs">
      {/* Top Header */}
      <div className="flex h-12 items-center justify-between border-b border-[#2A2A2A] bg-[#161616] px-4">
        <button
          onClick={() => navigate({ to: "/interviews" })}
          className="flex items-center gap-1.5 text-[#888888] hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Exit Replay</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="rounded bg-[#2A9D7B]/20 px-2 py-0.5 text-[11px] font-semibold text-[#2A9D7B]">
            STAGE: {currentFrame?.activeStage || "WAITING_ROOM"}
          </span>
          <span className="text-[#AAAAAA]">
            Session: <strong className="text-white">{manifest?.session?.title}</strong>
          </span>
        </div>

        <button
          onClick={() => navigate({ to: `/interview/${roomKey}/evaluation` })}
          className="flex items-center gap-1 rounded bg-[#2A2A2A] px-3 py-1.5 font-sans font-semibold text-white hover:bg-[#2A9D7B] transition"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>View Scorecard</span>
        </button>
      </div>

      {/* Main Multi-Pane State Reconstruction Grid */}
      <div className="grid flex-1 grid-cols-12 gap-2 p-3 overflow-hidden">
        {/* Left 8 Cols: Point-in-time Code Snapshot */}
        <div className="col-span-12 lg:col-span-8 flex flex-col rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] overflow-hidden">
          <div className="flex h-9 items-center justify-between border-b border-[#2A2A2A] bg-[#222222] px-3 font-semibold text-[#CCCCCC]">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-[#2A9D7B]" />
              <span>{activeFile?.path || "/solution.py"}</span>
              {currentFrame?.codeWorkspace?.sequenceNumber > 0 && (
                <span className="rounded bg-[#111111] px-1.5 py-0.2 text-[10px] text-[#777777]">
                  Snapshot #{currentFrame?.codeWorkspace?.sequenceNumber}
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#777777] uppercase">{activeFile?.language || "python"}</span>
          </div>

          <pre className="flex-1 overflow-auto p-3 font-mono text-xs text-[#E0E0E0] bg-[#141414] leading-relaxed">
            {activeFile?.content || "# [No code written at this timestamp]"}
          </pre>
        </div>

        {/* Right 4 Cols: Speech Transcript & Timeline History */}
        <div className="col-span-12 lg:col-span-4 flex flex-col rounded-xl border border-[#2A2A2A] bg-[#161616] overflow-hidden">
          <div className="flex h-9 items-center gap-2 border-b border-[#2A2A2A] bg-[#1F1F1F] px-3 font-semibold text-[#CCCCCC]">
            <MessageSquare className="h-4 w-4 text-[#2A9D7B]" />
            <span>Speech & Event History</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {currentFrame?.transcriptHistory?.length === 0 ? (
              <div className="text-center text-[#555555] py-4">No speech recorded yet at this offset.</div>
            ) : (
              currentFrame?.transcriptHistory?.map((t: any, idx: number) => (
                <div key={idx} className="rounded bg-[#202020] p-2 text-[11px] border border-[#282828]">
                  <div className="flex items-center justify-between text-[#888888] mb-1">
                    <span className="font-semibold text-white">{t.speakerName}</span>
                    <span className="font-mono text-[9px]">{formatOffset(t.offsetMs)}</span>
                  </div>
                  <p className="text-[#CCCCCC] leading-snug">{t.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Floating Scrubber Bar */}
      <div className="border-t border-[#2A2A2A] bg-[#141414] px-6 py-3 space-y-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold text-[#2A9D7B]">{formatOffset(currentTimeMs)}</span>
          <input
            type="range"
            min={0}
            max={manifest?.totalDurationMs || 60000}
            step={250}
            value={currentTimeMs}
            onChange={(e) => {
              setCurrentTimeMs(Number(e.target.value));
              setIsPlaying(false);
            }}
            className="flex-1 accent-[#2A9D7B] cursor-pointer"
          />
          <span className="font-mono text-xs text-[#777777]">{formatOffset(manifest?.totalDurationMs || 60000)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 rounded-lg bg-[#2A9D7B] px-3.5 py-1.5 font-sans font-semibold text-white shadow hover:bg-[#238266] transition"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </button>

            <button
              onClick={() => {
                setCurrentTimeMs(0);
                setIsPlaying(false);
              }}
              className="rounded p-1.5 text-[#888888] hover:bg-[#2A2A2A] hover:text-white transition"
              title="Restart Replay"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[#777777] mr-1">Speed:</span>
            {[1, 2, 4].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`rounded px-2 py-0.5 text-[10px] font-bold transition ${
                  playbackSpeed === speed ? "bg-[#2A9D7B] text-white" : "bg-[#222222] text-[#888888] hover:text-white"
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
