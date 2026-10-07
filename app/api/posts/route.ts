import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const SECRET = new TextEncoder().encode(process.env.PORTAL_SECRET!);
const POSTS_FILE = path.join(process.cwd(), "data", "posts.json");

async function auth(req: NextRequest) {
  const token = req.cookies.get("gbp_token")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const posts = JSON.parse(readFileSync(POSTS_FILE, "utf8"));
  return NextResponse.json(posts);
}

export async function PATCH(req: NextRequest) {
  if (!(await auth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, posted } = await req.json();
  const posts = JSON.parse(readFileSync(POSTS_FILE, "utf8"));
  const post = posts.find((p: { id: number }) => p.id === id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  post.posted = posted;
  post.postedAt = posted ? new Date().toISOString() : null;
  writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
  return NextResponse.json({ ok: true });
}
