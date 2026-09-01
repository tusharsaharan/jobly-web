import React from "react";
import {
  Search,
  FolderTree,
  Play,
  Puzzle,
  Settings,
} from "lucide-react";

export type ActivityType = "EXPLORER" | "SEARCH" | "RUN_DEBUG" | "EXTENSIONS" | "SETTINGS";

interface ActivityBarProps {
  active: ActivityType;
  onChange: (activity: ActivityType) => void;
}

const activities: { id: ActivityType; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; label: string }[] = [
  { id: "SEARCH", icon: Search, label: "Search" },
  { id: "EXPLORER", icon: FolderTree, label: "Explorer" },
  { id: "RUN_DEBUG", icon: Play, label: "Run and Debug" },
  { id: "EXTENSIONS", icon: Puzzle, label: "Problem Statement" },
  { id: "SETTINGS", icon: Settings, label: "Settings" },
];

export function ActivityBar({ active, onChange }: ActivityBarProps) {
  return (
    <div className="iv-activity-bar">
      {activities.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`iv-activity-item ${active === id ? "active" : ""}`}
          title={label}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}
