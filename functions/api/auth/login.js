// login.js
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ ok: false, error: "Email and password required" }), {
        status: 400,
      });
    }

    // SHA-256 hashing function for password comparison
    async function hashPassword(password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hash = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    // Example: Replace this with your KV / Database lookup
    const users = {
      "admin@example.com": "5e884898da28047151d0e56f8dc6292773603d0d6aabbddf4e0..." // hashed password
    };

    const storedPasswordHash = users[email];
    if (!storedPasswordHash) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid login" }), {
        status: 401,
      });
    }

    const inputPasswordHash = await hashPassword(password);

    if (inputPasswordHash !== storedPasswordHash) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid login" }), {
        status: 401,
      });
    }

    // JWT generation (Cloudflare compatible)
    const jwtHeader = { alg: "HS256", typ: "JWT" };
    const jwtPayload = {
      email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h expiry
    };

    function base64url(source) {
      let encoded = btoa(JSON.stringify(source))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      return encoded;
    }

    const headerEncoded = base64url(jwtHeader);
    const payloadEncoded = base64url(jwtPayload);

    const secret = env.JWT_SECRET;
    const key = new TextEncoder().encode(secret);
    const data = new TextEncoder().encode(`${headerEncoded}.${payloadEncoded}`);
    const signatureBuffer = await crypto.subtle.sign("HMAC", await crypto.subtle.importKey(
      "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    ), data);

    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const token = `${headerEncoded}.${payloadEncoded}.${signature}`;

    return new Response(JSON.stringify({ ok: true, token }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 });
  }
}
