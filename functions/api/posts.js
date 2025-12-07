export async function onRequest(context) {
  const { request, env } = context;

  const headers = {
    'Access-Control-Allow-Origin': 'https://admin.infliker.fun',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle preflight request
  if (request.method === 'OPTIONS') return new Response(null, { headers });

  try {
    // Get token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ ok:false, error:'Unauthorized' }), { status:401, headers });
    }
    const token = authHeader.split(' ')[1];

    // Simple JWT verify function (using Web Crypto)
    async function verifyJWT(token, secret) {
      const [header64, body64, sig64] = token.split('.');
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash:'SHA-256' }, false, ['verify']);
      const data = `${header64}.${body64}`;
      const sig = Uint8Array.from(atob(sig64), c => c.charCodeAt(0));
      const valid = await crypto.subtle.verify('HMAC', key, sig, enc.encode(data));
      if (!valid) throw new Error('Invalid token');
      return JSON.parse(atob(body64));
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);

    const { title, slug, content, excerpt, published } = await request.json();

    // Insert into D1
    await env.DB.prepare(
      `INSERT INTO posts (title, slug, content, excerpt, published, author_id) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(title, slug, content, excerpt, published ? 1 : 0, payload.id).run();

    return new Response(JSON.stringify({ ok:true }), { headers });

  } catch (err) {
    return new Response(JSON.stringify({ ok:false, error: err.message }), { status:500, headers });
  }
}
