export async function onRequestGet({ env }) {
const res = await env.DB.prepare('SELECT id, slug, title, excerpt FROM posts WHERE published=1 ORDER BY published_at DESC').all();
return new Response(JSON.stringify(res.results), {headers:{'Content-Type':'application/json'}});
}


export async function onRequestPost({ request, env }) {
const body = await request.json();
const { title, slug, content, excerpt, published } = body;


try {
await env.DB.prepare('INSERT INTO posts (slug, title, content, excerpt, published, published_at) VALUES (?,?,?,?,?,datetime("now"))')
.bind(slug, title, content, excerpt, published?1:0)
.run();
return new Response(JSON.stringify({ok:true}), {headers:{'Content-Type':'application/json'}});
} catch(e) {
return new Response(JSON.stringify({ok:false, error:e.message}), {status:500, headers:{'Content-Type':'application/json'}});
}
}
