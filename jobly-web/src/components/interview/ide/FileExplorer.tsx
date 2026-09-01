import React, { useState } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  FilePlus,
  FolderPlus,
  Trash2,
  ChevronRight,
  ChevronDown,
  File,
} from "lucide-react";

export interface WorkspaceFile {
  type: "file" | "directory";
  path: string;
  name: string;
  language?: string;
  parentId?: string | null;
}

interface FileExplorerProps {
  files: WorkspaceFile[];
  activeFilePath: string;
  onSelectFile: (file: WorkspaceFile) => void;
  onCreateFile: (path: string, type: "file" | "directory") => void;
  onDeleteFile: (path: string) => void;
  readOnly?: boolean;
}

const SW = 1.75;

export function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "cpp" || ext === "cc" || ext === "cxx" || ext === "h" || ext === "hpp") {
    return <FileCode strokeWidth={SW} className="h-4 w-4 text-iv-info" />;
  }
  if (ext === "py") {
    return <FileCode strokeWidth={SW} className="h-4 w-4 text-iv-warning" />;
  }
  if (ext === "js" || ext === "jsx") {
    return <FileCode strokeWidth={SW} className="h-4 w-4 text-yellow-400" />;
  }
  if (ext === "ts" || ext === "tsx") {
    return <FileCode strokeWidth={SW} className="h-4 w-4 text-cyan-400" />;
  }
  if (ext === "java") {
    return <FileCode strokeWidth={SW} className="h-4 w-4 text-iv-danger" />;
  }
  if (ext === "json") {
    return <FileJson strokeWidth={SW} className="h-4 w-4 text-iv-success" />;
  }
  if (ext === "md" || ext === "txt") {
    return <FileText strokeWidth={SW} className="h-4 w-4 text-iv-muted" />;
  }
  return <File strokeWidth={SW} className="h-4 w-4 text-iv-dim" />;
}

