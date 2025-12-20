import React from "react";
import { Play, Loader2, CheckCircle2, AlertTriangle, XCircle, Clock, Terminal as TerminalIcon } from "lucide-react";

interface ExecutionOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timedOut: boolean;
  phase?: "compile" | "run";
  failureKind?: "compilation_error" | "runtime_error" | "runtime_unavailable" | "timeout" | null;
}

interface ExecutionPanelProps {
  executing: boolean;
  output: ExecutionOutput | null;
  language: string;
  onRunCode: () => void;
  readOnly?: boolean;
}

export function ExecutionPanel({
  executing,
  output,
  language,
  onRunCode,
  readOnly = false,
}: ExecutionPanelProps) {
  return (
    <div className="flex h-full flex-col border-t border-[#2A2A2A] bg-[#141414] text-white font-mono text-xs">
      {/* Header bar */}
      <div className="flex h-9 items-center justify-between border-b border-[#2A2A2A] px-3 bg-[#1A1A1A]">
        <div className="flex items-center gap-2 text-[#888888]">
          <TerminalIcon className="h-3.5 w-3.5 text-[#2A9D7B]" />
          <span className="font-semibold uppercase tracking-wider">Output & Execution</span>
        </div>

        <button
          onClick={onRunCode}
          disabled={executing || readOnly}
          className="flex items-center gap-1.5 rounded bg-[#2A9D7B] px-3 py-1 font-sans text-xs font-semibold text-white transition hover:bg-[#238266] disabled:opacity-50"
        >
          {executing ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play className="h-3 w-3 fill-current" />
              <span>Run Code</span>
            </>
          )}
        </button>
      </div>

      {/* Output Console View */}
      <div className="flex-1 overflow-y-auto p-3">
        {output ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {output.exitCode === 0 ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Execution Passed (Exit 0)
                  </span>
                ) : output.timedOut ? (
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5" /> Timed Out
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400 font-semibold">
                    <XCircle className="h-3.5 w-3.5" /> {executionFailureLabel(output)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-[#888888]">
                <Clock className="h-3 w-3" />
                <span>{output.durationMs}ms</span>
              </div>
            </div>

            <pre className="whitespace-pre-wrap rounded bg-[#0A0A0A] p-2.5 text-[#E0E0E0] border border-[#222222]">
              {output.stdout || output.stderr || "[Process completed with no output]"}
            </pre>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-[#555555]">
            <span>Click &ldquo;Run Code&rdquo; to execute the active solution in the isolated sandbox.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function executionFailureLabel(output: ExecutionOutput) {
  if (output.failureKind === "compilation_error") return "Compilation failed";
  if (output.failureKind === "runtime_unavailable") return "Runtime unavailable";
  if (output.failureKind === "runtime_error") return "Program exited with an error";
  return `Exit code ${output.exitCode}`;
}
