import React from "react";
import {
  Play,
  Terminal as TermIcon,
  Beaker,
  History,
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  Trash2,
} from "lucide-react";
import { ExecutionPanel } from "./ExecutionPanel";
import { TestCasePanel } from "./TestCasePanel";
import { CheckpointTimeline, CheckpointItem } from "./CheckpointTimeline";
import { TerminalPanel } from "../terminal/TerminalPanel";

export type BottomPanelTab = "OUTPUT" | "TERMINAL" | "TESTS" | "CHECKPOINTS" | "AI";

interface BottomPanelProps {
  activeTab: BottomPanelTab;
  onTabChange: (tab: BottomPanelTab) => void;
  onClose: () => void;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  // Execution
  executing: boolean;
  executionOutput: any;
  language: string;
  customInput: string;
  setCustomInput: (val: string) => void;
  onRunCode: () => void;
  readOnly: boolean;
  // Terminal
  sessionId: string;
  roomKey: string;
  token?: string;
  // Tests
  getCode: () => string;
  activeProblem?: {
    testCases?: Array<{ input: string; expectedOutput: string; isHidden?: boolean }>;
    examples?: Array<{ input: string; output: string }>;
  };
  // Checkpoints
  onRestoreComplete: (cp: CheckpointItem) => void;
  // AI
  showAiTab?: boolean;
  aiPanel?: React.ReactNode;
}

export function BottomPanel({
  activeTab,
  onTabChange,
  onClose,
  isMaximized,
  onToggleMaximize,
  executing,
  executionOutput,
  language,
  customInput,
  setCustomInput,
  onRunCode,
  readOnly,
  sessionId,
  roomKey,
  token,
  getCode,
  activeProblem,
  onRestoreComplete,
  showAiTab = false,
  aiPanel,
}: BottomPanelProps) {
  const tabs: { id: BottomPanelTab; label: string; icon: React.ElementType }[] = [
    { id: "OUTPUT", label: "Output", icon: Play },
    { id: "TERMINAL", label: "Terminal", icon: TermIcon },
    { id: "TESTS", label: "Test Results", icon: Beaker },
    { id: "CHECKPOINTS", label: "Checkpoints", icon: History },
    ...(showAiTab ? [{ id: "AI" as BottomPanelTab, label: "AI Copilot", icon: Sparkles }] : []),
  ];

  return (
    <div className="iv-bottom-panel" role="region" aria-label="Bottom Panel">
      {/* VS Code Bottom Panel Tab Bar */}
      <div className="iv-bottom-panel-header">
        <div className="iv-bottom-panel-tabs">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className={`iv-bottom-panel-tab ${isActive ? "active" : ""}`}
                aria-selected={isActive}
                role="tab"
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
                {id === "OUTPUT" && executionOutput && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      executionOutput.success ? "bg-emerald-400" : "bg-red-400"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Action icons right (Clear, Maximize/Restore, Close) */}
        <div className="iv-bottom-panel-actions">
          <button
            type="button"
            onClick={onToggleMaximize}
            title={isMaximized ? "Restore Panel Size" : "Maximize Panel Size"}
            className="iv-bottom-panel-action-btn"
          >
            {isMaximized ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Close Panel (Ctrl+J)"
            className="iv-bottom-panel-action-btn"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tab Body */}
      <div className="flex-1 min-h-0 overflow-hidden" style={{ background: "var(--iv-bg)" }}>
        {activeTab === "OUTPUT" && (
          <div className="h-full overflow-hidden">
            <ExecutionPanel
              executing={executing}
              output={executionOutput}
              language={language}
              customInput={customInput}
              setCustomInput={setCustomInput}
              onRunCode={onRunCode}
              readOnly={readOnly}
            />
          </div>
        )}

        {activeTab === "TERMINAL" && (
          <div className="h-full overflow-hidden">
            <TerminalPanel
              sessionId={sessionId}
              roomKey={roomKey}
              token={token}
              readOnly={readOnly}
              hideHeader={true}
            />
          </div>
        )}

        {activeTab === "TESTS" && (
          <div className="h-full overflow-hidden">
            <TestCasePanel
              sessionId={sessionId}
              language={language}
              getCode={getCode}
              problemTestCases={activeProblem?.testCases}
              problemExamples={activeProblem?.examples}
            />
          </div>
        )}

        {activeTab === "CHECKPOINTS" && (
          <div className="h-full overflow-hidden">
            <CheckpointTimeline
              sessionId={sessionId}
              token={token}
              onRestoreComplete={onRestoreComplete}
              readOnly={readOnly}
            />
          </div>
        )}

        {activeTab === "AI" && aiPanel && (
          <div className="h-full overflow-y-auto iv-scroll p-3">
            {aiPanel}
          </div>
        )}
      </div>
    </div>
  );
}
