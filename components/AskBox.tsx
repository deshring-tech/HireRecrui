"use client";

import { useState } from "react";

export default function AskBox({ candidateId }: { candidateId: string }) {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const suggestions = [
    "Which project is actually deployed?",
    "What's their strongest technical skill?",
    "Have they worked with a database in production?",
  ];

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    setLoading(true);
    setQuestion("");
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, question: q }),
      });
      const data = await res.json();
      setHistory((prev) => [...prev, { q, a: data.answer }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-slate-800 mb-1">Ask about this candidate</h3>
      <p className="text-xs text-slate-400 mb-4">AI answers using only what's on this profile.</p>

      {history.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="text-xs px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100 transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
        {history.map((h, i) => (
          <div key={i} className="text-sm">
            <div className="font-medium text-slate-700">{h.q}</div>
            <div className="text-slate-500 mt-1">{h.a}</div>
          </div>
        ))}
        {loading && <div className="text-sm text-slate-400 animate-pulse">Thinking...</div>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        className="flex gap-2"
      >
        <input
          className="input"
          placeholder="Ask a question about this candidate..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={loading}>
          Ask
        </button>
      </form>
    </div>
  );
}
