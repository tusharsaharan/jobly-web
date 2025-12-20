import React, { useEffect, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { ConnectionState, Track } from "livekit-client";
import {
  AlertCircle,
  Loader2,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  Users,
  Video,
  VideoOff,
  Wifi,
} from "lucide-react";
import { apiCall } from "@/lib/api";

interface VideoGridProps {
  roomKey: string;
  sessionId?: string;
  token?: string;
  userName: string;
  userRole: string;
  initialCameraEnabled?: boolean;
  initialMicrophoneEnabled?: boolean;
  onLeave?: () => void;
}

interface LiveKitCredentials {
  token: string;
  roomKey: string;
  serverUrl: string;
}

/** The media surface only; the IDE and whiteboard remain independent panes. */
export function VideoGrid({
  sessionId,
  token,
  userName,
  userRole,
  onLeave,
  initialCameraEnabled = true,
  initialMicrophoneEnabled = true,
}: VideoGridProps) {
  const [credentials, setCredentials] = useState<LiveKitCredentials | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!sessionId || !token) {
      setError("Your interview access is still loading. Please try again in a moment.");
      return;
    }

    let disposed = false;
    setCredentials(null);
    setError(null);

    apiCall<LiveKitCredentials>(`/interviews/${sessionId}/livekit-token`, "POST", null, token)
      .then((nextCredentials) => {
        if (!disposed) setCredentials(nextCredentials);
      })
      .catch((err: Error) => {
        if (!disposed) setError(err.message || "Unable to connect to the interview call.");
      });

    return () => {
      disposed = true;
    };
  }, [retryKey, sessionId, token]);

  if (error)
    return (
      <MediaStatus
        tone="error"
        message={describeLiveKitError(error)}
        onLeave={onLeave}
        onRetry={() => setRetryKey((current) => current + 1)}
      />
    );
  if (!credentials)
    return <MediaStatus tone="loading" message="Connecting your secure interview call…" />;

  return (
    <LiveKitRoom
      className="h-full"
      token={credentials.token}
      serverUrl={credentials.serverUrl}
      connect
      video={initialCameraEnabled}
      audio={initialMicrophoneEnabled}
      onError={(err) => setError(err.message || "The interview call encountered an error.")}
    >
      <InterviewCall userName={userName} userRole={userRole} onLeave={onLeave} />
    </LiveKitRoom>
  );
}

