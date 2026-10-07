import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.PORTAL_SECRET!);
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const REPO = process.env.GITHUB_REPO ?? "rcheungwm-wq/raymond-cheung-site";
const BRANCH = process.env.GITHUB_BRANCH ?? "main";
const CONFIG_PATH = "data/portal-config.json";

async function hashPassword(pw: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function getConfig() {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${CONFIG_PATH}?ref=${BRANCH}`,
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" }, cache: "no-store" }
  );
  if (!res.ok) throw new Error("Could not read config");
  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf8");
  return { sha: data.sha as string, config: JSON.parse(content) };
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("gbp_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { await jwtVerify(token, SECRET); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { newPassword } = await req.json();
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const { sha, config } = await getConfig();
  const passwordHash = await hashPassword(newPassword);
  const updated = { ...config, passwordHash, mustChangePassword: false };

  await fetch(
    `https://api.github.com/repos/${REPO}/contents/${CONFIG_PATH}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "chore: update portal password",
        content: Buffer.from(JSON.stringify(updated, null, 2)).toString("base64"),
        sha,
        branch: BRANCH,
      }),
    }
  );

  // Issue a fresh token without mustChange
  const { SignJWT } = await import("jose");
  const newToken = await new SignJWT({ auth: true, mustChange: false })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("gbp_token", newToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
