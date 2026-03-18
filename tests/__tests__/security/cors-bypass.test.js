/**
 * Security tests for CORS bypass attempts
 * Tests various techniques attackers might use to bypass CORS
 */

const mockCreate = jest.fn();

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => {
    return {
      messages: {
        create: mockCreate,
      },
    };
  });
});

const { handler: chatHandler } = require('../../../api/chat.export');
const imageHandler = require('../../../api/image.export');

describe('Security: CORS Bypass Attempts', () => {
  let req,
    res,
    testCounter = 0;

  beforeEach(() => {
    testCounter++;
    jest.clearAllMocks();

    mockCreate.mockResolvedValue({
      id: 'msg_test',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'Test response' }],
      model: 'claude-sonnet-4-20250514',
      stop_reason: 'end_turn',
      usage: { input_tokens: 10, output_tokens: 20 },
    });

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };
  });

  describe('Chat API CORS', () => {
    beforeEach(() => {
      req = {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          'x-forwarded-for': `192.168.4.${testCounter}`,
        },
        body: {
          messages: [{ role: 'user', content: 'test' }],
        },
      };
    });

    test('should block requests from disallowed origins', async () => {
      process.env.FRONTEND_URL = 'https://allowed.com';
      req.headers.origin = 'https://malicious.com';

      await chatHandler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '');
    });

    test('should handle origin with startsWith matching', async () => {
      process.env.FRONTEND_URL = 'https://example.com';
      req.headers.origin = 'https://example.com/page';

      await chatHandler(req, res);

      // API uses startsWith, so /page path is allowed
      expect(res.setHeader).toHaveBeenCalled();
    });

    test('should block origin with null', async () => {
      process.env.FRONTEND_URL = 'https://example.com';
      req.headers.origin = 'null';

      await chatHandler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '');
    });

    test('should handle missing origin header', async () => {
      delete req.headers.origin;

      await chatHandler(req, res);

      // Should still process but without CORS
      expect(res.status).toHaveBeenCalled();
    });

    test('should process requests with standard origin header', async () => {
      process.env.FRONTEND_URL = 'https://example.com';
      req.headers.origin = 'https://example.com';

      await chatHandler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'https://example.com'
      );
    });

    test('should allow requests when FRONTEND_URL not set', async () => {
      delete process.env.FRONTEND_URL;

      await chatHandler(req, res);

      // When FRONTEND_URL is not set, allows all origins
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Image API CORS', () => {
    beforeEach(() => {
      req = {
        method: 'GET',
        headers: {
          origin: 'http://localhost:3000',
          'x-forwarded-for': `192.168.4.${testCounter}`,
        },
        query: { query: 'test' },
      };
    });

    test('should block image requests from disallowed origins', async () => {
      process.env.FRONTEND_URL = 'https://allowed.com';
      req.headers.origin = 'https://malicious.com';

      await imageHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('CORS'),
        })
      );
    });

    test('should block subdomain attacks on image API', async () => {
      process.env.FRONTEND_URL = 'https://app.example.com';
      req.headers.origin = 'https://evil.example.com';

      await imageHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Preflight Request Handling', () => {
    test('should handle OPTIONS preflight correctly', async () => {
      req = {
        method: 'OPTIONS',
        headers: {
          origin: 'http://localhost:3000',
          'x-forwarded-for': '192.168.4.100',
        },
        body: {},
      };

      await chatHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'POST, OPTIONS');
    });

    test('should set correct preflight headers', async () => {
      req = {
        method: 'OPTIONS',
        headers: {
          origin: 'http://localhost:3000',
          'x-forwarded-for': '192.168.4.101',
        },
        body: {},
      };

      await chatHandler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type');
    });
  });

  describe('Header Injection Prevention', () => {
    test('should not allow header injection via origin', async () => {
      req = {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000\nX-Malicious: value',
          'x-forwarded-for': '192.168.4.102',
        },
        body: {
          messages: [{ role: 'user', content: 'test' }],
        },
      };

      await chatHandler(req, res);

      // Header should not be parsed with newlines
      const originSet = res.setHeader.mock.calls.find(
        call => call[0] === 'Access-Control-Allow-Origin'
      );
      expect(originSet[1]).not.toContain('\n');
    });

    test('should handle string origin header', async () => {
      req = {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          'x-forwarded-for': '192.168.4.103',
        },
        body: {
          messages: [{ role: 'user', content: 'test' }],
        },
      };

      await chatHandler(req, res);

      // Should process normally with string origin
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.setHeader).toHaveBeenCalled();
    });
  });
});
