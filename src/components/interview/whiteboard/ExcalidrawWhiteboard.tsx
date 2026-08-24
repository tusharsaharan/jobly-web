import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { convertToExcalidrawElements, Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import "@excalidraw/excalidraw/index.css";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { Layers3, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";

interface ExcalidrawWhiteboardProps {
  roomKey: string;
  sessionId?: string;
  readOnly?: boolean;
  onSnapshotSaved?: (timelineEvent: any) => void;
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

  const persistScene = useCallback(
    (elements: readonly OrderedExcalidrawElement[]) => {
      const scene = sceneRef.current;
      if (!scene || applyingRemoteRef.current || readOnly) return;
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
      className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#121212] shadow-2xl"
      aria-label="Collaborative system-design whiteboard"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#333] bg-[#1b1b1b] px-3 py-2 font-sans text-xs text-[#d4d4d4]">
        <div className="flex items-center gap-2">
          <Layers3 className="h-4 w-4 text-[#2A9D7B]" aria-hidden="true" />
          <span className="font-semibold">Excalidraw System Design</span>
          <span
            className="rounded-full bg-[#2A9D7B]/15 px-2 py-0.5 text-[11px] text-[#7ee0c5]"
            aria-live="polite"
          >
            {connected ? "CRDT Synced" : "Connecting..."}
          </span>
          {peerCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-[#a8a8a8]">
              <Users className="h-3 w-3" />
              {peerCount} collaborating
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {!readOnly && (
            <button
              type="button"
              onClick={addTemplate}
              className="rounded-md border border-[#444] px-2.5 py-1.5 text-[11px] font-medium transition hover:border-[#2A9D7B] hover:bg-[#2A9D7B]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7ee0c5]"
            >
              Add Architecture Stencil
            </button>
          )}
          {sessionId && !readOnly && (
            <button
              type="button"
              onClick={saveSnapshot}
              className="flex items-center gap-1.5 rounded-md bg-[#2A9D7B] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#238266] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7ee0c5]"
            >
              <Save className="h-3.5 w-3.5" />
              Snapshot
            </button>
          )}
        </div>
      </div>
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
    </section>
  );
}
