/**
 * Mock Anthropic SDK for testing
 */

const mockMessages = {
  create: jest.fn(),
};

class MockAnthropic {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.messages = mockMessages;
  }
}

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

// Mock error response
const mockErrorResponse = new Error('API Error');
mockErrorResponse.status = 500;

module.exports = {
  MockAnthropic,
  mockMessages,
  mockSuccessResponse,
  mockErrorResponse,
};
