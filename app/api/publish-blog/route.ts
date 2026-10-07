import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.PORTAL_SECRET!);
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const REPO = process.env.GITHUB_REPO ?? "zaddyjohn-cyber/raymond-cheung-site";
const BRANCH = process.env.GITHUB_BRANCH ?? "main";
const FILE_PATH = "data/insights.json";

type Section = { type: string; text?: string; items?: string[] };

type Article = {
  id: string;
  title: string;
  summary: string;
  category: string;
  readingTime: string;
  date: string;
  status: "published";
  slug: string;
  body: Section[];
  keywords?: string[];
  ogImage?: string;
};

async function getFile() {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf8");
  return { sha: data.sha as string, articles: JSON.parse(content) as Article[] };
}

async function putFile(sha: string, content: string, message: string) {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        content: Buffer.from(content).toString("base64"),
        sha,
        branch: BRANCH,
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function bodyToSections(raw: string): Section[] {
  const sections: Section[] = [];
  for (const block of raw.split(/\n\n+/)) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("## ")) {
      sections.push({ type: "heading", text: trimmed.slice(3).trim() });
    } else if (trimmed.startsWith("- ")) {
      sections.push({ type: "list", items: trimmed.split("\n").map(l => l.replace(/^- /, "").trim()).filter(Boolean) });
    } else if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      sections.push({ type: "pullquote", text: trimmed.slice(1, -1) });
    } else {
      sections.push({ type: "paragraph", text: trimmed });
    }
  }
  return sections;
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("gbp_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { await jwtVerify(token, SECRET); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { title, summary, category, date, readingTime, body, keywords } = await req.json();
  if (!title || !summary || !category || !body) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { sha, articles } = await getFile();
  const maxId = articles.reduce((m: number, a: Article) => Math.max(m, parseInt(a.id) || 0), 0);
  const slug = slugify(title);

  const article: Article = {
    id: String(maxId + 1),
    title,
    summary,
    category,
    readingTime: readingTime || "5 min read",
    date: date || new Date().toLocaleDateString("en-SG", { month: "long", year: "numeric" }),
    status: "published",
    slug,
    body: bodyToSections(body),
    keywords: keywords ? keywords.split(",").map((k: string) => k.trim()).filter(Boolean) : [],
  };

  const updated = [article, ...articles];
  await putFile(sha, JSON.stringify(updated, null, 2), `feat: publish article "${title}"`);

  return NextResponse.json({ ok: true, slug, id: article.id });
}
