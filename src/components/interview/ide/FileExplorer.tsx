import React, { useState } from "react";
import {
  FileCode,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
} from "lucide-react";
import { toast } from "sonner";
import { apiCall } from "@/lib/api";

export interface FileItem {
  type: "file" | "directory";
  name: string;
  path: string;
  language?: string;
  content?: string;
}

interface FileExplorerProps {
  sessionId: string;
  token?: string;
  files: FileItem[];
  activeFile: string;
  onFileSelect: (path: string) => void;
  onRefresh: () => void;
  onFileRenamed?: (oldPath: string, newPath: string) => void;
  readOnly?: boolean;
}

export function FileExplorer({
  sessionId,
  token,
  files,
  activeFile,
  onFileSelect,
  onRefresh,
  onFileRenamed,
  readOnly = false,
}: FileExplorerProps) {
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [creatingType, setCreatingType] = useState<"file" | "folder" | null>(null);
  const [newPathInput, setNewPathInput] = useState<string>("");
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renamePathInput, setRenamePathInput] = useState<string>("");

  const toggleFolder = (path: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPathInput.trim()) return;

    const fileName = newPathInput.trim().split("/").pop() || newPathInput.trim();
    const ext = fileName.split(".").pop();
    let language = "python";
    if (ext === "js") language = "javascript";
    if (ext === "ts" || ext === "tsx") language = "typescript";
    if (ext === "cpp" || ext === "cc") language = "cpp";
    if (ext === "java") language = "java";

    try {
      if (creatingType === "file") {
        await apiCall(
          `/coding/${sessionId}/files`,
          "POST",
          {
            name: fileName,
            path: newPathInput.trim(),
            language,
          },
          token,
        );
        toast.success(`Created file ${fileName}`);
        onFileSelect(
          newPathInput.trim().startsWith("/") ? newPathInput.trim() : `/${newPathInput.trim()}`,
        );
      } else {
        await apiCall(
          `/coding/${sessionId}/directories`,
          "POST",
          {
            path: newPathInput.trim(),
          },
          token,
        );
        toast.success(`Created folder ${fileName}`);
      }
      setCreatingType(null);
      setNewPathInput("");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed creating item");
    }
  };

  const handleDeleteFile = async (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    if (readOnly) return;
    if (!confirm(`Delete ${path}?`)) return;

    try {
      await apiCall(`/coding/${sessionId}/files`, "DELETE", { path }, token);
      toast.success(`Deleted ${path}`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed deleting file");
    }
  };

  const handleRenameFile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!renamingPath || !renamePathInput.trim()) return;
    const newPath = renamePathInput.trim().startsWith("/")
      ? renamePathInput.trim()
      : `/${renamePathInput.trim()}`;
    try {
      await apiCall(
        `/coding/${sessionId}/files/rename`,
        "PUT",
        {
          oldPath: renamingPath,
          newPath,
          newName: newPath.split("/").pop(),
        },
        token,
      );
      toast.success(`Renamed to ${newPath}`);
      onFileRenamed?.(renamingPath, newPath);
      setRenamingPath(null);
      setRenamePathInput("");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed renaming file");
    }
  };

  return (
    <div className="flex h-full flex-col border-r border-[#2A2A2A] bg-[#141414] text-[#CCCCCC] select-none text-xs font-mono">
      {/* Explorer Header */}
      <div className="flex h-9 items-center justify-between border-b border-[#2A2A2A] px-3 font-semibold uppercase tracking-wider text-[#888888]">
        <span>Explorer</span>
        {!readOnly && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setCreatingType("file");
                setNewPathInput("");
              }}
              title="New File"
              className="rounded p-1 hover:bg-[#2A2A2A] hover:text-white transition"
            >
              <FilePlus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setCreatingType("folder");
                setNewPathInput("");
              }}
              title="New Folder"
              className="rounded p-1 hover:bg-[#2A2A2A] hover:text-white transition"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Inline Create Input */}
      {creatingType && (
        <form onSubmit={handleCreateFile} className="border-b border-[#2A2A2A] p-2 bg-[#1C1C1C]">
          <div className="flex items-center gap-1 mb-1 text-[11px] text-[#888888]">
            {creatingType === "file" ? (
              <FileCode className="h-3 w-3 text-[#2A9D7B]" />
            ) : (
              <Folder className="h-3 w-3 text-[#F4A261]" />
            )}
            <span>New {creatingType === "file" ? "File" : "Folder"} Path:</span>
          </div>
          <input
            type="text"
            value={newPathInput}
            onChange={(e) => setNewPathInput(e.target.value)}
            placeholder={creatingType === "file" ? "/utils/helper.py" : "/src"}
            autoFocus
            className="w-full rounded border border-[#333333] bg-[#0E0E0E] px-2 py-1 text-xs text-white outline-none focus:border-[#2A9D7B]"
          />
          <div className="mt-1.5 flex justify-end gap-1.5 text-[10px]">
            <button
              type="button"
              onClick={() => setCreatingType(null)}
              className="rounded px-2 py-0.5 text-[#888888] hover:bg-[#2A2A2A]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-[#2A9D7B] px-2 py-0.5 font-semibold text-white hover:bg-[#238266]"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {renamingPath && (
        <form onSubmit={handleRenameFile} className="border-b border-[#2A2A2A] bg-[#1C1C1C] p-2">
          <label
            htmlFor="rename-workspace-file"
            className="mb-1 flex items-center gap-1 text-[11px] text-[#bcbcbc]"
          >
            <Edit2 className="h-3 w-3 text-[#2A9D7B]" /> Rename or move file
          </label>
          <input
            id="rename-workspace-file"
            type="text"
            value={renamePathInput}
            onChange={(e) => setRenamePathInput(e.target.value)}
            autoFocus
            className="w-full rounded border border-[#555] bg-[#0E0E0E] px-2 py-1 text-xs text-white outline-none focus:border-[#2A9D7B] focus:ring-2 focus:ring-[#2A9D7B]/35"
          />
          <div className="mt-1.5 flex justify-end gap-1.5 text-[10px]">
            <button
              type="button"
              onClick={() => setRenamingPath(null)}
              className="rounded px-2 py-1 text-[#aaa] transition hover:bg-[#2A2A2A] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7ee0c5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-[#2A9D7B] px-2 py-1 font-semibold text-white transition hover:bg-[#238266] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7ee0c5]"
            >
              Rename
            </button>
          </div>
        </form>
      )}

      {/* Files List */}
      <div className="flex-1 overflow-y-auto p-1.5">
        {files.length === 0 ? (
          <div className="p-3 text-center text-[#666666] text-[11px]">No files in workspace</div>
        ) : (
          [...files]
            .sort(
              (left, right) =>
                left.type.localeCompare(right.type) || left.path.localeCompare(right.path),
            )
            .map((file) => {
              const isSelected = activeFile === file.path;
              return (
                <div
                  key={file.path}
                  onClick={() => file.type === "file" && onFileSelect(file.path)}
                  className={`group flex items-center justify-between rounded px-2 py-1.5 cursor-pointer transition ${
                    isSelected
                      ? "bg-[#2A9D7B]/20 text-[#2A9D7B] font-semibold"
                      : "hover:bg-[#222222] text-[#AAAAAA]"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {file.type === "directory" ? (
                      <Folder className="h-3.5 w-3.5 text-[#F4A261]" />
                    ) : (
                      <FileCode
                        className={`h-3.5 w-3.5 ${isSelected ? "text-[#2A9D7B]" : "text-[#777777]"}`}
                      />
                    )}
                    <span className="truncate">{file.path}</span>
                  </div>

                  {!readOnly && file.type === "file" && file.path !== "/solution.py" && (
                    <div className="flex items-center opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingPath(file.path);
                          setRenamePathInput(file.path);
                        }}
                        title="Rename file"
                        aria-label={`Rename ${file.path}`}
                        className="rounded p-0.5 hover:bg-[#2A9D7B]/20 hover:text-[#7ee0c5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7ee0c5]"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteFile(e, file.path)}
                        title="Delete File"
                        aria-label={`Delete ${file.path}`}
                        className="rounded p-0.5 hover:bg-rose-500/20 hover:text-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
