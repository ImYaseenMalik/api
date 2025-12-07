// functions/api/auth/login.js
export async function onRequestPost({ request, env }) {
  const { email, password } = await request.json();

  // fetch user from D1
  const userRes = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).all();
  if(!userRes.results || userRes.results.length === 0){
    return new Response(JSON.stringify({ok:false, error:'User not found'}), {status:401, headers:{'Content-Type':'application/json'}});
  }

  const user = userRes.results[0];

  // simple password check (replace with bcrypt if desired)
  if(password !== user.password_hash){
    return new Response(JSON.stringify({ok:false, error:'Wrong password'}), {status:401, headers:{'Content-Type':'application/json'}});
  }

  // create JWT using native Web Crypto
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

  return new Response(JSON.stringify({
    ok: true,
    token,
    user: {
      email: user.email,
      display_name: user.display_name
    }
  }), {headers:{'Content-Type':'application/json'}});
}
