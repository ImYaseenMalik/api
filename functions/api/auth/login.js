// generate JWT without jsonwebtoken
async function createJWT(payload, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));

  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(`${header}.${body}`)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)));
  return `${header}.${body}.${sig}`;
}

// Usage
const token = await createJWT({ id: user.id, email: user.email }, env.JWT_SECRET);
