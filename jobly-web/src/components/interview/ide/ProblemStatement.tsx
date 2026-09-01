import React, { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Code2,
  FlaskConical,
  ListChecks,
  Tag,
  X,
} from "lucide-react";

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

const SW = 1.75;

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
      <div className="iv-card flex items-center justify-between gap-2 bg-iv-surface px-3 py-2 text-xs">
        <span className="flex items-center gap-2 text-iv-muted">
          <BookOpen strokeWidth={SW} className="h-4 w-4" /> No problem statement attached to this
          session.
        </span>
      </div>
    );
  }

  return (
    <div className="iv-card flex flex-col overflow-hidden bg-iv-surface text-iv-text">
      {/* Header */}
      <div className="flex select-none items-center justify-between gap-2 border-b border-iv-line bg-iv-surface-alt px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <BookOpen strokeWidth={SW} className="h-4 w-4 shrink-0 text-iv-accent" />
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-xs font-bold">{title || "Coding Problem"}</span>
            {difficulty && (
              <span
                className={`iv-badge shrink-0 ${
                  difficulty === "Easy"
                    ? "iv-badge-success"
                    : difficulty === "Medium"
                    ? "iv-badge-warning"
                    : "iv-badge-danger"
                }`}
              >
                {difficulty}
              </span>
            )}
            {category && <span className="iv-badge iv-badge-neutral shrink-0">{category}</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="iv-icon-btn iv-icon-btn-sm"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronUp strokeWidth={SW} className="h-4 w-4" />
            ) : (
              <ChevronDown strokeWidth={SW} className="h-4 w-4" />
            )}
          </button>
          {onClose && (
            <button onClick={onClose} className="iv-icon-btn iv-icon-btn-sm" title="Close">
              <X strokeWidth={SW} className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="iv-scroll flex-1 space-y-3 overflow-y-auto p-3 text-xs leading-relaxed">
          {description && <div className="whitespace-pre-wrap text-iv-muted">{description}</div>}

          {/* Examples */}
          {examples && examples.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowExamples((s) => !s)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-iv-accent-glow transition hover:text-iv-text"
              >
                <Tag strokeWidth={SW} className="h-3 w-3" /> Examples ({examples.length})
                {showExamples ? (
                  <ChevronUp strokeWidth={SW} className="h-3 w-3" />
                ) : (
                  <ChevronDown strokeWidth={SW} className="h-3 w-3" />
                )}
              </button>
              {showExamples &&
                examples.map((ex, i) => (
                  <div key={i} className="space-y-1.5 rounded-lg border border-iv-line bg-iv-surface-alt p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-iv-muted">
                      <Code2 strokeWidth={SW} className="h-3 w-3 text-iv-accent" /> Example {i + 1}
                    </div>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      <div>
                        <div className="mb-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-iv-dim">
                          <FlaskConical strokeWidth={SW} className="h-3 w-3" /> Input
                        </div>
                        <pre className="whitespace-pre-wrap break-all rounded-md border border-iv-line bg-iv-bg p-2 font-iv-code text-[11px] text-iv-text">
                          {ex.input}
                        </pre>
                      </div>
                      <div>
                        <div className="mb-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-iv-dim">
                          <ListChecks strokeWidth={SW} className="h-3 w-3" /> Output
                        </div>
                        <pre className="whitespace-pre-wrap break-all rounded-md border border-iv-line bg-iv-bg p-2 font-iv-code text-[11px] text-iv-accent-glow">
                          {ex.output}
                        </pre>
                      </div>
                    </div>
                    {ex.explanation && (
                      <div className="text-[11px] text-iv-muted">
                        <span className="font-semibold text-iv-dim">Explanation: </span>
                        {ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* Constraints */}
          {constraints && constraints.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-iv-accent-glow">Constraints</div>
              <ul className="space-y-1">
                {constraints.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-iv-muted">
                    <span className="mt-1 text-iv-accent">•</span>
                    <span className="font-iv-code">{c}</span>
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
