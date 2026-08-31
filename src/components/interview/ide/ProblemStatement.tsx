import React, { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Code2, FlaskConical, ListChecks, Tag } from "lucide-react";

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

interface ProblemStatementProps {
  title?: string;
  description?: string;
  examples?: ProblemExample[];
  constraints?: string[];
  difficulty?: string;
  category?: string;
  onClose?: () => void;
}

export function ProblemStatement({
  title,
  description,
  examples,
  constraints,
  difficulty,
  category,
  onClose,
}: ProblemStatementProps) {
  const [expanded, setExpanded] = useState(true);
  const [showExamples, setShowExamples] = useState(true);

  if (!description && !title && !examples?.length) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-[#252526] bg-[#161B22] px-3 py-2 text-xs">
        <span className="flex items-center gap-2 text-[#8B949E]">
          <BookOpen className="h-3.5 w-3.5" /> No problem statement attached to this session.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-[#252526] bg-[#0d1117] text-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[#21262D] bg-[#161B22] px-3 py-2 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="h-4 w-4 text-[#2A9D7B] shrink-0" />
          <div className="min-w-0 flex items-center gap-2">
            <span className="truncate text-xs font-bold text-[#E6EDF3]">{title || "Coding Problem"}</span>
            {difficulty && (
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                difficulty === "Easy" ? "bg-emerald-500/20 text-emerald-300" :
                difficulty === "Medium" ? "bg-amber-500/20 text-amber-300" :
                "bg-rose-500/20 text-rose-300"
              }`}>{difficulty}</span>
            )}
            {category && <span className="rounded bg-[#21262D] px-1.5 py-0.5 text-[9px] text-[#8B949E] shrink-0">{category}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="rounded p-1 text-[#8B949E] hover:bg-[#21262D] hover:text-white transition"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {onClose && (
            <button onClick={onClose} className="rounded p-1 text-[#8B949E] hover:bg-[#21262D] hover:text-white transition" title="Close">
              ×
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs leading-relaxed">
          {description && (
            <div className="whitespace-pre-wrap text-[#C9D1D9]">{description}</div>
          )}

          {/* Examples */}
          {examples && examples.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowExamples(s => !s)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-[#7EE0C5] hover:text-white transition"
              >
                <Tag className="h-3 w-3" /> Examples ({examples.length})
                {showExamples ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {showExamples && examples.map((ex, i) => (
                <div key={i} className="rounded-md border border-[#21262D] bg-[#161B22] p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8B949E]">
                    <Code2 className="h-3 w-3 text-[#2A9D7B]" /> Example {i + 1}
                  </div>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-[#6B7280] mb-0.5 flex items-center gap-1">
                        <FlaskConical className="h-2.5 w-2.5" /> Input
                      </div>
                      <pre className="whitespace-pre-wrap break-all rounded bg-[#0d1117] border border-[#21262D] p-2 font-mono text-[11px] text-[#E6EDF3]">{ex.input}</pre>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-[#6B7280] mb-0.5 flex items-center gap-1">
                        <ListChecks className="h-2.5 w-2.5" /> Output
                      </div>
                      <pre className="whitespace-pre-wrap break-all rounded bg-[#0d1117] border border-[#21262D] p-2 font-mono text-[11px] text-[#7EE0C5]">{ex.output}</pre>
                    </div>
                  </div>
                  {ex.explanation && (
                    <div className="text-[11px] text-[#8B949E]">
                      <span className="font-semibold text-[#6B7280]">Explanation: </span>{ex.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Constraints */}
          {constraints && constraints.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-[#7EE0C5]">Constraints</div>
              <ul className="space-y-1">
                {constraints.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-[#C9D1D9]">
                    <span className="text-[#2A9D7B] mt-1">•</span>
                    <span className="font-mono">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}