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
  ChevronUp,
  ChevronDown,
  Trash2,
  FolderTree,
  FilePlus,
  FolderPlus,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { ExecutionPanel } from "./ExecutionPanel";
import { CheckpointTimeline } from "./CheckpointTimeline";
import { TerminalPanel } from "../terminal/TerminalPanel";
import { FileExplorer, WorkspaceFile, getFileIcon } from "./FileExplorer";

interface MonacoWorkspaceProps {
  roomKey: string;
  sessionId: string;
  initialCode?: string;
  initialLanguage?: string;
  allowedLanguages?: string[];
  readOnly?: boolean;
  onExecutionComplete?: (result: any) => void;
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

export function MonacoWorkspace({
  roomKey,
  sessionId,
  initialCode,
  initialLanguage = "python",
  allowedLanguages = ["python", "javascript", "typescript", "cpp", "java"],
  readOnly = false,
  onExecutionComplete,
}: MonacoWorkspaceProps) {
  const { user, token } = useAuth();
  const [language, setLanguage] = useState<string>(initialLanguage);
  const [customInput, setCustomInput] = useState<string>("");
  const [bottomDrawerTab, setBottomDrawerTab] = useState<"OUTPUT" | "TERMINAL" | "CHECKPOINTS">("OUTPUT");
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);
  const [panelHeight, setPanelHeight] = useState<number>(220);
  const [isPanelMaximized, setIsPanelMaximized] = useState<boolean>(false);
  const [executing, setExecuting] = useState<boolean>(false);
  const [synced, setSynced] = useState<boolean>(false);
  const [activePeers, setActivePeers] = useState<Array<{ name: string; color: string }>>([]);
  const [lspStatus, setLspStatus] = useState<"ready" | "connecting" | "unavailable">("connecting");
  const [editorStats, setEditorStats] = useState({ lines: 1, characters: 0 });

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
    failureKind?: string;
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
  const isResizingRef = useRef(false);

  const languageRef = useRef<string>(initialLanguage);
  const activeFilePathRef = useRef<string>(defaultInitialPath);
  const currentBoundPathRef = useRef<string | null>(null);

  // Panel Resizing Logic (Drag handle)
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    const startY = e.clientY;
    const startHeight = panelHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaY = startY - moveEvent.clientY;
      const newHeight = Math.min(Math.max(startHeight + deltaY, 90), 550);
      setPanelHeight(newHeight);
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

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

    // Initialize/Sync Folder Structure from Yjs
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

          const mainYText = ydoc.getText(`/src/solution.${ext}`);
          if (mainYText.length === 0) {
            mainYText.insert(0, initialCode || getDefaultCode(languageRef.current));
          }

          const utilsYText = ydoc.getText("/src/utils.cpp");
          if (utilsYText.length === 0) {
            utilsYText.insert(
              0,
              `// Utility functions & helpers\n#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nvoid printVector(const vector<int>& vec) {\n    for (int x : vec) cout << x << " ";\n    cout << endl;\n}\n`
            );
          }

          const headerYText = ydoc.getText("/include/solution.h");
          if (headerYText.length === 0) {
            headerYText.insert(
              0,
              `// Header definitions\n#pragma once\n#include <vector>\n\nclass Solution {\npublic:\n    void solve();\n};\n`
            );
          }

          const testYText = ydoc.getText("/tests/custom_input.txt");
          if (testYText.length === 0) {
            testYText.insert(0, `// Custom test inputs\n5\n10 20 30 40 50\n`);
          }

