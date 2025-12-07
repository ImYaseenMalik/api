// functions/api/auth/login.js
export async function onRequest({ request, env }) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") return new Response(null, { headers });

  const { email, password } = await request.json();

  // Replace this with your real database validation
  if (email !== "admin@test.com" || password !== "123456") {
    return new Response(JSON.stringify({ ok: false, error: "Invalid login" }), {
      status: 401,
      headers,
    });
  }

  // JWT creation
  const encoder = new TextEncoder();
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ email, exp: Date.now() + 1000 * 60 * 60 * 24 }));
  const secret = env.JWT_SECRET; // Add this in Cloudflare dashboard

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(`${header}.${payload}`));
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  const token = `${header}.${payload}.${signature}`;

  return new Response(JSON.stringify({ ok: true, token }), { headers });
}
