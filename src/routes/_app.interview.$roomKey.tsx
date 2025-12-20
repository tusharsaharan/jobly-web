import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";
import { getInterviewSocket } from "@/lib/socket";
import { MonacoWorkspace } from "@/components/interview/ide/MonacoWorkspace";
import { WhiteboardCanvas } from "@/components/interview/whiteboard/WhiteboardCanvas";
import { ExcalidrawWhiteboard } from "@/components/interview/whiteboard/ExcalidrawWhiteboard";
import { VideoGrid } from "@/components/interview/media/VideoGrid";
import { PrejoinLobby } from "@/components/interview/media/PrejoinLobby";
import {
  UnifiedTimelineView,
  TimelineItem,
} from "@/components/interview/timeline/UnifiedTimelineView";
import { AiInterviewerPanel } from "@/components/interview/ai/AiInterviewerPanel";
import { TerminalPanel } from "@/components/interview/terminal/TerminalPanel";
import {
  Code2,
  Layers,
  Sparkles,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileText,
  Terminal as TerminalIcon,
  Play,
  Settings,
  Users,
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
  const [activeTab, setActiveTab] = useState<"CODING" | "WHITEBOARD" | "TERMINAL">("CODING");
  const [whiteboardMode, setWhiteboardMode] = useState<"EXCALIDRAW" | "LEGACY">("EXCALIDRAW");
  const [timelineEvents, setTimelineEvents] = useState<TimelineItem[]>([]);
  const [currentStage, setCurrentStage] = useState<string>("WAITING_ROOM");
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [hasJoinedCall, setHasJoinedCall] = useState(false);
  const [mediaPreferences, setMediaPreferences] = useState({
    cameraEnabled: true,
    microphoneEnabled: true,
  });

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

        socket.on("participant_joined", (peer: any) => {
          toast.info(`${peer.name} (${peer.role}) joined the interview.`);
        });

        socket.on("live_transcript_received", (trans: any) => {
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
        });
      } catch (err: any) {
        toast.error(err.message || "Failed joining interview room.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadInterview();
    }
  }, [roomKey, token]);

  // Real-time interview timer
  useEffect(() => {
    if (session?.status !== "LIVE") return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.status]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStageChange = async (newStage: string) => {
    if (!permissions.canControlStage) return;
    try {
      const res = await apiCall<{ session: any }>(
        `/interviews/${session._id}/stage`,
        "PATCH",
        { stage: newStage },
        token,
      );
      setCurrentStage(newStage);
      setSession(res.session);
      toast.success(`Stage transitioned to ${newStage}`);

      // Auto-switch tabs based on stage context
      if (newStage === "CODING" || newStage === "DEBUGGING") setActiveTab("CODING");
      if (newStage === "SYSTEM_DESIGN") setActiveTab("WHITEBOARD");
    } catch (err: any) {
      toast.error(err.message || "Failed updating stage");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0E0E0E] text-white">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#2A9D7B]" />
        <p className="text-sm font-medium">Entering secure technical interview workspace...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0E0E0E] px-4 text-white">
        <AlertCircle className="mb-3 h-10 w-10 text-rose-500" />
        <h1 className="text-xl font-bold">Interview Room Not Found</h1>
        <p className="mt-1 text-sm text-[#888888]">
          The session may have ended or you lack participant authorization.
        </p>
        <button
          onClick={() => navigate({ to: "/interviews" })}
          className="mt-4 rounded-lg bg-[#2A9D7B] px-4 py-2 text-sm font-semibold"
        >
          Return to Interviews
        </button>
      </div>
    );
  }

  if (!hasJoinedCall) {
    return (
      <PrejoinLobby
        interviewTitle={session.title}
        jobTitle={session.job?.title}
        company={session.job?.company}
        userName={user?.name || "Participant"}
        onJoin={(preferences) => {
          setMediaPreferences(preferences);
          setHasJoinedCall(true);
        }}
        onLeave={() => navigate({ to: "/interviews" })}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#0A0A0A] text-white font-mono">
      {/* Top Header Bar */}
      <header className="flex h-14 items-center justify-between border-b border-[#222222] bg-[#121212] px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2A9D7B]/20 text-[#2A9D7B] font-bold text-sm">
            OS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-bold text-white uppercase tracking-wider">
                {session.title}
              </h1>
              <span className="rounded bg-[#222222] px-2 py-0.2 text-[10px] text-[#2A9D7B] border border-[#2A9D7B]/30">
                {session.status}
              </span>
            </div>
            <p className="text-[10px] text-[#888888]">
              {session.job?.title} • {session.job?.company}
            </p>
          </div>
        </div>

        {/* Stage Stepper Controller & Real-Time Clock */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg bg-[#181818] px-3 py-1 text-xs border border-[#262626]">
            <Clock className="h-3.5 w-3.5 text-[#2A9D7B]" />
            <span className="font-mono text-[11px] text-[#CCCCCC]">
              {formatTimer(elapsedSeconds)}
            </span>
          </div>

          {permissions.canControlStage ? (
            <div className="flex items-center gap-1 rounded-lg border border-[#262626] bg-[#181818] p-1 text-[11px]">
              <span className="px-1.5 text-[10px] text-[#777777] uppercase">Stage:</span>
              {["INTRODUCTION", "CODING", "SYSTEM_DESIGN", "FEEDBACK", "COMPLETED"].map((st) => (
                <button
                  key={st}
                  onClick={() => handleStageChange(st)}
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold transition ${
                    currentStage === st
                      ? "bg-[#2A9D7B] text-white"
                      : "text-[#888888] hover:bg-[#252526] hover:text-white"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full bg-[#2A9D7B]/20 px-3 py-1 text-[11px] font-semibold text-[#2A9D7B]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2A9D7B] animate-pulse" />
              <span>{currentStage.replace("_", " ")}</span>
            </div>
          )}

          {permissions.canEvaluate && (
            <Link
              to="/interview/$roomKey/evaluation"
              params={{ roomKey }}
              className="flex items-center gap-1 rounded-lg bg-[#2A9D7B] px-3 py-1.5 font-sans text-xs font-semibold text-white hover:bg-[#238266] transition shadow-md"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Scorecard</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Workspace Multi-Pane View */}
      <div className="grid flex-1 grid-cols-12 gap-2.5 p-2.5 overflow-hidden">
        {/* Left 8 Columns: Primary Interactive Canvas (IDE / Whiteboard / Terminal) */}
        <div className="col-span-12 flex flex-col gap-2 lg:col-span-8 overflow-hidden">
          {/* Pipeline Switcher Tabs */}
          <div className="flex items-center justify-between rounded-xl bg-[#141414] border border-[#222222] p-1 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab("CODING")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                  activeTab === "CODING"
                    ? "bg-[#2A9D7B] text-white shadow"
                    : "text-[#888888] hover:text-white"
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>Monaco IDE</span>
              </button>

              <button
                onClick={() => setActiveTab("WHITEBOARD")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                  activeTab === "WHITEBOARD"
                    ? "bg-[#2A9D7B] text-white shadow"
                    : "text-[#888888] hover:text-white"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>System Design</span>
              </button>

              <button
                onClick={() => setActiveTab("TERMINAL")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                  activeTab === "TERMINAL"
                    ? "bg-[#2A9D7B] text-white shadow"
                    : "text-[#888888] hover:text-white"
                }`}
              >
                <TerminalIcon className="h-3.5 w-3.5" />
                <span>PTY Terminal</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pr-2 text-[10px] text-[#777777]">
              <span>Real-Time Yjs CRDT Sync</span>
            </div>
          </div>

          {/* Primary Viewport */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "CODING" ? (
              <MonacoWorkspace
                roomKey={roomKey}
                sessionId={session._id}
                initialCode={session.codeWorkspace?.files?.[0]?.content}
                initialLanguage="python"
                allowedLanguages={session.allowedLanguages}
              />
            ) : activeTab === "WHITEBOARD" ? (
              whiteboardMode === "EXCALIDRAW" ? (
                <ExcalidrawWhiteboard
                  roomKey={roomKey}
                  sessionId={session._id}
                  readOnly={!permissions.canEditWhiteboard}
                  onUseLegacyBoard={() => setWhiteboardMode("LEGACY")}
                />
              ) : (
                <div className="relative h-full">
                  <button
                    type="button"
                    onClick={() => setWhiteboardMode("EXCALIDRAW")}
                    className="absolute right-3 top-3 z-10 rounded-md border border-[#2A9D7B]/50 bg-[#171717] px-2.5 py-1.5 text-[11px] font-semibold text-[#7ee0c5] shadow transition hover:bg-[#2A9D7B]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7ee0c5]"
                  >
                    Return to Excalidraw
                  </button>
                  <WhiteboardCanvas
                    roomKey={roomKey}
                    sessionId={session._id}
                    readOnly={!permissions.canEditWhiteboard}
                  />
                </div>
              )
            ) : (
              <TerminalPanel
                sessionId={session._id}
                roomKey={roomKey}
                token={token ?? undefined}
                readOnly={!permissions.canExecuteCode}
              />
            )}
          </div>
        </div>

        {/* Right 4 Columns: Communication Media, AI Copilot, Unified Timeline */}
        <div className="col-span-12 flex flex-col gap-2.5 lg:col-span-4 overflow-hidden">
          {/* Top Video Grid */}
          <div className="h-52">
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

          {/* AI Co-Interviewer Panel (Recruiter only) */}
          {permissions.canViewAiAssistant && (
            <div className="h-48">
              <AiInterviewerPanel
                sessionId={session._id}
                problemTitle={session.activeProblem?.title}
                currentStage={currentStage}
              />
            </div>
          )}

          {/* Unified Interview Timeline Stream */}
          <div className="flex-1 overflow-hidden">
            <UnifiedTimelineView events={timelineEvents} />
          </div>
        </div>
      </div>
    </div>
  );
}
