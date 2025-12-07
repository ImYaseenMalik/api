// functions/api/auth/login.js
import { create, getNumericDate, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

// ⚡ Secret for JWT signing — store in Cloudflare Pages secret in production
const SECRET = Deno.env.get("JWT_SECRET") || "supersecret";

// Example users with hashed passwords (SHA-256)
const users = [
  {
    username: "admin",
    // hash of "admin123" using SHA-256
    passwordHash: "a8b64babd2f2d9a76a9f72d48a0a1f30d18f71f5e7c0c0b0c9c9f9e6c9f8f7d8"
  }
];

// Function to hash password using SHA-256
async function hashPassword(password) {
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function onRequestPost({ request }) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return new Response(JSON.stringify({ error: "Username and password required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Find user
    const user = users.find(u => u.username === username);
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid username or password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Hash incoming password and compare
    const passwordHash = await hashPassword(password);
    if (passwordHash !== user.passwordHash) {
      return new Response(JSON.stringify({ error: "Invalid username or password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Create JWT
    const payload = {
      username,
      exp: getNumericDate(60 * 60) // expires in 1 hour
    };
    const token = await create({ alg: "HS256", typ: "JWT" }, payload, SECRET);

    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
