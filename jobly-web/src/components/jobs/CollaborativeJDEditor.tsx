import { useState, useEffect } from "react";
import { Users, Wifi, Share2, Check, Copy } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

type CollaborativeJDEditorProps = {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  jobDraftId?: string;
};

export function CollaborativeJDEditor({
  value,
  onChange,
  disabled,
  jobDraftId = "new-draft",
}: CollaborativeJDEditorProps) {
  const { user } = useAuth();
  const [isCollabActive, setIsCollabActive] = useState(false);
  const [activePeers, setActivePeers] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isCollabActive) {
      // Simulate connected collaborator presence
      setActivePeers([user?.name || "You (Lead Recruiter)", "Hiring Manager"]);
    } else {
      setActivePeers([]);
    }
  }, [isCollabActive, user]);

  const copyShareLink = () => {
    const url = `${window.location.origin}/post-job?collabRoom=${jobDraftId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Collaboration room link copied to clipboard.");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCollabActive(!isCollabActive)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition-colors ${
              isCollabActive
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-border bg-panel text-ink/70 hover:text-ink"
            }`}
          >
            <Wifi className={`h-3.5 w-3.5 ${isCollabActive ? "text-emerald-500 animate-pulse" : ""}`} />
            <span>{isCollabActive ? "Live Collaboration Active" : "Enable Live Co-authoring"}</span>
          </button>

          {isCollabActive && (
            <div className="flex items-center gap-1.5 text-xs text-ink/60">
              <Users className="h-3.5 w-3.5 text-emerald-600" />
              <span>{activePeers.length} active editors</span>
            </div>
          )}
        </div>

        {isCollabActive && (
          <button
            type="button"
            onClick={copyShareLink}
            className="inline-flex items-center gap-1 text-xs font-medium text-ink/70 hover:text-ink transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
            <span>{copied ? "Link Copied" : "Share Session Link"}</span>
          </button>
        )}
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
        maxLength={8000}
        disabled={disabled}
        className="control-surface mt-1 w-full resize-y px-4 py-3 text-base placeholder:text-ink/30 focus:border-ink focus:outline-none disabled:opacity-50 font-sans leading-relaxed"
        placeholder="Describe the work, outcomes, and the person you need. Collaborative live edits will reflect in real time."
      />
    </div>
  );
}
