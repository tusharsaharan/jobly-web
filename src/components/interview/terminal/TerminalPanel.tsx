import React, { useEffect, useRef, useState } from "react";
import { Terminal as TerminalIcon, Maximize2, RotateCcw, AlertCircle } from "lucide-react";
import { apiCall } from "@/lib/api";
import { getInterviewSocket } from "@/lib/socket";

interface TerminalPanelProps {
  sessionId: string;
  roomKey: string;
  token?: string;
  readOnly?: boolean;
}

export function TerminalPanel({ sessionId, roomKey, token, readOnly = false }: TerminalPanelProps) {
  const [terminalId, setTerminalId] = useState<string | null>(null);
  const [outputLines, setOutputLines] = useState<string[]>([
    "Interactive Terminal Initialized (Jobly Interview OS).",
    "Type commands below and press Enter...",
  ]);
  const [currentInput, setCurrentInput] = useState<string>("");
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalIdRef = useRef<string | null>(null);

  useEffect(() => {
    terminalIdRef.current = terminalId;
  }, [terminalId]);

  useEffect(() => {
    // 1. Create a remote terminal session via REST
    async function initTerminal() {
      try {
        const res = await apiCall<{ terminalId: string }>(
          `/coding/${sessionId}/terminal`,
          "POST",
          { cols: 80, rows: 24 },
          token
        );
        if (res && res.terminalId) {
          setTerminalId(res.terminalId);
        }
      } catch (err: any) {
        setOutputLines((prev) => [...prev, `[Terminal Initialization Error]: ${err.message}`]);
      }
    }

    initTerminal();

    // 2. Listen to real-time streamed terminal output from peers/pty
    const socket = getInterviewSocket(token);
    const handleOutput = ({ terminalId: incomingTermId, data }: { terminalId: string; data: string }) => {
      if (!terminalIdRef.current || incomingTermId === terminalIdRef.current) {
        setOutputLines((prev) => [...prev, data]);
      }
    };

    socket.on("terminal_output", handleOutput);

    return () => {
      socket.off("terminal_output", handleOutput);
      // The terminal belongs to the interview room, not to this browser. Do
      // not stop it when one of the two participants switches workspace tabs.
    };
  }, [sessionId, token]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [outputLines]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!currentInput && currentInput !== "") return;

      const socket = getInterviewSocket(token);
      socket.emit("terminal_input", {
        roomKey,
        terminalId,
        data: `${currentInput}\n`,
      });

      setOutputLines((prev) => [...prev, `$ ${currentInput}`]);
      setCurrentInput("");
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#0E0E0E] text-white font-mono text-xs shadow-2xl">
      {/* Header bar */}
      <div className="flex h-9 items-center justify-between border-b border-[#2A2A2A] bg-[#161616] px-3">
        <div className="flex items-center gap-2 text-[#888888]">
          <TerminalIcon className="h-3.5 w-3.5 text-[#2A9D7B]" />
          <span className="font-semibold uppercase tracking-wider text-xs">Interview Terminal</span>
          {terminalId && (
            <span className="rounded bg-[#222222] px-1.5 py-0.5 text-[10px] text-[#AAAAAA]">
              {terminalId.slice(0, 12)}
            </span>
          )}
        </div>

        <button
          onClick={() => setOutputLines(["Terminal cleared."])}
          title="Clear Terminal Output"
          className="rounded p-1 text-[#888888] hover:bg-[#2A2A2A] hover:text-white transition"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Terminal Output stream */}
      <div className="flex-1 overflow-y-auto p-3 text-[#CCCCCC] space-y-1 select-text">
        {outputLines.map((line, idx) => (
          <div key={idx} className="whitespace-pre-wrap leading-relaxed">
            {line}
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Interactive Command Prompt */}
      {!readOnly && (
        <div className="flex items-center border-t border-[#2A2A2A] bg-[#141414] px-3 py-2">
          <span className="text-[#2A9D7B] font-bold mr-2 select-none">$</span>
          <input
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type command and press Enter..."
            autoFocus
            className="flex-1 bg-transparent text-white outline-none font-mono text-xs placeholder:text-[#555555]"
          />
        </div>
      )}
    </div>
  );
}
