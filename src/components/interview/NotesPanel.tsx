import React, { useState, useCallback, useEffect, useRef } from "react";
import { getInterviewSocket } from "@/lib/socket";

interface NotesPanelProps {
  roomKey: string;
  sessionId: string;
  token?: string;
}

export function NotesPanel({ roomKey, sessionId, token }: NotesPanelProps) {
  const [content, setContent] = useState<string>("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRemoteRef = useRef(false);

  // Listen for remote note updates
  useEffect(() => {
    if (!token) return;
    const socket = getInterviewSocket(token);

    const handleNotesUpdate = (data: { content: string }) => {
      isRemoteRef.current = true;
      setContent(data.content);
      requestAnimationFrame(() => {
        isRemoteRef.current = false;
      });
    };

    socket.on("notes_updated", handleNotesUpdate);
    return () => {
      socket.off("notes_updated", handleNotesUpdate);
    };
  }, [token]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setContent(value);

      if (isRemoteRef.current) return;

      // Debounced broadcast
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (token) {
          const socket = getInterviewSocket(token);
          socket.emit("notes_update", { roomKey, content: value });
        }
      }, 300);
    },
    [roomKey, token],
  );

  return (
    <div
      className="flex h-full flex-col"
      style={{ fontFamily: "var(--font-iv-ui)" }}
    >
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Type your interview notes here..."
        className="iv-scroll flex-1 resize-none rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 text-[13px] leading-relaxed text-white/90 placeholder:text-white/20 outline-none transition focus:border-[var(--iv-accent)]/30"
        style={{ fontFamily: "var(--font-iv-code)" }}
        spellCheck={false}
      />
      <p className="mt-2 text-[11px] text-white/30">
        Notes are shared with all participants in real-time.
      </p>
    </div>
  );
}
