import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

// Passwords: use SHA-256 + base64
async function hashPassword(password) {
  const enc = new TextEncoder();
  const data = await crypto.subtle.digest("SHA-256", enc.encode(password));
  return btoa(String.fromCharCode(...new Uint8Array(data)));
}

export async function onRequest({ request, env }) {
  const headers = {
    "Access-Control-Allow-Origin": "https://admin.infliker.fun",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") return new Response(null, { headers });

  try {
    const { email, password } = await request.json();
    const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?")
      .bind(email)
      .first();

    if (!user) return new Response(JSON.stringify({ ok: false, error: "Invalid email/password" }), { status: 401, headers });

    const hashed = await hashPassword(password);
    if (hashed !== user.password_hash) 
      return new Response(JSON.stringify({ ok: false, error: "Invalid email/password" }), { status: 401, headers });

    const jwtPayload = { id: user.id, email: user.email };
    const token = await create({ alg: "HS256", typ: "JWT" }, jwtPayload, env.JWT_SECRET);

    return new Response(JSON.stringify({ ok: true, token }), { headers });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers });
  }
}
