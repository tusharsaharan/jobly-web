import { createFileRoute, useNavigate, Link, Outlet, useRouterState } from "@tanstack/react-router";
import React, { useEffect, useState, useCallback, useRef, lazy, Suspense } from "react";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";
import { getInterviewSocket } from "@/lib/socket";
const MonacoWorkspace = lazy(() => import("@/components/interview/ide/MonacoWorkspace").then((m) => ({ default: m.MonacoWorkspace })));
const ExcalidrawWhiteboard = lazy(() => import("@/components/interview/whiteboard/ExcalidrawWhiteboard").then((m) => ({ default: m.ExcalidrawWhiteboard })));
const VideoGrid = lazy(() => import("@/components/interview/media/VideoGrid").then((m) => ({ default: m.VideoGrid })));
const PrejoinLobby = lazy(() => import("@/components/interview/media/PrejoinLobby").then((m) => ({ default: m.PrejoinLobby })));
import {
  UnifiedTimelineView,
  TimelineItem,
} from "@/components/interview/timeline/UnifiedTimelineView";
import { CheckpointTimeline } from "@/components/interview/ide/CheckpointTimeline";
import { AiInterviewerPanel } from "@/components/interview/ai/AiInterviewerPanel";
import { SignalHUD } from "@/components/interview/ai/SignalHUD";
import { FloatingToolbar } from "@/components/interview/FloatingToolbar";
import { ToolbarSlidePanel } from "@/components/interview/ToolbarSlidePanel";
import type { VideoGridHandle } from "@/components/interview/media/VideoGrid";
import {
  Loader2,
  AlertCircle,
  ShieldAlert,
  X as XIcon,
} from "lucide-react";
import { toast } from "sonner";

