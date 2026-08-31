import React, { useEffect, useRef, useState } from "react";
import { Terminal as TerminalIcon, RotateCcw } from "lucide-react";
import { apiCall } from "@/lib/api";
import { getInterviewSocket } from "@/lib/socket";

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
    <div
      className="flex h-full flex-col overflow-hidden text-white select-text"
      style={{ background: "var(--iv-bg)", fontFamily: "var(--font-iv-code)" }}
    >
      {/* Header */}
      <div
        className="flex h-8 items-center justify-between border-b px-3"
        style={{
          borderColor: "var(--iv-border)",
          background: "var(--iv-surface)",
          fontFamily: "var(--font-iv-ui)",
        }}
      >
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-3.5 w-3.5 text-[var(--iv-accent)]" />
          <span className="text-[12px] font-semibold tracking-wide text-white/80">
            Terminal
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{ background: "var(--iv-surface-elevated)", color: "var(--iv-accent-glow)" }}
          >
            fish 3.6
          </span>
        </div>

        <button
          onClick={() => setLines([])}
          title="Clear Terminal"
          className="rounded p-1 text-white/40 transition hover:bg-white/[0.06] hover:text-white/80"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>

      {/* Terminal Output Stream */}
      <div
        ref={scrollContainerRef}
        className="iv-scroll flex-1 overflow-y-auto p-3 space-y-1.5"
        style={{ fontSize: "13px", lineHeight: "1.6" }}
      >
        {lines.map((line) => (
          <div key={line.id}>
            {line.type === "input" ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold" style={{ color: "#38BDF8" }}>{">"}</span>
                <span className="font-semibold" style={{ color: "var(--iv-accent-glow)" }}>~/interview</span>
                <span style={{ color: "#A78BFA", fontSize: "12px" }}>on main</span>
                <span className="font-bold" style={{ color: "var(--iv-accent)" }}>$</span>
                <span className="font-semibold text-white">{line.text}</span>
              </div>
            ) : line.type === "system" ? (
              <div style={{ color: "var(--iv-accent-glow)", opacity: 0.85 }}>{line.text}</div>
            ) : (
              <div className="whitespace-pre-wrap font-normal" style={{ color: "var(--iv-text)" }}>
                {line.text}
              </div>
            )}
          </div>
        ))}

        {/* Active Interactive Fish Prompt */}
        {!readOnly && (
          <div className="flex items-center gap-1.5 pt-1">
            <span className="font-bold select-none" style={{ color: "#38BDF8" }}>{">"}</span>
            <span className="font-semibold select-none" style={{ color: "var(--iv-accent-glow)" }}>~/interview</span>
            <span className="select-none" style={{ color: "#A78BFA", fontSize: "12px" }}>on main</span>
            <span className="font-bold select-none" style={{ color: "var(--iv-accent)" }}>$</span>
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="type command..."
              className="flex-1 bg-transparent text-white outline-none placeholder:text-white/20"
              style={{ fontFamily: "var(--font-iv-code)", fontSize: "13px" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
