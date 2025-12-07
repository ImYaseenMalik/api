export async function onRequestPost({ request, env }) {
const { email, password, display_name } = await request.json();


try {
const stmt = await env.DB.prepare('INSERT INTO users (email, password_hash, display_name) VALUES (?,?,?)').bind(email, password, display_name).run();
return new Response(JSON.stringify({ok:true}), {headers:{'Content-Type':'application/json'}});
} catch(e){
return new Response(JSON.stringify({ok:false, error:e.message}), {status:400, headers:{'Content-Type':'application/json'}});
}
}
