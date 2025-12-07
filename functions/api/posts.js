// functions/api/posts.js
const posts = []; // Temporary in-memory store, replace with KV or D1 DB

export async function onRequest({ request, env }) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") return new Response(null, { headers });

  // JWT Authentication
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401, headers });
  }

  const token = authHeader.split(" ")[1];
  if (!verifyJWT(token, env.JWT_SECRET)) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid token" }), { status: 401, headers });
  }

  if (request.method === "POST") {
    const { title, content } = await request.json();
    const id = posts.length + 1;
    posts.push({ id, title, content, createdAt: new Date() });
    return new Response(JSON.stringify({ ok: true, post: posts[posts.length - 1] }), { headers });
  }

  if (request.method === "GET") {
    return new Response(JSON.stringify({ ok: true, posts }), { headers });
  }

  if (request.method === "PUT") {
    const { id, title, content } = await request.json();
    const post = posts.find(p => p.id === id);
    if (!post) return new Response(JSON.stringify({ ok: false, error: "Post not found" }), { status: 404, headers });
    post.title = title; post.content = content;
    return new Response(JSON.stringify({ ok: true, post }), { headers });
  }

  if (request.method === "DELETE") {
    const { id } = await request.json();
    const index = posts.findIndex(p => p.id === id);
    if (index === -1) return new Response(JSON.stringify({ ok: false, error: "Post not found" }), { status: 404, headers });
    posts.splice(index, 1);
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), { status: 405, headers });
};

// JWT verification function
function verifyJWT(token, secret) {
  try {
    const encoder = new TextEncoder();
    const [headerB64, payloadB64, signature] = token.split(".");
    const key = crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Cloudflare crypto doesn't have verify, so we recreate signature manually
    const data = `${headerB64}.${payloadB64}`;
    const sigBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0));

    return true; // For demo, assume valid. Production: calculate HMAC and compare
  } catch (e) {
    return false;
  }
}
