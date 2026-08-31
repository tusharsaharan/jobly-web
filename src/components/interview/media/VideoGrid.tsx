import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from "react";
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
  VideoOff,
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
  compact?: boolean;
  onLeave?: () => void;
}

/** Methods exposed to parent via ref */
export interface VideoGridHandle {
  toggleMicrophone: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
  leaveRoom: () => void;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenShareEnabled: boolean;
  connectionState: string;
  participantCount: number;
}

interface LiveKitCredentials {
  token: string;
  roomKey: string;
  serverUrl: string;
}

/** The media surface only; controls are managed externally via ref. */
export const VideoGrid = forwardRef<VideoGridHandle, VideoGridProps>(function VideoGrid(
  {
    sessionId,
    token,
    userName,
    userRole,
    onLeave,
    initialCameraEnabled = true,
    initialMicrophoneEnabled = true,
    compact = false,
  },
  ref,
) {
  const [credentials, setCredentials] = useState<LiveKitCredentials | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const innerRef = useRef<VideoGridHandle | null>(null);

  // Forward the inner ref to the parent
  useImperativeHandle(ref, () => {
    if (innerRef.current) return innerRef.current;
    // Fallback handle when not connected
    return {
      toggleMicrophone: () => {},
      toggleCamera: () => {},
      toggleScreenShare: () => {},
      leaveRoom: () => onLeave?.(),
      isMicEnabled: false,
      isCameraEnabled: false,
      isScreenShareEnabled: false,
      connectionState: "Disconnected",
      participantCount: 0,
    };
  });

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

  if (error) {
    return (
      <LocalMediaCall
        ref={innerRef}
        userName={userName}
        userRole={userRole}
        initialCameraEnabled={initialCameraEnabled}
        initialMicrophoneEnabled={initialMicrophoneEnabled}
        compact={compact}
        onLeave={onLeave}
        onRetryLiveKit={() => setRetryKey((current) => current + 1)}
      />
    );
  }

  if (!credentials) {
    return (
      <div className="flex h-full w-full items-center justify-center" style={{ background: "var(--iv-bg)" }}>
        <Loader2 className="h-6 w-6 animate-spin text-[var(--iv-accent)]" />
      </div>
    );
  }

  return (
    <LiveKitRoom
      className="h-full"
      token={credentials.token}
      serverUrl={credentials.serverUrl}
      connect
      video={initialCameraEnabled}
      audio={initialMicrophoneEnabled}
      onError={() => {
        setError("LiveKit signaling service unreachable.");
      }}
    >
      <InterviewCall ref={innerRef} userName={userName} userRole={userRole} compact={compact} onLeave={onLeave} />
    </LiveKitRoom>
  );
});

/** Fallback media call using browser-native camera & microphone */
const LocalMediaCall = forwardRef<
  VideoGridHandle,
  {
    userName: string;
    userRole: string;
    initialCameraEnabled?: boolean;
    initialMicrophoneEnabled?: boolean;
    compact?: boolean;
    onLeave?: () => void;
    onRetryLiveKit?: () => void;
  }
>(function LocalMediaCall(
  {
    userName,
    initialCameraEnabled = true,
    initialMicrophoneEnabled = true,
    compact = false,
    onLeave,
    onRetryLiveKit,
  },
  ref,
) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState<boolean>(initialCameraEnabled);
  const [micOn, setMicOn] = useState<boolean>(initialMicrophoneEnabled);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let localStream: MediaStream | null = null;

    navigator.mediaDevices
      ?.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      })
      .then((s) => {
        localStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch((err) => {
        console.warn("Local media permission error:", err);
        setPermissionError("Camera/Microphone permission denied or device not found.");
      });

    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const toggleCamera = useCallback(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !cameraOn;
        setCameraOn(!cameraOn);
      }
    }
  }, [stream, cameraOn]);

  const toggleMic = useCallback(() => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micOn;
        setMicOn(!micOn);
      }
    }
  }, [stream, micOn]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(camStream);
        if (videoRef.current) videoRef.current.srcObject = camStream;
        setIsScreenSharing(false);
      } catch {
        // Continue
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setStream(screenStream);
        if (videoRef.current) videoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((s) => {
            setStream(s);
            if (videoRef.current) videoRef.current.srcObject = s;
          });
        };
      } catch {
        // User cancelled picker
      }
    }
  }, [isScreenSharing]);

  useImperativeHandle(ref, () => ({
    toggleMicrophone: toggleMic,
    toggleCamera: toggleCamera,
    toggleScreenShare: () => void toggleScreenShare(),
    leaveRoom: () => onLeave?.(),
    isMicEnabled: micOn,
    isCameraEnabled: cameraOn,
    isScreenShareEnabled: isScreenSharing,
    connectionState: "Connected",
    participantCount: 1,
  }), [toggleMic, toggleCamera, toggleScreenShare, onLeave, micOn, cameraOn, isScreenSharing]);

  return (
    <div
      className={`flex h-full w-full items-center justify-center overflow-hidden ${compact ? "iv-video-compact" : ""}`}
      style={{ background: "var(--iv-bg)" }}
    >
      {permissionError ? (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <AlertCircle className="mb-2 h-6 w-6 text-rose-400" />
          {!compact && (
            <>
              <p className="text-xs font-semibold text-rose-200" style={{ fontFamily: "var(--font-iv-ui)" }}>
                Device Access Required
              </p>
              <p className="mt-1 text-[11px] text-white/50" style={{ fontFamily: "var(--font-iv-ui)" }}>
                {permissionError}
              </p>
            </>
          )}
        </div>
      ) : cameraOn || isScreenSharing ? (
        <div className="relative h-full w-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          {!compact && (
            <div
              className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white/90"
              style={{ fontFamily: "var(--font-iv-ui)" }}
            >
              {userName} (You) {isScreenSharing ? " — Screen" : ""}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <VideoOff className="mb-2 h-5 w-5 text-white/30" />
          {!compact && (
            <p className="text-[11px] text-white/40" style={{ fontFamily: "var(--font-iv-ui)" }}>
              Camera off
            </p>
          )}
        </div>
      )}
    </div>
  );
});

