import React from "react";
import {
  Search,
  FolderTree,
  Play,
  FileText,
  Settings,
} from "lucide-react";

export type ActivityType = "EXPLORER" | "SEARCH" | "RUN_DEBUG" | "PROBLEM" | "SETTINGS";

interface ActivityBarProps {
  active: ActivityType;
  onChange: (activity: ActivityType) => void;
}

const mainActivities: { id: ActivityType; icon: React.ElementType; label: string }[] = [
  { id: "EXPLORER", icon: FolderTree, label: "Explorer (Ctrl+Shift+E)" },
  { id: "SEARCH", icon: Search, label: "Search (Ctrl+Shift+F)" },
  { id: "RUN_DEBUG", icon: Play, label: "Run and Debug" },
  { id: "PROBLEM", icon: FileText, label: "Problem Statement" },
];

export function ActivityBar({ active, onChange }: ActivityBarProps) {
  return (
    <div className="iv-activity-bar justify-between h-full select-none">
      {/* Top Primary Activities */}
      <div className="flex flex-col items-center gap-1 w-full">
        {mainActivities.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`iv-activity-item ${active === id ? "active" : ""}`}
            title={label}
            aria-label={label}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </button>
        ))}
      </div>

      {/* Bottom Pinned Activities (Settings) */}
      <div className="flex flex-col items-center gap-1 w-full mt-auto">
        <button
          type="button"
          onClick={() => onChange("SETTINGS")}
          className={`iv-activity-item ${active === "SETTINGS" ? "active" : ""}`}
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.6} />
        </button>
      </div>
    </div>
  );
}
