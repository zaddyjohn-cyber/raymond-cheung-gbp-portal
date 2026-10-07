import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(process.env.PORTAL_SECRET!);
const BOOTSTRAP_PASSWORD = process.env.PORTAL_PASSWORD!;
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
  if (!res.ok) return null;
  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf8");
  return { sha: data.sha as string, config: JSON.parse(content) };
}

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!password) return NextResponse.json({ error: "Invalid password" }, { status: 401 });

  const configResult = await getConfig();
  const config = configResult?.config ?? { mustChangePassword: true, passwordHash: "" };

  let authenticated = false;
  let mustChange = false;

  if (config.passwordHash) {
    const hash = await hashPassword(password);
    authenticated = hash === config.passwordHash;
    mustChange = false;
  } else {
    // No password set yet -- use bootstrap env var
    authenticated = password === BOOTSTRAP_PASSWORD;
    mustChange = true;
  }

  if (!authenticated) return NextResponse.json({ error: "Invalid password" }, { status: 401 });

  const token = await new SignJWT({ auth: true, mustChange })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);

  const res = NextResponse.json({ ok: true, mustChange });
  res.cookies.set("gbp_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
