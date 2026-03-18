/**
 * Integration tests for /api/image endpoint
 * Tests Pexels API integration for plant images
 */

// Mock successful Pexels response
const mockPexelsSuccessResponse = {
  photos: [
    {
      id: 123456,
      src: {
        original: 'https://example.com/image-original.jpg',
        large: 'https://example.com/image-large.jpg',
        medium: 'https://example.com/image-medium.jpg',
        small: 'https://example.com/image-small.jpg',
      },
      photographer: 'John Doe',
      photographer_url: 'https://example.com/photographer',
    },
  ],
};

const mockPexelsEmptyResponse = {
  photos: [],
};

// Mock fetch for Pexels API
const mockFetch = jest.fn();
global.fetch = mockFetch;

const handler = require('../../../api/image.export');

describe('API: /api/image endpoint', () => {
  let req, res, testCounter = 0;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockPexelsSuccessResponse,
    });

    // Use unique IP for each test
    testCounter++;

    // Mock request object
    req = {
      method: 'GET',
      headers: {
        origin: 'http://localhost:3000',
        'x-forwarded-for': `192.168.2.${testCounter}`,
      },
      query: {
        query: 'monstera deliciosa plant',
      },
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
  });

  describe('CORS handling', () => {
    test('should set CORS headers for allowed origin', async () => {
      await handler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'http://localhost:3000'
      );
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET');
    });

    test('should reject disallowed origin when FRONTEND_URL is set', async () => {
      process.env.FRONTEND_URL = 'https://allowed.com';
      req.headers.origin = 'https://malicious.com';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('CORS'),
        })
      );
    });

    test('should allow any origin when FRONTEND_URL is not set', async () => {
      delete process.env.FRONTEND_URL;

      await handler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    });
  });

  describe('HTTP method validation', () => {
    test('should reject POST requests', async () => {
      req.method = 'POST';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Method not allowed'),
        })
      );
    });

    test('should reject PUT requests', async () => {
      req.method = 'PUT';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
    });

    test('should accept GET requests', async () => {
      req.method = 'GET';
      process.env.PEXELS_API_KEY = 'test-key';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Query parameter validation', () => {
    test('should reject request without query parameter', async () => {
      req.query = {};

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Query parameter required'),
        })
      );
    });

    test('should reject empty query parameter', async () => {
      req.query = { query: '' };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should reject non-string query parameter', async () => {
      req.query = { query: 123 };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should accept valid query parameter', async () => {
      req.query = { query: 'monstera plant' };
      process.env.PEXELS_API_KEY = 'test-key';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should trim whitespace from query', async () => {
      req.query = { query: '  monstera plant  ' };
      process.env.PEXELS_API_KEY = 'test-key';

      await handler(req, res);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('monstera%20plant'),
        expect.any(Object)
      );
    });
  });

  describe('Pexels API integration', () => {
    test('should return null when PEXELS_API_KEY is not configured', async () => {
      delete process.env.PEXELS_API_KEY;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        imageUrl: null,
        source: 'none',
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should call Pexels API with correct parameters', async () => {
      process.env.PEXELS_API_KEY = 'test-api-key-123';
      req.query = { query: 'monstera deliciosa' };

      await handler(req, res);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.pexels.com/v1/search?query=monstera%20deliciosa&per_page=1&orientation=landscape',
        {
          headers: {
            Authorization: 'test-api-key-123',
          },
        }
      );
    });

    test('should return image URL on successful Pexels response', async () => {
      process.env.PEXELS_API_KEY = 'test-key';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        imageUrl: 'https://example.com/image-medium.jpg',
        source: 'pexels',
        photographer: 'John Doe',
        photographerUrl: 'https://example.com/photographer',
      });
    });

    test('should return small image if medium is not available', async () => {
      process.env.PEXELS_API_KEY = 'test-key';
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          photos: [
            {
              id: 123,
              src: {
                small: 'https://example.com/small.jpg',
              },
              photographer: 'Jane Doe',
              photographer_url: 'https://example.com/jane',
            },
          ],
        }),
      });

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: 'https://example.com/small.jpg',
        })
      );
    });

    test('should return null when no photos found', async () => {
      process.env.PEXELS_API_KEY = 'test-key';
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockPexelsEmptyResponse,
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        imageUrl: null,
        source: 'not_found',
      });
    });

    test('should handle Pexels API errors gracefully', async () => {
      process.env.PEXELS_API_KEY = 'test-key';
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        imageUrl: null,
        source: 'error',
      });
    });

    test('should handle network errors gracefully', async () => {
      process.env.PEXELS_API_KEY = 'test-key';
      mockFetch.mockRejectedValue(new Error('Network error'));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        imageUrl: null,
        source: 'error',
      });
    });
  });

  describe('Security headers', () => {
    test('should set X-Frame-Options header', async () => {
      await handler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    });

    test('should set X-Content-Type-Options header', async () => {
      await handler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    });

    test('should set Referrer-Policy header', async () => {
      await handler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy',
        'strict-origin-when-cross-origin'
      );
    });
  });

  describe('Response format', () => {
    test('should always return status 200 for valid requests', async () => {
      process.env.PEXELS_API_KEY = 'test-key';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return JSON response', async () => {
      process.env.PEXELS_API_KEY = 'test-key';

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

    test('should include source field in response', async () => {
      process.env.PEXELS_API_KEY = 'test-key';

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          source: expect.any(String),
        })
      );
    });

    test('should not expose API key in response', async () => {
      process.env.PEXELS_API_KEY = 'secret-api-key-123';

      await handler(req, res);

      const response = res.json.mock.calls[0][0];
      expect(JSON.stringify(response)).not.toContain('secret-api-key');
    });
  });

  describe('Error handling', () => {
    test('should handle malformed Pexels response', async () => {
      process.env.PEXELS_API_KEY = 'test-key';
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        imageUrl: null,
        source: 'not_found',
      });
    });

    test('should handle JSON parse errors', async () => {
      process.env.PEXELS_API_KEY = 'test-key';
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('JSON parse error');
        },
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        imageUrl: null,
        source: 'error',
      });
    });
  });
});
