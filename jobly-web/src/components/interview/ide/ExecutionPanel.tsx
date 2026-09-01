import React, { useState } from "react";
import {
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Terminal as TerminalIcon,
  FileInput,
  FileOutput,
  Copy,
  RotateCcw,
  Check,
} from "lucide-react";
import { toast } from "sonner";

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
  customInput: string;
  setCustomInput: (val: string) => void;
  onRunCode: () => void;
  readOnly?: boolean;
}

const SW = 1.75;

export function ExecutionPanel({
  executing,
  output,
  language,
  customInput,
  setCustomInput,
  onRunCode,
  readOnly = false,
}: ExecutionPanelProps) {
  const [activeTab, setActiveTab] = useState<"SPLIT" | "INPUT" | "OUTPUT">("SPLIT");
  const [copied, setCopied] = useState(false);

  const handleCopyOutput = () => {
    const text = output?.stdout || output?.stderr || "";
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Output copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden border-t border-iv-line bg-iv-surface text-iv-text">
      {/* Header bar */}
      <div className="iv-header-panel h-9 shrink-0 justify-between px-3">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-iv-muted">
            Compiler Console
          </span>

          {/* View Toggles (Input / Output / Split) */}
          <div className="iv-seg">
            <button
              onClick={() => setActiveTab("SPLIT")}
              className={`iv-seg-btn h-6 text-[10px] ${activeTab === "SPLIT" ? "active" : ""}`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setActiveTab("INPUT")}
              className={`iv-seg-btn h-6 text-[10px] ${activeTab === "INPUT" ? "active" : ""}`}
            >
              Custom Input {customInput.trim() ? "●" : ""}
            </button>
            <button
              onClick={() => setActiveTab("OUTPUT")}
              className={`iv-seg-btn h-6 gap-1 text-[10px] ${activeTab === "OUTPUT" ? "active" : ""}`}
            >
              <FileOutput strokeWidth={SW} className="h-3 w-3" />
              Output
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {output && (
            <div className="iv-badge iv-badge-neutral mr-1 font-num">
              <Clock strokeWidth={SW} className="h-3 w-3" />
              {output.durationMs}ms
            </div>
          )}

          <button
            onClick={onRunCode}
            disabled={executing || readOnly}
            className="iv-btn iv-btn-primary iv-btn-sm"
          >
            {executing ? (
              <>
                <Loader2 strokeWidth={SW} className="h-3 w-3 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play strokeWidth={SW} className="h-3 w-3 fill-current" />
                Run Code
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Console Viewport */}
      <div className="flex-1 overflow-hidden p-2.5">
        {activeTab === "SPLIT" ? (
          <div className="grid h-full grid-cols-1 gap-2.5 md:grid-cols-2">
            {/* Left Box: Custom Input (stdin) */}
            <div className="iv-card flex h-full flex-col bg-iv-bg">
              <div className="flex items-center justify-between border-b border-iv-line bg-iv-surface-alt px-2.5 py-1.5 text-[10px] font-semibold text-iv-muted">
                <div className="flex items-center gap-1.5">
                  <FileInput strokeWidth={SW} className="h-3 w-3 text-iv-accent" />
                  <span>Custom Input (stdin)</span>
                </div>
                {customInput.trim() && (
                  <button
                    onClick={() => setCustomInput("")}
                    className="flex items-center gap-0.5 text-[9px] text-iv-dim transition hover:text-iv-text"
                  >
                    <RotateCcw strokeWidth={SW} className="h-3 w-3" /> Clear
                  </button>
                )}
              </div>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Type or paste custom test input here (e.g. numbers, arrays, strings)...&#10;cin >> a >> b; or input() reads this sequentially."
                className="flex-1 w-full resize-none bg-transparent p-2.5 font-iv-code text-[11px] text-iv-text outline-none placeholder:text-iv-dim"
                spellCheck={false}
              />
            </div>

            {/* Right Box: Standard Output (stdout) */}
            <div className="iv-card flex h-full flex-col bg-iv-bg">
              <div className="flex items-center justify-between border-b border-iv-line bg-iv-surface-alt px-2.5 py-1.5 text-[10px] font-semibold text-iv-muted">
                <div className="flex items-center gap-1.5">
                  <FileOutput strokeWidth={SW} className="h-3 w-3 text-iv-accent" />
                  <span>Output (stdout)</span>
                </div>
                <div className="flex items-center gap-2">
                  {output && (
                    <span
                      className={`text-[10px] font-bold ${
                        output.exitCode === 0 ? "text-iv-success" : "text-iv-danger"
                      }`}
                    >
                      {output.exitCode === 0 ? "Pass (0)" : `Exit ${output.exitCode}`}
                    </span>
                  )}
                  {output && (output.stdout || output.stderr) && (
                    <button
                      onClick={handleCopyOutput}
                      className="flex items-center gap-1 text-[9px] text-iv-muted transition hover:text-iv-text"
                      title="Copy output"
                    >
                      {copied ? (
                        <Check strokeWidth={SW} className="h-3 w-3 text-iv-success" />
                      ) : (
                        <Copy strokeWidth={SW} className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="iv-scroll flex-1 overflow-y-auto p-2.5">
                {output ? (
                  <pre className="select-text whitespace-pre-wrap font-iv-code text-[11px] leading-relaxed text-iv-text">
                    {[output.stdout, output.stderr].filter(Boolean).join("\n") ||
                      "[Process completed with no output]"}
                  </pre>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-3 text-center">
                    <p className="text-[11px] text-iv-dim">No execution output yet.</p>
                    <p className="mt-0.5 text-[10px] text-iv-dim">
                      Click &ldquo;Run Code&rdquo; to compile and execute in the sandbox.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === "INPUT" ? (
          /* Full Input View */
          <div className="iv-card flex h-full flex-col bg-iv-bg">
            <div className="flex items-center justify-between border-b border-iv-line bg-iv-surface-alt px-2.5 py-1.5 text-[10px] font-semibold text-iv-muted">
              <div className="flex items-center gap-1.5">
                <FileInput strokeWidth={SW} className="h-3 w-3 text-iv-accent" />
                <span>Custom Input (stdin)</span>
              </div>
              {customInput.trim() && (
                <button
                  onClick={() => setCustomInput("")}
                  className="flex items-center gap-0.5 text-[9px] text-iv-dim transition hover:text-iv-text"
                >
                  <RotateCcw strokeWidth={SW} className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Type or paste custom test input here...&#10;For example:&#10;5&#10;10 20 30 40 50"
              className="flex-1 w-full resize-none bg-transparent p-3 font-iv-code text-xs text-iv-text outline-none placeholder:text-iv-dim"
              spellCheck={false}
            />
          </div>
        ) : (
          /* Full Output View */
          <div className="iv-card flex h-full flex-col bg-iv-bg">
            <div className="flex items-center justify-between border-b border-iv-line bg-iv-surface-alt px-2.5 py-1.5 text-[10px] font-semibold text-iv-muted">
              <div className="flex items-center gap-2">
                {output ? (
                  output.exitCode === 0 ? (
                    <span className="flex items-center gap-1 font-semibold text-iv-success">
                      <CheckCircle2 strokeWidth={SW} className="h-4 w-4" /> Execution Passed (Exit 0)
                    </span>
                  ) : output.timedOut ? (
                    <span className="flex items-center gap-1 font-semibold text-iv-warning-text">
                      <AlertTriangle strokeWidth={SW} className="h-4 w-4" /> Timed Out
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-semibold text-iv-danger">
                      <XCircle strokeWidth={SW} className="h-4 w-4" /> {executionFailureLabel(output)}
                    </span>
                  )
                ) : (
                  <span>Output Console</span>
                )}
              </div>

              {output && (output.stdout || output.stderr) && (
                <button
                  onClick={handleCopyOutput}
                  className="flex items-center gap-1 text-[10px] text-iv-muted transition hover:text-iv-text"
                >
                  {copied ? (
                    <Check strokeWidth={SW} className="h-3 w-3 text-iv-success" />
                  ) : (
                    <Copy strokeWidth={SW} className="h-3 w-3" />
                  )}
                  <span>{copied ? "Copied" : "Copy Output"}</span>
                </button>
              )}
            </div>

            <div className="iv-scroll flex-1 overflow-y-auto p-3">
              {output ? (
                <pre className="whitespace-pre-wrap font-iv-code text-xs leading-relaxed text-iv-text">
                  {output.stdout || output.stderr || "[Process completed with no output]"}
                </pre>
              ) : (
                <div className="flex h-full items-center justify-center text-iv-dim">
                  <span>Click &ldquo;Run Code&rdquo; to execute the active solution in the isolated sandbox.</span>
                </div>
              )}
            </div>
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
