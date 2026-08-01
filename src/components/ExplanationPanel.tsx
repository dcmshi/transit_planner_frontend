import ReactMarkdown from "react-markdown";
import { isExplanationAvailable } from "@/lib/explanation";

interface Props {
  explanation: string;
}

export function ExplanationPanel({ explanation }: Props) {
  if (!isExplanationAvailable(explanation)) {
    return (
      <div className="rounded-xl border border-n-200 bg-n-50 px-4 py-3 text-sm text-n-400">
        AI explanation requires Ollama — see the{" "}
        <a
          href="https://ollama.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-n-600"
        >
          setup guide
        </a>
        .
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-accent-edge bg-accent-surface px-5 py-4 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-ink">
        AI explanation
      </p>
      <div className="prose prose-sm prose-green max-w-none text-accent-ink-strong [&_strong]:text-accent-ink-strong">
        <ReactMarkdown>{explanation}</ReactMarkdown>
      </div>
    </div>
  );
}
