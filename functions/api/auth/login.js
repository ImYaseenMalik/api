export async function onRequestPost({ request, env }) {
const { email, password } = await request.json();


// check user in D1
const userRes = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).all();
if(!userRes.results || userRes.results.length===0){
return new Response(JSON.stringify({ok:false, error:'User not found'}), {status:401, headers:{'Content-Type':'application/json'}});
}


const user = userRes.results[0];


// check password (simple for now, later can use bcrypt)
if(password !== user.password_hash){
return new Response(JSON.stringify({ok:false, error:'Wrong password'}), {status:401, headers:{'Content-Type':'application/json'}});
}


// generate JWT token
const jwt = require('jsonwebtoken');
const token = jwt.sign({id:user.id, email:user.email}, env.JWT_SECRET, {expiresIn:'7d'});


return new Response(JSON.stringify({ok:true, token, user:{email:user.email, display_name:user.display_name}}), {headers:{'Content-Type':'application/json'}});
}
