import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { convertToExcalidrawElements, Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
// Excalidraw CSS is bundled via main.js; explicit CSS import removed to fix Vite resolution (was index.css not found)
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { Layers3, Save, Users, ArrowLeft, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";

interface ExcalidrawWhiteboardProps {
  roomKey: string;
  sessionId?: string;
  readOnly?: boolean;
  onSnapshotSaved?: (timelineEvent: any) => void;
  onLeave?: () => void;
  videoElement?: React.ReactNode;
  isVideoHidden?: boolean;
  onToggleVideo?: () => void;
}

const userColors = ["#2A9D7B", "#E76F51", "#F4A261", "#457B9D", "#9D4EDD"];

function parseElements(scene: Y.Map<string>): OrderedExcalidrawElement[] {
  const elements: OrderedExcalidrawElement[] = [];
  scene.forEach((value) => {
    try {
      const element: unknown = JSON.parse(value);
      if (element && typeof element === "object" && "id" in element) {
        elements.push(element as OrderedExcalidrawElement);
      }
    } catch {
      // A malformed legacy entry must not prevent the rest of the board loading.
    }
  });
  return elements.sort((left, right) => left.index.localeCompare(right.index));
}

function systemDesignTemplate() {
  return convertToExcalidrawElements([
    { type: "text", x: 130, y: 60, text: "Interview system design", fontSize: 28 },
    { type: "rectangle", x: 100, y: 160, width: 170, height: 80, label: { text: "Client" } },
    {
      type: "rectangle",
      x: 380,
      y: 160,
      width: 170,
      height: 80,
      label: { text: "API / Load balancer" },
    },
    { type: "rectangle", x: 660, y: 160, width: 170, height: 80, label: { text: "Service" } },
    { type: "ellipse", x: 660, y: 340, width: 170, height: 80, label: { text: "Database" } },
    { type: "rectangle", x: 380, y: 340, width: 170, height: 80, label: { text: "Cache" } },
    { type: "arrow", x: 270, y: 200, width: 110, height: 0, endArrowhead: "arrow" },
    { type: "arrow", x: 550, y: 200, width: 110, height: 0, endArrowhead: "arrow" },
    { type: "arrow", x: 745, y: 240, width: 0, height: 100, endArrowhead: "arrow" },
    { type: "arrow", x: 550, y: 380, width: 110, height: 0, endArrowhead: "arrow" },
  ]);
}

export function ExcalidrawWhiteboard({
  roomKey,
  sessionId,
  readOnly = false,
  onSnapshotSaved,
  onLeave,
  videoElement,
  isVideoHidden = false,
  onToggleVideo,
}: ExcalidrawWhiteboardProps) {
  const { token, user } = useAuth();
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const applyingRemoteRef = useRef(false);
  const sceneRef = useRef<Y.Map<string> | null>(null);
  const sceneSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingElementsRef = useRef<readonly OrderedExcalidrawElement[]>([]);
  const [connected, setConnected] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [ready, setReady] = useState(false);
  const identity = useMemo(
    () => ({
      name: user?.name || "Participant",
      color: userColors[Math.floor(Math.random() * userColors.length)],
    }),
    [user?.name],
  );

  const applyRemoteScene = useCallback(() => {
    const scene = sceneRef.current;
    const api = apiRef.current;
    if (!scene || !api) return;
    applyingRemoteRef.current = true;
    api.updateScene({ elements: parseElements(scene) });
    requestAnimationFrame(() => {
      applyingRemoteRef.current = false;
    });
  }, []);

  useEffect(() => {
    const document = new Y.Doc();
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const provider = new WebsocketProvider(
      `${protocol}//${window.location.hostname}:5000/whiteboard`,
      roomKey,
      document,
      {
        params: { token: token || "" },
        disableBc: true,
      },
    );
    const scene = document.getMap<string>("excalidraw-elements");
    sceneRef.current = scene;
    const refreshPeers = () => {
      const peers = Array.from(provider.awareness.getStates().values()).filter((state) => {
        const value = state as { user?: { name?: string } };
        return value.user?.name && value.user.name !== identity.name;
      });
      setPeerCount(peers.length);
    };

    provider.awareness.setLocalStateField("user", identity);
    provider.on("status", (event: { status: string }) =>
      setConnected(event.status === "connected"),
    );
    provider.awareness.on("change", refreshPeers);
    // Yjs fires observers for both local and remote transactions. Reapplying a
    // local scene while Excalidraw is still handling pointer movement cancels
    // the in-progress element, which is why freehand strokes appeared as dots.
    const onSceneUpdate = (_event: Y.YMapEvent<string>, transaction: Y.Transaction) => {
      if (transaction.origin === "excalidraw-local-change") return;
      applyRemoteScene();
    };
    scene.observe(onSceneUpdate);
    applyRemoteScene();
    setReady(true);

    return () => {
      setReady(false);
      scene.unobserve(onSceneUpdate);
      if (sceneSaveTimerRef.current) clearTimeout(sceneSaveTimerRef.current);
      provider.destroy();
      document.destroy();
      sceneRef.current = null;
    };
  }, [applyRemoteScene, identity, roomKey, token]);

  const MAX_WHITEBOARD_ELEMENTS = 3000;
  const MAX_WHITEBOARD_TOTAL_SIZE = 500 * 1024; // 500KB total
  const MAX_WHITEBOARD_ELEMENT_SIZE = 20 * 1024; // 20KB per element

  const persistScene = useCallback(
    (elements: readonly OrderedExcalidrawElement[]) => {
      const scene = sceneRef.current;
      if (!scene || applyingRemoteRef.current || readOnly) return;
      // Whiteboard size limits: element count and size
      if (elements.length > MAX_WHITEBOARD_ELEMENTS) {
        toast.error(`Whiteboard limit: max ${MAX_WHITEBOARD_ELEMENTS} elements (currently ${elements.length})`);
        return;
      }
      let totalSize = 0;
      for (const element of elements) {
        const elStr = JSON.stringify(element);
        if (elStr.length > MAX_WHITEBOARD_ELEMENT_SIZE) {
          toast.error(`Element ${element.id} exceeds ${MAX_WHITEBOARD_ELEMENT_SIZE / 1024}KB, rejected`);
          return;
        }
        totalSize += elStr.length;
      }
      if (totalSize > MAX_WHITEBOARD_TOTAL_SIZE) {
        toast.error(`Whiteboard total size exceeds ${MAX_WHITEBOARD_TOTAL_SIZE / 1024}KB (${Math.round(totalSize / 1024)}KB), save blocked`);
        return;
      }
      const ids = new Set(elements.map((element) => element.id));
      scene.doc?.transact(() => {
        for (const key of Array.from(scene.keys())) {
          if (!ids.has(key)) scene.delete(key);
        }
        for (const element of elements) scene.set(element.id, JSON.stringify(element));
      }, "excalidraw-local-change");
    },
    [readOnly],
  );

  const saveScene = useCallback(
    (elements: readonly OrderedExcalidrawElement[]) => {
      if (readOnly || applyingRemoteRef.current) return;
      pendingElementsRef.current = elements;
      if (sceneSaveTimerRef.current) clearTimeout(sceneSaveTimerRef.current);
      // Excalidraw emits updates for every pointer movement. Send a complete
      // scene shortly after drawing settles so the other participant gets a
      // smooth collaboration update without disrupting the local gesture.
      sceneSaveTimerRef.current = setTimeout(() => {
        sceneSaveTimerRef.current = null;
        persistScene(pendingElementsRef.current);
      }, 120);
    },
    [persistScene, readOnly],
  );

  const addTemplate = () => {
    if (readOnly || !apiRef.current) return;
    const existing = apiRef.current.getSceneElements();
    apiRef.current.updateScene({ elements: [...existing, ...systemDesignTemplate()] });
    saveScene(apiRef.current.getSceneElements());
    toast.success("System-design template added.");
  };

  const saveSnapshot = async () => {
    if (!sessionId) return;
    try {
      const res = await apiCall<{ msg: string; snapshot: any; timelineEvent?: any }>(
        `/whiteboard/${sessionId}/snapshots`,
        "POST",
        { canvasWidth: 1920, canvasHeight: 1080 },
        token,
      );
      if (res && res.timelineEvent && onSnapshotSaved) {
        onSnapshotSaved(res.timelineEvent);
      }
      toast.success("Whiteboard snapshot saved to the interview timeline.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save whiteboard snapshot.");
    }
  };

  return (
    <section
      className="relative flex h-full min-h-0 flex-col overflow-hidden"
      style={{ background: "var(--iv-bg)" }}
      aria-label="Collaborative system-design whiteboard"
    >
      {/* Header bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 text-[13px]"
        style={{
          borderColor: "var(--iv-border)",
          background: "var(--iv-surface)",
          fontFamily: "var(--font-iv-ui)",
          color: "var(--iv-text)",
        }}
      >
        <div className="flex items-center gap-3">
          <Layers3 className="h-4 w-4" style={{ color: "var(--iv-accent)" }} aria-hidden="true" />
          <span className="font-semibold">System Design Whiteboard</span>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{
              background: "var(--iv-accent-surface)",
              color: "var(--iv-accent-glow)",
            }}
            aria-live="polite"
          >
            {connected ? "Synced" : "Connecting..."}
          </span>
          {peerCount > 0 && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--iv-text-muted)" }}>
              <Users className="h-3 w-3" />
              {peerCount} collaborating
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              type="button"
              onClick={addTemplate}
              className="iv-btn iv-btn-ghost text-[12px]"
            >
              Add Stencil
            </button>
          )}
          {sessionId && !readOnly && (
            <button
              type="button"
              onClick={saveSnapshot}
              className="iv-btn iv-btn-primary text-[12px]"
            >
              <Save className="h-3.5 w-3.5" />
              Snapshot
            </button>
          )}
        </div>
      </div>

      {/* Excalidraw Canvas */}
      <div className="min-h-0 flex-1 bg-[#f8fafc]">
        {ready && (
          <Excalidraw
            excalidrawAPI={(api) => {
              apiRef.current = api;
              applyRemoteScene();
            }}
            onChange={(elements) => saveScene(elements)}
            initialData={{ appState: { viewModeEnabled: readOnly } }}
            UIOptions={{
              canvasActions: { loadScene: false, saveToActiveFile: false, export: false },
            }}
          />
        )}
      </div>

      {/* Bottom bar: Leave + Hide Video */}
      <div
        className="flex h-10 flex-shrink-0 items-center justify-between border-t px-4"
        style={{
          borderColor: "var(--iv-border)",
          background: "var(--iv-surface)",
          fontFamily: "var(--font-iv-ui)",
        }}
      >
        <div className="flex items-center gap-2">
          {onLeave && (
            <button
              type="button"
              onClick={onLeave}
              className="iv-btn iv-btn-ghost text-[12px]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Leave Whiteboard
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onToggleVideo && (
            <button
              type="button"
              onClick={onToggleVideo}
              className="iv-btn iv-btn-ghost text-[12px]"
            >
              <VideoOff className="h-3.5 w-3.5" />
              {isVideoHidden ? "Show Video" : "Hide Video"}
            </button>
          )}
        </div>
      </div>

      {/* Compact video in bottom-right corner */}
      {videoElement && !isVideoHidden && (
        <div
          className="iv-video-compact absolute bottom-14 right-4 z-20"
          style={{ width: 200, height: 120 }}
        >
          {videoElement}
        </div>
      )}
    </section>
  );
}
