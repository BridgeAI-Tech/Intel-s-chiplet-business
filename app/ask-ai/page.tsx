"use client";

import { useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Layers,
  HelpCircle
} from "lucide-react";

export default function AskAiPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    {
      role: "assistant",
      content: `Welcome to the **Intel Chiplet Market Signals RAG Assistant**.
      
I can retrieve and synthesize intelligence across the full underlying SQLite dataset covering **Module 1 (Emerging Custom Silicon Demand)** and **Module 2 (Competitive Movement & Packaging Moves)**.

All answers are derived dynamically with verified primary source citations and audited excerpts.`,
      citations: []
    }
  ]);

  const sampleQuestions = [
    "What are Cerebras's packaging and foundry requirements based on collected signals?",
    "What is Arm's role in the chiplet ecosystem, and how does it differ from direct foundry competitors?",
    "How does the TSMC CoWoS capacity bottleneck create opportunities for Intel EMIB packaging?",
    "What are the latest custom silicon developments and hiring signals for AWS Annapurna Labs?"
  ];

  async function handleSend(queryText?: string) {
    const textToSend = queryText || prompt;
    if (!textToSend.trim() || loading) return;

    const newMessages = [...messages, { role: "user", content: textToSend }];
    setMessages(newMessages);
    if (!queryText) setPrompt("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToSend })
      });

      const data = await res.json();
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.answer || "No response received.",
          citations: data.citations || []
        }
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, an error occurred while querying the backend SQLite database.",
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-4 rounded-xl border border-[#1b3459] bg-[#0c1a32]/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[#0068B5]/20 text-[#00C7FD]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Ask AI (RAG Intelligence)</h2>
            <p className="text-xs text-slate-300">
              Query synthesized company intelligence, hiring trends, and competitive developments.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-[#11233e] px-3 py-1.5 rounded-lg border border-[#1d3d6b]">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Connected to SQLite Backend</span>
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider px-1">
          <Sparkles className="w-3.5 h-3.5 text-[#00C7FD]" />
          <span>Suggested Research Queries:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-left p-2.5 rounded-lg bg-[#0e1d35] hover:bg-[#122544] border border-[#172d4c] hover:border-[#0068B5]/50 text-xs text-slate-200 transition flex items-center justify-between group"
            >
              <span className="line-clamp-1">{q}</span>
              <span className="text-[#00C7FD] opacity-0 group-hover:opacity-100 transition text-[10px] ml-2 shrink-0">
                Ask →
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Window */}
      <div className="rounded-xl border border-[#1b3459] bg-[#0c1a32] shadow-xl p-5 space-y-4 min-h-[420px] flex flex-col justify-between">
        <div className="space-y-4 overflow-y-auto max-h-[520px] pr-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-3xl rounded-xl p-4 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#0068B5] text-white"
                    : "bg-[#0e1e38] text-slate-200 border border-[#1b365c]"
                }`}
              >
                <div className="whitespace-pre-line prose prose-invert max-w-none text-xs">
                  {m.content}
                </div>

                {/* Citations section if present */}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#1b365c] space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#00C7FD] block">
                      Audited Primary Sources & Disclosures:
                    </span>
                    <div className="space-y-1.5">
                      {m.citations.map((c: any, cIdx: number) => (
                        <div
                          key={cIdx}
                          className="p-2 rounded bg-[#091528] border border-[#142948] text-[11px] space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200">{c.name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#162c4c] text-emerald-300">
                              {c.class}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 italic">"{c.excerpt}"</p>
                          <div className="text-right">
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:underline inline-flex items-center space-x-1 text-[10px]"
                            >
                              <span>Open Verified Link</span>
                              <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-[#00C7FD] p-3 rounded-lg bg-[#0e1e38] border border-[#1b365c] max-w-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Querying SQLite backend & synthesizing facts...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-3 border-t border-[#162744] flex items-center space-x-2">
          <input
            type="text"
            placeholder="Ask anything about custom silicon signals, hiring, competitors, or Intel relevance..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#0e1d35] border border-[#1d3d6b] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00C7FD]"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !prompt.trim()}
            className="px-4 py-2.5 rounded-lg bg-[#0068B5] hover:bg-[#007cdb] disabled:bg-slate-700 text-white text-xs font-bold transition flex items-center space-x-1.5"
          >
            <span>Query</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