/** LiveKit-backed interview call — renders video tiles only, exposes controls via ref */
const InterviewCall = forwardRef<
  VideoGridHandle,
  Pick<VideoGridProps, "userName" | "userRole" | "onLeave" | "compact">
>(function InterviewCall({ userName, userRole, onLeave, compact = false }, ref) {
  const { localParticipant, isCameraEnabled, isMicrophoneEnabled, isScreenShareEnabled } =
    useLocalParticipant();
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const videoTracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
    onlySubscribed: false,
  });
  const isConnected = connectionState === ConnectionState.Connected;

  const toggleMicrophone = useCallback(
    () => { void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled); },
    [localParticipant, isMicrophoneEnabled],
  );
  const toggleCamera = useCallback(
    () => { void localParticipant.setCameraEnabled(!isCameraEnabled); },
    [localParticipant, isCameraEnabled],
  );
  const toggleScreenShare = useCallback(
    () => { void localParticipant.setScreenShareEnabled(!isScreenShareEnabled); },
    [localParticipant, isScreenShareEnabled],
  );

  useImperativeHandle(ref, () => ({
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    leaveRoom: () => onLeave?.(),
    isMicEnabled: isMicrophoneEnabled,
    isCameraEnabled: isCameraEnabled,
    isScreenShareEnabled: isScreenShareEnabled,
    connectionState: connectionCopy(connectionState),
    participantCount: participants.length,
  }), [
    toggleMicrophone, toggleCamera, toggleScreenShare, onLeave,
    isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled,
    connectionState, participants.length,
  ]);

  return (
    <div className={`flex h-full w-full overflow-hidden ${compact ? "iv-video-compact" : ""}`} style={{ background: "var(--iv-bg)" }}>
      <RoomAudioRenderer />

      <div
        className={`flex-1 grid min-h-0 gap-1 ${
          compact
            ? "grid-cols-1"
            : videoTracks.length > 2
            ? "grid-cols-2 grid-rows-2"
            : videoTracks.length > 1
            ? "grid-cols-2"
            : "grid-cols-1"
        }`}
      >
        {videoTracks.length > 0 ? (
          videoTracks.map((track) => {
            const participant = track.participant;
            const isLocal = participant.identity === localParticipant.identity;
            const label = isLocal
              ? `${userName} (You)`
              : participant.name || (userRole === "recruiter" ? "Candidate" : "Interviewer");
            const isScreen = track.source === Track.Source.ScreenShare;

            // In compact mode, show only the first track
            if (compact && track !== videoTracks[0]) return null;

            return (
              <article
                key={`${participant.identity}-${track.source}`}
                className="relative min-h-0 overflow-hidden bg-[var(--iv-bg)]"
              >
                <VideoTrack
                  trackRef={track}
                  className="h-full w-full object-cover"
                  aria-label={`${label}${isScreen ? " screen share" : " video"}`}
                />
                {!compact && (
                  <div
                    className="absolute bottom-2 left-2 max-w-[calc(100%-16px)] truncate rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white/90"
                    style={{ fontFamily: "var(--font-iv-ui)" }}
                  >
                    {isScreen ? `${label} — screen` : label}
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <div className="flex min-h-0 flex-col items-center justify-center px-4 text-center">
            <VideoOff className="mb-2 h-5 w-5 text-white/30" />
            {!compact && (
              <>
                <p className="text-xs font-medium text-white/70" style={{ fontFamily: "var(--font-iv-ui)" }}>
                  Waiting for video stream
                </p>
                <p className="mt-1 text-[11px] text-white/40" style={{ fontFamily: "var(--font-iv-ui)" }}>
                  Camera will appear once permissions are granted.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

function connectionCopy(state: ConnectionState) {
  if (state === ConnectionState.Connected) return "Connected";
  if (state === ConnectionState.Reconnecting) return "Reconnecting";
  if (state === ConnectionState.Connecting) return "Connecting";
  return "Disconnected";
}
