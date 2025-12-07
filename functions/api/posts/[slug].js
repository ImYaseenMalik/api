export async function onRequestGet({ env, params }) {
const slug = params.slug;
const res = await env.DB.prepare('SELECT * FROM posts WHERE slug=?').bind(slug).all();
if(!res.results || res.results.length===0){
return new Response(JSON.stringify({ok:false, error:'Post not found'}), {status:404, headers:{'Content-Type':'application/json'}});
}
return new Response(JSON.stringify(res.results[0]), {headers:{'Content-Type':'application/json'}});
}
