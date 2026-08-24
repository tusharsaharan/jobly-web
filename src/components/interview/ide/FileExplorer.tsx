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
  Code2,
  File
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

export function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "cpp" || ext === "cc" || ext === "cxx" || ext === "h" || ext === "hpp") {
    return <FileCode className="h-3.5 w-3.5 text-blue-400" />;
  }
  if (ext === "py") {
    return <FileCode className="h-3.5 w-3.5 text-amber-400" />;
  }
  if (ext === "js" || ext === "jsx") {
    return <FileCode className="h-3.5 w-3.5 text-yellow-400" />;
  }
  if (ext === "ts" || ext === "tsx") {
    return <FileCode className="h-3.5 w-3.5 text-cyan-400" />;
  }
  if (ext === "java") {
    return <FileCode className="h-3.5 w-3.5 text-red-400" />;
  }
  if (ext === "json") {
    return <FileJson className="h-3.5 w-3.5 text-emerald-400" />;
  }
  if (ext === "md" || ext === "txt") {
    return <FileText className="h-3.5 w-3.5 text-[#AAAAAA]" />;
  }
  return <File className="h-3.5 w-3.5 text-[#888888]" />;
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
                className="group flex items-center justify-between py-1 px-1.5 rounded hover:bg-[#252525] cursor-pointer text-[#CCCCCC] transition select-none"
                style={{ paddingLeft: `${Math.max(6, level * 14 + 6)}px` }}
              >
                <div className="flex items-center gap-1.5 truncate text-[11px]">
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3 text-[#777777] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-[#777777] flex-shrink-0" />
                  )}
                  {isCollapsed ? (
                    <Folder className="h-3.5 w-3.5 text-[#F4A261] flex-shrink-0" />
                  ) : (
                    <FolderOpen className="h-3.5 w-3.5 text-[#F4A261] flex-shrink-0" />
                  )}
                  <span className="truncate font-medium">{dir.name}</span>
                </div>

                {!readOnly && (
                  <div className="hidden group-hover:flex items-center gap-1 opacity-80">
                    <button
                      onClick={(e) => handleStartCreate(dir.path, "file", e)}
                      title="New File in folder"
                      className="p-0.5 hover:text-white rounded hover:bg-[#333333]"
                    >
                      <FilePlus className="h-2.5 w-2.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete folder ${dir.path} and all its contents?`)) {
                          onDeleteFile(dir.path);
                        }
                      }}
                      title="Delete folder"
                      className="p-0.5 hover:text-rose-400 rounded hover:bg-[#333333]"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
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
            className="flex items-center gap-1.5 px-2 py-1 bg-[#1A1A1A] border border-[#2A9D7B] rounded my-0.5"
            style={{ marginLeft: `${level * 14 + 6}px` }}
          >
            {isCreating.type === "file" ? (
              <FileCode className="h-3.5 w-3.5 text-[#2A9D7B]" />
            ) : (
              <Folder className="h-3.5 w-3.5 text-[#F4A261]" />
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
              className="flex-1 bg-transparent text-[11px] text-white outline-none font-mono placeholder:text-[#555555]"
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
              className={`group flex items-center justify-between py-1 px-1.5 rounded cursor-pointer transition select-none ${
                isActive
                  ? "bg-[#2A9D7B]/20 text-[#7EE0C5] font-semibold border-l-2 border-[#2A9D7B]"
                  : "text-[#AAAAAA] hover:bg-[#202020] hover:text-[#E0E0E0]"
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
                  className="hidden group-hover:flex p-0.5 text-[#777777] hover:text-rose-400 rounded transition"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#121212] border-r border-[#262626] text-white font-mono text-xs select-none w-56 flex-shrink-0">
      {/* Explorer Header */}
      <div className="flex h-8 items-center justify-between px-2.5 border-b border-[#222222] bg-[#161616] text-[10px] uppercase tracking-wider text-[#888888] font-bold">
        <span>Explorer</span>

        {!readOnly && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => handleStartCreate("/", "file", e)}
              title="New File at root"
              className="p-1 text-[#888888] hover:text-white rounded hover:bg-[#242424] transition cursor-pointer"
            >
              <FilePlus className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => handleStartCreate("/", "directory", e)}
              title="New Folder at root"
              className="p-1 text-[#888888] hover:text-white rounded hover:bg-[#242424] transition cursor-pointer"
            >
              <FolderPlus className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Root Workspace Folder Label */}
      <div className="px-2 py-1.5 flex items-center justify-between text-[10px] text-[#777777] border-b border-[#1E1E1E]">
        <span className="font-semibold uppercase tracking-tight text-[#CCCCCC]">Workspace Root</span>
        <span className="text-[9px] text-[#555555]">{files.length} items</span>
      </div>

      {/* Files & Folder Structure List */}
      <div className="flex-1 overflow-y-auto p-1.5">
        {renderFolderContent("/")}
      </div>
    </div>
  );
}
