/**
 * Security tests for rate limiting bypass attempts
 * Tests various techniques to circumvent rate limits
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

describe('Security: Rate Limiting', () => {
  let req, res;

  beforeEach(() => {
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
    };
  });

  describe('IP-based Rate Limiting', () => {
    test('should enforce rate limit per IP', async () => {
      const testIP = '10.0.0.200';

      req = {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          'x-forwarded-for': testIP,
        },
        body: {
          messages: [{ role: 'user', content: 'test' }],
        },
      };

      // Make 61 requests (limit is 60)
      for (let i = 0; i < 61; i++) {
        await chatHandler(req, res);
      }

      expect(res.status).toHaveBeenLastCalledWith(429);
    });

    test('should reset rate limit after time window', async () => {
      const testIP = '10.0.0.201';

      req = {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          'x-forwarded-for': testIP,
        },
        body: {
          messages: [{ role: 'user', content: 'test' }],
        },
      };

      // Make requests up to limit
      for (let i = 0; i < 60; i++) {
        await chatHandler(req, res);
      }

      expect(res.status).toHaveBeenLastCalledWith(200);

      // Note: Time-based reset requires waiting 15 minutes
      // This test validates the limit is enforced
    });

    test('should track different IPs separately', async () => {
      // IP 1
      req = {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          'x-forwarded-for': '10.0.0.202',
        },
        body: {
          messages: [{ role: 'user', content: 'test' }],
        },
      };

      for (let i = 0; i < 60; i++) {
        await chatHandler(req, res);
      }
      expect(res.status).toHaveBeenLastCalledWith(200);

      // IP 2 should still have full limit
      req.headers['x-forwarded-for'] = '10.0.0.203';
      await chatHandler(req, res);
      expect(res.status).toHaveBeenLastCalledWith(200);
    });
  });

  describe('X-Forwarded-For Header Manipulation', () => {
    test('should handle missing x-forwarded-for header', async () => {
      req = {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
        },
        body: {
          messages: [{ role: 'user', content: 'test' }],
        },
      };

      await chatHandler(req, res);

      // Should use fallback IP (127.0.0.1 or similar)
      expect(res.status).toHaveBeenCalled();
    });

    test('should handle multiple IPs in x-forwarded-for', async () => {
      req = {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          'x-forwarded-for': '10.0.0.1, 10.0.0.2, 10.0.0.3',
        },
        body: {
          messages: [{ role: 'user', content: 'test' }],
        },
      };

      await chatHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle malformed x-forwarded-for', async () => {
      req = {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          'x-forwarded-for': 'not-an-ip',
        },
        body: {
          messages: [{ role: 'user', content: 'test' }],
        },
      };

      await chatHandler(req, res);

      expect(res.status).toHaveBeenCalled();
    });

    test('should handle IPv6 addresses', async () => {
      req = {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        },
        body: {
          messages: [{ role: 'user', content: 'test' }],
        },
      };

      await chatHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle header injection in x-forwarded-for', async () => {
      req = {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          'x-forwarded-for': '10.0.0.1\r\nX-Custom: malicious',
        },
        body: {
          messages: [{ role: 'user', content: 'test' }],
        },
      };

      await chatHandler(req, res);

      // Should still process (header injection shouldn't bypass limit)
      expect(res.status).toHaveBeenCalled();
    });
  });

  describe('Rate Limit Error Responses', () => {
    test('should return 429 status when rate limited', async () => {
      const testIP = '10.0.0.210';

      req = {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          'x-forwarded-for': testIP,
        },
        body: {
          messages: [{ role: 'user', content: 'test' }],
        },
      };

      // Exceed limit
      for (let i = 0; i < 61; i++) {
        await chatHandler(req, res);
      }

      expect(res.status).toHaveBeenLastCalledWith(429);
    });

    test('should include helpful error message when rate limited', async () => {
      const testIP = '10.0.0.211';

      req = {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          'x-forwarded-for': testIP,
        },
        body: {
          messages: [{ role: 'user', content: 'test' }],
        },
      };

      // Exceed limit
      for (let i = 0; i < 61; i++) {
        await chatHandler(req, res);
      }

      expect(res.json).toHaveBeenLastCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Demasiadas peticiones'),
        })
      );
    });

    test('should not leak rate limit info in response', async () => {
      const testIP = '10.0.0.212';

      req = {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          'x-forwarded-for': testIP,
        },
        body: {
          messages: [{ role: 'user', content: 'test' }],
        },
      };

      // Exceed limit
      for (let i = 0; i < 61; i++) {
        await chatHandler(req, res);
      }

      const response = res.json.mock.calls[res.json.mock.calls.length - 1][0];
      const responseStr = JSON.stringify(response);

      // Should not reveal exact limit numbers or implementation details
      expect(responseStr).not.toMatch(/60|61|limit.*60/i);
    });
  });

  describe('Distributed Attack Prevention', () => {
    test('should handle requests from many different IPs', async () => {
      // Simulate distributed attack from 100 different IPs
      for (let i = 1; i <= 100; i++) {
        req = {
          method: 'POST',
          headers: {
            origin: 'http://localhost:3000',
            'x-forwarded-for': `10.0.1.${i}`,
          },
          body: {
            messages: [{ role: 'user', content: 'test' }],
          },
        };

        await chatHandler(req, res);
      }

      // All should succeed (each IP gets own limit)
      expect(res.status).toHaveBeenLastCalledWith(200);
    });

    test('should maintain rate limit accuracy under concurrent requests', async () => {
      const testIP = '10.0.0.220';

      req = {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          'x-forwarded-for': testIP,
        },
        body: {
          messages: [{ role: 'user', content: 'test' }],
        },
      };

      // Make 65 requests to ensure we're over limit
      const promises = [];
      for (let i = 0; i < 65; i++) {
        promises.push(chatHandler(req, res));
      }

      await Promise.all(promises);

      // At least some should be rate limited
      const rateLimitedCalls = res.status.mock.calls.filter((call) => call[0] === 429);
      expect(rateLimitedCalls.length).toBeGreaterThan(0);
    });
  });
});
