export default {
  async fetch(request, env) {
    const headers = { "Content-Type": "application/json" };

    // In-memory posts array (replace with KV for persistence in production)
    const POSTS = env.POSTS ? JSON.parse(env.POSTS) : [];

    // Helper: Simple JWT verification (like login.js)
    function verifyJWT(token, secret) {
      try {
        const [headerB64, payloadB64, signature] = token.split(".");
        const payload = JSON.parse(atob(payloadB64));
        if (payload.exp && payload.exp * 1000 < Date.now()) return false;
        return payload; // return decoded payload
      } catch (e) {
        return false;
      }
    }

    const url = new URL(request.url);
    const method = request.method;

    // Auth check for POST, PUT, DELETE
    if (["POST", "PUT", "DELETE"].includes(method)) {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401, headers });
      }
      const token = authHeader.split(" ")[1];
      const decoded = verifyJWT(token, env.JWT_SECRET);
      if (!decoded) {
        return new Response(JSON.stringify({ ok: false, error: "Invalid token" }), { status: 401, headers });
      }
    }

    // GET all posts
    if (method === "GET") {
      return new Response(JSON.stringify({ ok: true, posts: POSTS }), { headers });
    }

    // CREATE new post
    if (method === "POST") {
      const data = await request.json();
      const newPost = {
        id: Date.now().toString(),
        title: data.title || "Untitled",
        content: data.content || "",
        createdAt: new Date().toISOString(),
      };
      POSTS.push(newPost);

      // Save to KV if you have POSTS KV binding
      // await env.POSTS_KV.put("POSTS", JSON.stringify(POSTS));

      return new Response(JSON.stringify({ ok: true, post: newPost }), { headers });
    }

    // UPDATE post
    if (method === "PUT") {
      const data = await request.json();
      const post = POSTS.find(p => p.id === data.id);
      if (!post) return new Response(JSON.stringify({ ok: false, error: "Post not found" }), { status: 404, headers });
      post.title = data.title || post.title;
      post.content = data.content || post.content;
      return new Response(JSON.stringify({ ok: true, post }), { headers });
    }

    // DELETE post
    if (method === "DELETE") {
      const { id } = await request.json();
      const index = POSTS.findIndex(p => p.id === id);
      if (index === -1) return new Response(JSON.stringify({ ok: false, error: "Post not found" }), { status: 404, headers });
      POSTS.splice(index, 1);
      return new Response(JSON.stringify({ ok: true, message: "Post deleted" }), { headers });
    }

    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), { status: 405, headers });
  }
};
