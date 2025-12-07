// posts.js
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

async function authenticate(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) throw new Error("No token provided");

  const payload = await verify(token, env.JWT_SECRET, "HS256");
  return payload;
}

export async function onRequest({ request, env }) {
  const headers = {
    "Access-Control-Allow-Origin": "https://admin.infliker.fun",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") return new Response(null, { headers });

  try {
    const user = await authenticate(request, env);

    // Create post
    if (request.method === "POST") {
      const { title, content } = await request.json();
      const result = await env.DB.prepare(
        "INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)"
      )
      .bind(user.id, title, content)
      .run();

      return new Response(JSON.stringify({ ok: true, postId: result.lastInsertId }), { headers });
    }

    // List posts
    if (request.method === "GET") {
      const posts = await env.DB.prepare("SELECT * FROM posts WHERE user_id = ?")
        .bind(user.id)
        .all();
      return new Response(JSON.stringify({ ok: true, posts: posts.results }), { headers });
    }

    // Update post
    if (request.method === "PUT") {
      const { id, title, content } = await request.json();
      await env.DB.prepare("UPDATE posts SET title = ?, content = ? WHERE id = ? AND user_id = ?")
        .bind(title, content, id, user.id)
        .run();
      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    // Delete post
    if (request.method === "DELETE") {
      const { id } = await request.json();
      await env.DB.prepare("DELETE FROM posts WHERE id = ? AND user_id = ?")
        .bind(id, user.id)
        .run();
      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), { status: 405, headers });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 401, headers });
  }
}
