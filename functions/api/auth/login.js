export async function onRequest(context) {
  const { request, env } = context;
  
  // Common CORS headers
  const headers = {
    'Access-Control-Allow-Origin': 'https://admin.infliker.fun',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const { email, password } = await request.json();

    // Fetch user from D1
    const userRes = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).all();
    if (!userRes.results || userRes.results.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: 'User not found' }), { status: 401, headers });
    }

    const user = userRes.results[0];

    if (password !== user.password_hash) {
      return new Response(JSON.stringify({ ok: false, error: 'Wrong password' }), { status: 401, headers });
    }

    // Create JWT using Web Crypto
    async function createJWT(payload, secret) {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify(payload));
      const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${body}`));
      const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)));
      return `${header}.${body}.${sig}`;
    }

    const token = await createJWT({ id: user.id, email: user.email }, env.JWT_SECRET);

    return new Response(JSON.stringify({ ok: true, token, user: { email: user.email } }), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers });
  }
}
