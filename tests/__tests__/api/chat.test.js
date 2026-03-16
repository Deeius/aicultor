/**
 * Integration tests for /api/chat endpoint
 */

const { validMessages, invalidMessages } = require('../../fixtures/test-data');

// Mock successful response
const mockSuccessResponse = {
  id: 'msg_test123',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: 'This is a test response from Claude.',
    },
  ],
  model: 'claude-sonnet-4-20250514',
  stop_reason: 'end_turn',
  usage: {
    input_tokens: 10,
    output_tokens: 20,
  },
};

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

describe('API: /api/chat endpoint', () => {
  let req,
    res,
    testCounter = 0;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockCreate.mockResolvedValue(mockSuccessResponse);

    // Use unique IP for each test to avoid rate limiting interference
    testCounter++;

    // Mock request object
    req = {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        'x-forwarded-for': `192.168.1.${testCounter}`,
      },
      body: {
        messages: validMessages,
      },
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };
  });

  describe('CORS handling', () => {
    test('should set CORS headers for allowed origin', async () => {
      await handler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'http://localhost:3000'
      );
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'POST, OPTIONS');
    });

    test('should handle OPTIONS preflight request', async () => {
      req.method = 'OPTIONS';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.end).toHaveBeenCalled();
    });

    test('should reject disallowed origin', async () => {
      process.env.FRONTEND_URL = 'https://allowed.com';
      req.headers.origin = 'https://malicious.com';

      await handler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '');
    });
  });

  describe('HTTP method validation', () => {
    test('should reject GET requests', async () => {
      req.method = 'GET';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Método no permitido'),
        })
      );
    });

    test('should accept POST requests', async () => {
      req.method = 'POST';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Rate limiting', () => {
    test('should allow requests within rate limit', async () => {
      for (let i = 0; i < 5; i++) {
        await handler(req, res);
      }

      expect(res.status).toHaveBeenLastCalledWith(200);
    });

    test('should block requests exceeding rate limit', async () => {
      // Use dedicated IP for rate limit test
      req.headers['x-forwarded-for'] = '10.0.0.99';

      // Make 61 requests (limit is 60)
      for (let i = 0; i < 61; i++) {
        await handler(req, res);
      }

      expect(res.status).toHaveBeenLastCalledWith(429);
      expect(res.json).toHaveBeenLastCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Demasiadas peticiones'),
        })
      );
    });
  });

  describe('Request validation', () => {
    test('should reject request without messages', async () => {
      req.body = {};

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('messages'),
        })
      );
    });

    test('should reject non-array messages', async () => {
      req.body.messages = 'not an array';

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should accept valid messages', async () => {
      req.body.messages = validMessages;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Anthropic API integration', () => {
    test('should call Anthropic API with correct parameters', async () => {
      req.body = {
        messages: validMessages,
        system: 'You are a helpful assistant.',
        max_tokens: 500,
      };

      await handler(req, res);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: 'You are a helpful assistant.',
        messages: validMessages,
      });
    });

    test('should enforce max_tokens cap', async () => {
      req.body = {
        messages: validMessages,
        max_tokens: 5000,
      };

      await handler(req, res);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 1500,
        })
      );
    });

    test('should return successful response', async () => {
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        content: mockSuccessResponse.content,
      });
    });

    test('should handle Anthropic API errors', async () => {
      const error = new Error('API Error');
      error.status = 500;
      mockCreate.mockRejectedValue(error);

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });
  });

  describe('Security', () => {
    test('should not expose API key in response', async () => {
      await handler(req, res);

      const response = res.json.mock.calls[0][0];
      expect(JSON.stringify(response)).not.toContain('sk-ant');
    });
  });
});
