// script // posts.js
// --- START: New helper function for JWT verification using Web Crypto API ---
// This replaces the "import { verify } from..." line and the original authenticate function.

async function verifyJwt(token, secret) {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    
    // 1. Import the secret key
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
    );
    
    // 2. Prepare the data to verify (header.payload)
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

    // 3. Convert signature from base64url to ArrayBuffer
    const base64UrlToUint8Array = (base64Url) => {
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    };
    
    const signature = base64UrlToUint8Array(signatureB64);

    // 4. Verify the signature
    const isValid = await crypto.subtle.verify(
        "HMAC",
        key,
        signature,
        data
    );

    if (!isValid) {
        throw new Error("Invalid JWT signature");
    }

    // 5. Decode and parse the payload
    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payloadJson);
}

async function authenticate(request, env) {
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    
    if (!token) throw new Error("No token provided");

    // Use the new, self-contained verification function
    const payload = await verifyJwt(token, env.JWT_SECRET);
    return payload;
}
// --- END: New helper function ---


export async function onRequest({ request, env }) {
    // ... (rest of the code is unchanged)
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
        // Use 401 for authentication errors like "No token provided" or "Invalid signature"
        return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 401, headers });
    }
}
