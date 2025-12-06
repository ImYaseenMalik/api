// Example for a file at functions/api/uploads.js
export async function onRequest(context) {
    const { request, env } = context;

    if (request.method === 'POST') {
        // 1. Get the uploaded file data
        const formData = await request.formData();
        const file = formData.get('file'); // 'file' is the name attribute from your admin's form input

        if (!file || typeof file === 'string') {
             return new Response('No file uploaded or file format is incorrect.', { status: 400 });
        }
        
        // 2. Determine the unique file path (Key)
        const timestamp = Date.now();
        // Use the original filename to generate a safe key
        const fileName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const fileKey = `posts/images/${timestamp}_${fileName}`;
        
        try {
            // 3. Save the file to R2 using the binding (env.R2_BUCKET)
            // .put() is the method to write an object to the R2 bucket
            await env.R2_BUCKET.put(fileKey, file.stream(), {
                httpMetadata: { contentType: file.type },
            });
            
            // 4. Return the path (URL) to the admin UI to save in D1
            // Note: You must enable a Public Development URL on your R2 bucket 
            // for direct access, or serve it via a Worker route for production.
            const publicUrl = `https://your-r2-domain.r2.dev/${fileKey}`; // Replace with your actual R2 URL
            
            return new Response(JSON.stringify({ 
                message: 'File uploaded successfully',
                url: publicUrl,
                key: fileKey
            }), {
                headers: { 'Content-Type': 'application/json' },
                status: 200,
            });
        } catch (e) {
            console.error('R2 Upload Error:', e);
            return new Response(`Upload failed: ${e.message}`, { status: 500 });
        }
    }

    return new Response('Method Not Allowed for this endpoint.', { status: 405 });
}
