import React, { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import {
  Square,
  Circle,
  ArrowRight,
  Type,
  StickyNote,
  Trash2,
  Server,
  Database,
  Globe,
  Cpu,
  Camera,
  Users,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";
import { toast } from "sonner";

export interface WhiteboardElement {
  id: string;
  type: "rectangle" | "circle" | "arrow" | "text" | "sticky" | "stencil";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  text?: string;
  stencilType?: "client" | "load_balancer" | "api_server" | "database" | "redis";
}

interface WhiteboardCanvasProps {
  roomKey: string;
  sessionId?: string;
  readOnly?: boolean;
}

export function WhiteboardCanvas({ roomKey, sessionId, readOnly = false }: WhiteboardCanvasProps) {
  const { user, token } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>("rectangle");
  const [selectedColor, setSelectedColor] = useState<string>("#2A9D7B");
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [activePeers, setActivePeers] = useState<
    Array<{ name: string; color: string; point?: { x: number; y: number } }>
  >([]);
  const [synced, setSynced] = useState<boolean>(false);

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const objectsMapRef = useRef<Y.Map<any> | null>(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    const wsUrl = `${protocol}//${host}:5000/whiteboard`;

    const provider = new WebsocketProvider(wsUrl, roomKey, ydoc, {
      params: { token: token || "" },
      disableBc: true,
    });
    providerRef.current = provider;

    const objectsMap = ydoc.getMap("objects");
    objectsMapRef.current = objectsMap;

    provider.on("status", (event: { status: string }) => {
      setSynced(event.status === "connected");
    });

    // Populate local React elements from Y.Map
    const updateElementsFromMap = () => {
      const items: WhiteboardElement[] = [];
      objectsMap.forEach((val) => {
        if (val) items.push(val as WhiteboardElement);
      });
      setElements(items);
    };

    updateElementsFromMap();
    objectsMap.observe(updateElementsFromMap);

    // Awareness
    const userColors = ["#2A9D7B", "#E76F51", "#F4A261", "#457B9D", "#A8DADC", "#9D4EDD"];
    const randomColor = userColors[Math.floor(Math.random() * userColors.length)];

    provider.awareness.setLocalStateField("user", {
      name: user?.name || "Participant",
      color: randomColor,
    });

    provider.awareness.on("change", () => {
      const states = Array.from(provider.awareness.getStates().values()) as Array<{
        user?: { name: string; color: string; point?: { x: number; y: number } };
      }>;
      const peers = states.filter((s) => s.user && s.user.name !== user?.name).map((s) => s.user!);
      setActivePeers(peers);
    });

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [roomKey, token, user?.name]);

  // Redraw canvas on state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw architectural dot grid
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    for (let x = 0; x < canvas.width; x += 24) {
      for (let y = 0; y < canvas.height; y += 24) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    // Render elements
    elements.forEach((el) => {
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color + "22";
      ctx.lineWidth = 2;

      if (el.type === "rectangle") {
        ctx.strokeRect(el.x, el.y, el.width, el.height);
        ctx.fillRect(el.x, el.y, el.width, el.height);
      } else if (el.type === "circle") {
        ctx.beginPath();
        const rx = Math.abs(el.width) / 2;
        const ry = Math.abs(el.height) / 2;
        ctx.ellipse(el.x + rx, el.y + ry, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
      } else if (el.type === "arrow") {
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x + el.width, el.y + el.height);
        ctx.stroke();
      } else if (el.type === "sticky") {
        ctx.fillStyle = "#F59E0B22";
        ctx.strokeStyle = "#F59E0B";
        ctx.fillRect(el.x, el.y, el.width, el.height);
        ctx.strokeRect(el.x, el.y, el.width, el.height);
      } else if (el.type === "stencil") {
        ctx.fillStyle = "#3B82F622";
        ctx.strokeStyle = "#3B82F6";
        ctx.strokeRect(el.x, el.y, el.width, el.height);
        ctx.fillRect(el.x, el.y, el.width, el.height);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "12px sans-serif";
        ctx.fillText(el.stencilType?.toUpperCase() || "NODE", el.x + 8, el.y + 24);
      }
    });

    // Render remote peer cursors
    activePeers.forEach((peer) => {
      if (peer.point) {
        ctx.fillStyle = peer.color || "#3B82F6";
        ctx.beginPath();
        ctx.arc(peer.point.x, peer.point.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "10px sans-serif";
        ctx.fillText(peer.name, peer.point.x + 8, peer.point.y + 4);
      }
    });
  }, [elements, activePeers]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (providerRef.current) {
      providerRef.current.awareness.setLocalStateField("user", {
        name: user?.name || "Participant",
        color: selectedColor,
        point: { x, y },
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos || readOnly || !objectsMapRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    const elId = `el_${Date.now()}_${Math.random()}`;
    const newElement: WhiteboardElement = {
      id: elId,
      type: selectedTool as any,
      x: Math.min(startPos.x, endX),
      y: Math.min(startPos.y, endY),
      width: Math.max(20, Math.abs(endX - startPos.x)),
      height: Math.max(20, Math.abs(endY - startPos.y)),
      color: selectedColor,
    };

    // Store in collaborative Y.Map directly
    objectsMapRef.current.set(elId, newElement);

    setIsDrawing(false);
    setStartPos(null);
  };

  const addSystemStencil = (
    stencil: "client" | "load_balancer" | "api_server" | "database" | "redis",
  ) => {
    if (readOnly || !objectsMapRef.current) return;
    const elId = `stencil_${Date.now()}`;
    const newElement: WhiteboardElement = {
      id: elId,
      type: "stencil",
      x: 100 + elements.length * 20,
      y: 100 + elements.length * 20,
      width: 140,
      height: 60,
      color: "#3B82F6",
      stencilType: stencil,
    };
    objectsMapRef.current.set(elId, newElement);
  };

  const handleClear = () => {
    if (readOnly || !objectsMapRef.current) return;
    if (!confirm("Clear all whiteboard objects for all participants?")) return;
    objectsMapRef.current.clear();
  };

  const handleSaveSnapshot = async () => {
    if (!sessionId) return;
    try {
      await apiCall(
        `/whiteboard/${sessionId}/snapshots`,
        "POST",
        { canvasWidth: 1920, canvasHeight: 1080 },
        token,
      );
      toast.success("Whiteboard snapshot saved to timeline.");
    } catch (err: any) {
      toast.error(err.message || "Failed saving whiteboard snapshot");
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] text-white shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#333333] bg-[#252526] px-4 py-2 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedTool("rectangle")}
            className={`rounded p-1.5 transition ${selectedTool === "rectangle" ? "bg-[#2A9D7B] text-white" : "text-[#AAAAAA] hover:bg-[#333333]"}`}
            title="Rectangle"
          >
            <Square className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSelectedTool("circle")}
            className={`rounded p-1.5 transition ${selectedTool === "circle" ? "bg-[#2A9D7B] text-white" : "text-[#AAAAAA] hover:bg-[#333333]"}`}
            title="Circle"
          >
            <Circle className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSelectedTool("arrow")}
            className={`rounded p-1.5 transition ${selectedTool === "arrow" ? "bg-[#2A9D7B] text-white" : "text-[#AAAAAA] hover:bg-[#333333]"}`}
            title="Arrow Connector"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSelectedTool("sticky")}
            className={`rounded p-1.5 transition ${selectedTool === "sticky" ? "bg-[#2A9D7B] text-white" : "text-[#AAAAAA] hover:bg-[#333333]"}`}
            title="Sticky Note"
          >
            <StickyNote className="h-4 w-4" />
          </button>
        </div>

        {/* System Design Stencils */}
        <div className="flex items-center gap-1.5 border-l border-[#444444] pl-3">
          <span className="font-mono text-[10px] uppercase text-[#888888]">
            Architecture Stencils:
          </span>
          <button
            onClick={() => addSystemStencil("load_balancer")}
            className="flex items-center gap-1 rounded bg-[#333333] px-2 py-1 text-[11px] text-[#E0E0E0] hover:bg-[#444444] transition"
          >
            <Globe className="h-3 w-3 text-cyan-400" />
            <span>LB</span>
          </button>
          <button
            onClick={() => addSystemStencil("api_server")}
            className="flex items-center gap-1 rounded bg-[#333333] px-2 py-1 text-[11px] text-[#E0E0E0] hover:bg-[#444444] transition"
          >
            <Server className="h-3 w-3 text-emerald-400" />
            <span>API</span>
          </button>
          <button
            onClick={() => addSystemStencil("database")}
            className="flex items-center gap-1 rounded bg-[#333333] px-2 py-1 text-[11px] text-[#E0E0E0] hover:bg-[#444444] transition"
          >
            <Database className="h-3 w-3 text-amber-400" />
            <span>DB</span>
          </button>
          <button
            onClick={() => addSystemStencil("redis")}
            className="flex items-center gap-1 rounded bg-[#333333] px-2 py-1 text-[11px] text-[#E0E0E0] hover:bg-[#444444] transition"
          >
            <Cpu className="h-3 w-3 text-rose-400" />
            <span>Redis</span>
          </button>
        </div>

        {/* Status and Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[#888888]">
            <span
              className={`h-2 w-2 rounded-full ${synced ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`}
            />
            <span className="text-[11px]">{synced ? "CRDT Synced" : "Connecting..."}</span>
          </div>

          {activePeers.length > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-[#2A9D7B]/20 px-2 py-0.5 text-[11px] text-[#2A9D7B]">
              <Users className="h-2.5 w-2.5" />
              <span>{activePeers.length} active peer(s)</span>
            </div>
          )}

          {sessionId && !readOnly && (
            <button
              onClick={handleSaveSnapshot}
              title="Save Whiteboard Snapshot"
              className="flex items-center gap-1 rounded bg-[#2A9D7B] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#238266] transition"
            >
              <Camera className="h-3 w-3" />
              <span>Snapshot</span>
            </button>
          )}

          {!readOnly && (
            <button
              onClick={handleClear}
              className="rounded p-1 text-rose-400 hover:bg-[#333333] transition"
              title="Clear Board"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative flex-1 bg-[#121212] overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="h-full w-full cursor-crosshair"
        />
      </div>
    </div>
  );
}
