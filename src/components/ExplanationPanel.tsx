import ReactMarkdown from "react-markdown";
import { isExplanationAvailable } from "@/lib/explanation";

interface Props {
  explanation: string;
}

export function ExplanationPanel({ explanation }: Props) {
  if (!isExplanationAvailable(explanation)) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-400">
        AI explanation requires Ollama — see the{" "}
        <a
          href="https://ollama.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600"
        >
          setup guide
        </a>
        .
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-700">
        AI explanation
      </p>
      <div className="prose prose-sm prose-green max-w-none text-green-900 [&_strong]:text-green-800">
        <ReactMarkdown>{explanation}</ReactMarkdown>
      </div>
    </div>
  );
}
