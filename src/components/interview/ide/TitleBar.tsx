import React from "react";
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Wand2,
  Users,
  Search,
  Code2,
  PanelBottom,
  PanelRight,
  Loader2,
  Video,
} from "lucide-react";

interface TitleBarProps {
  roomKey: string;
  activeFileName: string;
  language: string;
  allowedLanguages: string[];
  onLanguageChange: (lang: string) => void;
  synced: boolean;
  activePeersCount: number;
  executing: boolean;
  readOnly: boolean;
  onRunCode: () => void;
  onFormatDocument: () => void;
  onResetCode: () => void;
  onLeaveEditor?: () => void;
  isBottomPanelOpen: boolean;
  onToggleBottomPanel: () => void;
  isRightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;
  hasRightSidebarContent?: boolean;
}

export function TitleBar({
  roomKey,
  activeFileName,
  language,
  allowedLanguages,
  onLanguageChange,
  synced,
  activePeersCount,
  executing,
  readOnly,
  onRunCode,
  onFormatDocument,
  onResetCode,
  onLeaveEditor,
  isBottomPanelOpen,
  onToggleBottomPanel,
  isRightSidebarOpen,
  onToggleRightSidebar,
  hasRightSidebarContent = false,
}: TitleBarProps) {
  return (
    <header className="iv-titlebar" role="banner">
      {/* Left: Back to Video + Sync Status + Peers */}
      <div className="flex items-center gap-3">
        {onLeaveEditor && (
          <button
            type="button"
            onClick={onLeaveEditor}
            className="iv-back-btn"
            title="Return to full-screen video call (Exit Code Mode)"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="font-semibold tracking-wide">Back to Video</span>
          </button>
        )}

        <div className="h-4 w-px bg-white/10 mx-0.5 hidden sm:block" />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/90">
            <Code2 className="h-4 w-4 text-[var(--iv-accent)]" />
            <span className="hidden md:inline">Jobly Code</span>
          </div>

          <div
            className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: "rgb(255 255 255 / 0.05)" }}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                synced
                  ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                  : "bg-amber-400 animate-pulse"
              }`}
            />
            <span className="text-white/60 hidden lg:inline">
              {synced ? "Synced" : "Connecting..."}
            </span>
          </div>

          {activePeersCount > 0 && (
            <div
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                background: "var(--iv-accent-surface)",
                color: "var(--iv-accent-glow)",
              }}
            >
              <Users className="h-2.5 w-2.5" />
              <span>{activePeersCount} peer{activePeersCount > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>

      {/* Center: Command Palette / File Quick-Open Pill */}
      <div className="hidden md:flex items-center justify-center flex-1 mx-4">
        <div className="iv-titlebar-center-pill">
          <Search className="h-3 w-3 text-white/40" />
          <span className="truncate max-w-[140px] text-white/60">{roomKey}</span>
          <span className="text-white/20">/</span>
          <span className="text-white font-medium truncate max-w-[160px]">
            {activeFileName}
          </span>
          <span
            className="ml-1 text-[9px] rounded px-1 py-0.2 border text-white/40"
            style={{ borderColor: "var(--iv-border)" }}
          >
            Ctrl+P
          </span>
        </div>
      </div>

      {/* Right: Actions, Language, Run, Layout Toggles */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Format */}
        <button
          type="button"
          onClick={onFormatDocument}
          disabled={readOnly || executing}
          title="Format Document (Shift+Alt+F)"
          className="iv-titlebar-btn hidden sm:inline-flex disabled:opacity-40"
        >
          <Wand2 className="h-3 w-3" />
          <span>Format</span>
        </button>

        {/* Reset Template */}
        <button
          type="button"
          onClick={onResetCode}
          disabled={readOnly || executing}
          title="Reset code template"
          className="iv-titlebar-btn p-1.5 disabled:opacity-40"
        >
          <RotateCcw className="h-3 w-3" />
        </button>

        {/* Language Selector */}
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          disabled={readOnly || executing}
          aria-label="Select coding language"
          className="h-7 rounded border px-2 text-[11px] font-semibold text-white outline-none cursor-pointer transition"
          style={{
            borderColor: "var(--iv-border)",
            background: "var(--iv-surface-elevated)",
            fontFamily: "var(--font-iv-ui)",
          }}
        >
          {allowedLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {lang.toUpperCase()}
            </option>
          ))}
        </select>

        {/* Run Code Button */}
        <button
          type="button"
          onClick={onRunCode}
          disabled={executing || readOnly}
          title="Run Code (Ctrl+Enter)"
          className="iv-btn iv-btn-primary h-7 px-3 text-[11px] gap-1.5 font-semibold disabled:opacity-50"
        >
          {executing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Play className="h-3 w-3 fill-current" />
          )}
          <span>{executing ? "Running..." : "Run"}</span>
        </button>

        <div className="h-4 w-px bg-white/10 mx-0.5" />

        {/* Toggle Bottom Panel */}
        <button
          type="button"
          onClick={onToggleBottomPanel}
          title={isBottomPanelOpen ? "Hide Panel (Ctrl+J)" : "Show Panel (Ctrl+J)"}
          className={`iv-bottom-panel-action-btn ${isBottomPanelOpen ? "text-[var(--iv-accent-glow)] bg-white/[0.08]" : ""}`}
        >
          <PanelBottom className="h-4 w-4" />
        </button>

        {/* Toggle Floating Video */}
        {hasRightSidebarContent && (
          <button
            type="button"
            onClick={onToggleRightSidebar}
            title={isRightSidebarOpen ? "Hide Live Video Window" : "Show Live Video Window"}
            className={`iv-bottom-panel-action-btn ${isRightSidebarOpen ? "text-[var(--iv-accent-glow)] bg-white/[0.08]" : ""}`}
          >
            <Video className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
}
