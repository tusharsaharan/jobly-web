import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";
import { getInterviewSocket } from "@/lib/socket";
import { MonacoWorkspace } from "@/components/interview/ide/MonacoWorkspace";
import { ExcalidrawWhiteboard } from "@/components/interview/whiteboard/ExcalidrawWhiteboard";
import { VideoGrid } from "@/components/interview/media/VideoGrid";
import { PrejoinLobby } from "@/components/interview/media/PrejoinLobby";
import {
  UnifiedTimelineView,
  TimelineItem,
} from "@/components/interview/timeline/UnifiedTimelineView";
import { AiInterviewerPanel } from "@/components/interview/ai/AiInterviewerPanel";
import { SignalHUD } from "@/components/interview/ai/SignalHUD";
import {
  Clock,
  Loader2,
  AlertCircle,
  Maximize,
  Minimize,
  PanelRightClose,
  PanelRightOpen,
  Video,
  ListTree,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/interview/$roomKey")({
  head: () => ({
    meta: [
      { title: "Technical Interview Room | Jobly Interview OS" },
      {
        name: "description",
        content:
          "Real-time technical interview room with collaborative IDE, Whiteboard, and Video.",
      },
    ],
  }),
  component: InterviewRoomPage,
});

function InterviewRoomPage() {
  const { roomKey } = Route.useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string>("seeker");
  const [permissions, setPermissions] = useState<any>({});
  const [activeTab, setActiveTab] = useState<"CODING" | "WHITEBOARD">("CODING");
  const [isSidePanelCollapsed, setIsSidePanelCollapsed] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineItem[]>([]);
  const [currentStage, setCurrentStage] = useState<string>("WAITING_ROOM");
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [hasJoinedCall, setHasJoinedCall] = useState(false);
  const [sideTab, setSideTab] = useState<"VIDEO" | "TIMELINE" | "AI">("VIDEO");
  const [mediaPreferences, setMediaPreferences] = useState({
    cameraEnabled: true,
    microphoneEnabled: true,
  });

  // Track browser fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsBrowserFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    async function loadInterview() {
      try {
        setLoading(true);
        const data = await apiCall<{
          session: any;
          roomToken: string;
          role: string;
          permissions: any;
          timelineEvents?: TimelineItem[];
        }>(`/interviews/room/${roomKey}`, "GET", null, token);

        setSession(data.session);
        setRole(data.role);
        setPermissions(data.permissions || {});
        setCurrentStage(data.session.stage || "WAITING_ROOM");
        if (data.timelineEvents) setTimelineEvents(data.timelineEvents);

        // Join real-time WebSocket room
        const socket = getInterviewSocket(token);
        socket.emit("join_interview", { roomKey });

        const handleParticipantJoined = (peer: any) => {
          toast.info(`${peer.name} (${peer.role}) joined the interview.`);
        };

        const handleParticipantLeft = (_peer: any) => {
          toast.info(`Participant left the interview.`);
        };

        const handleStageUpdated = (stageData: { stage: string; status?: string; offsetMs?: number }) => {
          setCurrentStage(stageData.stage);
          setSession((prev: any) => (prev ? { ...prev, stage: stageData.stage, status: stageData.status || prev.status } : prev));
          toast.info(`Interview stage transitioned to ${stageData.stage.replace("_", " ")}`);

          if (stageData.stage === "CODING" || stageData.stage === "DEBUGGING") setActiveTab("CODING");
          if (stageData.stage === "SYSTEM_DESIGN") setActiveTab("WHITEBOARD");
          if (stageData.stage === "COMPLETED") {
            toast.success("Interview session completed!");
          }
        };

        const handleSessionStatusChanged = (statusData: { status: string; stage?: string }) => {
          setSession((prev: any) => (prev ? { ...prev, status: statusData.status, stage: statusData.stage || prev.stage } : prev));
          if (statusData.status === "COMPLETED") {
            toast.success("Interview session marked completed.");
          }
        };

        const handleCodeExecutionReceived = (execData: any) => {
          const exitCode = execData.execution?.exitCode ?? 0;
          if (exitCode === 0) {
            toast.success("Code run succeeded in sandbox.");
          } else {
            toast.error(`Code execution failed with exit code ${exitCode}`);
          }

          if (execData.execution) {
            setTimelineEvents((prev) => [
              ...prev,
              {
                pipeline: "CODING",
                eventType: "code.execution",
                offsetMs: execData.offsetMs || 0,
                participantRole: role,
                payload: {
                  text: `Executed ${execData.language || "code"} (Exit ${exitCode})`,
                  status: exitCode === 0 ? "success" : "error",
                  durationMs: execData.execution.durationMs,
                },
              },
            ]);
          }
        };

        const handleLiveTranscript = (trans: any) => {
          setTimelineEvents((prev) => [
            ...prev,
            {
              pipeline: "COMMUNICATION",
              eventType: "transcript.segment",
              offsetMs: trans.offsetMs || 0,
              participantRole: trans.role,
              payload: { text: `[${trans.speakerName}]: ${trans.text}` },
            },
          ]);
        };

        const handleTimelineEvent = (event: TimelineItem) => {
          setTimelineEvents((prev) => [...prev, event]);
        };

        const handleWhiteboardSnapshot = (snapshotData: any) => {
          if (snapshotData.timelineEvent) {
            setTimelineEvents((prev) => [...prev, snapshotData.timelineEvent]);
          }
        };

        socket.on("participant_joined", handleParticipantJoined);
        socket.on("participant_left", handleParticipantLeft);
        socket.on("stage_updated", handleStageUpdated);
        socket.on("session_status_changed", handleSessionStatusChanged);
        socket.on("code_execution_received", handleCodeExecutionReceived);
        socket.on("live_transcript_received", handleLiveTranscript);
        socket.on("timeline_event_received", handleTimelineEvent);
        socket.on("whiteboard_snapshot_saved", handleWhiteboardSnapshot);
      } catch (err: any) {
        toast.error(err.message || "Failed joining interview room.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadInterview();
    }

    return () => {
      if (token) {
        const socket = getInterviewSocket(token);
        socket.emit("leave_interview", { roomKey });
        socket.off("participant_joined");
        socket.off("participant_left");
        socket.off("stage_updated");
        socket.off("session_status_changed");
        socket.off("code_execution_received");
        socket.off("live_transcript_received");
        socket.off("timeline_event_received");
        socket.off("whiteboard_snapshot_saved");
      }
    };
  }, [roomKey, token]);

  // Real-time interview timer
  useEffect(() => {
    if (session?.status !== "LIVE") return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.status]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (totalSeconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleStageTransition = async (newStage: string) => {
    try {
      await apiCall(
        `/interviews/${session._id}/stage`,
        "PUT",
        { stage: newStage },
        token
      );
      setCurrentStage(newStage);
      setSession((prev: any) => ({ ...prev, stage: newStage }));
      toast.success(`Stage changed to ${newStage.replace("_", " ")}`);

      if (newStage === "CODING" || newStage === "DEBUGGING") setActiveTab("CODING");
      if (newStage === "SYSTEM_DESIGN") setActiveTab("WHITEBOARD");
    } catch (err: any) {
      toast.error(err.message || "Failed updating interview stage.");
    }
  };

  const handleStartSession = async () => {
    try {
      await apiCall(
        `/interviews/${session._id}/status`,
        "PUT",
        { status: "LIVE" },
        token
      );
      setSession((prev: any) => ({ ...prev, status: "LIVE" }));
      toast.success("Interview session is now LIVE!");
    } catch (err: any) {
      toast.error(err.message || "Failed starting interview.");
    }
  };

  const handleEndSession = async () => {
    if (!confirm("Are you sure you want to end this interview session?")) return;
    try {
      await apiCall(
        `/interviews/${session._id}/status`,
        "PUT",
        { status: "COMPLETED" },
        token
      );
      setSession((prev: any) => ({ ...prev, status: "COMPLETED" }));
      toast.success("Interview session concluded.");
      navigate({ to: `/interview/${roomKey}/feedback` });
    } catch (err: any) {
      toast.error(err.message || "Failed ending interview.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0A0A0A] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#2A9D7B]" />
          <p className="font-mono text-xs text-[#888888]">
            Connecting to Jobly Real-Time Interview Room...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0A0A0A] p-4 text-white">
        <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-950/10 p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
          <h2 className="text-lg font-bold text-white">Session Unavailable</h2>
          <p className="mt-2 text-xs text-[#AAAAAA]">
            This interview room does not exist, has expired, or you do not have permission to join.
          </p>
          <button
            onClick={() => navigate({ to: "/interviews" })}
            className="mt-5 rounded-lg bg-[#2A9D7B] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#238266]"
          >
            Back to Interviews
          </button>
        </div>
      </div>
    );
  }

  // Pre-join Audio/Video Device Configuration Lobby
  if (!hasJoinedCall) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0A0A0A] p-4 text-white overflow-hidden">
        <div className="w-full max-w-xl">
          <PrejoinLobby
            roomKey={roomKey}
            sessionId={session._id}
            title={session.title}
            userName={user?.name || "Participant"}
            role={role}
            onJoin={(prefs) => {
              setMediaPreferences(prefs);
              setHasJoinedCall(true);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-[#0A0A0A] text-white overflow-hidden">
      {/* Compact Session Header */}
      <header className="flex h-10 flex-shrink-0 items-center justify-between border-b border-[#1F1F1F] bg-[#111111] px-3 text-xs font-mono select-none">
        <div className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-[#2A9D7B]/20 text-[9px] font-bold text-[#2A9D7B]">
            OS
          </span>
          <span className="font-semibold text-white truncate max-w-[220px]" title={`${session.job?.title || ""} · ${session.job?.company || ""}`}>
            {session.title || "Technical Interview"}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
              session.status === "LIVE"
                ? "bg-emerald-500/20 text-emerald-400 animate-pulse border border-emerald-500/30"
                : session.status === "COMPLETED"
                ? "bg-purple-500/20 text-purple-400"
                : "bg-amber-500/20 text-amber-400"
            }`}
          >
            {session.status}
          </span>
        </div>

        {/* Recruiter Stage Controls */}
        {permissions.canManageSession && (
          <div className="flex items-center gap-2">
            <select
              value={currentStage}
              onChange={(e) => handleStageTransition(e.target.value)}
              className="rounded border border-[#333333] bg-[#1C1C1C] px-2 py-0.5 text-[11px] font-semibold text-white outline-none hover:border-[#2A9D7B]"
            >
              <option value="WAITING_ROOM">1. WAITING ROOM</option>
              <option value="INTRO">2. INTRODUCTION</option>
              <option value="CODING">3. LIVE CODING</option>
              <option value="SYSTEM_DESIGN">4. SYSTEM DESIGN</option>
              <option value="DEBUGGING">5. CODE DEBUGGING</option>
              <option value="BEHAVIORAL">6. BEHAVIORAL Q&A</option>
              <option value="WRAP_UP">7. WRAP UP</option>
            </select>

            {session.status !== "LIVE" && (
              <button
                onClick={handleStartSession}
                className="rounded bg-[#2A9D7B] px-2.5 py-0.5 font-sans text-[11px] font-bold text-white transition hover:bg-[#238266]"
              >
                Go Live
              </button>
            )}

            {session.status === "LIVE" && (
              <button
                onClick={handleEndSession}
                className="rounded bg-rose-600 px-2.5 py-0.5 font-sans text-[11px] font-bold text-white transition hover:bg-rose-700"
              >
                End Session
              </button>
            )}
          </div>
        )}

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md bg-[#1B1B1B] px-2 py-0.5 text-[#CCCCCC] border border-[#2A2A2A]">
            <Clock className="h-3 w-3 text-[#2A9D7B]" />
            <span className="font-mono text-[11px] font-semibold">{formatTimer(elapsedSeconds)}</span>
          </div>

          <button
            onClick={toggleBrowserFullscreen}
            title={isBrowserFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className={`rounded-md border p-1 transition ${
              isBrowserFullscreen
                ? "border-[#2A9D7B] bg-[#2A9D7B]/20 text-[#7EE0C5]"
                : "border-[#333333] bg-[#1B1B1B] text-[#CCCCCC] hover:border-[#2A9D7B] hover:text-white"
            }`}
          >
            {isBrowserFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          </button>

          {permissions.canEvaluate && (
            <Link
              to={`/interview/${roomKey}/feedback`}
              className="rounded-md border border-[#333333] bg-[#1C1C1C] px-2 py-0.5 text-[11px] font-medium text-[#AAAAAA] hover:border-[#2A9D7B] hover:text-white transition"
            >
              Scorecard
            </Link>
          )}
        </div>
      </header>

      {/* Main Layout: Workspace + Tabbed Side Panel */}
      <div className="grid flex-1 grid-cols-12 gap-0 overflow-hidden">
        {/* Main Workspace Area */}
        <div
          className={`${
            isSidePanelCollapsed ? "col-span-12" : "col-span-12 lg:col-span-9"
          } flex flex-col overflow-hidden transition-all duration-200`}
        >
          {/* Workspace Tab Bar */}
          <div className="flex items-center justify-between bg-[#141414] border-b border-[#222222] px-2 py-1 text-xs">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setActiveTab("CODING")}
                className={`rounded-md px-3 py-1 font-semibold transition ${
                  activeTab === "CODING"
                    ? "bg-[#2A9D7B] text-white shadow-sm"
                    : "text-[#777777] hover:text-white hover:bg-[#1E1E1E]"
                }`}
              >
                Code
              </button>

              <button
                onClick={() => setActiveTab("WHITEBOARD")}
                className={`rounded-md px-3 py-1 font-semibold transition ${
                  activeTab === "WHITEBOARD"
                    ? "bg-[#2A9D7B] text-white shadow-sm"
                    : "text-[#777777] hover:text-white hover:bg-[#1E1E1E]"
                }`}
              >
                Design
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" title="CRDT Synced" />

              <button
                onClick={() => setIsSidePanelCollapsed(!isSidePanelCollapsed)}
                title={isSidePanelCollapsed ? "Show side panel" : "Hide side panel"}
                className="rounded-md border border-[#333333] bg-[#1E1E1E] p-1 text-[#999999] transition hover:border-[#2A9D7B] hover:text-white"
              >
                {isSidePanelCollapsed ? <PanelRightOpen className="h-3.5 w-3.5" /> : <PanelRightClose className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Primary Viewport */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "CODING" ? (
              <MonacoWorkspace
                roomKey={roomKey}
                sessionId={session._id}
                initialCode={session.codeWorkspace?.files?.[0]?.content}
                initialLanguage={session.codeWorkspace?.activeLanguage || session.codeWorkspace?.files?.[0]?.language || "python"}
                allowedLanguages={session.allowedLanguages || ["python", "javascript", "typescript", "cpp", "java"]}
                readOnly={!permissions.canExecuteCode && role !== "seeker" && role !== "recruiter"}
              />
            ) : (
              <ExcalidrawWhiteboard
                roomKey={roomKey}
                sessionId={session._id}
                readOnly={!permissions.canEditWhiteboard && role !== "seeker" && role !== "recruiter"}
                onSnapshotSaved={(ev) => setTimelineEvents((prev) => [...prev, ev])}
              />
            )}
          </div>
        </div>

        {/* Tabbed Side Panel */}
        {!isSidePanelCollapsed && (
          <div className="col-span-12 flex flex-col lg:col-span-3 border-l border-[#1F1F1F] bg-[#0E0E0E] overflow-hidden">
            {/* Side Panel Tab Bar */}
            <div className="flex items-center gap-0.5 border-b border-[#222222] bg-[#121212] px-2 py-1 flex-shrink-0">
              <button
                onClick={() => setSideTab("VIDEO")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                  sideTab === "VIDEO"
                    ? "bg-[#1E1E1E] text-white border-b-2 border-[#2A9D7B]"
                    : "text-[#666666] hover:text-[#CCCCCC]"
                }`}
              >
                <Video className="h-3 w-3" />
                Video
              </button>

              <button
                onClick={() => setSideTab("TIMELINE")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                  sideTab === "TIMELINE"
                    ? "bg-[#1E1E1E] text-white border-b-2 border-[#2A9D7B]"
                    : "text-[#666666] hover:text-[#CCCCCC]"
                }`}
              >
                <ListTree className="h-3 w-3" />
                Timeline
                {timelineEvents.length > 0 && (
                  <span className="rounded-full bg-[#1A3D33] px-1.5 text-[9px] text-[#7EE0C5] font-bold">
                    {timelineEvents.length}
                  </span>
                )}
              </button>

              {permissions.canViewAiAssistant && (
                <button
                  onClick={() => setSideTab("AI")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                    sideTab === "AI"
                      ? "bg-[#1E1E1E] text-white border-b-2 border-[#2A9D7B]"
                      : "text-[#666666] hover:text-[#CCCCCC]"
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  AI
                </button>
              )}
            </div>

            {/* Side Panel Content — Only one visible at a time */}
            <div className="flex-1 overflow-hidden p-2">
              {sideTab === "VIDEO" && (
                <div className="h-full">
                  <VideoGrid
                    roomKey={roomKey}
                    sessionId={session._id}
                    token={token ?? undefined}
                    userName={user?.name || "Participant"}
                    userRole={role}
                    initialCameraEnabled={mediaPreferences.cameraEnabled}
                    initialMicrophoneEnabled={mediaPreferences.microphoneEnabled}
                    onLeave={() => navigate({ to: "/interviews" })}
                  />
                </div>
              )}

              {sideTab === "TIMELINE" && (
                <div className="h-full">
                  <UnifiedTimelineView events={timelineEvents} />
                </div>
              )}

              {sideTab === "AI" && permissions.canViewAiAssistant && (
                <div className="flex h-full flex-col gap-2 overflow-y-auto">
                  <AiInterviewerPanel
                    sessionId={session._id}
                    problemTitle={session.activeProblem?.title}
                    currentStage={currentStage}
                  />
                  <SignalHUD sessionId={session._id} roomKey={roomKey} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
