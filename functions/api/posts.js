// This is the default export for a Pages Function.
// It receives the request and the environment variables (including DB).
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // This file specifically handles GET requests to /api/posts
    // (If you used functions/api/posts.js, the path is already handled.)

    if (request.method === 'GET') {
        try {
            // 1. Prepare the SQL query
            // We select only necessary fields and filter for published posts.
            const query = `
                SELECT id, title, slug, featured_image, category, tags, created_at
                FROM posts
                WHERE is_published = 1
                ORDER BY created_at DESC
                LIMIT 10
            `;

            // 2. Execute the query using the D1 binding (env.DB)
            const { results } = await env.DB.prepare(query).all();

            // 3. Return the data as a JSON response
            return new Response(JSON.stringify(results), {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
            });

        } catch (e) {
            // 4. Handle any errors (like a database connection issue)
            console.error('API Error:', e);
            return new Response(JSON.stringify({ error: e.message, description: "Could not fetch posts from the database." }), {
                headers: { 'Content-Type': 'application/json' },
                status: 500,
            });
        }
    }

    // If the request method is not GET (e.g., POST, PUT), return a 405 error
    return new Response('Method Not Allowed', { status: 405 });
}
