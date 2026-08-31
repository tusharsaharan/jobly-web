import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Command } from "cmdk";
import {
  Award,
  Briefcase,
  Compass,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  Video,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

type Item = {
  id: string;
  label: string;
  hint?: string;
  to?: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  shortcut?: string;
};

const SEEKER_LINKS: Item[] = [
  { id: "dashboard", label: "Overview", to: "/dashboard", icon: LayoutDashboard, group: "Workspace" },
  { id: "jobs", label: "Browse jobs", to: "/jobs", icon: Briefcase, group: "Workspace" },
  { id: "resume", label: "Resume", to: "/resume", icon: FileText, group: "Workspace" },
  { id: "applications", label: "Applications", to: "/applications", icon: Send, group: "Workspace" },
  { id: "interviews", label: "Interviews", to: "/interviews", icon: Video, group: "Workspace" },
  { id: "learn", label: "Learn hub", to: "/learn", icon: GraduationCap, group: "Practice" },
  { id: "learn-dsa", label: "DSA problems", to: "/learn", icon: Target, group: "Practice" },
  { id: "learn-arena", label: "Quiz arena", to: "/learn", icon: Trophy, group: "Practice" },
  { id: "profile", label: "Profile", to: "/profile", icon: UserRound, group: "Account" },
  { id: "messages", label: "Messages", to: "/messages", icon: MessageSquare, group: "Account" },
];

const RECRUITER_LINKS: Item[] = [
  { id: "dashboard", label: "Overview", to: "/dashboard", icon: LayoutDashboard, group: "Workspace" },
  { id: "post-job", label: "Post a role", to: "/post-job", icon: Sparkles, group: "Workspace" },
  { id: "applicants", label: "Applicants", to: "/applicants", icon: Award, group: "Workspace" },
  { id: "interviews", label: "Interviews", to: "/interviews", icon: Video, group: "Workspace" },
  { id: "profile", label: "Profile", to: "/profile", icon: UserRound, group: "Account" },
  { id: "messages", label: "Messages", to: "/messages", icon: MessageSquare, group: "Account" },
];

export function CommandPalette() {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const items = useMemo(() => {
    const base = user?.role === "recruiter" ? RECRUITER_LINKS : SEEKER_LINKS;
    return [
      ...base,
      { id: "home", label: "Home", to: "/", icon: Compass, group: "Navigate" },
    ];
  }, [user?.role]);

  // Keyboard shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
    >
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-popover shadow-lift">
        <Command
          label="Jobly command palette"
          className="w-full"
          onSelect={(id) => {
            const item = items.find((i) => i.id === id);
            if (item?.to) {
              router.navigate({ to: item.to });
              setOpen(false);
            }
          }}
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="h-4 w-4 text-ink/45" aria-hidden />
            <Command.Input
              autoFocus
              placeholder="Jump anywhere in Jobly…"
              className="flex-1 bg-transparent text-base text-ink placeholder:text-ink/40 focus:outline-none"
            />
            <kbd className="rounded border border-border bg-panel px-1.5 py-0.5 font-mono text-[10px] text-ink/55">
              ESC
           </kbd>
         </div>
          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-sm text-ink/55">
              Nothing here. Try a different word.
           </Command.Empty>
            {Array.from(new Set(items.map((i) => i.group))).map((group) => (
              <Command.Group
                key={group}
                heading={group}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-ink/45"
              >
                {items
                  .filter((i) => i.group === group)
                  .map((item) => (
                    <Command.Item
                      key={item.id}
                      value={item.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-ink aria-selected:bg-mint-soft aria-selected:text-ink"
                    >
                      <item.icon className="h-4 w-4 text-ink/55" aria-hidden />
                      <span className="flex-1">{item.label</span>
                      <span className="font-mono text-[10px] text-ink/35">
                        Go
                     </span>
                   </Command.Item>
                  ))}
             </Command.Group>
            ))}
         </Command.List>
          <div className="flex items-center justify-between border-t border-border bg-cream/60 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-ink/45">
            <span>Jobly command</span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-border bg-popover px-1">⌘</kbd>
              <kbd className="rounded border border-border bg-popover px-1">K</kbd>
           </span>
         </div>
       </Command>
     </div>
   </div>
  );
}
