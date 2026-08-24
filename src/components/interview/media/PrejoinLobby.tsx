import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronLeft,
  Loader2,
  Mic,
  MicOff,
  Monitor,
  Video,
  VideoOff,
} from "lucide-react";

interface PrejoinLobbyProps {
  interviewTitle: string;
  jobTitle?: string;
  company?: string;
  userName: string;
  onJoin: (preferences: { cameraEnabled: boolean; microphoneEnabled: boolean }) => void;
  onLeave: () => void;
}

type DeviceStatus = "checking" | "ready" | "unavailable";

export function PrejoinLobby({
  interviewTitle,
  jobTitle,
  company,
  userName,
  onJoin,
  onLeave,
}: PrejoinLobbyProps) {
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [cameraStatus, setCameraStatus] = useState<DeviceStatus>("checking");
  const [microphoneStatus, setMicrophoneStatus] = useState<DeviceStatus>("checking");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [cameraId, setCameraId] = useState("");
  const [microphoneId, setMicrophoneId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const stopPreview = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const loadDevices = useCallback(async () => {
    const found = await navigator.mediaDevices.enumerateDevices();
    setDevices(
      found.filter((device) => device.kind === "videoinput" || device.kind === "audioinput"),
    );
  }, []);

  const startPreview = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("unavailable");
      setMicrophoneStatus("unavailable");
      setError("This browser does not support camera and microphone access.");
      return;
    }
    setError(null);
    setCameraStatus("checking");
    setMicrophoneStatus("checking");
    stopPreview();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: cameraId ? { deviceId: { exact: cameraId } } : true,
        audio: microphoneId ? { deviceId: { exact: microphoneId } } : true,
      });
      streamRef.current = stream;
      if (previewRef.current) previewRef.current.srcObject = stream;
      setCameraStatus(stream.getVideoTracks().length ? "ready" : "unavailable");
      setMicrophoneStatus(stream.getAudioTracks().length ? "ready" : "unavailable");
      await loadDevices();
    } catch (cause) {
      const message =
        cause instanceof DOMException && cause.name === "NotAllowedError"
          ? "Camera or microphone permission was blocked. You can still join without media."
          : "We could not access your selected camera or microphone. You can still join without media.";
      setError(message);
      setCameraStatus("unavailable");
      setMicrophoneStatus("unavailable");
    }
  }, [cameraId, loadDevices, microphoneId, stopPreview]);

  useEffect(() => {
    void startPreview();
    return stopPreview;
  }, [startPreview, stopPreview]);

  const updateCamera = (enabled: boolean) => {
    streamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
    setCameraEnabled(enabled);
  };

  const updateMicrophone = (enabled: boolean) => {
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
    setMicrophoneEnabled(enabled);
  };

  const enterInterview = () => {
    stopPreview();
    onJoin({
      cameraEnabled: cameraStatus === "ready" && cameraEnabled,
      microphoneEnabled: microphoneStatus === "ready" && microphoneEnabled,
    });
  };

  const cameras = devices.filter((device) => device.kind === "videoinput");
  const microphones = devices.filter((device) => device.kind === "audioinput");
  const readyCount = Number(cameraStatus === "ready") + Number(microphoneStatus === "ready");

  return (
    <main className="min-h-screen overflow-y-auto bg-[#08090c] px-4 py-6 font-sans text-[#f7fafc] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-center">
        <button
          type="button"
          onClick={onLeave}
          className="mb-6 flex w-fit items-center gap-1.5 text-sm text-[#adb5bd] transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7ee0c5]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to interviews
        </button>
        <div className="grid overflow-hidden rounded-2xl border border-[#292d35] bg-[#12151b] shadow-2xl lg:grid-cols-[1.3fr_0.7fr]">
          <section className="border-b border-[#292d35] p-5 sm:p-8 lg:border-b-0 lg:border-r">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7ee0c5]">
              Interview readiness
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{interviewTitle}</h1>
            {(jobTitle || company) && (
              <p className="mt-2 text-sm text-[#aeb5c0]">
                {[jobTitle, company].filter(Boolean).join(" · ")}
              </p>
            )}
            <div className="relative mt-6 aspect-video overflow-hidden rounded-xl border border-[#343944] bg-[#07090d]">
              <video
                ref={previewRef}
                autoPlay
                muted
                playsInline
                className={`h-full w-full object-cover transition-opacity ${cameraStatus === "ready" && cameraEnabled ? "opacity-100" : "opacity-0"}`}
              />
              {(!cameraEnabled || cameraStatus !== "ready") && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top,#253343,transparent_55%)]">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#26313d] text-xl font-semibold text-[#dbe5ee]">
                    {userName.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="mt-3 text-sm text-[#d4dae2]">
                    {cameraStatus === "checking" ? "Checking camera…" : "Camera is off"}
                  </span>
                </div>
              )}
              <div className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1.5 text-xs font-medium backdrop-blur">
                {userName} (you)
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-3">
              <DeviceToggle
                active={microphoneEnabled && microphoneStatus === "ready"}
                label={microphoneEnabled ? "Mute microphone" : "Unmute microphone"}
                onClick={() => updateMicrophone(!microphoneEnabled)}
                disabled={microphoneStatus !== "ready"}
              >
                {microphoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </DeviceToggle>
              <DeviceToggle
                active={cameraEnabled && cameraStatus === "ready"}
                label={cameraEnabled ? "Turn camera off" : "Turn camera on"}
                onClick={() => updateCamera(!cameraEnabled)}
                disabled={cameraStatus !== "ready"}
              >
                {cameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </DeviceToggle>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <DeviceSelector
                label="Camera"
                icon={<Video className="h-4 w-4" />}
                value={cameraId}
                onChange={setCameraId}
                devices={cameras}
                disabled={cameraStatus !== "ready"}
              />
              <DeviceSelector
                label="Microphone"
                icon={<Mic className="h-4 w-4" />}
                value={microphoneId}
                onChange={setMicrophoneId}
                devices={microphones}
                disabled={microphoneStatus !== "ready"}
              />
            </div>
          </section>
          <aside className="flex flex-col p-5 sm:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Monitor className="h-4 w-4 text-[#7ee0c5]" />
              Ready to collaborate
            </div>
            <p className="mt-2 text-sm leading-6 text-[#aeb5c0]">
              You will enter a live room with collaborative code, a system-design board, and secure
              audio/video controls.
            </p>
            <div className="mt-6 space-y-3" aria-live="polite">
              <ReadinessRow label="Camera" status={cameraStatus} />
              <ReadinessRow label="Microphone" status={microphoneStatus} />
              <ReadinessRow label="Workspace" status="ready" />
            </div>
            {error && (
              <div className="mt-5 flex gap-2 rounded-lg border border-amber-400/25 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="mt-auto pt-8">
              <p className="mb-3 text-xs text-[#9199a5]">
                {readyCount === 2
                  ? "Devices are ready. You can change them later in the call."
                  : "You may join with camera and microphone disabled."}
              </p>
              <button
                type="button"
                onClick={enterInterview}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#2A9D7B] px-4 text-sm font-semibold text-white transition hover:bg-[#238266] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7ee0c5]"
              >
                Join interview <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function DeviceToggle({
  active,
  label,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7ee0c5] disabled:cursor-not-allowed disabled:opacity-45 ${active ? "bg-[#28313b] text-white hover:bg-[#37434f]" : "bg-rose-600 text-white hover:bg-rose-700"}`}
    >
      {children}
    </button>
  );
}

function DeviceSelector({
  label,
  icon,
  value,
  onChange,
  devices,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  devices: MediaDeviceInfo[];
  disabled: boolean;
}) {
  const id = `prejoin-${label.toLowerCase()}`;
  return (
    <label htmlFor={id} className="block text-xs font-medium text-[#cbd2dc]">
      <span className="mb-1.5 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || devices.length === 0}
        className="w-full rounded-md border border-[#3b414c] bg-[#0e1015] px-3 py-2 text-sm text-white outline-none transition hover:border-[#526070] focus:border-[#2A9D7B] focus:ring-2 focus:ring-[#2A9D7B]/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Default {label.toLowerCase()}</option>
        {devices.map((device, index) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `${label} ${index + 1}`}
          </option>
        ))}
      </select>
    </label>
  );
}

function ReadinessRow({ label, status }: { label: string; status: DeviceStatus }) {
  const ready = status === "ready";
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#2d323b] bg-[#171b22] px-3 py-2.5 text-sm">
      <span>{label}</span>
      <span
        className={`flex items-center gap-1.5 text-xs ${ready ? "text-[#7ee0c5]" : status === "checking" ? "text-[#e8c374]" : "text-[#aeb5c0]"}`}
      >
        {status === "checking" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : ready ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5" />
        )}
        {ready ? "Ready" : status === "checking" ? "Checking" : "Off"}
      </span>
    </div>
  );
}
