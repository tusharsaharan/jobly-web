import React, { useEffect, useRef, useState, useCallback } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import {
  Braces,
  FileCode,
  RotateCcw,
  Users,
  Wand2,
  Terminal as TermIcon,
  Play,
  History,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  FolderTree,
  FilePlus,
  FolderPlus,
  PanelLeftClose,
  PanelLeftOpen,
  Beaker,
  ArrowLeft,
  VideoOff as VideoOffIcon,
  Video,
  GitBranch,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { ProblemStatement } from "./ProblemStatement";
import { FileExplorer, WorkspaceFile, getFileIcon } from "./FileExplorer";
import { ActivityBar, ActivityType } from "./ActivityBar";
import { TitleBar } from "./TitleBar";
import { BottomPanel, BottomPanelTab } from "./BottomPanel";
import { CheckpointItem } from "./CheckpointTimeline";
// ResizablePanelGroup removed — using custom CSS drag split

interface MonacoWorkspaceProps {
  roomKey: string;
  sessionId: string;
  initialCode?: string;
  initialLanguage?: string;
  allowedLanguages?: string[];
  readOnly?: boolean;
  onExecutionComplete?: (result: any) => void;
  restoreRef?: React.MutableRefObject<((cp: any) => void) | null>;
  remoteExecution?: {
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs: number;
    timedOut: boolean;
    compilerOutput?: string;
    failureKind?: "compilation_error" | "runtime_error" | "runtime_unavailable" | "timeout" | null;
  } | null;
  activeProblem?: {
    title?: string;
    description?: string;
    examples?: Array<{ input: string; output: string }>;
    testCases?: Array<{ input: string; expectedOutput: string; isHidden?: boolean }>;
  } | null;

  // New props for the redesign
  onLeaveEditor?: () => void;
  videoElement?: React.ReactNode;
  isVideoHidden?: boolean;
  onToggleVideo?: () => void;
  showAiTab?: boolean;
  aiPanel?: React.ReactNode;
}

const getLanguageExtension = (lang: string) => {
  if (lang === "python") return "py";
  if (lang === "javascript") return "js";
  if (lang === "typescript") return "ts";
  if (lang === "cpp") return "cpp";
  if (lang === "java") return "java";
  return "txt";
};

const getLanguageFromPath = (filePath: string): string => {
  const ext = filePath.split(".").pop()?.toLowerCase();
  if (ext === "cpp" || ext === "cc" || ext === "cxx" || ext === "h" || ext === "hpp") return "cpp";
  if (ext === "py") return "python";
  if (ext === "js" || ext === "jsx") return "javascript";
  if (ext === "ts" || ext === "tsx") return "typescript";
  if (ext === "java") return "java";
  if (ext === "json") return "json";
  if (ext === "md") return "markdown";
  if (ext === "html") return "html";
  if (ext === "css") return "css";
  return "plaintext";
};

const getMonacoLanguage = (lang: string) => {
  if (lang === "cpp") return "cpp";
  if (lang === "python") return "python";
  if (lang === "javascript") return "javascript";
  if (lang === "typescript") return "typescript";
  if (lang === "java") return "java";
  if (lang === "markdown") return "markdown";
  if (lang === "json") return "json";
  if (lang === "html") return "html";
  if (lang === "css") return "css";
  return "plaintext";
};

const getDefaultCode = (lang: string) => {
  if (lang === "cpp") {
    return `// Technical Interview - C++ Solution\n#include <iostream>\n#include <vector>\n#include <string>\n\nusing namespace std;\n\nint main() {\n    cout << "Hello from Jobly C++ Sandbox!" << endl;\n    return 0;\n}\n`;
  }
  if (lang === "python") {
    return `# Technical Interview - Python Solution\n\ndef solution():\n    print("Hello from Jobly Python Sandbox!")\n    return True\n\nif __name__ == "__main__":\n    solution()\n`;
  }
  if (lang === "javascript") {
    return `// Technical Interview - JavaScript Solution\n\nfunction solution() {\n    console.log("Hello from Jobly JS Sandbox!");\n    return true;\n}\n\nsolution();\n`;
  }
  if (lang === "typescript") {
    return `// Technical Interview - TypeScript Solution\n\nfunction solution(): boolean {\n    console.log("Hello from Jobly TS Sandbox!");\n    return true;\n}\n\nsolution();\n`;
  }
  if (lang === "java") {
    return `// Technical Interview - Java Solution\n\npublic class Solution {\n    public static void main(String[] args) {\n        System.out.println("Hello from Jobly Java Sandbox!");\n    }\n}\n`;
  }
  if (lang === "markdown") {
    return `# Project Workspace\n\n- Compile and execute using the **Run Code** button.\n- Add custom test cases in \`/tests/custom_input.txt\` or in the **Custom Input (stdin)** compiler tab.\n- Modularize headers and helper classes under \`/include\` and \`/src\`.\n`;
  }
  return "";
};

const MAX_FILE_SIZE = 100000;

function decodeAndValidatePath(rawPath: string): { cleanPath: string; error?: string } {
  try {
    const decoded = decodeURIComponent(String(rawPath));
    // Double decode to catch double-encoded traversal
    let doubleDecoded = decoded;
    try {
      const d2 = decodeURIComponent(decoded);
      if (d2 !== decoded) doubleDecoded = d2;
    } catch {}
    const check = doubleDecoded;
    if (check.includes("..") || check.includes("\0") || check.includes("\\")) {
      return { cleanPath: "", error: "Invalid file path (directory traversal not allowed)." };
    }
    // Simple posix normalize (without node path)
    const normalized = check.startsWith("/") ? check : `/${check}`;
    // Normalize segments
    const segments = normalized.split("/").filter(Boolean);
    const stack: string[] = [];
    for (const seg of segments) {
      if (seg === "..") {
        if (stack.length === 0) return { cleanPath: "", error: "Invalid file path (directory traversal not allowed)." };
        stack.pop();
      } else if (seg !== "." && seg !== "") {
        stack.push(seg);
      }
    }
    const clean = "/" + stack.join("/");
    if (clean.includes("..") || !clean.startsWith("/")) {
      return { cleanPath: "", error: "Invalid file path (directory traversal not allowed)." };
    }
    return { cleanPath: clean };
  } catch {
    return { cleanPath: "", error: "Invalid encoded path" };
  }
}

function wouldExceedSizeLimit(ytext: Y.Text, insertText: string): boolean {
  return ytext.length + insertText.length > MAX_FILE_SIZE;
}

export function MonacoWorkspace({
  roomKey,
  sessionId,
  initialCode,
  initialLanguage = "python",
  allowedLanguages = ["python", "javascript", "typescript", "cpp", "java"],
  readOnly = false,
  onExecutionComplete,
  restoreRef,
  remoteExecution,
  activeProblem,
  onLeaveEditor,
  videoElement,
  isVideoHidden = false,
  onToggleVideo,
  showAiTab = false,
  aiPanel,
}: MonacoWorkspaceProps) {
  const { user, token } = useAuth();
  const [language, setLanguage] = useState<string>(initialLanguage);
  const [customInput, setCustomInput] = useState<string>("");
  const [bottomPanelTab, setBottomPanelTab] = useState<BottomPanelTab>("OUTPUT");
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState<boolean>(true);
  const [isBottomPanelMaximized, setIsBottomPanelMaximized] = useState<boolean>(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(true);
  const [bottomPanelHeight, setBottomPanelHeight] = useState<number>(220);
  const isDraggingDividerRef = useRef<boolean>(false);
  const dragStartYRef = useRef<number>(0);
  const dragStartHeightRef = useRef<number>(220);
  const [executing, setExecuting] = useState<boolean>(false);
  const [synced, setSynced] = useState<boolean>(false);
  const [activePeers, setActivePeers] = useState<Array<{ name: string; color: string }>>([]);
  const [lspStatus, setLspStatus] = useState<"ready" | "connecting" | "unavailable">("connecting");
  const [editorStats, setEditorStats] = useState({ lines: 1, characters: 0 });
  const [activeActivity, setActiveActivity] = useState<ActivityType>("EXPLORER");

  // File Explorer & Open Tabs State
  const initialExt = getLanguageExtension(initialLanguage);
  const defaultInitialPath = `/src/solution.${initialExt}`;
  const [activeFilePath, setActiveFilePath] = useState<string>(defaultInitialPath);
  const [openTabs, setOpenTabs] = useState<string[]>([defaultInitialPath]);
  const [isExplorerOpen, setIsExplorerOpen] = useState<boolean>(true);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);

  const [executionOutput, setExecutionOutput] = useState<{
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs: number;
    timedOut: boolean;
    compilerOutput?: string;
    failureKind?: "compilation_error" | "runtime_error" | "runtime_unavailable" | "timeout" | null;
    executionId?: string;
    sequence?: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const contentListenerRef = useRef<{ dispose: () => void } | null>(null);
  const lspSocketRef = useRef<WebSocket | null>(null);
  const lspContentListenerRef = useRef<{ dispose: () => void } | null>(null);
  const lspRequestIdRef = useRef(0);

  const languageRef = useRef<string>(initialLanguage);
  const activeFilePathRef = useRef<string>(defaultInitialPath);
  const currentBoundPathRef = useRef<string | null>(null);
  const latestExecutionSeqRef = useRef<number>(remoteExecution?.sequence || 0);

  // =============================================
  // Yjs CRDT Sync — same as original
  // =============================================
  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    const wsUrl = `${protocol}//${host}:5000/collab`;

    const provider = new WebsocketProvider(wsUrl, roomKey, ydoc, {
      params: { token: token || "" },
      disableBc: true,
    });
    providerRef.current = provider;

    const metaMap = ydoc.getMap("meta");
    const filesystem = ydoc.getMap("filesystem");

    const syncFilesystem = () => {
      const list: WorkspaceFile[] = [];
      filesystem.forEach((val: any) => {
        if (val && val.path) {
          list.push(val);
        }
      });

      if (list.length === 0) {
        const ext = getLanguageExtension(languageRef.current);
        const starterFiles: WorkspaceFile[] = [
          { type: "directory", path: "/src", name: "src" },
          { type: "file", path: `/src/solution.${ext}`, name: `solution.${ext}`, language: languageRef.current },
          { type: "file", path: "/src/utils.cpp", name: "utils.cpp", language: "cpp" },
          { type: "directory", path: "/include", name: "include" },
          { type: "file", path: "/include/solution.h", name: "solution.h", language: "cpp" },
          { type: "directory", path: "/tests", name: "tests" },
          { type: "file", path: "/tests/custom_input.txt", name: "custom_input.txt", language: "plaintext" },
          { type: "file", path: "/README.md", name: "README.md", language: "markdown" },
        ];

        ydoc.transact(() => {
          starterFiles.forEach((f) => filesystem.set(f.path, f));

          const safeInsert = (ytext: Y.Text, content: string) => {
            if (ytext.length === 0 && content) {
              if (content.length > MAX_FILE_SIZE) {
                content = content.slice(0, MAX_FILE_SIZE);
                toast.error("Initial file exceeds 100KB, truncated");
              }
              if (wouldExceedSizeLimit(ytext, content)) {
                toast.error("File would exceed 100KB limit");
                return;
              }
              ytext.insert(0, content);
            }
          };
          const mainYText = ydoc.getText(`/src/solution.${ext}`);
          safeInsert(mainYText, initialCode || getDefaultCode(languageRef.current));

          const utilsYText = ydoc.getText("/src/utils.cpp");
          safeInsert(utilsYText, `// Utility functions & helpers\n#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nvoid printVector(const vector<int>& vec) {\n    for (int x : vec) cout << x << " ";\n    cout << endl;\n}\n`);

          const headerYText = ydoc.getText("/include/solution.h");
          safeInsert(headerYText, `// Header definitions\n#pragma once\n#include <vector>\n\nclass Solution {\npublic:\n    void solve();\n};\n`);

          const testYText = ydoc.getText("/tests/custom_input.txt");
          safeInsert(testYText, `// Custom test inputs\n5\n10 20 30 40 50\n`);

          const readmeYText = ydoc.getText("/README.md");
          safeInsert(readmeYText, getDefaultCode("markdown"));
        });
        setFiles(starterFiles);
        return;
      }
      setFiles(list);
    };

    syncFilesystem();
    filesystem.observe(syncFilesystem);
    // Y.Text size limit enforcement for collaborative edits
    const enforceSizeLimit = (update: Uint8Array, origin: any) => {
      if (origin === "size-limit-enforcement") return;
      for (const [key, value] of (ydoc as any).share.entries()) {
        if (value instanceof Y.Text && (value as Y.Text).length > MAX_FILE_SIZE) {
          ydoc.transact(() => {
            (value as Y.Text).delete(MAX_FILE_SIZE, (value as Y.Text).length - MAX_FILE_SIZE);
          }, "size-limit-enforcement");
          toast.error(`File ${key} exceeds 100KB, truncated`);
        }
      }
    };
    ydoc.on("update", enforceSizeLimit);

    const metaObserver = () => {
      const remoteLang = metaMap.get("activeLanguage") as string | undefined;
      if (remoteLang && remoteLang !== languageRef.current) {
        languageRef.current = remoteLang;
        setLanguage(remoteLang);
        const ext = getLanguageExtension(remoteLang);
        const newPath = `/src/solution.${ext}`;
        activeFilePathRef.current = newPath;
        setActiveFilePath(newPath);
        if (!openTabs.includes(newPath)) {
          setOpenTabs((prev) => [...prev, newPath]);
        }
        if (editorRef.current && currentBoundPathRef.current !== newPath) {
          bindActiveFile(newPath, remoteLang, true);
        }
      }
    };
    metaMap.observe(metaObserver);

    provider.on("status", (event: { status: string }) => {
      setSynced(event.status === "connected");
      if (event.status === "connected" && editorRef.current) {
        const curPath = activeFilePathRef.current;
        const curLang = (metaMap.get("activeLanguage") as string) || languageRef.current;
        if (currentBoundPathRef.current !== curPath) {
          bindActiveFile(curPath, curLang);
        }
      }
    });

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

    return () => {
      metaMap.unobserve(metaObserver);
      filesystem.unobserve(syncFilesystem);
      ydoc.off("update", enforceSizeLimit);
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

  // =============================================
  // LSP Language Service — same as original
  // =============================================
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
          params?: {
            uri?: string;
            diagnostics?: Array<{
              message: string;
              severity?: number;
              range?: {
                start: { line: number; character: number };
                end: { line: number; character: number };
              };
            }>;
          };
        };
        if (message.method !== "textDocument/publishDiagnostics" || message.params?.uri !== uri) return;
        const monaco = monacoRef.current;
        if (!monaco) return;
        monaco.editor.setModelMarkers(
          model,
          "jobly-lsp",
          (message.params.diagnostics || []).map((diagnostic: any) => ({
            message: diagnostic.message,
            severity: diagnostic.severity === 1 ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
            startLineNumber: (diagnostic.range?.start.line || 0) + 1,
            startColumn: (diagnostic.range?.start.character || 0) + 1,
            endLineNumber: (diagnostic.range?.end.line || diagnostic.range?.start.line || 0) + 1,
            endColumn: (diagnostic.range?.end.character || diagnostic.range?.start.character || 0) + 2,
          })),
        );
      } catch {
        // Ignore malformed language-server messages
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

  // =============================================
  // File Binding — same as original
  // =============================================
  const bindActiveFile = (filePath: string, lang: string, force = false) => {
    if (!editorRef.current || !ydocRef.current || !providerRef.current) return;

    // Path traversal check: decode and normalize before binding
    const pathCheck = decodeAndValidatePath(filePath);
    if (pathCheck.error) {
      toast.error(pathCheck.error);
      return;
    }
    const safePath = pathCheck.cleanPath;

    if (!force && currentBoundPathRef.current === safePath && bindingRef.current) {
      return;
    }

    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    currentBoundPathRef.current = safePath;

    const ytext = ydocRef.current.getText(safePath);
    const targetDefaultCode = lang === initialLanguage && initialCode ? initialCode : getDefaultCode(lang);

    if (ytext.length === 0 && targetDefaultCode) {
      if (wouldExceedSizeLimit(ytext, targetDefaultCode)) {
        toast.error("File content exceeds 100KB limit");
        return;
      }
      ydocRef.current.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, targetDefaultCode);
      });
    } else if (ytext.length > MAX_FILE_SIZE) {
      // Enforce size limit if existing content already exceeds
      ydocRef.current.transact(() => {
        ytext.delete(MAX_FILE_SIZE, ytext.length - MAX_FILE_SIZE);
      }, "size-limit-enforcement");
      toast.error("File exceeds 100KB limit, truncated");
    }

    const model = editorRef.current.getModel();
    if (model) {
      if (monacoRef.current) {
        monacoRef.current.editor.setModelLanguage(model, getMonacoLanguage(lang));
      }
      const targetVal = ytext.toString() || targetDefaultCode || "";
      if (model.getValue() !== targetVal) {
        model.setValue(targetVal);
      }
    }

    bindingRef.current = new MonacoBinding(
      ytext,
      model,
      new Set([editorRef.current]),
      providerRef.current.awareness,
    );

    const updateStats = () => {
      const currentModel = editorRef.current?.getModel();
      if (currentModel) {
        setEditorStats({ lines: currentModel.getLineCount(), characters: currentModel.getValueLength() });
      }
    };
    contentListenerRef.current?.dispose();
    contentListenerRef.current = editorRef.current.onDidChangeModelContent(updateStats);
    updateStats();

    connectLanguageService(filePath, lang);
  };

  // =============================================
  // File operations — same as original
  // =============================================
  const handleSelectFile = (file: WorkspaceFile) => {
    if (file.type === "directory") return;
    setActiveFilePath(file.path);
    activeFilePathRef.current = file.path;
    if (!openTabs.includes(file.path)) {
      setOpenTabs((prev) => [...prev, file.path]);
    }
    const inferredLang = file.language || getLanguageFromPath(file.path);
    setLanguage(inferredLang);
    languageRef.current = inferredLang;
    bindActiveFile(file.path, inferredLang);
  };

  const handleCloseTab = (tabPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextTabs = openTabs.filter((t) => t !== tabPath);
    if (nextTabs.length === 0) {
      return;
    }
    setOpenTabs(nextTabs);
    if (activeFilePath === tabPath) {
      const nextActive = nextTabs[nextTabs.length - 1];
      setActiveFilePath(nextActive);
      activeFilePathRef.current = nextActive;
      const nextFile = files.find((f) => f.path === nextActive);
      const nextLang = nextFile?.language || getLanguageFromPath(nextActive);
      setLanguage(nextLang);
      languageRef.current = nextLang;
      bindActiveFile(nextActive, nextLang);
    }
  };

  const handleCreateFile = (fullPath: string, type: "file" | "directory") => {
    if (!ydocRef.current) return;
    // Path traversal encoded fix: decodeURIComponent before checking .. and normalize path
    const validated = decodeAndValidatePath(fullPath);
    if (validated.error) {
      toast.error(validated.error);
      return;
    }
    const safePath = validated.cleanPath;
    const filename = safePath.split("/").pop() || "untitled";
    const lang = type === "file" ? getLanguageFromPath(safePath) : undefined;
    const newEntry: WorkspaceFile = {
      type,
      path: safePath,
      name: filename,
      language: lang,
    };
    const filesystem = ydocRef.current.getMap("filesystem");
    if (filesystem.has(safePath)) {
      toast.error("File or directory already exists at this path.");
      return;
    }
    filesystem.set(safePath, newEntry);

    if (type === "file") {
      const ytext = ydocRef.current.getText(safePath);
      if (ytext.length === 0) {
        const defaultCode = getDefaultCode(lang || "plaintext");
        // Size limit check: if Y.Text insert would exceed 100000, reject
        if (wouldExceedSizeLimit(ytext, defaultCode)) {
          toast.error("File content exceeds 100KB limit");
          filesystem.delete(safePath);
          return;
        }
        ytext.insert(0, defaultCode);
      }
      handleSelectFile(newEntry);
      toast.success(`Created file ${filename}`);
    } else {
      toast.success(`Created folder ${filename}`);
    }
  };

  const handleDeleteFile = (fullPath: string) => {
    if (!ydocRef.current) return;
    const validated = decodeAndValidatePath(fullPath);
    if (validated.error) {
      toast.error(validated.error);
      return;
    }
    const safePath = validated.cleanPath;
    const filesystem = ydocRef.current.getMap("filesystem");
    filesystem.delete(safePath);
    filesystem.forEach((_val: any, key: string) => {
      if (key.startsWith(safePath + "/")) {
        filesystem.delete(key);
      }
    });
    setOpenTabs((prev) => prev.filter((t) => t !== safePath && !t.startsWith(safePath + "/")));
    if (activeFilePath === safePath || activeFilePath.startsWith(safePath + "/")) {
      const remaining = files.filter((f) => f.path !== safePath && !f.path.startsWith(safePath + "/") && f.type === "file");
      if (remaining.length > 0) {
        handleSelectFile(remaining[0]);
      }
    }
    toast.info(`Deleted ${safePath}`);
  };

  const handleLanguageChange = (newLang: string) => {
    if (newLang === languageRef.current) return;
    languageRef.current = newLang;
    setLanguage(newLang);
    const ext = getLanguageExtension(newLang);
    const newFilePath = `/src/solution.${ext}`;
    activeFilePathRef.current = newFilePath;
    setActiveFilePath(newFilePath);

    if (!openTabs.includes(newFilePath)) {
      setOpenTabs((prev) => [...prev, newFilePath]);
    }

    if (ydocRef.current) {
      const metaMap = ydocRef.current.getMap("meta");
      metaMap.set("activeLanguage", newLang);
      const filesystem = ydocRef.current.getMap("filesystem");
      if (!filesystem.has(newFilePath)) {
        filesystem.set(newFilePath, {
          type: "file",
          path: newFilePath,
          name: `solution.${ext}`,
          language: newLang,
        });
      }
    }
    bindActiveFile(newFilePath, newLang, true);
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    const curPath = activeFilePathRef.current;
    const curLang = (ydocRef.current?.getMap("meta").get("activeLanguage") as string) || languageRef.current;
    bindActiveFile(curPath, curLang);

    editor.onDidPaste((e: any) => {
      try {
        const model = editor.getModel();
        if (!model) return;
        const text = model.getValueInRange(e.range);
        const characterCount = text.length;
        const lineCount = e.range.endLineNumber - e.range.startLineNumber + 1;
        apiCall("/integrity/telemetry", "POST", {
          sessionId,
          eventType: "clipboard.paste",
          offsetMs: 0,
          pasteData: {
            text: text.slice(0, 500),
            characterCount,
            durationMs: 50,
            lineCount,
          },
        }, token).catch(() => {});
      } catch {
        // Silently continue
      }
    });
  };

  const handleRunCode = async () => {
    if (!editorRef.current) return;
    const currentCode = editorRef.current.getValue();

    setExecuting(true);
    setExecutionOutput(null);
    setIsBottomPanelOpen(true);
    setBottomPanelTab("OUTPUT");

    try {
      const res = await apiCall<{ execution: any }>(
        `/interviews/${sessionId}/execute`,
        "POST",
        {
          language,
          code: currentCode,
          stdin: customInput,
        },
        token,
      );

      const execution = res.execution;
      if (execution?.sequence) {
        if (execution.sequence < latestExecutionSeqRef.current) {
          console.warn(`[Execution Dropped] Stale local HTTP response #${execution.sequence} arrived after #${latestExecutionSeqRef.current}`);
          setExecuting(false);
          return;
        }
        latestExecutionSeqRef.current = execution.sequence;
      }

      setExecutionOutput(execution);
      if (onExecutionComplete) onExecutionComplete(execution);
      if (execution?.exitCode === 0) {
        toast.success("Code executed successfully in sandbox.");
      } else {
        toast.error(`Code execution exited with code ${execution?.exitCode || 1}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed running code in sandbox.");
      setExecutionOutput({
        stdout: "",
        stderr: err.message || "Execution failed",
        exitCode: 1,
        durationMs: 0,
        timedOut: false,
        failureKind: "runtime_error",
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleReset = () => {
    if (ydocRef.current && editorRef.current) {
      const curPath = activeFilePathRef.current || activeFilePath;
      const fallbackCode = (language === initialLanguage && initialCode) ? initialCode : getDefaultCode(language);
      const ytext = ydocRef.current.getText(curPath);
      ydocRef.current.transact(() => {
        ytext.delete(0, ytext.length);
        if (fallbackCode) ytext.insert(0, fallbackCode);
      });
      if (editorRef.current.getModel()) {
        editorRef.current.getModel().setValue(fallbackCode || "");
      }
      toast.info(`Reset template to standard ${language.toUpperCase()} starter.`);
    }
  };

  const handleFormatDocument = () => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
  };

  const handleRestoreComplete = (cp: any) => {
    const restoredFile = cp?.filesSnapshot?.[0];
    if (restoredFile) {
      const lang = restoredFile.language || "python";
      const path = restoredFile.path || `/src/solution.${getLanguageExtension(lang)}`;
      languageRef.current = lang;
      activeFilePathRef.current = path;
      setActiveFilePath(path);
      setLanguage(lang);
      if (!openTabs.includes(path)) {
        setOpenTabs((prev) => [...prev, path]);
      }
      if (ydocRef.current) {
        ydocRef.current.getMap("meta").set("activeLanguage", lang);
        const ytext = ydocRef.current.getText(path);
        ydocRef.current.transact(() => {
          ytext.delete(0, ytext.length);
          ytext.insert(0, restoredFile.content || "");
        });
      }
      if (editorRef.current) {
        bindActiveFile(path, lang, true);
        editorRef.current.getModel()?.setValue(restoredFile.content || "");
      }
    }
  };

  const openBottomPanelTab = (tab: BottomPanelTab) => {
    setBottomPanelTab(tab);
    setIsBottomPanelOpen(true);
  };

  // Expose restore handler to parent via ref
  useEffect(() => {
    if (restoreRef) {
      restoreRef.current = handleRestoreComplete;
    }
    return () => {
      if (restoreRef) {
        restoreRef.current = null;
      }
    };
  }, [restoreRef]);

  // When a remote participant runs code, update our output panel
  useEffect(() => {
    if (remoteExecution?.executionId) {
      if (remoteExecution.sequence) {
        if (remoteExecution.sequence < latestExecutionSeqRef.current) {
          console.warn(`[Execution Dropped] Stale remote Socket response #${remoteExecution.sequence} arrived after #${latestExecutionSeqRef.current}`);
          return;
        }
        latestExecutionSeqRef.current = remoteExecution.sequence;
      }

      setExecutionOutput(remoteExecution);
      setIsBottomPanelOpen(true);
      setBottomPanelTab("OUTPUT");
    }
  }, [remoteExecution?.executionId]);

  // Activity bar click toggles activity panel visibility
  const handleActivityChange = (activity: ActivityType) => {
    if (activeActivity === activity) {
      setIsExplorerOpen((prev) => !prev);
    } else {
      setActiveActivity(activity);
      setIsExplorerOpen(true);
    }
  };

  // Global keyboard shortcuts (Ctrl+J/Ctrl+` for bottom panel, Ctrl+B for explorer)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "j" || e.key === "`")) {
        e.preventDefault();
        setIsBottomPanelOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsExplorerOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex h-full flex-col overflow-hidden select-none"
      style={{ background: "var(--iv-bg)", color: "var(--iv-text)", fontFamily: "var(--font-iv-ui)" }}
    >
      {/* VS Code Title Bar */}
      <TitleBar
        roomKey={roomKey}
        activeFileName={activeFilePath.split("/").pop() || "solution"}
        language={language}
        allowedLanguages={allowedLanguages}
        onLanguageChange={handleLanguageChange}
        synced={synced}
        activePeersCount={activePeers.length}
        executing={executing}
        readOnly={readOnly}
        onRunCode={handleRunCode}
        onFormatDocument={handleFormatDocument}
        onResetCode={handleReset}
        onLeaveEditor={onLeaveEditor}
        isBottomPanelOpen={isBottomPanelOpen}
        onToggleBottomPanel={() => setIsBottomPanelOpen((prev) => !prev)}
        isRightSidebarOpen={isRightSidebarOpen}
        onToggleRightSidebar={() => setIsRightSidebarOpen((prev) => !prev)}
        hasRightSidebarContent={!!(videoElement || (showAiTab && aiPanel))}
      />

      {/* Main Workspace Body: Activity Bar + Sidebars + Editor & Bottom Panel Split */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* VS Code Left Activity Bar */}
        <ActivityBar active={activeActivity} onChange={handleActivityChange} />

        {/* Primary Left Sidebars (Explorer, Problem Statement, Search, Settings) */}
        {isExplorerOpen && activeActivity === "EXPLORER" && (
          <FileExplorer
            files={files}
            activeFilePath={activeFilePath}
            onSelectFile={handleSelectFile}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            readOnly={readOnly}
          />
        )}

        {isExplorerOpen && activeActivity === "PROBLEM" && (
          <div
            className="w-80 flex flex-col h-full overflow-y-auto iv-scroll border-r flex-shrink-0"
            style={{ borderColor: "var(--iv-border)", background: "var(--iv-surface)" }}
          >
            <div className="h-9 flex items-center px-4 border-b text-[11px] font-semibold uppercase tracking-wider text-white/70 flex-shrink-0" style={{ borderColor: "var(--iv-border)" }}>
              Problem Statement
            </div>
            <div className="p-3">
              <ProblemStatement
                title={activeProblem?.title}
                description={activeProblem?.description}
                examples={activeProblem?.examples as any}
                difficulty={activeProblem?.difficulty}
              />
            </div>
          </div>
        )}

        {isExplorerOpen && activeActivity === "SEARCH" && (
          <div
            className="w-72 flex flex-col h-full border-r flex-shrink-0 select-none"
            style={{ borderColor: "var(--iv-border)", background: "var(--iv-surface)" }}
          >
            <div className="h-9 flex items-center px-4 border-b text-[11px] font-semibold uppercase tracking-wider text-white/70" style={{ borderColor: "var(--iv-border)" }}>
              Search Workspace
            </div>
            <div className="p-3 flex flex-col gap-2">
              <input
                type="text"
                placeholder="Search text in files..."
                className="w-full h-7 rounded border px-2 text-xs bg-black/30 text-white placeholder:text-white/30 outline-none focus:border-[var(--iv-accent)]"
                style={{ borderColor: "var(--iv-border)" }}
              />
              <p className="text-[11px] text-white/40 italic">
                Press Enter to search within current files.
              </p>
            </div>
          </div>
        )}

        {isExplorerOpen && activeActivity === "SETTINGS" && (
          <div
            className="w-72 flex flex-col h-full border-r flex-shrink-0 select-none"
            style={{ borderColor: "var(--iv-border)", background: "var(--iv-surface)" }}
          >
            <div className="h-9 flex items-center px-4 border-b text-[11px] font-semibold uppercase tracking-wider text-white/70" style={{ borderColor: "var(--iv-border)" }}>
              IDE Preferences
            </div>
            <div className="p-4 space-y-4 text-xs text-white/80">
              <div>
                <label className="block text-[11px] text-white/50 mb-1">Editor Font Size</label>
                <div className="px-2 py-1 rounded bg-black/20 border border-white/10">14px (Fira Code)</div>
              </div>
              <div>
                <label className="block text-[11px] text-white/50 mb-1">Tab Size</label>
                <div className="px-2 py-1 rounded bg-black/20 border border-white/10">2 spaces</div>
              </div>
              <div>
                <label className="block text-[11px] text-white/50 mb-1">Theme</label>
                <div className="px-2 py-1 rounded bg-black/20 border border-white/10">VS Dark Modern</div>
              </div>
            </div>
          </div>
        )}

        {/* Main IDE Workspace: Editor (top) + Bottom Panel (down) — pure flex-col, no ResizablePanelGroup */}
        <div
          className="flex-1 flex flex-col min-w-0 relative"
          style={{ minHeight: 0, overflow: "hidden" }}
          onMouseMove={(e) => {
            if (!isDraggingDividerRef.current) return;
            const delta = dragStartYRef.current - e.clientY;
            const newH = Math.max(80, Math.min(dragStartHeightRef.current + delta, window.innerHeight - 200));
            setBottomPanelHeight(newH);
          }}
          onMouseUp={() => { isDraggingDividerRef.current = false; }}
          onMouseLeave={() => { isDraggingDividerRef.current = false; }}
        >
          {/* Editor Area (Tabs + Breadcrumbs + Monaco) — takes all remaining height */}
          <div
            className="flex flex-col min-w-0"
            style={{
              flex: "1 1 0%",
              minHeight: 0,
              overflow: "hidden",
              background: "var(--iv-surface-elevated)",
            }}
          >
            {/* Open Tabs Bar */}
            <div
              className="flex items-center h-8 overflow-x-auto px-1 gap-0.5 flex-shrink-0 select-none border-b"
              style={{
                background: "var(--iv-surface)",
                borderColor: "var(--iv-border-subtle)",
                scrollbarWidth: "none",
              }}
            >
              {openTabs.map((tabPath) => {
                const filename = tabPath.split("/").pop() || "untitled";
                const isActive = activeFilePath === tabPath;
                return (
                  <div
                    key={tabPath}
                    onClick={() => {
                      const targetFile = files.find((f) => f.path === tabPath) || {
                        type: "file",
                        path: tabPath,
                        name: filename,
                      };
                      handleSelectFile(targetFile as WorkspaceFile);
                    }}
                    className="group flex items-center gap-1.5 px-3 py-1 text-[11px] rounded-t cursor-pointer border-t-2 transition flex-shrink-0"
                    style={{
                      fontFamily: "var(--font-iv-ui)",
                      ...(isActive
                        ? { background: "var(--iv-surface-elevated)", color: "#fff", borderColor: "var(--iv-accent)" }
                        : { background: "var(--iv-surface)", color: "var(--iv-text-muted)", borderColor: "transparent" }),
                    }}
                  >
                    {getFileIcon(filename)}
                    <span className="truncate max-w-[120px]">{filename}</span>
                    {openTabs.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleCloseTab(tabPath, e)}
                        title="Close Tab"
                        className="p-0.5 rounded transition hover:text-white"
                        style={{ color: "var(--iv-text-dim)" }}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Breadcrumb */}
            <div
              className="h-5 flex items-center px-3 border-b text-[11px] flex-shrink-0 gap-1"
              style={{
                fontFamily: "var(--font-iv-code)",
                background: "var(--iv-surface-alt)",
                borderColor: "var(--iv-border-subtle)",
                color: "var(--iv-text-dim)",
              }}
            >
              <span style={{ color: "var(--iv-text-muted)" }}>src</span>
              <span style={{ color: "var(--iv-text-dim)" }}>/</span>
              <span style={{ color: "var(--iv-text)" }}>{activeFilePath.split("/").pop()}</span>
            </div>

            {/* Monaco Editor */}
            <div style={{ flex: "1 1 0%", position: "relative", overflow: "hidden", minHeight: 0 }}>
              <Editor
                height="100%"
                language={getMonacoLanguage(language)}
                theme="vs-dark"
                onMount={handleEditorMount}
                options={{
                  readOnly,
                  fontSize: 14,
                  fontFamily: "Fira Code, Cascadia Code, JetBrains Mono, Menlo, monospace",
                  fontLigatures: true,
                  lineHeight: 22,
                  minimap: { enabled: true, scale: 1, showSlider: "mouseover" },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  cursorBlinking: "smooth",
                  smoothScrolling: true,
                  padding: { top: 14, bottom: 14 },
                  wordWrap: "on",
                  wrappingStrategy: "advanced",
                  bracketPairColorization: { enabled: true },
                  guides: { bracketPairs: true, indentation: true, bracketPairsHorizontal: true },
                  suggest: { showKeywords: true, showSnippets: true },
                  quickSuggestions: { other: true, comments: false, strings: false },
                  parameterHints: { enabled: true },
                  hover: { enabled: true },
                  lightbulb: { enabled: true },
                  formatOnType: true,
                  formatOnPaste: true,
                  autoClosingBrackets: "always",
                  autoClosingQuotes: "always",
                  autoSurround: "languageDefined",
                  folding: true,
                  foldingHighlight: true,
                  unfoldOnClickAfterEndOfLine: true,
                  renderLineHighlight: "all",
                  renderWhitespace: "selection",
                  rulers: [80, 100],
                  stickyScroll: { enabled: true },
                }}
              />
            </div>
          </div>

          {/* Drag Divider between Editor and Bottom Panel */}
          {isBottomPanelOpen && (
            <div
              role="separator"
              aria-orientation="horizontal"
              className="flex-shrink-0 flex items-center justify-center cursor-row-resize group"
              style={{
                height: 5,
                background: "var(--iv-border)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--iv-accent)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--iv-border)"; }}
              onMouseDown={(e) => {
                e.preventDefault();
                isDraggingDividerRef.current = true;
                dragStartYRef.current = e.clientY;
                dragStartHeightRef.current = isBottomPanelMaximized ? window.innerHeight * 0.75 : bottomPanelHeight;
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 3,
                  borderRadius: 2,
                  background: "rgba(255,255,255,0.2)",
                }}
              />
            </div>
          )}

          {/* VS Code Bottom Panel — fixed pixel height, docked at bottom */}
          {isBottomPanelOpen && (
            <div
              className="flex-shrink-0 flex flex-col"
              style={{
                height: isBottomPanelMaximized ? "75%" : bottomPanelHeight,
                minHeight: 80,
                overflow: "hidden",
              }}
            >
              <BottomPanel
                activeTab={bottomPanelTab}
                onTabChange={setBottomPanelTab}
                onClose={() => setIsBottomPanelOpen(false)}
                isMaximized={isBottomPanelMaximized}
                onToggleMaximize={() => setIsBottomPanelMaximized((prev) => !prev)}
                executing={executing}
                executionOutput={executionOutput}
                language={language}
                customInput={customInput}
                setCustomInput={setCustomInput}
                onRunCode={handleRunCode}
                readOnly={readOnly}
                sessionId={sessionId}
                roomKey={roomKey}
                token={token ?? undefined}
                getCode={() => editorRef.current?.getValue() || ""}
                activeProblem={activeProblem || undefined}
                onRestoreComplete={handleRestoreComplete}
                showAiTab={showAiTab}
                aiPanel={aiPanel}
              />
            </div>
          )}

          {/* Floating Picture-in-Picture Video Call Window on the right */}
          {videoElement && !isVideoHidden && isRightSidebarOpen && (
            <div
              className="absolute bottom-4 right-4 z-40 w-72 rounded-xl border border-white/15 bg-black/90 shadow-2xl overflow-hidden iv-panel-slide-up select-none"
              style={{ backdropFilter: "blur(16px)" }}
            >
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/90">
                  <Video className="h-3.5 w-3.5 text-[var(--iv-accent)]" />
                  <span>Live Call</span>
                </div>
                <div className="flex items-center gap-1">
                  {onToggleVideo && (
                    <button
                      type="button"
                      onClick={onToggleVideo}
                      className="p-1 text-white/40 hover:text-white transition rounded"
                      title="Turn video feed on/off"
                    >
                      <VideoOffIcon className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsRightSidebarOpen(false)}
                    className="p-1 text-white/40 hover:text-white transition rounded"
                    title="Minimize floating video"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="p-2">
                <div className="iv-video-compact rounded-lg overflow-hidden" style={{ height: 140 }}>
                  {videoElement}
                </div>
              </div>
            </div>
          )}

          {/* Minimized Floating Video Badge */}
          {videoElement && !isVideoHidden && !isRightSidebarOpen && (
            <button
              type="button"
              onClick={() => setIsRightSidebarOpen(true)}
              className="absolute bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-white/15 bg-black/85 px-3 py-1.5 text-xs text-white/90 shadow-lg hover:border-[var(--iv-accent)] transition-all cursor-pointer select-none"
              title="Expand Live Video Call"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <Video className="h-3.5 w-3.5 text-[var(--iv-accent)]" />
              <span className="font-semibold text-[11px]">Show Video</span>
            </button>
          )}
        </div>
      </div>

      {/* VS Code Status Bar */}
      <footer
        className="iv-status-bar"
        role="contentinfo"
      >
        <div className="flex items-center gap-2">
          {/* Git Branch */}
          <span className="iv-status-bar-item">
            <GitBranch className="h-3 w-3 text-[var(--iv-accent)]" />
            <span>main*</span>
          </span>

          {/* Errors / Warnings */}
          <span className="iv-status-bar-item gap-2">
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-red-400" />
              <span>{executionOutput?.exitCode && executionOutput.exitCode !== 0 ? 1 : 0}</span>
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-400" />
              <span>0</span>
            </span>
          </span>

          {/* Quick Tab Switchers in Status Bar */}
          <button
            type="button"
            onClick={() => openBottomPanelTab("OUTPUT")}
            className="iv-status-bar-item interactive hidden sm:inline-flex"
          >
            Output
          </button>

          <button
            type="button"
            onClick={() => openBottomPanelTab("TERMINAL")}
            className="iv-status-bar-item interactive hidden sm:inline-flex"
          >
            Terminal
          </button>

          <button
            type="button"
            onClick={() => openBottomPanelTab("TESTS")}
            className="iv-status-bar-item interactive hidden md:inline-flex"
          >
            Tests
          </button>

          <button
            type="button"
            onClick={() => openBottomPanelTab("CHECKPOINTS")}
            className="iv-status-bar-item interactive hidden lg:inline-flex"
          >
            Checkpoints
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* LSP Indicator */}
          <span className="iv-status-bar-item hidden md:inline-flex">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                lspStatus === "ready" ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <span>LSP {lspStatus.toUpperCase()}</span>
          </span>

          {/* Line & Column */}
          <span className="iv-status-bar-item interactive">
            Ln {editorStats.lines}, Col {editorStats.characters}
          </span>

          <span className="iv-status-bar-item hidden sm:inline-flex">Spaces: 2</span>
          <span className="iv-status-bar-item hidden sm:inline-flex">UTF-8</span>

          {/* Active Language */}
          <span className="iv-status-bar-item interactive font-medium text-white/90">
            <Braces className="h-3 w-3 text-[var(--iv-accent)]" />
            {language.toUpperCase()}
          </span>
        </div>
      </footer>
    </div>
  );
}
