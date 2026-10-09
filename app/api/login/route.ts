import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(process.env.PORTAL_SECRET!);
const PASSWORD = process.env.PORTAL_PASSWORD!;

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!password || password !== PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await new SignJWT({ auth: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);

  const res = NextResponse.json({ ok: true, mustChange: false });
  res.cookies.set("gbp_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
