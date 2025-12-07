// File: functions/api/uploads.js

// This function handles requests to the /api/uploads path.
export async function onRequest(context) {
    const { request, env } = context;

    // We only expect POST requests for uploads.
    if (request.method === 'POST') {
        try {
            // 1. Get the uploaded file data using formData
            const formData = await request.formData();
            const file = formData.get('file'); // 'file' should be the name from your admin form

            if (!file || typeof file === 'string') {
                 return new Response('No file uploaded or file format is incorrect.', { status: 400 });
            }
            
            // 2. Determine a unique and safe file key (path in R2)
            const timestamp = Date.now();
            // Create a safe, lower-cased filename
            const fileName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase(); 
            const fileKey = `posts/images/${timestamp}_${fileName}`;
            
            // 3. Save the file to R2 using the R2_BUCKET binding
            await env.R2_BUCKET.put(fileKey, file.stream(), {
                httpMetadata: { contentType: file.type },
                // You can add more headers here if needed
            });
            
            // 4. Construct the public URL for the file
            // **IMPORTANT:** Replace 'your-r2-domain.r2.dev' with the actual R2 public access domain 
            // once you configure it in the next step. For now, this is a placeholder.
            const publicUrl = `https://your-r2-domain.r2.dev/${fileKey}`; 
            
            // 5. Return the URL so the admin dashboard can save it to the D1 'posts' table
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
            return new Response(JSON.stringify({ error: `Upload failed: ${e.message}` }), { 
                headers: { 'Content-Type': 'application/json' },
                status: 500 
            });
        }
    }

    // Default for any other request method
    return new Response('Method Not Allowed', { status: 405 });
}
