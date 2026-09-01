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
    <div className="flex h-full flex-col">
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Type your interview notes here..."
        className="iv-scroll flex-1 resize-none rounded-lg border border-iv-line bg-white/[0.03] p-3 font-iv-code text-[13px] leading-relaxed text-iv-text outline-none transition placeholder:text-iv-dim focus:border-iv-accent/40"
        spellCheck={false}
      />
      <p className="mt-2 text-[11px] text-iv-dim">Notes are shared with all participants in real-time.</p>
    </div>
  );
}
