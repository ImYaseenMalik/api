export async function onRequestPost({ request, env }) {
const body = await request.json();
const prompt = body.prompt;


// example using OPENAI_KEY
const res = await fetch('https://api.openai.com/v1/completions',{
method:'POST',
headers:{
'Authorization':'Bearer '+env.OPENAI_KEY,
'Content-Type':'application/json'
},
body:JSON.stringify({
model:'text-davinci-003',
prompt,
max_tokens:200
})
});


const data = await res.json();
return new Response(JSON.stringify({response: data.choices[0].text}), {headers:{'Content-Type':'application/json'}});
}