class InterviewSectionBoundary extends React.Component<{ children: React.ReactNode; fallbackLabel: string }, { hasError: boolean; error?: Error }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error) {
    console.error(`[InterviewSectionBoundary:${this.props.fallbackLabel}]`, error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-[#0E0E0E] p-6 text-white">
          <div className="max-w-md rounded-xl border border-amber-500/20 bg-amber-950/10 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-amber-400" />
            <h3 className="mt-3 font-semibold">This panel had a hiccup</h3>
            <p className="mt-2 text-sm text-white/60">We kept the rest of your interview running. Try switching modes again.</p>
            <button onClick={() => this.setState({ hasError: false })} className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15">Retry</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string>("seeker");
  const [permissions, setPermissions] = useState<any>({});
  const [activeMode, setActiveMode] = useState<"VIDEO" | "CODING" | "WHITEBOARD">("VIDEO");
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineItem[]>([]);
  const [currentStage, setCurrentStage] = useState<string>("WAITING_ROOM");
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [hasJoinedCall, setHasJoinedCall] = useState(false);
  const [mediaPreferences, setMediaPreferences] = useState({
    cameraEnabled: true,
    microphoneEnabled: true,
  });
  const [proctorAlert, setProctorAlert] = useState<{
    type: string;
    timestamp: number;
  } | null>(null);

  // Video mode toolbar panels
  const [toolbarPanel, setToolbarPanel] = useState<"TIMELINE" | "CHECKPOINTS" | "NOTES" | null>(null);

  // Video hide state
  const [isVideoHidden, setIsVideoHidden] = useState(false);

  // VideoGrid ref for call controls
  const videoGridRef = useRef<VideoGridHandle | null>(null);
  const [videoControlState, setVideoControlState] = useState({
    isMicEnabled: true,
    isCameraEnabled: true,
    isScreenShareEnabled: false,
  });

  const monacoRestoreRef = useRef<((cp: any) => void) | null>(null);
  const [remoteExecution, setRemoteExecution] = useState<any>(null);

  // Sync video control state from ref periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const handle = videoGridRef.current;
      if (handle) {
        setVideoControlState({
          isMicEnabled: handle.isMicEnabled,
          isCameraEnabled: handle.isCameraEnabled,
          isScreenShareEnabled: handle.isScreenShareEnabled,
        });
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

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

  const addTimelineEventUnique = useCallback((event: TimelineItem) => {
    setTimelineEvents((prev) => {
      if (event._id && prev.some((e) => e._id === event._id)) return prev;
      return [...prev, event];
    });
  }, []);

  // Seeker proctoring: emit focus/fullscreen events to recruiter
  useEffect(() => {
    if (role !== "seeker" || !token || !session) return;
    const socket = getInterviewSocket(token);

    const emitProctorEvent = (eventType: string) => {
      socket.emit("proctor_event", {
        roomKey,
        eventType,
        timestamp: Date.now(),
      });
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        emitProctorEvent("tab_hidden");
      } else {
        emitProctorEvent("tab_visible");
      }
    };

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        emitProctorEvent("fullscreen_exited");
      } else {
        emitProctorEvent("fullscreen_entered");
      }
    };

    const onWindowBlur = () => {
      emitProctorEvent("window_blur");
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("blur", onWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [role, token, session, roomKey]);

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
          toast.info(`Interview stage transitioned to ${stageData.stage.replace(/_/g, " ")}`);

          if (stageData.stage === "CODING" || stageData.stage === "DEBUGGING") setActiveMode("CODING");
          if (stageData.stage === "SYSTEM_DESIGN") setActiveMode("WHITEBOARD");
          if (stageData.stage === "COMPLETED") {
            toast.success("Interview session completed!");
          }
        };

        const latestExecutionSeqRef = { current: data.session?.lastExecution?.sequence || 0 };

        const handleSessionStatusChanged = (statusData: { status: string; stage?: string }) => {
          setSession((prev: any) => (prev ? { ...prev, status: statusData.status, stage: statusData.stage || prev.stage } : prev));
          if (statusData.status === "COMPLETED") {
            toast.success("Interview session marked completed.");
          }
        };

        const handleCodeExecutionReceived = (execData: any) => {
          const execution = execData.execution;
          const seq = execution?.sequence ?? 0;

          if (seq > 0 && seq <= latestExecutionSeqRef.current) {
            console.warn(`[Execution Dropped] Stale execution #${seq} arrived after/equal to #${latestExecutionSeqRef.current}`);
            return;
          }
          if (seq > 0) {
            latestExecutionSeqRef.current = seq;
          }

          const exitCode = execution?.exitCode ?? 0;

          setRemoteExecution({
            stdout: execution?.stdout || "",
            stderr: execution?.stderr || "",
            exitCode: exitCode,
            durationMs: execution?.durationMs || 0,
            timedOut: execution?.timedOut || false,
            compilerOutput: execution?.compilerOutput,
            failureKind: execution?.failureKind,
            sequence: seq,
            executionId: execution?.executionId || Date.now().toString(),
          });

          if (exitCode === 0) {
            toast.success("Code run succeeded in sandbox.");
          } else {
            toast.error(`Code execution failed with exit code ${exitCode}`);
          }
        };

        const handleLiveTranscript = (trans: any) => {
          addTimelineEventUnique({
            pipeline: "COMMUNICATION",
            eventType: "transcript.segment",
            offsetMs: trans.offsetMs || 0,
            participantRole: trans.role,
            payload: { text: `[${trans.speakerName}]: ${trans.text}` },
          });
        };

        const handleTimelineEvent = (event: TimelineItem) => {
          addTimelineEventUnique(event);
        };

        const handleWhiteboardSnapshot = (snapshotData: any) => {
          if (snapshotData.timelineEvent) {
            addTimelineEventUnique(snapshotData.timelineEvent);
          }
        };

        const handleCheckpointCreated = (cp: any) => {
          toast.success(`Checkpoint #${cp.sequenceNumber} created`);
        };

        const handleCheckpointRestored = (cp: any) => {
          toast.info(`Restored to Checkpoint #${cp.sequenceNumber}`);
        };

        const handleProctorEvent = (eventData: { eventType: string; timestamp: number }) => {
          if (eventData.eventType === "fullscreen_exited" || eventData.eventType === "tab_hidden" || eventData.eventType === "window_blur") {
            setProctorAlert({ type: eventData.eventType, timestamp: eventData.timestamp });
            addTimelineEventUnique({
              _id: `proctor-${eventData.timestamp}`,
              pipeline: "INTEGRITY",
              eventType: `focus.${eventData.eventType}`,
              offsetMs: data.session?.actualStart ? Date.now() - new Date(data.session.actualStart).getTime() : 0,
              participantRole: "seeker",
              payload: {
                text: eventData.eventType === "fullscreen_exited"
                  ? "Candidate exited fullscreen mode"
                  : eventData.eventType === "tab_hidden"
                  ? "Candidate switched to a different browser tab"
                  : "Candidate's browser window lost focus",
                isAnomalous: true,
              },
            } as TimelineItem);
            setTimeout(() => setProctorAlert(null), 8000);
          } else {
            setProctorAlert(null);
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
        socket.on("checkpoint_created", handleCheckpointCreated);
        socket.on("checkpoint_restored", handleCheckpointRestored);
        socket.on("proctor_event_received", handleProctorEvent);
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
        socket.off("participant_joined", handleParticipantJoined);
        socket.off("participant_left", handleParticipantLeft);
        socket.off("stage_updated", handleStageUpdated);
        socket.off("session_status_changed", handleSessionStatusChanged);
        socket.off("code_execution_received", handleCodeExecutionReceived);
        socket.off("live_transcript_received", handleLiveTranscript);
        socket.off("timeline_event_received", handleTimelineEvent);
        socket.off("whiteboard_snapshot_saved", handleWhiteboardSnapshot);
        socket.off("checkpoint_created", handleCheckpointCreated);
        socket.off("checkpoint_restored", handleCheckpointRestored);
        socket.off("proctor_event_received", handleProctorEvent);
      }
    };
  }, [roomKey, token, addTimelineEventUnique]);

