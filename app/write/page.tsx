"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  "Climate Risk",
  "Enterprise Risk",
  "Insurance Innovation",
  "Technology Risk",
  "Insurance Capital",
  "ESG",
  "Governance",
  "Regulation",
  "Board Advisory",
  "Actuarial",
  "Speaking & Events",
];

export default function WritePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    summary: "",
    category: "Enterprise Risk",
    date: "",
    readingTime: "",
    body: "",
    keywords: "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [result, setResult] = useState<{ slug: string } | null>(null);
  const [error, setError] = useState("");

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function publish() {
    if (!form.title || !form.summary || !form.body) {
      setError("Title, summary and body are required.");
      return;
    }
    setError("");
    setStatus("saving");
    const res = await fetch("/api/publish-blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setResult(data);
      setStatus("done");
    } else {
      setError(data.error ?? "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "done" && result) {
    return (
      <div className="min-h-screen bg-[#05090F] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-full bg-emerald-900 border border-emerald-600 flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Article published</h2>
          <p className="text-slate-400 text-sm mb-1">Deploying now -- usually live in 2-3 minutes.</p>
          <p className="text-slate-500 text-xs mb-8">
            URL: <span className="text-[#C9A040]">raymondcheungwm.com/insights/{result.slug}</span>
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setForm({ title: "", summary: "", category: "Enterprise Risk", date: "", readingTime: "", body: "", keywords: "" }); setStatus("idle"); setResult(null); }} className="px-5 py-2.5 bg-[#C9A040] text-black text-sm font-semibold rounded-lg hover:bg-[#E8D9A8] transition-colors">
              Write another
            </button>
            <Link href="/" className="px-5 py-2.5 bg-white/5 text-slate-300 text-sm rounded-lg hover:bg-white/10 transition-colors border border-white/10">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05090F] text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#C9A040]" />
          <span className="font-semibold text-sm">New Article</span>
        </div>
        <Link href="/" className="text-xs text-slate-500 hover:text-white transition-colors">Back to dashboard</Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2">Headline *</label>
          <input
            value={form.title}
            onChange={e => set("title", e.target.value)}
            placeholder="e.g. Why ERM Boards Are Rethinking Climate Scenarios in 2026"
            className="w-full bg-[#0A1628] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#C9A040] transition-colors placeholder:text-slate-600"
          />
        </div>

        {/* Summary */}
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2">Summary / intro (1-2 sentences) *</label>
          <textarea
            value={form.summary}
            onChange={e => set("summary", e.target.value)}
            rows={3}
            placeholder="Shown on the insights listing and in search results."
            className="w-full bg-[#0A1628] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#C9A040] transition-colors resize-none placeholder:text-slate-600"
          />
        </div>

        {/* Category + Date row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2">Category *</label>
            <select
              value={form.category}
              onChange={e => set("category", e.target.value)}
              className="w-full bg-[#0A1628] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#C9A040] transition-colors"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2">Date (e.g. October 2026)</label>
            <input
              value={form.date}
              onChange={e => set("date", e.target.value)}
              placeholder="October 2026"
              className="w-full bg-[#0A1628] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#C9A040] transition-colors placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Body */}
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2">Article body *</label>
          <p className="text-xs text-slate-600 mb-3">
            Separate paragraphs with a blank line. Start a line with <code className="text-slate-400">## </code> for a heading, <code className="text-slate-400">- </code> for a bullet list, or wrap in <code className="text-slate-400">"quotes"</code> for a pull quote.
          </p>
          <textarea
            value={form.body}
            onChange={e => set("body", e.target.value)}
            rows={18}
            placeholder={`## Why This Matters Now\n\nYour first paragraph here.\n\nAnother paragraph.\n\n- Bullet one\n- Bullet two\n\n"A compelling pull quote from the article."\n\nClosing paragraph.`}
            className="w-full bg-[#0A1628] border border-white/10 rounded-lg px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-[#C9A040] transition-colors resize-y placeholder:text-slate-600"
          />
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2">Keywords (comma-separated, optional)</label>
          <input
            value={form.keywords}
            onChange={e => set("keywords", e.target.value)}
            placeholder="ERM, climate risk, Singapore, reinsurance"
            className="w-full bg-[#0A1628] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#C9A040] transition-colors placeholder:text-slate-600"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={publish}
            disabled={status === "saving"}
            className="px-6 py-3 bg-[#C9A040] text-black font-semibold text-sm rounded-lg hover:bg-[#E8D9A8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === "saving" ? "Publishing..." : "Publish article"}
          </button>
          <Link href="/" className="px-5 py-3 bg-white/5 text-slate-400 text-sm rounded-lg hover:bg-white/10 transition-colors border border-white/10">
            Cancel
          </Link>
        </div>
      </main>
    </div>
  );
}
