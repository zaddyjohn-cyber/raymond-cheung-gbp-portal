"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Post = {
  id: number;
  posted: boolean;
  postedAt?: string;
  summary: string;
  callToAction: { actionType: string; url: string };
};

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/posts")
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setPosts)
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function publish(id: number) {
    setPublishing(id);
    const res = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (res.ok) {
      setPosts(p => p.map(x => x.id === id ? { ...x, posted: true, postedAt: new Date().toISOString() } : x));
      showToast("Posted to Google Business Profile", true);
    } else {
      showToast(typeof data.error === "string" ? data.error : "API error -- GBP quota may need approval", false);
    }
    setPublishing(null);
  }

  async function togglePosted(id: number, posted: boolean) {
    await fetch("/api/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, posted }),
    });
    setPosts(p => p.map(x => x.id === id ? { ...x, posted, postedAt: posted ? new Date().toISOString() : undefined } : x));
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  const pending = posts.filter(p => !p.posted);
  const done = posts.filter(p => p.posted);

  return (
    <div className="min-h-screen bg-[#05090F] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#C9A040]" />
          <span className="font-semibold text-sm">GBP Content Portal</span>
          <span className="text-slate-500 text-xs">raymondcheungwm.com</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/write" className="px-4 py-2 bg-[#C9A040] text-black text-xs font-semibold rounded-lg hover:bg-[#E8D9A8] transition-colors">+ Write article</Link>
          <span className="text-xs text-slate-400">{pending.length} pending &middot; {done.length} posted</span>
          <button onClick={logout} className="text-xs text-slate-500 hover:text-white transition-colors">Sign out</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {loading ? (
          <div className="text-slate-500 text-sm">Loading posts...</div>
        ) : (
          <>
            {/* Pending */}
            {pending.length > 0 && (
              <section className="mb-12">
                <h2 className="text-xs uppercase tracking-widest text-[#C9A040] mb-5">Ready to Post ({pending.length})</h2>
                <div className="space-y-4">
                  {pending.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onPublish={() => publish(post.id)}
                      onMark={() => togglePosted(post.id, true)}
                      publishing={publishing === post.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Done */}
            {done.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-5">Posted ({done.length})</h2>
                <div className="space-y-3">
                  {done.map(post => (
                    <div key={post.id} className="bg-[#0A1628]/50 border border-white/5 rounded-xl p-5 opacity-60">
                      <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line line-clamp-2">{post.summary}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-slate-600">{post.postedAt ? new Date(post.postedAt).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }) : "Marked posted"}</span>
                        <button onClick={() => togglePosted(post.id, false)} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Undo</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {pending.length === 0 && done.length === 0 && (
              <p className="text-slate-500 text-sm">No posts loaded. Add posts to data/posts.json.</p>
            )}
          </>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-medium shadow-xl transition-all ${toast.ok ? "bg-emerald-900 text-emerald-200 border border-emerald-700" : "bg-red-900 text-red-200 border border-red-700"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, onPublish, onMark, publishing }: {
  post: Post;
  onPublish: () => void;
  onMark: () => void;
  publishing: boolean;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(post.summary + "\n\n" + post.callToAction.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-[#0A1628] border border-white/10 rounded-xl p-5 hover:border-[#C9A040]/30 transition-colors">
      <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line mb-3">{post.summary}</p>
      <a href={post.callToAction.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C9A040] hover:underline block mb-4 truncate">{post.callToAction.url}</a>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onPublish}
          disabled={publishing}
          className="px-4 py-2 bg-[#C9A040] text-black text-xs font-semibold rounded-lg hover:bg-[#E8D9A8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {publishing ? "Posting..." : "Post to GBP"}
        </button>
        <button onClick={copy} className="px-4 py-2 bg-white/5 text-slate-300 text-xs rounded-lg hover:bg-white/10 transition-colors border border-white/10">
          {copied ? "Copied!" : "Copy text"}
        </button>
        <button onClick={onMark} className="px-4 py-2 text-slate-500 text-xs rounded-lg hover:text-slate-300 transition-colors">
          Mark posted
        </button>
        <span className="ml-auto text-xs text-slate-600">#{post.id}</span>
      </div>
    </div>
  );
}
