import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function onRequest({ request, env }) {
  const headers = {
    'Access-Control-Allow-Origin': 'https://admin.infliker.fun',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') return new Response(null, { headers });

  try {
    const { email, password } = await request.json();
    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();

    if (!user) return new Response(JSON.stringify({ ok:false, error:'Invalid email/password' }), { status:401, headers });

    // Compare password (plain text or bcrypt)
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return new Response(JSON.stringify({ ok:false, error:'Invalid email/password' }), { status:401, headers });

    // Generate JWT
    const token = jwt.sign({ id:user.id, email:user.email }, env.JWT_SECRET, { expiresIn: '7d' });

    return new Response(JSON.stringify({ ok:true, token }), { headers });

  } catch (err) {
    return new Response(JSON.stringify({ ok:false, error:err.message }), { status:500, headers });
  }
}
