import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const SECRET = new TextEncoder().encode(process.env.PORTAL_SECRET!);
const POSTS_FILE = path.join(process.cwd(), "data", "posts.json");

async function getAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GBP_CLIENT_ID!,
      client_secret: process.env.GBP_CLIENT_SECRET!,
      refresh_token: process.env.GBP_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(JSON.stringify(data));
  return data.access_token as string;
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("gbp_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { await jwtVerify(token, SECRET); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { id } = await req.json();
  const posts = JSON.parse(readFileSync(POSTS_FILE, "utf8"));
  const post = posts.find((p: { id: number }) => p.id === id);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  if (post.posted) return NextResponse.json({ error: "Already posted" }, { status: 400 });

  const accessToken = await getAccessToken();
  const accountId = process.env.GBP_ACCOUNT_ID!;
  const locationId = process.env.GBP_LOCATION_ID!;

  const gbpRes = await fetch(
    `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/localPosts`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        languageCode: "en",
        summary: post.summary,
        callToAction: post.callToAction,
        topicType: "STANDARD",
      }),
    }
  );

  const result = await gbpRes.json();
  if (!gbpRes.ok) return NextResponse.json({ error: result }, { status: 500 });

  post.posted = true;
  post.postedAt = new Date().toISOString();
  writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));

  return NextResponse.json({ ok: true, name: result.name });
}
