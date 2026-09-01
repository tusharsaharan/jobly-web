import { useState, useEffect } from "react";
import { Layers, X, Plus, Check, Trash2, ArrowRight, Tag, BookmarkPlus, Loader2 } from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

type RequirementBlock = {
  _id: string;
  name: string;
  category: "benefits" | "requirements" | "responsibilities" | "qualifications" | "culture";
  content: string;
  skills: string[];
  usageCount: number;
  isDefault?: boolean;
};

type RequirementBlocksDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onInsertContent: (content: string) => void;
  onAppendSkills: (skills: string[]) => void;
  selectedText?: string;
};

export function RequirementBlocksDrawer({
  isOpen,
  onClose,
  onInsertContent,
  onAppendSkills,
  selectedText = "",
}: RequirementBlocksDrawerProps) {
  const { token } = useAuth();
  const [blocks, setBlocks] = useState<RequirementBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreating, setIsCreating] = useState(false);
  const [newBlockName, setNewBlockName] = useState("");
  const [newBlockCategory, setNewBlockCategory] = useState<string>("requirements");
  const [newBlockContent, setNewBlockContent] = useState("");
  const [newBlockSkills, setNewBlockSkills] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBlocks();
      if (selectedText.trim()) {
        setNewBlockContent(selectedText.trim());
        setIsCreating(true);
      }
    }
  }, [isOpen, selectedText]);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const res = await apiCall<{ blocks: RequirementBlock[] }>("/jobs/blocks", "GET", undefined, token);
      if (res?.blocks) {
        setBlocks(res.blocks);
      }
    } catch (err) {
      console.error("Failed to load requirement blocks", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockName.trim() || !newBlockContent.trim()) {
      toast.error("Please enter both a block name and content.");
      return;
    }

    setSaving(true);
    try {
      const skillsArray = newBlockSkills
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const created = await apiCall<RequirementBlock>("/jobs/blocks", "POST", {
        name: newBlockName.trim(),
        category: newBlockCategory,
        content: newBlockContent.trim(),
        skills: skillsArray,
      }, token);

      setBlocks((prev) => [created, ...prev]);
      setIsCreating(false);
      setNewBlockName("");
      setNewBlockContent("");
      setNewBlockSkills("");
      toast.success("Requirement block saved successfully.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create requirement block.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      await apiCall(`/jobs/blocks/${id}`, "DELETE", undefined, token);
      setBlocks((prev) => prev.filter((b) => b._id !== id));
      toast.success("Block removed.");
    } catch (err: any) {
      toast.error(err?.message || "Could not delete block.");
    }
  };

  const handleInsert = async (block: RequirementBlock) => {
    onInsertContent(block.content);
    if (block.skills && block.skills.length > 0) {
      onAppendSkills(block.skills);
    }
    toast.success(`Inserted "${block.name}" (Snapshot copied to draft)`);
    
    // Record adoption metric
    try {
      await apiCall(`/jobs/blocks/${block._id}/use`, "POST", undefined, token);
    } catch (err) {
      // Non-blocking
    }
  };

  const filteredBlocks = selectedCategory === "all"
    ? blocks
    : blocks.filter((b) => b.category === selectedCategory);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="surface relative flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint text-ink">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold text-ink text-base">Requirement Blocks</h3>
              <p className="text-xs text-ink/60">Standardized modular criteria (Snapshot on insert)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink/50 transition-colors hover:bg-panel hover:text-ink"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex gap-1 overflow-x-auto border-b border-border/80 bg-panel/30 px-6 py-2.5 text-xs">
          {["all", "responsibilities", "qualifications", "benefits", "culture"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-md px-3 py-1 font-medium capitalize transition-colors ${
                selectedCategory === cat
                  ? "bg-ink text-cream"
                  : "text-ink/60 hover:bg-panel hover:text-ink"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Action Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-3 bg-panel/10">
          <span className="text-xs font-semibold text-ink/70">
            {filteredBlocks.length} Available Blocks
          </span>
          <button
            type="button"
            onClick={() => setIsCreating(!isCreating)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isCreating ? "Cancel" : "Create New Block"}</span>
          </button>
        </div>

        {/* Creation Form */}
        {isCreating && (
          <form onSubmit={handleCreateBlock} className="border-b border-border bg-panel/40 p-5 space-y-3.5 text-xs animate-in slide-in-from-top-2">
            <p className="font-semibold text-ink">Save Custom Requirement Block</p>
            <div>
              <label className="block marker-num mb-1">Block Title</label>
              <input
                type="text"
                value={newBlockName}
                onChange={(e) => setNewBlockName(e.target.value)}
                placeholder="e.g. Distributed Systems Standards"
                className="control-surface w-full px-3 py-2 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block marker-num mb-1">Category</label>
                <select
                  value={newBlockCategory}
                  onChange={(e) => setNewBlockCategory(e.target.value)}
                  className="control-surface w-full px-3 py-2 text-xs"
                >
                  <option value="requirements">Requirements</option>
                  <option value="responsibilities">Responsibilities</option>
                  <option value="qualifications">Qualifications</option>
                  <option value="benefits">Benefits</option>
                  <option value="culture">Culture / DEI</option>
                </select>
              </div>
              <div>
                <label className="block marker-num mb-1">Associated Skills</label>
                <input
                  type="text"
                  value={newBlockSkills}
                  onChange={(e) => setNewBlockSkills(e.target.value)}
                  placeholder="Go, Docker, Kafka"
                  className="control-surface w-full px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block marker-num mb-1">Content (Markdown)</label>
              <textarea
                value={newBlockContent}
                onChange={(e) => setNewBlockContent(e.target.value)}
                placeholder="Bullet points or rich criteria..."
                rows={4}
                className="control-surface w-full px-3 py-2 text-xs resize-y"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="pill-mint inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
              Save Block
            </button>
          </form>
        )}

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
              <p className="text-xs text-ink/60">Loading blocks...</p>
            </div>
          )}

          {!loading && filteredBlocks.length === 0 && (
            <div className="py-12 text-center text-xs text-ink/50">
              <p>No requirement blocks found in this category.</p>
              <p className="mt-1">Create one above to standardize your postings.</p>
            </div>
          )}

          {filteredBlocks.map((block) => (
            <div
              key={block._id}
              className="rounded-xl border border-border/80 bg-panel/30 p-4 text-xs space-y-2.5 transition-colors hover:border-border"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink text-sm">{block.name}</p>
                    {block.isDefault && (
                      <span className="rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-medium text-ink/70">
                        Platform Standard
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-ink/50 capitalize mt-0.5">{block.category} • Used {block.usageCount} times</p>
                </div>
                {!block.isDefault && (
                  <button
                    onClick={() => handleDeleteBlock(block._id)}
                    className="rounded p-1 text-ink/40 hover:text-red-500 transition-colors"
                    title="Delete custom block"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="max-h-32 overflow-y-auto rounded-lg border border-border/40 bg-background/50 p-2.5 font-mono text-[11px] text-ink/80 whitespace-pre-wrap leading-relaxed">
                {block.content}
              </div>

              {block.skills && block.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {block.skills.map((s, idx) => (
                    <span key={idx} className="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                      <Tag className="h-2.5 w-2.5" />
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={() => handleInsert(block)}
                  className="pill-mint inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
                >
                  <span>Insert into Description</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
