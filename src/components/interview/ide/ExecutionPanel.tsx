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
  Check
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
    <div className="flex h-full flex-col border-t border-[#2A2A2A] bg-[#141414] text-white font-mono text-xs overflow-hidden">
      {/* Header bar */}
      <div className="flex h-9 items-center justify-between border-b border-[#2A2A2A] px-3 bg-[#1A1A1A] flex-shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="text-[#888888]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Compiler Console</span>
          </div>

          {/* View Toggles (CodeChef Style: Input / Output / Split) */}
          <div className="flex items-center rounded-lg bg-[#0E0E0E] p-0.5 border border-[#262626] text-[10px]">
            <button
              onClick={() => setActiveTab("SPLIT")}
              className={`px-2 py-0.5 rounded transition ${
                activeTab === "SPLIT" ? "bg-[#252525] text-[#7EE0C5] font-bold" : "text-[#777777] hover:text-white"
              }`}
            >
              <span>Side-by-Side</span>
            </button>
            <button
              onClick={() => setActiveTab("INPUT")}
              className={`px-2 py-0.5 rounded transition ${
                activeTab === "INPUT" ? "bg-[#252525] text-[#7EE0C5] font-bold" : "text-[#777777] hover:text-white"
              }`}
            >
              <span>Custom Input {customInput.trim() ? "●" : ""}</span>
            </button>
            <button
              onClick={() => setActiveTab("OUTPUT")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition ${
                activeTab === "OUTPUT" ? "bg-[#252525] text-[#7EE0C5] font-bold" : "text-[#777777] hover:text-white"
              }`}
            >
              <FileOutput className="h-2.5 w-2.5" />
              <span>Output</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {output && (
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-[#888888] mr-1">
              <Clock className="h-3 w-3" />
              <span>{output.durationMs}ms</span>
            </div>
          )}

          <button
            onClick={onRunCode}
            disabled={executing || readOnly}
            className="flex items-center gap-1.5 rounded bg-[#2A9D7B] px-3 py-1 font-sans text-xs font-semibold text-white transition hover:bg-[#238266] disabled:opacity-50 cursor-pointer shadow-xs"
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
      </div>

      {/* Main Console Viewport */}
      <div className="flex-1 overflow-hidden p-2.5">
        {activeTab === "SPLIT" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 h-full">
            {/* Left Box: Custom Input (stdin) */}
            <div className="flex flex-col rounded-lg border border-[#252525] bg-[#0E0E0E] overflow-hidden h-full">
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#222222] bg-[#161616] text-[10px] font-semibold text-[#888888]">
                <div className="flex items-center gap-1.5">
                  <FileInput className="h-3 w-3 text-[#2A9D7B]" />
                  <span>Custom Input (stdin)</span>
                </div>
                {customInput.trim() && (
                  <button
                    onClick={() => setCustomInput("")}
                    className="text-[#666666] hover:text-white transition text-[9px] flex items-center gap-0.5"
                  >
                    <RotateCcw className="h-2.5 w-2.5" /> Clear
                  </button>
                )}
              </div>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Type or paste custom test input here (e.g. numbers, arrays, strings)...&#10;cin >> a >> b; or input() reads this sequentially."
                className="flex-1 w-full bg-transparent p-2.5 text-[#E0E0E0] placeholder:text-[#444444] text-[11px] font-mono outline-none resize-none focus:bg-[#121212] transition-colors"
                spellCheck={false}
              />
            </div>

            {/* Right Box: Standard Output (stdout) */}
            <div className="flex flex-col rounded-lg border border-[#252525] bg-[#0E0E0E] overflow-hidden h-full">
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#222222] bg-[#161616] text-[10px] font-semibold text-[#888888]">
                <div className="flex items-center gap-1.5">
                  <FileOutput className="h-3 w-3 text-[#2A9D7B]" />
                  <span>Output (stdout)</span>
                </div>
                <div className="flex items-center gap-2">
                  {output && (
                    <span className={`text-[10px] font-bold ${
                      output.exitCode === 0 ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      {output.exitCode === 0 ? "Pass (0)" : `Exit ${output.exitCode}`}
                    </span>
                  )}
                  {output && (output.stdout || output.stderr) && (
                    <button
                      onClick={handleCopyOutput}
                      className="text-[#888888] hover:text-white transition flex items-center gap-1 text-[9px]"
                      title="Copy output"
                    >
                      {copied ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5">
                {output ? (
                  <pre className="whitespace-pre-wrap text-[#E0E0E0] text-[11px] leading-relaxed select-text font-mono">
                    {[output.stdout, output.stderr].filter(Boolean).join("\n") || "[Process completed with no output]"}
                  </pre>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-[#555555] text-center p-3">
                    <p className="text-[11px]">No execution output yet.</p>
                    <p className="text-[9px] text-[#444444] mt-0.5">Click &ldquo;Run Code&rdquo; to compile and execute in the sandbox.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === "INPUT" ? (
          /* Full Input View */
          <div className="flex flex-col rounded-lg border border-[#252525] bg-[#0E0E0E] overflow-hidden h-full">
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#222222] bg-[#161616] text-[10px] font-semibold text-[#888888]">
              <div className="flex items-center gap-1.5">
                <FileInput className="h-3 w-3 text-[#2A9D7B]" />
                <span>Custom Input (stdin)</span>
              </div>
              {customInput.trim() && (
                <button
                  onClick={() => setCustomInput("")}
                  className="text-[#666666] hover:text-white transition text-[9px] flex items-center gap-0.5"
                >
                  <RotateCcw className="h-2.5 w-2.5" /> Clear
                </button>
              )}
            </div>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Type or paste custom test input here...&#10;For example:&#10;5&#10;10 20 30 40 50"
              className="flex-1 w-full bg-transparent p-3 text-[#E0E0E0] placeholder:text-[#444444] text-xs font-mono outline-none resize-none"
              spellCheck={false}
            />
          </div>
        ) : (
          /* Full Output View */
          <div className="flex flex-col rounded-lg border border-[#252525] bg-[#0E0E0E] overflow-hidden h-full">
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#222222] bg-[#161616] text-[10px] font-semibold text-[#888888]">
              <div className="flex items-center gap-2">
                {output ? (
                  output.exitCode === 0 ? (
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
                  )
                ) : (
                  <span>Output Console</span>
                )}
              </div>

              {output && (output.stdout || output.stderr) && (
                <button
                  onClick={handleCopyOutput}
                  className="text-[#888888] hover:text-white transition flex items-center gap-1 text-[10px]"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? "Copied" : "Copy Output"}</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {output ? (
                <pre className="whitespace-pre-wrap text-[#E0E0E0] text-xs leading-relaxed font-mono">
                  {output.stdout || output.stderr || "[Process completed with no output]"}
                </pre>
              ) : (
                <div className="flex h-full items-center justify-center text-[#555555]">
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
