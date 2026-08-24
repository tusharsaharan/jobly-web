import React, { useEffect, useRef, useState } from "react";
import { Terminal as TerminalIcon, RotateCcw, Sparkles } from "lucide-react";
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

    socket.on("terminal_output", handleOutput);

    return () => {
      socket.off("terminal_output", handleOutput);
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
        prompt: "⋊> ~/interview on main ❯",
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
    <div className="flex h-full flex-col overflow-hidden bg-[#0D1117] text-white font-mono text-xs select-text">
      {/* VS Code Style Header */}
      <div className="flex h-8 items-center justify-between border-b border-[#21262D] bg-[#161B22] px-3">
        <div className="flex items-center gap-2 text-[#8B949E]">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-[#C9D1D9]">
            Interview Terminal
          </span>
          <span className="rounded bg-[#21262D] px-1.5 py-0.5 text-[10px] text-[#7EE0C5]">
            fish 3.6
          </span>
        </div>

        <button
          onClick={() => setLines([])}
          title="Clear Terminal"
          className="rounded p-1 text-[#8B949E] hover:bg-[#21262D] hover:text-white transition"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>

      {/* Terminal Output Stream */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-3 text-[#C9D1D9] space-y-1.5 scrollbar-thin scrollbar-thumb-[#21262D]"
      >
        {lines.map((line) => (
          <div key={line.id} className="leading-relaxed">
            {line.type === "input" ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[#38BDF8] font-bold">⋊&gt;</span>
                <span className="text-[#7EE0C5] font-semibold">~/interview</span>
                <span className="text-[#A78BFA] text-[11px]">on main</span>
                <span className="text-[#2A9D7B] font-bold">❯</span>
                <span className="text-white font-semibold">{line.text}</span>
              </div>
            ) : line.type === "system" ? (
              <div className="text-[#7EE0C5] opacity-90">{line.text}</div>
            ) : (
              <div className="whitespace-pre-wrap text-[#C9D1D9] font-normal">{line.text}</div>
            )}
          </div>
        ))}

        {/* Active Interactive Fish Prompt */}
        {!readOnly && (
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[#38BDF8] font-bold select-none">⋊&gt;</span>
            <span className="text-[#7EE0C5] font-semibold select-none">~/interview</span>
            <span className="text-[#A78BFA] text-[11px] select-none">on main</span>
            <span className="text-[#2A9D7B] font-bold select-none">❯</span>
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="type command..."
              className="flex-1 bg-transparent text-white outline-none font-mono text-xs placeholder:text-[#484F58]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
