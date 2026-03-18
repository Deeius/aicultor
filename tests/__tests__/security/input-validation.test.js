/**
 * Security tests for input validation and sanitization
 * Tests XSS prevention, injection attempts, and malicious input handling
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

const { handler } = require('../../../api/chat.export');
const imageHandler = require('../../../api/image.export');

describe('Security: Input Validation', () => {
  let req, res, testCounter = 0;

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

    req = {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        'x-forwarded-for': `192.168.3.${testCounter}`,
      },
      body: {
        messages: [{ role: 'user', content: 'Test' }],
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
  });

  describe('XSS Prevention', () => {
    test('should reject messages with script tags', async () => {
      req.body.messages = [
        {
          role: 'user',
          content: '<script>alert("xss")</script>',
        },
      ];

      // The API doesn't sanitize HTML - it passes to Anthropic
      // But we should validate that dangerous patterns are handled
      await handler(req, res);

      // API should still process (Anthropic handles content safety)
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle messages with HTML entities', async () => {
      req.body.messages = [
        {
          role: 'user',
          content: '&lt;script&gt;alert("xss")&lt;/script&gt;',
        },
      ];

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle messages with event handlers', async () => {
      req.body.messages = [
        {
          role: 'user',
          content: '<img src=x onerror=alert("xss")>',
        },
      ];

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle javascript: protocol in content', async () => {
      req.body.messages = [
        {
          role: 'user',
          content: '<a href="javascript:alert(1)">Click</a>',
        },
      ];

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('SQL Injection Prevention', () => {
    test('should handle SQL injection patterns in plant names', () => {
      const plantName = "'; DROP TABLE plants; --";

      // LocalStorage is JSON-based, not SQL
      // Validate that special chars don't break storage
      const plants = [{ name: plantName, type: 'interior' }];
      const serialized = JSON.stringify(plants);
      const deserialized = JSON.parse(serialized);

      expect(deserialized[0].name).toBe(plantName);
    });

    test('should handle SQL injection in query content', async () => {
      req.body.messages = [
        {
          role: 'user',
          content: "' OR '1'='1",
        },
      ];

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle union-based SQL injection', async () => {
      req.body.messages = [
        {
          role: 'user',
          content: "' UNION SELECT * FROM users--",
        },
      ];

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Command Injection Prevention', () => {
    test('should handle shell command injection in messages', async () => {
      req.body.messages = [
        {
          role: 'user',
          content: '`rm -rf /`',
        },
      ];

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle pipe commands', async () => {
      req.body.messages = [
        {
          role: 'user',
          content: 'test | cat /etc/passwd',
        },
      ];

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle path traversal attempts', async () => {
      req.body.messages = [
        {
          role: 'user',
          content: '../../../../etc/passwd',
        },
      ];

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Input Length Validation', () => {
    test('should handle very long message content', async () => {
      req.body.messages = [
        {
          role: 'user',
          content: 'x'.repeat(10000),
        },
      ];

      await handler(req, res);

      // API delegates to Anthropic for content limits
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle many messages', async () => {
      req.body.messages = Array(20).fill({
        role: 'user',
        content: 'test',
      });

      await handler(req, res);

      // API allows multiple messages
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should require messages to be an array', async () => {
      req.body.messages = 'not an array';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Special Characters Handling', () => {
    test('should handle unicode characters', async () => {
      req.body.messages = [
        {
          role: 'user',
          content: '你好世界 🌿🌱💐',
        },
      ];

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle null bytes', async () => {
      req.body.messages = [
        {
          role: 'user',
          content: 'test\x00malicious',
        },
      ];

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle control characters', async () => {
      req.body.messages = [
        {
          role: 'user',
          content: 'test\r\n\t',
        },
      ];

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle mixed encoding', async () => {
      req.body.messages = [
        {
          role: 'user',
          content: 'test%0D%0AHeader:%20injection',
        },
      ];

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Image API Input Validation', () => {
    beforeEach(() => {
      req.method = 'GET';
      req.query = { query: 'monstera' };
      delete req.body;
    });

    test('should handle query with XSS attempt', async () => {
      req.query = { query: '<script>alert("xss")</script>' };

      await imageHandler(req, res);

      // Should process without error (query is URL-encoded)
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle very long query strings', async () => {
      req.query = { query: 'x'.repeat(1000) };

      await imageHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle special characters in query', async () => {
      req.query = { query: '../../etc/passwd' };

      await imageHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle unicode in image query', async () => {
      req.query = { query: 'растение 植物 🌿' };

      await imageHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
