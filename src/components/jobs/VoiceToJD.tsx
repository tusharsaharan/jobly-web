import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

type VoiceToJDProps = {
  onTranscriptComplete: (transcript: string) => void;
  disabled?: boolean;
};

export function VoiceToJD({ onTranscriptComplete, disabled }: VoiceToJDProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let currentText = "";
      for (let i = 0; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript + " ";
      }
      setTranscript(currentText.trim());
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Microphone access was denied. Please enable mic permissions.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!isSupported) {
      toast.error("Voice input is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      if (transcript.trim()) {
        onTranscriptComplete(transcript.trim());
        setTranscript("");
      }
    } else {
      setTranscript("");
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        toast.info("Listening... Describe the role or requirements.");
      } catch (err) {
        console.error("Could not start recognition:", err);
      }
    }
  };

  const cancelListening = () => {
    recognitionRef.current?.abort();
    setIsListening(false);
    setTranscript("");
  };

  const confirmTranscript = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    if (transcript.trim()) {
      onTranscriptComplete(transcript.trim());
      setTranscript("");
    }
  };

  if (!isSupported) return null;

  return (
    <div className="relative inline-block">
      {!isListening ? (
        <button
          type="button"
          onClick={toggleListening}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-panel/40 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-panel hover:text-ink disabled:opacity-50"
          title="Voice to JD: Speak to describe role requirements"
        >
          <Mic className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Voice input</span>
        </button>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">Listening...</span>
          <button
            type="button"
            onClick={confirmTranscript}
            className="rounded bg-emerald-600 px-2 py-0.5 font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            Insert
          </button>
          <button
            type="button"
            onClick={cancelListening}
            className="rounded px-1 text-ink/50 hover:text-ink"
          >
            Cancel
          </button>
        </div>
      )}

      {isListening && transcript && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-xl border border-border/80 bg-background/95 p-3 text-xs shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95">
          <p className="font-semibold text-ink/70 mb-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-emerald-500" />
            Live Transcription
          </p>
          <p className="text-ink text-[11px] leading-relaxed italic">{transcript}</p>
        </div>
      )}
    </div>
  );
}
