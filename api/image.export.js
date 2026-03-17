/**
 * CommonJS export wrapper for image.js (for Jest testing)
 */

const handler = async (req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  const allowedOrigin = process.env.FRONTEND_URL || '*';
  const origin = req.headers.origin;

  if (allowedOrigin !== '*' && origin !== allowedOrigin) {
    return res.status(403).json({ error: 'CORS policy violation' });
  }

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Security headers
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    // Check if Pexels API key is configured
    const pexelsApiKey = process.env.PEXELS_API_KEY;

    if (!pexelsApiKey) {
      // No API key configured - return null (will show emoji)
      return res.status(200).json({ imageUrl: null, source: 'none' });
    }

    // Search Pexels for plant image
    const searchQuery = encodeURIComponent(query.trim());
    const pexelsUrl = `https://api.pexels.com/v1/search?query=${searchQuery}&per_page=1&orientation=landscape`;

    const response = await fetch(pexelsUrl, {
      headers: {
        Authorization: pexelsApiKey,
      },
    });

    if (!response.ok) {
      console.error('Pexels API error:', response.status);
      return res.status(200).json({ imageUrl: null, source: 'error' });
    }

    const data = await response.json();

    // Get the first photo's medium-sized URL
    if (data.photos && data.photos.length > 0) {
      const photo = data.photos[0];
      return res.status(200).json({
        imageUrl: photo.src.medium || photo.src.small,
        source: 'pexels',
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
      });
    }

    // No photos found
    return res.status(200).json({ imageUrl: null, source: 'not_found' });
  } catch (error) {
    console.error('Image API error:', error);
    return res.status(200).json({ imageUrl: null, source: 'error' });
  }
};

module.exports = handler;
