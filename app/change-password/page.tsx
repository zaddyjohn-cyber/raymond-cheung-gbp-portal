"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== confirm) { setError("Passwords do not match"); return; }
    if (pw.length < 8) { setError("Must be at least 8 characters"); return; }
    setError("");
    setLoading(true);
    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: pw }),
    });
    if (res.ok) {
      router.push("/");
    } else {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#05090F] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-block w-10 h-10 rounded-full bg-[#C9A040] mb-4" />
          <h1 className="text-white text-xl font-semibold">Set your password</h1>
          <p className="text-slate-500 text-sm mt-1">Choose a password you will remember</p>
        </div>
        <form onSubmit={submit} className="bg-[#0A1628] border border-white/10 rounded-xl p-8 space-y-5">
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2">New password</label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              className="w-full bg-[#05090F] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#C9A040] transition-colors"
              placeholder="At least 8 characters"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full bg-[#05090F] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#C9A040] transition-colors"
              placeholder="Repeat password"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading || !pw || !confirm}
            className="w-full bg-[#C9A040] text-black font-semibold py-3 rounded-lg text-sm hover:bg-[#E8D9A8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Set password"}
          </button>
        </form>
      </div>
    </div>
  );
}