function InterviewCall({
  userName,
  userRole,
  onLeave,
}: Pick<VideoGridProps, "userName" | "userRole" | "onLeave">) {
  const { localParticipant, isCameraEnabled, isMicrophoneEnabled, isScreenShareEnabled } =
    useLocalParticipant();
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const videoTracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
    onlySubscribed: false,
  });
  const isConnected = connectionState === ConnectionState.Connected;

  const toggleMicrophone = async () => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  const toggleCamera = async () => localParticipant.setCameraEnabled(!isCameraEnabled);
  const toggleScreenShare = async () =>
    localParticipant.setScreenShareEnabled(!isScreenShareEnabled);

  return (
    <section
      className="flex h-full flex-col overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#161616] p-2.5 text-white shadow-xl"
      aria-label="Live interview call"
    >
      <RoomAudioRenderer />

      <div className="mb-2 flex items-center justify-between gap-2 text-[11px]">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-semibold ${isConnected ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-200"}`}
          aria-live="polite"
        >
          {isConnected ? (
            <Wifi className="h-3.5 w-3.5" />
          ) : (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          )}
          {connectionCopy(connectionState)}
        </span>
        <span
          className="inline-flex items-center gap-1 text-[#A7A7A7]"
          title={`${participants.length} participants in the room`}
        >
          <Users className="h-3.5 w-3.5" />
          {participants.length}
        </span>
      </div>

      <div
        className={`grid min-h-0 flex-1 gap-2 ${videoTracks.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
        aria-label="Participant videos"
      >
        {videoTracks.length > 0 ? (
          videoTracks.map((track) => {
            const participant = track.participant;
            const isLocal = participant.identity === localParticipant.identity;
            const label = isLocal
              ? `${userName} (You)`
              : participant.name || (userRole === "recruiter" ? "Candidate" : "Interviewer");
            const isScreen = track.source === Track.Source.ScreenShare;

            return (
              <article
                key={`${participant.identity}-${track.source}`}
                className="relative min-h-0 overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#0E0E0E]"
              >
                <VideoTrack
                  trackRef={track}
                  className="h-full w-full object-cover"
                  aria-label={`${label}${isScreen ? " screen share" : " video"}`}
                />
                <div className="absolute bottom-1.5 left-1.5 max-w-[calc(100%-12px)] truncate rounded bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white">
                  {isScreen ? `${label} — screen` : label}
                </div>
              </article>
            );
          })
        ) : (
          <div className="flex min-h-0 flex-col items-center justify-center rounded-lg border border-dashed border-[#333333] bg-[#0E0E0E] px-4 text-center">
            <VideoOff className="mb-2 h-5 w-5 text-[#777777]" />
            <p className="text-xs font-medium text-[#D4D4D4]">Waiting for a video stream</p>
            <p className="mt-1 text-[11px] leading-4 text-[#888888]">
              Your camera will appear here once browser permissions are granted.
            </p>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-center gap-2 border-t border-[#2A2A2A] pt-2">
        <CallButton
          active={isMicrophoneEnabled}
          label={isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
          onClick={() => void toggleMicrophone()}
        >
          {isMicrophoneEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </CallButton>
        <CallButton
          active={isCameraEnabled}
          label={isCameraEnabled ? "Turn camera off" : "Turn camera on"}
          onClick={() => void toggleCamera()}
        >
          {isCameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </CallButton>
        <CallButton
          active={isScreenShareEnabled}
          label={isScreenShareEnabled ? "Stop sharing screen" : "Share screen"}
          onClick={() => void toggleScreenShare()}
        >
          <Monitor className="h-4 w-4" />
        </CallButton>
        {onLeave && (
          <button
            type="button"
            onClick={onLeave}
            aria-label="Leave interview call"
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full bg-rose-600 text-white transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#161616]"
          >
            <PhoneOff className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
}

function CallButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D7B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161616] ${active ? "bg-[#252526] text-white hover:bg-[#333333]" : "bg-rose-600 text-white hover:bg-rose-700"}`}
    >
      {children}
    </button>
  );
}

function MediaStatus({
  tone,
  message,
  onLeave,
  onRetry,
}: {
  tone: "loading" | "error";
  message: string;
  onLeave?: () => void;
  onRetry?: () => void;
}) {
  const isError = tone === "error";
  return (
    <section
      className="flex h-full flex-col items-center justify-center rounded-xl border border-[#2A2A2A] bg-[#161616] p-5 text-center text-white"
      aria-live="polite"
    >
      {isError ? (
        <AlertCircle className="mb-3 h-7 w-7 text-rose-400" />
      ) : (
        <Loader2 className="mb-3 h-7 w-7 animate-spin text-[#2A9D7B]" />
      )}
      <p className="max-w-xs text-sm font-medium">{message}</p>
      {isError && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md bg-[#2A9D7B] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#238266] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7ee0c5]"
            >
              Retry connection
            </button>
          )}
          {onLeave && (
            <button
              type="button"
              onClick={onLeave}
              className="rounded-md border border-[#454545] px-3 py-2 text-xs font-semibold transition-colors hover:bg-[#252526] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D7B]"
            >
              Return to interviews
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function connectionCopy(state: ConnectionState) {
  if (state === ConnectionState.Connected) return "Connected";
  if (state === ConnectionState.Reconnecting) return "Reconnecting";
  if (state === ConnectionState.Connecting) return "Connecting";
  return "Disconnected";
}

function describeLiveKitError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("failed to fetch") || normalized.includes("signal")) {
    return "The live-call signaling service could not be reached. For local Docker use, start the Compose stack and confirm LiveKit is published on ws://localhost:7880. For a hosted deployment, configure LIVEKIT_PUBLIC_URL as the public wss:// address.";
  }
  return message;
}