          const readmeYText = ydoc.getText("/README.md");
          if (readmeYText.length === 0) {
            readmeYText.insert(0, getDefaultCode("markdown"));
          }
        });
        setFiles(starterFiles);
        return;
      }
      setFiles(list);
    };

    syncFilesystem();
    filesystem.observe(syncFilesystem);

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

  const bindActiveFile = (filePath: string, lang: string, force = false) => {
    if (!editorRef.current || !ydocRef.current || !providerRef.current) return;

    if (!force && currentBoundPathRef.current === filePath && bindingRef.current) {
      return;
    }

    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    currentBoundPathRef.current = filePath;

    const ytext = ydocRef.current.getText(filePath);
    const targetDefaultCode = lang === initialLanguage && initialCode ? initialCode : getDefaultCode(lang);

    if (ytext.length === 0 && targetDefaultCode) {
      ydocRef.current.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, targetDefaultCode);
      });
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
    const filename = fullPath.split("/").pop() || "untitled";
    const lang = type === "file" ? getLanguageFromPath(fullPath) : undefined;
    const newEntry: WorkspaceFile = {
      type,
      path: fullPath,
      name: filename,
      language: lang,
    };
    const filesystem = ydocRef.current.getMap("filesystem");
    filesystem.set(fullPath, newEntry);

    if (type === "file") {
      const ytext = ydocRef.current.getText(fullPath);
      if (ytext.length === 0) {
        ytext.insert(0, getDefaultCode(lang || "plaintext"));
      }
      handleSelectFile(newEntry);
      toast.success(`Created file ${filename}`);
    } else {
      toast.success(`Created folder ${filename}`);
    }
  };

  const handleDeleteFile = (fullPath: string) => {
    if (!ydocRef.current) return;
    const filesystem = ydocRef.current.getMap("filesystem");
    filesystem.delete(fullPath);
    filesystem.forEach((val: any, key: string) => {
      if (key.startsWith(fullPath + "/")) {
        filesystem.delete(key);
      }
    });
    setOpenTabs((prev) => prev.filter((t) => t !== fullPath && !t.startsWith(fullPath + "/")));
    if (activeFilePath === fullPath || activeFilePath.startsWith(fullPath + "/")) {
      const remaining = files.filter((f) => f.path !== fullPath && !f.path.startsWith(fullPath + "/") && f.type === "file");
      if (remaining.length > 0) {
        handleSelectFile(remaining[0]);
      }
    }
    toast.info(`Deleted ${fullPath}`);
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
    setIsPanelOpen(true);
    setBottomDrawerTab("OUTPUT");

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

      setExecutionOutput(res.execution);
      if (onExecutionComplete) onExecutionComplete(res.execution);
      if (res.execution?.exitCode === 0) {
        toast.success("Code executed successfully in sandbox.");
      } else {
        toast.error(`Code execution exited with code ${res.execution?.exitCode || 1}`);
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

  const openPanelTab = (tab: "OUTPUT" | "TERMINAL" | "CHECKPOINTS") => {
    setBottomDrawerTab(tab);
    setIsPanelOpen(true);
  };

  return (
    <div ref={containerRef} className="flex h-full flex-col overflow-hidden rounded-xl border border-[#222222] bg-[#141414] text-white shadow-2xl">
      {/* Top Header & Main Toolbar */}
      <div className="flex items-center justify-between border-b border-[#252526] bg-[#181818] px-3 py-1.5 flex-shrink-0 select-none">
        <div className="flex items-center gap-2">
          {/* File Explorer Toggle Button */}
          <button
            type="button"
            onClick={() => setIsExplorerOpen(!isExplorerOpen)}
            title={isExplorerOpen ? "Hide File Explorer" : "Show File Explorer"}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-mono border transition ${
              isExplorerOpen
                ? "bg-[#252525] text-[#7EE0C5] border-[#2A9D7B]"
                : "bg-[#1E1E1E] text-[#AAAAAA] border-[#333333] hover:text-white"
            }`}
          >
            {isExplorerOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
            <span className="font-semibold text-[11px]">Explorer</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-[#888888] ml-1">
            <span className={`h-2 w-2 rounded-full ${synced ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-amber-400 animate-pulse"}`} />
            <span className="text-[11px] hidden sm:inline">{synced ? "CRDT Synced" : "Connecting..."}</span>
          </div>

          {activePeers.length > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-[#2A9D7B]/20 px-2 py-0.5 text-[11px] text-[#7EE0C5]">
              <Users className="h-2.5 w-2.5" />
              <span>{activePeers.length} peer(s)</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openPanelTab("CHECKPOINTS")}
            title="Open Code Timeline & Version Checkpoints"
            className="flex items-center gap-1.5 rounded border border-[#3A3A3A] bg-[#1E1E1E] px-2.5 py-1 text-[11px] text-[#CCCCCC] transition hover:border-[#2A9D7B] hover:text-white"
          >
            <History className="h-3 w-3 text-[#2A9D7B]" />
            <span>Timeline</span>
          </button>

          <button
            type="button"
            onClick={handleFormatDocument}
            disabled={readOnly || executing}
            title="Format document"
            className="flex items-center gap-1 rounded border border-[#3A3A3A] bg-[#1E1E1E] px-2.5 py-1 text-[11px] text-[#CCCCCC] transition hover:border-[#2A9D7B] hover:text-white disabled:opacity-45"
          >
            <Wand2 className="h-3 w-3" />
            <span>Format</span>
          </button>

          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={readOnly || executing}
            aria-label="Active language"
            className="rounded border border-[#3A3A3A] bg-[#1E1E1E] px-2.5 py-1 text-xs font-semibold text-white outline-none hover:border-[#2A9D7B] focus:ring-1 focus:ring-[#2A9D7B]"
          >
            {allowedLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
          </select>

          <button
            onClick={handleReset}
            disabled={readOnly || executing}
            title="Reset code template"
            className="rounded border border-[#3A3A3A] bg-[#1E1E1E] p-1 text-[#888888] hover:border-[#2A9D7B] hover:text-white transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleRunCode}
            disabled={executing || readOnly}
            className="flex items-center gap-1.5 rounded bg-[#2A9D7B] px-3.5 py-1 font-sans text-xs font-semibold text-white shadow transition hover:bg-[#238266] disabled:opacity-50 cursor-pointer"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Run Code</span>
          </button>
        </div>
      </div>

      {/* Middle Workspace Area (Explorer Sidebar + Editor Canvas) */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* VS Code Style Folder Structure Explorer Sidebar */}
        {isExplorerOpen && (
          <FileExplorer
            files={files}
            activeFilePath={activeFilePath}
            onSelectFile={handleSelectFile}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            readOnly={readOnly}
          />
        )}

        {/* Editor Main Canvas with Tabs */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#1E1E1E]">
          {/* Open Tabs Bar */}
          <div className="flex items-center h-8 bg-[#181818] border-b border-[#252526] overflow-x-auto px-1 gap-1 flex-shrink-0 select-none scrollbar-none">
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
                  className={`group flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono rounded-t cursor-pointer border-t-2 transition flex-shrink-0 ${
                    isActive
                      ? "bg-[#1E1E1E] text-white border-[#2A9D7B] font-medium shadow-sm"
                      : "bg-[#141414] text-[#888888] border-transparent hover:bg-[#1C1C1C] hover:text-[#CCCCCC]"
                  }`}
                >
                  {getFileIcon(filename)}
                  <span className="truncate max-w-[120px]">{filename}</span>
                  {openTabs.length > 1 && (
                    <button
                      onClick={(e) => handleCloseTab(tabPath, e)}
                      title="Close Tab"
                      className="p-0.5 text-[#666666] hover:text-white rounded hover:bg-[#333333] transition"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Monaco Editor Canvas */}
          <div className="flex-1 relative overflow-hidden">
            <Editor
              height="100%"
              language={getMonacoLanguage(language)}
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
                padding: { top: 10, bottom: 10 },
              }}
            />
          </div>
        </div>
      </div>

      {/* Resizable & Collapsible VS Code Style Bottom Panel */}
      {isPanelOpen ? (
        <div
          style={{ height: isPanelMaximized ? "75%" : `${panelHeight}px` }}
          className="flex-shrink-0 flex flex-col border-t border-[#252526] bg-[#0E1117] relative transition-[height] duration-75"
        >
          {/* Top Drag-to-Resize Handle */}
          {!isPanelMaximized && (
            <div
              onMouseDown={handleMouseDownResize}
              className="absolute -top-1 left-0 right-0 h-2 cursor-row-resize z-20 hover:bg-[#2A9D7B]/40 transition-colors"
              title="Drag to resize panel"
            />
          )}

          {/* VS Code Style Header with Tab Buttons & Right Control Actions */}
          <div className="flex h-8 items-center justify-between bg-[#161B22] px-2 border-b border-[#21262D] text-xs font-mono select-none">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setBottomDrawerTab("OUTPUT")}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 transition ${
                  bottomDrawerTab === "OUTPUT"
                    ? "bg-[#21262D] text-[#7EE0C5] font-semibold border-b-2 border-[#2A9D7B]"
                    : "text-[#8B949E] hover:text-white"
                }`}
              >
                <Play className="h-3 w-3" />
                <span>Output & Execution</span>
              </button>

              <button
                onClick={() => setBottomDrawerTab("TERMINAL")}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 transition ${
                  bottomDrawerTab === "TERMINAL"
                    ? "bg-[#21262D] text-[#7EE0C5] font-semibold border-b-2 border-[#2A9D7B]"
                    : "text-[#8B949E] hover:text-white"
                }`}
              >
                <TermIcon className="h-3 w-3" />
                <span>Terminal (fish)</span>
              </button>

              <button
                onClick={() => setBottomDrawerTab("CHECKPOINTS")}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 transition ${
                  bottomDrawerTab === "CHECKPOINTS"
                    ? "bg-[#21262D] text-[#7EE0C5] font-semibold border-b-2 border-[#2A9D7B]"
                    : "text-[#8B949E] hover:text-white"
                }`}
              >
                <History className="h-3 w-3" />
                <span>Checkpoints</span>
              </button>
            </div>

            {/* VS Code Style Action Controls on the Right (Maximize, Clear, Close X) */}
            <div className="flex items-center gap-1 text-[#8B949E]">
              <button
                onClick={() => setIsPanelMaximized(!isPanelMaximized)}
                title={isPanelMaximized ? "Restore panel size" : "Maximize panel size"}
                className="rounded p-1 hover:bg-[#21262D] hover:text-white transition"
              >
                {isPanelMaximized ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
              </button>

              <button
                onClick={() => setIsPanelOpen(false)}
                title="Close panel (can reopen from bottom status bar)"
                className="rounded p-1 hover:bg-[#21262D] hover:text-white transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Panel Viewport */}
          <div className="flex-1 overflow-hidden">
            {bottomDrawerTab === "OUTPUT" ? (
              <ExecutionPanel
                executing={executing}
                output={executionOutput}
                language={language}
                customInput={customInput}
                setCustomInput={setCustomInput}
                onRunCode={handleRunCode}
                readOnly={readOnly}
              />
            ) : bottomDrawerTab === "TERMINAL" ? (
              <TerminalPanel
                sessionId={sessionId}
                roomKey={roomKey}
                token={token ?? undefined}
                readOnly={readOnly}
              />
            ) : (
              <CheckpointTimeline
                sessionId={sessionId}
                token={token ?? undefined}
                onRestoreComplete={handleRestoreComplete}
                readOnly={readOnly}
              />
            )}
          </div>
        </div>
      ) : null}

      {/* Editor Status Bar with Quick Panel Toggles */}
      <div className="flex h-6 items-center justify-between border-t border-[#252526] bg-[#141414] px-3 font-mono text-[10px] text-[#888888] flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[#CCCCCC]">
            <Braces className="h-3 w-3 text-[#2A9D7B]" />
            {activeFilePath} · {language.toUpperCase()}
          </span>

          <button
            onClick={() => openPanelTab("OUTPUT")}
            className="hover:text-[#7EE0C5] transition flex items-center gap-1 cursor-pointer"
          >
            <span>Output</span>
          </button>

          <button
            onClick={() => openPanelTab("TERMINAL")}
            className="hover:text-[#7EE0C5] transition flex items-center gap-1 cursor-pointer"
          >
            <span>Terminal</span>
          </button>

          <button
            onClick={() => openPanelTab("CHECKPOINTS")}
            className="hover:text-[#7EE0C5] transition flex items-center gap-1 cursor-pointer"
          >
            <History className="h-2.5 w-2.5 text-[#2A9D7B]" />
            <span>Timeline</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className={`${lspStatus === "ready" ? "text-emerald-400" : "text-amber-400"}`}>
            LSP {lspStatus.toUpperCase()}
          </span>
          <span>
            Ln {editorStats.lines}, Col {editorStats.characters}
          </span>
        </div>
      </div>
    </div>
  );
}