export function FileExplorer({
  files,
  activeFilePath,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  readOnly = false,
}: FileExplorerProps) {
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isCreating, setIsCreating] = useState<{ parentDir: string; type: "file" | "directory" } | null>(null);
  const [newEntryName, setNewEntryName] = useState("");

  const toggleFolder = (folderPath: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [folderPath]: !prev[folderPath] }));
  };

  const handleStartCreate = (parentDir: string, type: "file" | "directory", e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCreating({ parentDir, type });
    setNewEntryName("");
  };

  const handleCommitCreate = () => {
    if (!newEntryName.trim() || !isCreating) {
      setIsCreating(null);
      return;
    }
    const cleanName = newEntryName.trim().replace(/^\/+/, "");
    const fullPath = isCreating.parentDir === "/"
      ? `/${cleanName}`
      : `${isCreating.parentDir}/${cleanName}`;

    onCreateFile(fullPath, isCreating.type);
    setIsCreating(null);
    setNewEntryName("");
  };

  // Build hierarchical folder tree from flat list
  const directories = files.filter((f) => f.type === "directory");
  const regularFiles = files.filter((f) => f.type === "file");

  // Group files by immediate parent folder
  const getChildren = (parentPath: string) => {
    const childDirs = directories.filter((d) => {
      const parts = d.path.split("/").filter(Boolean);
      const parentParts = parentPath.split("/").filter(Boolean);
      return parts.length === parentParts.length + 1 && d.path.startsWith(parentPath === "/" ? "/" : parentPath + "/");
    });

    const childFiles = regularFiles.filter((f) => {
      const parts = f.path.split("/").filter(Boolean);
      const parentParts = parentPath.split("/").filter(Boolean);
      return parts.length === parentParts.length + 1 && f.path.startsWith(parentPath === "/" ? "/" : parentPath + "/");
    });

    return { childDirs, childFiles };
  };

  const renderFolderContent = (currentPath: string, level = 0) => {
    const { childDirs, childFiles } = getChildren(currentPath);

    return (
      <div className="space-y-0.5">
        {/* Render child directories */}
        {childDirs.map((dir) => {
          const isCollapsed = !!collapsedFolders[dir.path];
          return (
            <div key={dir.path} className="flex flex-col">
              <div
                onClick={() => toggleFolder(dir.path)}
                className="group flex cursor-pointer select-none items-center justify-between rounded py-1 px-1.5 text-iv-muted transition hover:bg-iv-elevated hover:text-iv-text"
                style={{ paddingLeft: `${Math.max(6, level * 14 + 6)}px` }}
              >
                <div className="flex items-center gap-1.5 truncate text-[11px]">
                  {isCollapsed ? (
                    <ChevronRight strokeWidth={SW} className="h-3 w-3 shrink-0 text-iv-dim" />
                  ) : (
                    <ChevronDown strokeWidth={SW} className="h-3 w-3 shrink-0 text-iv-dim" />
                  )}
                  {isCollapsed ? (
                    <Folder strokeWidth={SW} className="h-4 w-4 shrink-0 text-iv-warning" />
                  ) : (
                    <FolderOpen strokeWidth={SW} className="h-4 w-4 shrink-0 text-iv-warning" />
                  )}
                  <span className="truncate font-medium">{dir.name}</span>
                </div>

                {!readOnly && (
                  <div className="hidden items-center gap-1 opacity-80 group-hover:flex">
                    <button
                      onClick={(e) => handleStartCreate(dir.path, "file", e)}
                      title="New File in folder"
                      className="iv-icon-btn iv-icon-btn-sm"
                    >
                      <FilePlus strokeWidth={SW} className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete folder ${dir.path} and all its contents?`)) {
                          onDeleteFile(dir.path);
                        }
                      }}
                      title="Delete folder"
                      className="iv-icon-btn iv-icon-btn-sm hover:!text-iv-danger"
                    >
                      <Trash2 strokeWidth={SW} className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Recursive folder children */}
              {!isCollapsed && renderFolderContent(dir.path, level + 1)}
            </div>
          );
        })}

        {/* Inline input when creating inside this folder */}
        {isCreating && isCreating.parentDir === currentPath && (
          <div
            className="my-0.5 flex items-center gap-1.5 rounded border border-iv-accent bg-iv-surface-alt px-2 py-1"
            style={{ marginLeft: `${level * 14 + 6}px` }}
          >
            {isCreating.type === "file" ? (
              <FileCode strokeWidth={SW} className="h-4 w-4 text-iv-accent" />
            ) : (
              <Folder strokeWidth={SW} className="h-4 w-4 text-iv-warning" />
            )}
            <input
              type="text"
              autoFocus
              value={newEntryName}
              onChange={(e) => setNewEntryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCommitCreate();
                if (e.key === "Escape") setIsCreating(null);
              }}
              onBlur={handleCommitCreate}
              placeholder={isCreating.type === "file" ? "filename.cpp" : "folder_name"}
              className="flex-1 bg-transparent font-iv-code text-[11px] text-iv-text outline-none placeholder:text-iv-dim"
            />
          </div>
        )}

        {/* Render child files */}
        {childFiles.map((f) => {
          const isActive = activeFilePath === f.path;
          return (
            <div
              key={f.path}
              onClick={() => onSelectFile(f)}
              className={`group flex cursor-pointer select-none items-center justify-between rounded py-1 px-1.5 transition ${
                isActive
                  ? "border-l-2 border-iv-accent bg-iv-accent-surface font-semibold text-iv-accent-glow"
                  : "text-iv-muted hover:bg-iv-elevated hover:text-iv-text"
              }`}
              style={{ paddingLeft: `${Math.max(18, level * 14 + 18)}px` }}
            >
              <div className="flex items-center gap-1.5 truncate text-[11px]">
                {getFileIcon(f.name)}
                <span className="truncate">{f.name}</span>
              </div>

              {!readOnly && f.path !== "/src/solution.cpp" && f.path !== "/solution.cpp" && f.path !== "/solution.py" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete file ${f.name}?`)) {
                      onDeleteFile(f.path);
                    }
                  }}
                  title="Delete file"
                  className="iv-icon-btn iv-icon-btn-sm hidden group-hover:flex hover:!text-iv-danger"
                >
                  <Trash2 strokeWidth={SW} className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-full w-56 shrink-0 select-none flex-col border-r border-iv-line bg-iv-surface text-iv-text">
      {/* Explorer Header */}
      <div className="iv-header-panel h-8 shrink-0 justify-between px-2.5 text-[10px] font-bold uppercase tracking-wider text-iv-muted">
        <span>Explorer</span>

        {!readOnly && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => handleStartCreate("/", "file", e)}
              title="New File at root"
              className="iv-icon-btn iv-icon-btn-sm"
            >
              <FilePlus strokeWidth={SW} className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => handleStartCreate("/", "directory", e)}
              title="New Folder at root"
              className="iv-icon-btn iv-icon-btn-sm"
            >
              <FolderPlus strokeWidth={SW} className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Root Workspace Folder Label */}
      <div className="flex items-center justify-between border-b border-iv-line px-2 py-1.5 text-[10px] text-iv-dim">
        <span className="font-semibold uppercase tracking-tight text-iv-muted">Workspace Root</span>
        <span className="font-num text-[9px]">{files.length} items</span>
      </div>

      {/* Files & Folder Structure List */}
      <div className="iv-scroll flex-1 overflow-y-auto p-1.5">{renderFolderContent("/")}</div>
    </div>
  );
}
