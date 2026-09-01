import { useState } from "react";
import { HelpCircle, X, CheckSquare, Square, Plus, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

type QuestionItem = {
  id: string;
  question: string;
  defaultAnswer: string;
  category: string;
  selected?: boolean;
};

type CandidateQuestionsPreviewProps = {
  jobPayload: any;
  onAppendFaq: (faqMarkdown: string) => void;
  disabled?: boolean;
};

export function CandidateQuestionsPreview({
  jobPayload,
  onAppendFaq,
  disabled,
}: CandidateQuestionsPreviewProps) {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);

  const handleOpen = async () => {
    setIsOpen(true);
    setLoading(true);
    try {
      const res = await apiCall<{ questions: QuestionItem[] }>("/jobs/predict-questions", "POST", jobPayload, token);
      if (res?.questions) {
        setQuestions(
          res.questions.map((q, idx) => ({
            ...q,
            id: q.id || `q-${idx}`,
            selected: true,
          }))
        );
      }
    } catch (err: any) {
      console.error("Failed to predict questions", err);
      toast.error(err?.message || "Could not generate candidate questions.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, selected: !q.selected } : q))
    );
  };

  const updateAnswer = (id: string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, defaultAnswer: text } : q))
    );
  };

  const updateQuestion = (id: string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, question: text } : q))
    );
  };

  const handleAppend = () => {
    const selectedQuestions = questions.filter((q) => q.selected && q.question.trim());
    if (selectedQuestions.length === 0) {
      toast.error("Please select at least one question to include in FAQ.");
      return;
    }

    let faqMarkdown = "\n\n### Frequently Asked Questions (FAQ)\n\n";
    selectedQuestions.forEach((q) => {
      faqMarkdown += `**Q: ${q.question.trim()}**\n${q.defaultAnswer.trim()}\n\n`;
    });

    onAppendFaq(faqMarkdown.trimEnd());
    setIsOpen(false);
    toast.success("Appended FAQ section to job description.");
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled || (!jobPayload.title && !jobPayload.description)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-1 text-xs font-semibold text-ink transition-colors hover:bg-panel/80 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        title="Predict anticipated candidate questions and generate FAQ"
      >
        <HelpCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Predict Candidate FAQ</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="surface relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint text-ink">
                  <HelpCircle className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-ink text-base">Anticipated Candidate Questions</h3>
                  <p className="text-xs text-ink/60">Pre-empt applicant questions with clear answers in your posting</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-ink/50 transition-colors hover:bg-panel hover:text-ink"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
                  <p className="font-medium text-ink text-sm">Analyzing job details &amp; predicting candidate inquiries...</p>
                </div>
              )}

              {!loading && questions.length === 0 && (
                <div className="py-12 text-center text-xs text-ink/60">
                  <p>No questions generated. Ensure the job has a title and description.</p>
                </div>
              )}

              {!loading && questions.length > 0 && (
                <div className="space-y-4">
                  <p className="text-xs text-ink/60 leading-relaxed">
                    Select the questions you would like to include as an FAQ in your job description. You can edit both the question phrasing and the response before inserting.
                  </p>

                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className={`rounded-xl border p-4 transition-colors space-y-2.5 ${
                        q.selected
                          ? "border-emerald-500/40 bg-panel/40"
                          : "border-border/60 bg-panel/10 opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleSelect(q.id)}
                          className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                        >
                          {q.selected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-ink/40" />}
                        </button>
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={q.question}
                            onChange={(e) => updateQuestion(q.id, e.target.value)}
                            className="w-full bg-transparent font-semibold text-ink text-xs focus:outline-none border-b border-border/40 pb-1"
                            placeholder="Question..."
                          />
                          <textarea
                            value={q.defaultAnswer}
                            onChange={(e) => updateAnswer(q.id, e.target.value)}
                            rows={2}
                            className="control-surface w-full px-3 py-1.5 text-xs text-ink/80 leading-relaxed resize-y"
                            placeholder="Answer..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border bg-panel/40 px-6 py-3.5">
              <span className="text-xs text-ink/60">
                {questions.filter((q) => q.selected).length} of {questions.length} questions selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-ink hover:bg-panel"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAppend}
                  disabled={loading || questions.length === 0}
                  className="pill-mint inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold"
                >
                  <span>Append FAQ to Description</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
