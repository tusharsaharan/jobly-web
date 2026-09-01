import React, { useEffect, useRef, useState } from "react";
import { Terminal as TerminalIcon, RotateCcw } from "lucide-react";
import { apiCall } from "@/lib/api";
import { getInterviewSocket } from "@/lib/socket";

const SW = 1.75;

interface TerminalPanelProps {
  sessionId: string;
  roomKey: string;
  token?: string;
  readOnly?: boolean;
}

interface TerminalLine {
  id: string;
  type: "system" | "input" | "output" | "error";
  text: string;
  prompt?: string;
}

export function TerminalPanel({ sessionId, roomKey, token, readOnly = false }: TerminalPanelProps) {
  const [terminalId, setTerminalId] = useState<string | null>(null);
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: "init-1",
      type: "system",
      text: "Welcome to fish, the friendly interactive shell (Jobly OS v2.4)",
    },
    {
      id: "init-2",
      type: "system",
      text: "Type 'help' to see available tools or run scripts directly.",
    },
  ]);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const terminalIdRef = useRef<string | null>(null);

  useEffect(() => {
    terminalIdRef.current = terminalId;
  }, [terminalId]);

  useEffect(() => {
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
      } catch {
        // Fallback to client-side fish shell execution
      }
    }

    if (sessionId) {
      initTerminal();
    }

    const socket = getInterviewSocket(token);
    const handleOutput = ({ terminalId: incomingTermId, data }: { terminalId: string; data: string }) => {
      if (!terminalIdRef.current || incomingTermId === terminalIdRef.current) {
        setLines((prev) => [
          ...prev,
          { id: Math.random().toString(36).substring(7), type: "output", text: data },
        ]);
      }
    };

    const handleRemoteInput = ({ terminalId: incomingTermId, data }: { terminalId: string; data: string; senderId?: string }) => {
      if (!terminalIdRef.current || incomingTermId === terminalIdRef.current) {
        setLines((prev) => [
          ...prev,
          { 
            id: Math.random().toString(36).substring(7), 
            type: "input", 
            text: data.trim(),
            prompt: "~/interview on main"
          },
        ]);
      }
    };

    socket.on("terminal_output", handleOutput);
    socket.on("terminal_input_received", handleRemoteInput);

    return () => {
      socket.off("terminal_output", handleOutput);
      socket.off("terminal_input_received", handleRemoteInput);
    };
  }, [sessionId, token]);

  // Safe inner container scroll only - NEVER scrolls the outer browser window
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [lines]);

  const executeLocalCommand = (cmd: string): string[] | null => {
    const trimmed = cmd.trim();
    if (!trimmed) return [];
    const parts = trimmed.split(" ");
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(" ");

    switch (command) {
      case "help":
        return [
          "Jobly fish shell built-in utilities:",
          "  help           Show this list of commands",
          "  clear          Clear terminal display",
          "  pwd            Print working directory",
          "  ls             List workspace files",
          "  whoami         Display current participant identity",
          "  date           Display current UTC timestamp",
          "  echo <text>    Print arguments",
          "  python <file>  Execute Python scripts in sandbox",
          "  g++ <file>     Compile C++ solution",
          "  node <file>    Execute JavaScript / TypeScript",
          "  cat <file>     Display contents of file",
        ];
      case "pwd":
        return ["/workspace/interview"];
      case "whoami":
        return ["candidate@jobly-interview-node-01"];
      case "date":
        return [new Date().toUTCString()];
      case "echo":
        return [args];
      case "ls":
        return [
          "solution.py   solution.cpp   solution.js   solution.java   README.md",
        ];
      case "cat":
        if (args.includes("README") || args.includes("readme")) {
          return [
            "# Technical Interview Workspace",
            "Solve the problem in the Monaco editor above and run tests.",
          ];
        }
        return [`File content for ${args || "unspecified file"}`];
      case "clear":
        setLines([]);
        return null;
      default:
        return null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const input = currentInput;
      if (!input && input !== "") return;

      const newHistory = [...history, input];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length);

      const inputLine: TerminalLine = {
        id: Math.random().toString(36).substring(7),
        type: "input",
        text: input,
        prompt: "~/interview on main",
      };

      const localResult = executeLocalCommand(input);

      if (input.trim() === "clear") {
        setCurrentInput("");
        return;
      }

      if (localResult !== null) {
        const outputLines: TerminalLine[] = localResult.map((text) => ({
          id: Math.random().toString(36).substring(7),
          type: "output",
          text,
        }));
        setLines((prev) => [...prev, inputLine, ...outputLines]);
      } else {
        setLines((prev) => [...prev, inputLine]);
      }

      // Also stream to room sockets / backend PTY
      if (token) {
        const socket = getInterviewSocket(token);
        socket.emit("terminal_input", {
          roomKey,
          terminalId,
          data: `${input}\n`,
        });
      }

      setCurrentInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0 && historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setCurrentInput(history[nextIdx] || "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setCurrentInput(history[nextIdx] || "");
      } else {
        setHistoryIndex(history.length);
        setCurrentInput("");
      }
    }
  };

  return (
    <div className="flex h-full select-text flex-col overflow-hidden bg-iv-bg font-iv-code text-iv-text">
      {/* Header */}
      <div className="iv-header-panel h-8 shrink-0 justify-between px-3">
        <div className="flex items-center gap-2">
          <TerminalIcon strokeWidth={SW} className="h-4 w-4 text-iv-accent" />
          <span className="text-xs font-semibold tracking-wide text-iv-muted">Terminal</span>
          <span className="iv-badge iv-badge-accent">fish 3.6</span>
        </div>

        <button
          onClick={() => setLines([])}
          title="Clear Terminal"
          className="iv-icon-btn iv-icon-btn-sm"
        >
          <RotateCcw strokeWidth={SW} className="h-3 w-3" />
        </button>
      </div>

      {/* Terminal Output Stream */}
      <div
        ref={scrollContainerRef}
        className="iv-scroll flex-1 space-y-1.5 overflow-y-auto p-3 text-[13px] leading-[1.6]"
      >
        {lines.map((line) => (
          <div key={line.id}>
            {line.type === "input" ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-[#38BDF8]">{">"}</span>
                <span className="font-semibold text-iv-accent-glow">~/interview</span>
                <span className="text-xs text-[#A78BFA]">on main</span>
                <span className="font-bold text-iv-accent">$</span>
                <span className="font-semibold text-iv-text">{line.text}</span>
              </div>
            ) : line.type === "system" ? (
              <div className="text-iv-accent-glow opacity-85">{line.text}</div>
            ) : (
              <div className="whitespace-pre-wrap font-normal text-iv-text">{line.text}</div>
            )}
          </div>
        ))}

        {/* Active Interactive Fish Prompt */}
        {!readOnly && (
          <div className="flex items-center gap-1.5 pt-1">
            <span className="select-none font-bold text-[#38BDF8]">{">"}</span>
            <span className="select-none font-semibold text-iv-accent-glow">~/interview</span>
            <span className="select-none text-xs text-[#A78BFA]">on main</span>
            <span className="select-none font-bold text-iv-accent">$</span>
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="type command..."
              className="flex-1 bg-transparent font-iv-code text-[13px] text-iv-text outline-none placeholder:text-white/20"
            />
          </div>
        )}
      </div>
    </div>
  );
}