  // Real-time interview timer
  useEffect(() => {
    if (session?.status !== "LIVE") return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.status]);

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
      toast.success(`Stage changed to ${newStage.replace(/_/g, " ")}`);

      if (newStage === "CODING" || newStage === "DEBUGGING") setActiveMode("CODING");
      if (newStage === "SYSTEM_DESIGN") setActiveMode("WHITEBOARD");
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

  const handleToggleToolbarPanel = (panel: "TIMELINE" | "CHECKPOINTS" | "NOTES") => {
    setToolbarPanel((prev) => (prev === panel ? null : panel));
  };

  const isChildRoute = pathname.endsWith("/replay") || pathname.endsWith("/feedback") || pathname.endsWith("/evaluation");
  if (isChildRoute) {
    return <Outlet />;
  }

  // Loading state
  if (loading) {
    return (
      <div
        className="flex h-screen w-screen items-center justify-center"
        style={{ background: "var(--iv-bg)", fontFamily: "var(--font-iv-ui)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--iv-accent)" }} />
          <p className="text-[13px]" style={{ color: "var(--iv-text-muted)" }}>
            Connecting to interview room...
          </p>
        </div>
      </div>
    );
  }

  // Session not found
  if (!session) {
    return (
      <div
        className="flex h-screen w-screen items-center justify-center p-4"
        style={{ background: "var(--iv-bg)", fontFamily: "var(--font-iv-ui)", color: "var(--iv-text)" }}
      >
        <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-950/10 p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
          <h2 className="text-lg font-bold">Session Unavailable</h2>
          <p className="mt-2 text-[13px]" style={{ color: "var(--iv-text-muted)" }}>
            This interview room does not exist, has expired, or you do not have permission to join.
          </p>
          <button
            onClick={() => navigate({ to: "/interviews" })}
            className="iv-btn iv-btn-primary mt-5"
          >
            Back to Interviews
          </button>
        </div>
      </div>
    );
  }

