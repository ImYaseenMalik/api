export async function onRequestGet({ request, env }) {
const url = new URL(request.url);
const q = url.searchParams.get('q') || '';


// simple search in posts table
const res = await env.DB.prepare('SELECT slug, title, excerpt FROM posts WHERE title LIKE ? OR content LIKE ?')
.bind(`%${q}%`, `%${q}%`)
.all();


return new Response(JSON.stringify({results: res.results}), {headers:{'Content-Type':'application/json'}});
}
