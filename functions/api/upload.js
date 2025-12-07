export async function onRequestPost({ request, env }) {
const formData = await request.formData();
const file = formData.get('file');


if(!file) return new Response(JSON.stringify({ok:false, error:'No file'}), {status:400, headers:{'Content-Type':'application/json'}});


const key = `uploads/${Date.now()}-${file.name}`;
await env.MEDIA.put(key, file.stream());


return new Response(JSON.stringify({ok:true, url:`https://infliker-storage.<account>.r2.cloudflarestorage.com/${key}`}), {headers:{'Content-Type':'application/json'}});
}