  // Pre-join lobby
  if (!hasJoinedCall) {
    return (
      <Suspense fallback={
        <div className="flex h-screen w-screen items-center justify-center" style={{ background: "var(--iv-bg)" }}>
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--iv-accent)" }} />
        </div>
      }>
        <div
          className="flex h-screen w-screen items-center justify-center p-4 overflow-hidden"
          style={{ background: "var(--iv-bg)", fontFamily: "var(--font-iv-ui)", color: "var(--iv-text)" }}
        >
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
      </Suspense>
    );
  }

  // Compact video element for embedding in editor / whiteboard
  const compactVideoElement = (
    <Suspense fallback={null}>
      <VideoGrid
        ref={videoGridRef}
        roomKey={roomKey}
        sessionId={session._id}
        token={token ?? undefined}
        userName={user?.name || "Participant"}
        userRole={role}
        initialCameraEnabled={mediaPreferences.cameraEnabled}
        initialMicrophoneEnabled={mediaPreferences.microphoneEnabled}
        compact
        onLeave={() => navigate({ to: "/interviews" })}
      />
    </Suspense>
  );

  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center" style={{ background: "var(--iv-bg)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--iv-accent)" }} />
      </div>
    }>
      <div
        className="flex h-screen w-screen flex-col overflow-hidden"
        style={{ background: "var(--iv-bg)", color: "var(--iv-text)", fontFamily: "var(--font-iv-ui)" }}
      >
        {/* Proctor Alert — floating top-right overlay */}
        {proctorAlert && permissions.canManageSession && (
          <div
            className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-[12px] font-medium text-red-300 animate-pulse iv-mode-enter"
            style={{ background: "rgba(127, 29, 29, 0.85)", backdropFilter: "blur(8px)", fontFamily: "var(--font-iv-ui)" }}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>
              {proctorAlert.type === "fullscreen_exited"
                ? "Candidate exited fullscreen"
                : proctorAlert.type === "tab_hidden"
                ? "Candidate switched tabs"
                : "Candidate window lost focus"}
            </span>
            <button
              onClick={() => setProctorAlert(null)}
              className="ml-1 rounded p-0.5 hover:bg-red-500/30 transition"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Main Content Area — fills between top and toolbar */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          {/* VIDEO MODE */}
          {activeMode === "VIDEO" && (
            <div className="h-full w-full iv-mode-enter">
              <VideoGrid
                ref={videoGridRef}
                roomKey={roomKey}
                sessionId={session._id}
                token={token ?? undefined}
                userName={user?.name || "Participant"}
                userRole={role}
                initialCameraEnabled={mediaPreferences.cameraEnabled}
                initialMicrophoneEnabled={mediaPreferences.microphoneEnabled}
                onLeave={() => navigate({ to: "/interviews" })}
              />

              {/* Slide-up panel */}
              {toolbarPanel && (
                <ToolbarSlidePanel
                  activePanel={toolbarPanel}
                  onClose={() => setToolbarPanel(null)}
                  timelineEvents={timelineEvents}
                  sessionId={session._id}
                  token={token ?? undefined}
                  onRestoreCheckpoint={(cp) => {
                    if (monacoRestoreRef.current) {
                      monacoRestoreRef.current(cp);
                    }
                    toast.success(`Workspace restored to Checkpoint #${cp.sequenceNumber}`);
                  }}
                  checkpointReadOnly={!permissions.canExecuteCode && role !== "seeker" && role !== "recruiter"}
                  roomKey={roomKey}
                />
              )}
            </div>
          )}

          {/* CODING MODE — wrapped so one panel crash never snaps the whole interview */}
          {activeMode === "CODING" && (
            <div className="h-full w-full iv-mode-enter">
              <InterviewSectionBoundary fallbackLabel="coding">
                <Suspense fallback={<div className="flex h-full items-center justify-center bg-[#0E0E0E] text-white"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
                  <MonacoWorkspace
                    roomKey={roomKey}
                    sessionId={session._id}
                    initialCode={session.codeWorkspace?.files?.[0]?.content ?? ""}
                    initialLanguage={session.codeWorkspace?.activeLanguage || session.codeWorkspace?.files?.[0]?.language || "python"}
                    allowedLanguages={session.allowedLanguages || ["python", "javascript", "typescript", "cpp", "java"]}
                    readOnly={!permissions.canExecuteCode && role !== "seeker" && role !== "recruiter"}
                    restoreRef={monacoRestoreRef}
                    remoteExecution={remoteExecution}
                    activeProblem={session.activeProblem}
                    onLeaveEditor={() => setActiveMode("VIDEO")}
                    videoElement={compactVideoElement}
                    isVideoHidden={isVideoHidden}
                    onToggleVideo={() => setIsVideoHidden((prev) => !prev)}
                    showAiTab={!!permissions.canViewAiAssistant}
                    aiPanel={
                      permissions.canViewAiAssistant ? (
                        <InterviewSectionBoundary fallbackLabel="ai-panel">
                          <div className="flex flex-col gap-2">
                            <AiInterviewerPanel
                              sessionId={session._id}
                              problemTitle={session.activeProblem?.title}
                              currentStage={currentStage}
                              jobSkills={session.job?.skills}
                              jobTitle={session.job?.title}
                            />
                            <SignalHUD sessionId={session._id} roomKey={roomKey} currentStage={currentStage} />
                          </div>
                        </InterviewSectionBoundary>
                      ) : null
                    }
                  />
                </Suspense>
              </InterviewSectionBoundary>
            </div>
          )}

          {/* WHITEBOARD MODE */}
          {activeMode === "WHITEBOARD" && (
            <div className="h-full w-full iv-mode-enter">
              <InterviewSectionBoundary fallbackLabel="whiteboard">
                <Suspense fallback={<div className="flex h-full items-center justify-center bg-[#0E0E0E] text-white"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
                  <ExcalidrawWhiteboard
                    roomKey={roomKey}
                    sessionId={session._id}
                    readOnly={!permissions.canEditWhiteboard && role !== "seeker" && role !== "recruiter"}
                    onSnapshotSaved={(ev) => addTimelineEventUnique(ev)}
                    onLeave={() => setActiveMode("VIDEO")}
                    videoElement={compactVideoElement}
                    isVideoHidden={isVideoHidden}
                    onToggleVideo={() => setIsVideoHidden((prev) => !prev)}
                  />
                </Suspense>
              </InterviewSectionBoundary>
            </div>
          )}
        </div>

        {/* Floating Toolbar (always visible in VIDEO mode, hidden in CODING/WHITEBOARD) */}
        {activeMode === "VIDEO" && (
          <FloatingToolbar
            activeMode={activeMode}
            onModeChange={(mode) => {
              setToolbarPanel(null);
              setActiveMode(mode);
            }}
            isMicEnabled={videoControlState.isMicEnabled}
            isCameraEnabled={videoControlState.isCameraEnabled}
            isScreenShareEnabled={videoControlState.isScreenShareEnabled}
            onToggleMic={() => videoGridRef.current?.toggleMicrophone()}
            onToggleCamera={() => videoGridRef.current?.toggleCamera()}
            onToggleScreenShare={() => videoGridRef.current?.toggleScreenShare()}
            onEndCall={() => videoGridRef.current?.leaveRoom()}
            activePanel={toolbarPanel}
            onTogglePanel={handleToggleToolbarPanel}
            elapsedSeconds={elapsedSeconds}
            isFullscreen={isBrowserFullscreen}
            onToggleFullscreen={toggleBrowserFullscreen}
            isRecruiter={!!permissions.canManageSession}
            sessionStatus={session.status}
            currentStage={currentStage}
            onStageChange={handleStageTransition}
            onStartSession={handleStartSession}
            onEndSession={handleEndSession}
            onOpenScorecard={
              permissions.canEvaluate
                ? () => navigate({ to: `/interview/${roomKey}/feedback` })
                : undefined
            }
          />
        )}
      </div>
    </Suspense>
  );
}
