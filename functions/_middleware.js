export const onRequest = async ({ request, next }) => {
  const response = await next();

  // CORS Headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "https://admin.infliker.fun",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle preflight OPTIONS request
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Attach CORS headers to actual responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
};
