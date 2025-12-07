import jwt from 'jsonwebtoken';

export async function onRequest({ request, env }) {
  const headers = {
    'Access-Control-Allow-Origin': 'https://admin.infliker.fun',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') return new Response(null, { headers });

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) 
      return new Response(JSON.stringify({ ok:false, error:'Unauthorized' }), { status:401, headers });

    const token = authHeader.split(' ')[1];
    let payload;
    try { payload = jwt.verify(token, env.JWT_SECRET); } 
    catch { return new Response(JSON.stringify({ ok:false, error:'Invalid token' }), { status:401, headers }); }

    const { title, slug, content, excerpt, published } = await request.json();

    await env.DB.prepare(
      `INSERT INTO posts (title, slug, content, excerpt, published, author_id) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(title, slug, content, excerpt, published?1:0, payload.id).run();

    return new Response(JSON.stringify({ ok:true }), { headers });

  } catch(err) {
    return new Response(JSON.stringify({ ok:false, error: err.message }), { status:500, headers });
  }
}
