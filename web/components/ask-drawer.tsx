"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import type { Doc } from "@/lib/retrieve";

type Turn = { q: string; answer?: string; sources?: Doc[]; error?: string };

const GENERAL = [
  "Which companies show evidence of expanding custom-silicon activity?",
  "What supplier and manufacturing relationships have been identified?",
  "Which companies are hiring for chip design and verification roles?",
  "What has AWS announced about Trainium in the last 12 months?",
];
const forCompany = (n: string) => [
  `What custom-silicon programmes has ${n} announced in the last 12 months?`,
  `Which foundry, packaging and memory suppliers does ${n} use?`,
  `What engineering roles is ${n} hiring for?`,
  `What is ${n}'s relationship with Intel?`,
];

// Renders "[S1, S3]" citations as clickable chips that jump to the source list of that answer.
function Answer({ text, turn }: { text: string; turn: number }) {
  const parts = text.split(/(\[[^\]]*S\d+[^\]]*\])/g);
  return (
    <div className="whitespace-pre-wrap text-sm leading-6">
      {parts.map((p, i) => {
        const refs = /^\[[^\]]*S\d+[^\]]*\]$/.test(p) ? p.match(/S\d+/g) ?? [] : [];
        if (!refs.length) return <Fragment key={i}>{p}</Fragment>;
        return refs.map((r) => (
          <a key={i + r} href={`#t${turn}-${r}`}
            className="mx-0.5 inline-block rounded bg-accent-soft px-1 font-mono text-[10px] font-semibold text-accent no-underline hover:bg-accent hover:text-white">{r}</a>
        ));
      })}
    </div>
  );
}

export function AskDrawer({ companies }: { companies: { company_id: string; short_name: string }[] }) {
  const sp = useSearchParams();
  const co = companies.find((c) => c.company_id === sp.get("co")) ?? null;
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { if (open) field.current?.focus(); }, [open]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [turns, busy]);

  async function ask(q: string) {
    if (!q.trim() || busy) return;
    setInput("");
    setBusy(true);
    setTurns((t) => [...t, { q }]);
    let next: Turn;
    try {
      const res = await fetch("/api/ask", { method: "POST", body: JSON.stringify({ question: q, company: co?.short_name }) });
      const data = await res.json();
      next = res.ok ? { q, answer: data.answer, sources: data.sources ?? [] } : { q, error: data.error ?? "Request failed" };
    } catch {
      next = { q, error: "Request failed — check the connection and try again." };
    }
    setTurns((t) => [...t.slice(0, -1), next]);
    setBusy(false);
  }

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-black">
          <Sparkle /> Ask Intelligence
        </button>
      )}

      <div onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/25 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} />

      <aside aria-label="Ask Intelligence" aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col border-l border-border bg-surface shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wide"><Sparkle /> Ask Intelligence</div>
            <p className="mt-0.5 text-xs text-muted">
              Answers only from verified records, with citations{co ? <> · focused on <b className="text-foreground">{co.short_name}</b></> : ""}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {turns.length > 0 && <button onClick={() => setTurns([])} className="rounded px-2 py-1 text-xs text-muted hover:bg-accent-soft">New chat</button>}
            <button onClick={() => setOpen(false)} aria-label="Close" className="rounded px-2 py-1 text-lg leading-none text-muted hover:bg-accent-soft">×</button>
          </div>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {!turns.length && (
            <div>
              <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted">Try asking</div>
              <div className="space-y-2">
                {(co ? forCompany(co.short_name) : GENERAL).map((s) => (
                  <button key={s} onClick={() => ask(s)}
                    className="block w-full rounded-lg border border-border px-3 py-2 text-left text-sm hover:border-accent hover:bg-accent-soft/50">{s}</button>
                ))}
              </div>
            </div>
          )}

          {turns.map((t, i) => (
            <div key={i} className="space-y-2">
              <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-neutral-900 px-3 py-2 text-sm text-white">{t.q}</div>
              {t.error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{t.error}</div>}
              {t.answer !== undefined && (
                <div className="rounded-2xl rounded-bl-sm border border-border bg-background p-3">
                  <Answer text={t.answer} turn={i} />
                  {!!t.sources?.length && (
                    <div className="mt-3 border-t border-border pt-2">
                      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted">Sources ({t.sources.length})</div>
                      <ol className="space-y-1.5">
                        {t.sources.map((s) => (
                          <li key={s.ref} id={`t${i}-${s.ref}`} className="text-xs">
                            <span className="mr-1 font-mono font-semibold text-accent">{s.ref}</span>
                            <Link href={s.link} onClick={() => setOpen(false)} className="font-medium hover:underline">{s.title}</Link>
                            <span className="text-muted"> · {s.company} · {s.date ?? "undated"}{s.evidence_class ? ` · ${s.evidence_class.replace(/_/g, " ")}` : ""}</span>
                            {s.url && <> · <a href={s.url} target="_blank" rel="noreferrer" className="text-accent">source ↗</a></>}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
              {t.answer === undefined && !t.error && (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-accent" /> Searching records and drafting a cited answer…
                </div>
              )}
            </div>
          ))}
          <div ref={bottom} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="border-t border-border p-3">
          <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-2 focus-within:border-accent">
            <textarea ref={field} rows={2} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); } }}
              placeholder={co ? `Ask about ${co.short_name}…` : "Ask about companies, programmes, suppliers, hiring…"}
              className="flex-1 resize-none bg-transparent px-1 text-sm outline-none" />
            <button disabled={busy || !input.trim()} className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-40">
              {busy ? "…" : "Ask"}
            </button>
          </div>
          <p className="mt-1.5 px-1 text-[10px] text-muted">Each question is answered on its own from stored records. Enter to send, Shift+Enter for a new line.</p>
        </form>
      </aside>
    </>
  );
}

function Sparkle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
    </svg>
  );
}
