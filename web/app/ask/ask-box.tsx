"use client";

import Link from "next/link";
import { useState } from "react";
import type { Doc } from "@/lib/retrieve";

const SUGGESTED = [
  "Which companies show evidence of expanding custom-silicon activity?",
  "What engineering roles is Cerebras hiring for?",
  "What supplier and manufacturing relationships have been identified, and what is their status?",
  "What has AWS announced about Trainium in the last 12 months?",
];

export function AskBox() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<Doc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function ask(q: string) {
    setQuestion(q);
    setBusy(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/ask", { method: "POST", body: JSON.stringify({ question: q }) });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Request failed");
      else { setAnswer(data.answer); setSources(data.sources ?? []); }
    } catch {
      setError("Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-2 text-xs uppercase tracking-wide text-muted">Suggested questions</div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map((s) => (
            <button key={s} onClick={() => ask(s)} className="rounded border border-border px-2 py-1 text-left text-sm hover:bg-accent-soft">{s}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (question.trim()) ask(question); }} className="mt-3 flex gap-2">
          <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a question…"
            className="flex-1 rounded border border-border px-3 py-2 text-sm" />
          <button disabled={busy} className="rounded bg-accent px-4 py-2 text-sm text-white disabled:opacity-50">
            {busy ? "Thinking…" : "Submit"}
          </button>
        </form>
      </div>

      {error && <div className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}

      {answer && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-2 text-xs uppercase tracking-wide text-muted">Answer</div>
          <div className="whitespace-pre-wrap text-sm leading-6">{answer}</div>
          <div className="mt-4 mb-2 text-xs uppercase tracking-wide text-muted">Supporting evidence</div>
          {sources.length ? (
            <ol className="space-y-2 text-sm">
              {sources.map((s) => (
                <li key={s.ref}>
                  <span className="font-mono text-xs">[{s.ref}]</span>{" "}
                  <Link href={s.link} className="font-medium text-accent hover:underline">{s.title}</Link>
                  <span className="text-xs text-muted"> · {s.company} · {s.date ?? "undated"}{s.evidence_class ? ` · ${s.evidence_class.replace(/_/g, " ")}` : ""}</span>
                  {s.url && <> · <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-accent">open source</a></>}
                </li>
              ))}
            </ol>
          ) : <div className="text-sm text-muted">No records were cited.</div>}
        </div>
      )}
    </div>
  );
}
