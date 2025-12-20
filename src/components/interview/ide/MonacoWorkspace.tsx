import React, { useEffect, useRef, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import { Braces, FileCode, RotateCcw, Users, Wand2, X } from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { FileExplorer, FileItem } from "./FileExplorer";
import { ExecutionPanel } from "./ExecutionPanel";
import { CheckpointTimeline } from "./CheckpointTimeline";

interface MonacoWorkspaceProps {
  roomKey: string;
  sessionId: string;
  initialCode?: string;
  initialLanguage?: string;
  allowedLanguages?: string[];
  readOnly?: boolean;
  onExecutionComplete?: (result: any) => void;
}

export function MonacoWorkspace({
  roomKey,
  sessionId,
  initialCode = "# Write your solution here\n\ndef solution():\n    pass\n",
  initialLanguage = "python",
  allowedLanguages = ["python", "javascript", "typescript", "cpp", "java"],
  readOnly = false,
  onExecutionComplete,
}: MonacoWorkspaceProps) {
  const { user, token } = useAuth();
  const [language, setLanguage] = useState<string>(initialLanguage);
  const [bottomDrawerTab, setBottomDrawerTab] = useState<"OUTPUT" | "CHECKPOINTS">("OUTPUT");
  const [activeFilePath, setActiveFilePath] = useState<string>("/solution.py");
  const [openTabs, setOpenTabs] = useState<string[]>(["/solution.py"]);
  const [workspaceFiles, setWorkspaceFiles] = useState<FileItem[]>([]);
  const [executing, setExecuting] = useState<boolean>(false);
  const [synced, setSynced] = useState<boolean>(false);
  const [activePeers, setActivePeers] = useState<Array<{ name: string; color: string }>>([]);
  const [lspStatus, setLspStatus] = useState<"ready" | "connecting" | "unavailable">("connecting");
  const [editorStats, setEditorStats] = useState({ lines: 1, characters: 0 });
  const [executionOutput, setExecutionOutput] = useState<{
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs: number;
    timedOut: boolean;
  } | null>(null);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const contentListenerRef = useRef<{ dispose: () => void } | null>(null);
  const lspSocketRef = useRef<WebSocket | null>(null);
  const lspContentListenerRef = useRef<{ dispose: () => void } | null>(null);
  const lspRequestIdRef = useRef(0);

  // Load workspace file tree
  const loadWorkspace = async () => {
    try {
      const data = await apiCall<{ workspace: FileItem[] }>(
        `/coding/${sessionId}/workspace`,
        "GET",
        null,
        token,
      );
      if (data && data.workspace) {
        setWorkspaceFiles(data.workspace);
      }
    } catch {
      // Fallback default
      setWorkspaceFiles([
        { type: "file", name: "solution.py", path: "/solution.py", language: "python" },
      ]);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [sessionId, token]);

  useEffect(() => {
    // 1. Initialize Y.Doc
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    const wsUrl = `${protocol}//${host}:5000/collab`;

    // 2. Setup Yjs WebsocketProvider connected to our custom endpoint
    const provider = new WebsocketProvider(wsUrl, roomKey, ydoc, {
      params: { token: token || "" },
      disableBc: true,
    });
    providerRef.current = provider;

    provider.on("status", (event: { status: string }) => {
      setSynced(event.status === "connected");
    });

    // 3. User awareness & presence setup
    const userColors = ["#2A9D7B", "#E76F51", "#F4A261", "#457B9D", "#A8DADC", "#9D4EDD"];
    const randomColor = userColors[Math.floor(Math.random() * userColors.length)];

    provider.awareness.setLocalStateField("user", {
      name: user?.name || "Participant",
      color: randomColor,
    });

    provider.awareness.on("change", () => {
      const states = Array.from(provider.awareness.getStates().values()) as Array<{
        user?: { name: string; color: string };
      }>;
      const peers = states.filter((s) => s.user && s.user.name !== user?.name).map((s) => s.user!);
      setActivePeers(peers);
    });

    // Listen to filesystem CRDT changes to sync file tree automatically
    const filesystem = ydoc.getMap("filesystem");
    filesystem.observe(() => {
      loadWorkspace();
    });

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      contentListenerRef.current?.dispose();
      lspContentListenerRef.current?.dispose();
      lspSocketRef.current?.close();
      provider.destroy();
      ydoc.destroy();
    };
  }, [roomKey, token, user?.name]);

  // Bind active file to Monaco model whenever activeFilePath changes
  const stopLanguageService = () => {
    lspContentListenerRef.current?.dispose();
    lspContentListenerRef.current = null;
    lspSocketRef.current?.close();
    lspSocketRef.current = null;
  };

  const connectLanguageService = (filePath: string, fileLanguage: string) => {
    stopLanguageService();
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model || !token || !["python", "javascript", "typescript", "cpp"].includes(fileLanguage)) {
      setLspStatus("unavailable");
      return;
    }

    setLspStatus("connecting");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const uri = `file:///tmp/jobly-lsp/${encodeURIComponent(roomKey)}${filePath}`;
    const socket = new WebSocket(
      `${protocol}//${window.location.hostname}:5000/lsp/${encodeURIComponent(roomKey)}/${fileLanguage}?token=${encodeURIComponent(token)}`,
    );
    lspSocketRef.current = socket;
    const send = (message: Record<string, unknown>) => {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
    };

    socket.onopen = () => {
      const initializeId = ++lspRequestIdRef.current;
      send({
        jsonrpc: "2.0",
        id: initializeId,
        method: "initialize",
        params: {
          processId: null,
          rootUri: `file:///tmp/jobly-lsp/${encodeURIComponent(roomKey)}`,
          capabilities: { textDocument: { publishDiagnostics: { relatedInformation: true } } },
        },
      });
      send({ jsonrpc: "2.0", method: "initialized", params: {} });
      send({
        jsonrpc: "2.0",
        method: "textDocument/didOpen",
        params: { textDocument: { uri, languageId: fileLanguage, version: 1, text: model.getValue() } },
      });
      setLspStatus("ready");
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as {
          method?: string;
          params?: { uri?: string; diagnostics?: Array<{ message: string; severity?: number; range?: { start: { line: number; character: number }; end: { line: number; character: number } } }> };
        };
        if (message.method !== "textDocument/publishDiagnostics" || message.params?.uri !== uri) return;
        const monaco = monacoRef.current;
        if (!monaco) return;
        monaco.editor.setModelMarkers(
          model,
          "jobly-lsp",
          (message.params.diagnostics || []).map((diagnostic) => ({
            message: diagnostic.message,
            severity: diagnostic.severity === 1 ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
            startLineNumber: (diagnostic.range?.start.line || 0) + 1,
            startColumn: (diagnostic.range?.start.character || 0) + 1,
            endLineNumber: (diagnostic.range?.end.line || diagnostic.range?.start.line || 0) + 1,
            endColumn: (diagnostic.range?.end.character || diagnostic.range?.start.character || 0) + 2,
          })),
        );
      } catch {
        // Ignore malformed language-server messages without interrupting editing.
      }
    };
    socket.onerror = () => {
      if (lspSocketRef.current === socket) setLspStatus("unavailable");
    };
    socket.onclose = () => {
      if (lspSocketRef.current === socket) setLspStatus((status) => (status === "ready" ? "unavailable" : status));
    };

    let documentVersion = 1;
    lspContentListenerRef.current = editor.onDidChangeModelContent(() => {
      documentVersion += 1;
      send({
        jsonrpc: "2.0",
        method: "textDocument/didChange",
        params: { textDocument: { uri, version: documentVersion }, contentChanges: [{ text: model.getValue() }] },
      });
    });
  };

  const bindActiveFile = (filePath: string) => {
    if (!editorRef.current || !ydocRef.current || !providerRef.current) return;

    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    const ytext = ydocRef.current.getText(filePath);
    if (ytext.length === 0 && filePath === "/solution.py" && initialCode) {
      ytext.insert(0, initialCode);
    }

    bindingRef.current = new MonacoBinding(
      ytext,
      editorRef.current.getModel()!,
      new Set([editorRef.current]),
      providerRef.current.awareness,
    );

    const updateStats = () => {
      const model = editorRef.current?.getModel();
      if (model)
        setEditorStats({ lines: model.getLineCount(), characters: model.getValueLength() });
    };
    contentListenerRef.current?.dispose();
    contentListenerRef.current = editorRef.current.onDidChangeModelContent(updateStats);
    updateStats();

    // Auto-detect language
    const ext = filePath.split(".").pop();
    if (ext === "py") setLanguage("python");
    else if (ext === "js") setLanguage("javascript");
    else if (ext === "ts" || ext === "tsx") setLanguage("typescript");
    else if (ext === "cpp" || ext === "cc") setLanguage("cpp");
    else if (ext === "java") setLanguage("java");
    const fileLanguage = ext === "py" ? "python" : ext === "js" ? "javascript" : ext === "ts" || ext === "tsx" ? "typescript" : ext === "cpp" || ext === "cc" ? "cpp" : ext === "java" ? "java" : language;
    connectLanguageService(filePath, fileLanguage);
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    bindActiveFile(activeFilePath);
  };

  const handleSelectFile = (path: string) => {
    setActiveFilePath(path);
    if (!openTabs.includes(path)) {
      setOpenTabs((prev) => [...prev, path]);
    }
    bindActiveFile(path);
  };

  const handleCloseTab = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    if (openTabs.length === 1) return; // Keep at least one tab open
    const filtered = openTabs.filter((t) => t !== path);
    setOpenTabs(filtered);
    if (activeFilePath === path) {
      const nextActive = filtered[filtered.length - 1];
      setActiveFilePath(nextActive);
      bindActiveFile(nextActive);
    }
  };

  const handleRunCode = async () => {
    if (!editorRef.current) return;
    const currentCode = editorRef.current.getValue();

    setExecuting(true);
    setExecutionOutput(null);
    try {
      const res = await apiCall<{ execution: any }>(
        `/interviews/${sessionId}/execute`,
        "POST",
        {
          language,
          code: currentCode,
        },
        token,
      );

      setExecutionOutput(res.execution);
      if (onExecutionComplete) onExecutionComplete(res.execution);
      toast.success("Code executed in sandbox.");
    } catch (err: any) {
      toast.error(err.message || "Failed running code in sandbox.");
      setExecutionOutput({
        stdout: "",
        stderr: err.message || "Execution failed",
        exitCode: 1,
        durationMs: 0,
        timedOut: false,
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleReset = () => {
    if (ydocRef.current && initialCode) {
      const ytext = ydocRef.current.getText(activeFilePath);
      ydocRef.current.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, initialCode);
      });
    }
  };

  const handleRenameOpenFile = (oldPath: string, newPath: string) => {
    setOpenTabs((tabs) => tabs.map((path) => (path === oldPath ? newPath : path)));
    if (activeFilePath === oldPath) {
      setActiveFilePath(newPath);
      requestAnimationFrame(() => bindActiveFile(newPath));
    }
  };

  const handleFormatDocument = () => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
  };

  return (
    <div className="flex h-full overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] text-white shadow-2xl">
      {/* Left 200px: Collaborative File Explorer */}
      <div className="w-52 h-full flex-shrink-0">
        <FileExplorer
          sessionId={sessionId}
          token={token ?? undefined}
          files={workspaceFiles}
          activeFile={activeFilePath}
          onFileSelect={handleSelectFile}
          onRefresh={loadWorkspace}
          onFileRenamed={handleRenameOpenFile}
          readOnly={readOnly}
        />
      </div>

      {/* Center & Right: Editor Tabs, Monaco Canvas & Execution Panel */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Tab bar & Controls */}
        <div className="flex items-center justify-between border-b border-[#333333] bg-[#252526] px-3 py-1.5">
          {/* Open Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-[60%] scrollbar-none">
            {openTabs.map((tabPath) => {
              const isActive = activeFilePath === tabPath;
              const fileName = tabPath.split("/").pop() || tabPath;
              return (
                <div
                  key={tabPath}
                  onClick={() => handleSelectFile(tabPath)}
                  className={`flex items-center gap-1.5 rounded-t-md px-2.5 py-1 text-xs font-mono cursor-pointer border-t-2 transition ${
                    isActive
                      ? "bg-[#1E1E1E] text-white border-[#2A9D7B] font-semibold"
                      : "bg-[#2D2D2D] text-[#888888] border-transparent hover:text-white"
                  }`}
                >
                  <FileCode
                    className={`h-3 w-3 ${isActive ? "text-[#2A9D7B]" : "text-[#777777]"}`}
                  />
                  <span className="truncate max-w-[100px]">{fileName}</span>
                  {openTabs.length > 1 && (
                    <button
                      onClick={(e) => handleCloseTab(e, tabPath)}
                      className="rounded p-0.5 hover:bg-[#444444] text-[#888888] hover:text-white ml-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Toolbar Status & Language Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFormatDocument}
              disabled={readOnly || executing}
              title="Format document"
              className="flex items-center gap-1 rounded border border-[#444] px-2 py-1 text-[11px] text-[#cfcfcf] transition hover:border-[#2A9D7B] hover:bg-[#2A9D7B]/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7ee0c5]"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Format
            </button>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={readOnly || executing}
              aria-label="Active file language"
              className="rounded border border-[#444444] bg-[#1E1E1E] px-2 py-0.5 text-xs text-white outline-none hover:border-[#2A9D7B] focus:ring-2 focus:ring-[#2A9D7B]/35"
            >
              {allowedLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 text-xs text-[#888888]">
              <span
                className={`h-2 w-2 rounded-full ${synced ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`}
              />
              <span className="text-[11px]">{synced ? "Synced" : "Connecting..."}</span>
            </div>

            <span className={`text-[10px] ${lspStatus === "ready" ? "text-emerald-300" : lspStatus === "connecting" ? "text-amber-300" : "text-[#888]"}`} title="Language intelligence status">
              LSP {lspStatus === "ready" ? "ready" : lspStatus === "connecting" ? "connecting" : "unavailable"}
            </span>

            {activePeers.length > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-[#2A9D7B]/20 px-2 py-0.5 text-[11px] text-[#2A9D7B]">
                <Users className="h-2.5 w-2.5" />
                <span>{activePeers.length} peer(s)</span>
              </div>
            )}

            <button
              onClick={handleReset}
              disabled={readOnly || executing}
              title="Reset solution template"
              aria-label="Reset active file to the solution template"
              className="rounded p-1 text-[#888888] hover:bg-[#333333] hover:text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7ee0c5]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Monaco Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            onMount={handleEditorMount}
            options={{
              readOnly,
              fontSize: 14,
              fontFamily: "JetBrains Mono, Fira Code, Menlo, monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              cursorBlinking: "smooth",
              smoothScrolling: true,
              padding: { top: 8, bottom: 8 },
            }}
          />
        </div>

        <div
          className="flex h-6 items-center justify-between border-t border-[#2A2A2A] bg-[#181818] px-3 font-mono text-[10px] text-[#888]"
          aria-live="polite"
        >
          <span className="flex items-center gap-1.5">
            <Braces className="h-3 w-3 text-[#2A9D7B]" />
            {activeFilePath} · {language.toUpperCase()}
          </span>
          <span>
            {editorStats.lines} lines · {editorStats.characters} characters
          </span>
        </div>

        {/* Bottom 180px: Output & Checkpoints Tabbed Drawer */}
        <div className="h-48 flex-shrink-0 flex flex-col border-t border-[#2A2A2A] bg-[#141414]">
          {/* Drawer tab selector bar */}
          <div className="flex h-7 items-center gap-1 bg-[#1E1E1E] px-2 border-b border-[#2A2A2A] text-[11px] font-mono">
            <button
              onClick={() => setBottomDrawerTab("OUTPUT")}
              className={`rounded px-2 py-0.5 transition ${
                bottomDrawerTab === "OUTPUT"
                  ? "bg-[#2A9D7B] text-white font-semibold"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              Execution Output
            </button>
            <button
              onClick={() => setBottomDrawerTab("CHECKPOINTS")}
              className={`rounded px-2 py-0.5 transition ${
                bottomDrawerTab === "CHECKPOINTS"
                  ? "bg-[#2A9D7B] text-white font-semibold"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              Checkpoints & Time Travel
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {bottomDrawerTab === "OUTPUT" ? (
              <ExecutionPanel
                executing={executing}
                output={executionOutput}
                language={language}
                onRunCode={handleRunCode}
                readOnly={readOnly}
              />
            ) : (
              <CheckpointTimeline
                sessionId={sessionId}
                token={token ?? undefined}
                onRestoreComplete={loadWorkspace}
                readOnly={readOnly}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
