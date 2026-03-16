# Integration Tests Documentation

## Overview

Comprehensive integration test suite for the Jardín Verde project, ensuring production-ready quality for both backend API and frontend functionality.

## Test Structure

```
tests/
├── __tests__/
│   ├── api/
│   │   └── chat.test.js           # API endpoint tests
│   └── integration/
│       └── plant-management.test.js  # Frontend integration tests
├── fixtures/
│   └── test-data.js               # Test data and fixtures
├── mocks/
│   └── anthropic.mock.js          # Anthropic SDK mock
└── setup.js                        # Jest configuration
```

## Running Tests

### All Tests

```bash
npm test
```

### Watch Mode (for development)

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

### Verbose Output

```bash
npm run test:verbose
```

## Test Coverage

### API Tests (`chat.test.js`)

**Total: 15 tests**

#### CORS Handling (3 tests)

- ✅ Sets correct CORS headers for allowed origins
- ✅ Handles OPTIONS preflight requests
- ✅ Rejects requests from disallowed origins

#### HTTP Method Validation (2 tests)

- ✅ Rejects GET requests with 405
- ✅ Accepts POST requests

#### Rate Limiting (2 tests)

- ✅ Allows requests within limit (60 per 15 minutes)
- ✅ Blocks requests exceeding rate limit with 429

#### Request Validation (3 tests)

- ✅ Rejects requests without messages field
- ✅ Rejects non-array messages
- ✅ Accepts valid message arrays

#### Anthropic API Integration (4 tests)

- ✅ Calls API with correct parameters
- ✅ Enforces max_tokens cap (1500)
- ✅ Returns successful responses
- ✅ Handles API errors gracefully

#### Security (1 test)

- ✅ Does not expose API keys in responses

### Frontend Integration Tests (`plant-management.test.js`)

**Total: 20 tests**

#### Plant Data Validation (4 tests)

- ✅ Validates required fields (name, type)
- ✅ Validates plant type (interior/exterior/semilla)
- ✅ Sanitizes plant names for XSS prevention
- ✅ Validates name length constraints

#### LocalStorage Operations (5 tests)

- ✅ Saves plants to localStorage
- ✅ Loads plants from localStorage
- ✅ Handles empty localStorage
- ✅ Handles corrupted data gracefully
- ✅ Handles quota exceeded errors

#### Plant CRUD Operations (4 tests)

- ✅ Adds new plants with unique IDs
- ✅ Deletes plants by ID
- ✅ Updates plant statistics
- ✅ Filters plants by type

#### AI Integration Flow (4 tests)

- ✅ Formats messages for Anthropic API
- ✅ Handles empty plant collections
- ✅ Parses AI responses
- ✅ Handles malformed AI responses

#### Error Handling (3 tests)

- ✅ Handles network errors
- ✅ Handles API errors with status codes
- ✅ Validates responses before processing

## Test Fixtures

### Valid Test Data

```javascript
validMessages = [
  {
    role: 'user',
    content: 'What is a Monstera plant?',
  },
];

validPlantData = {
  name: 'Monstera Deliciosa',
  scientific: 'Monstera deliciosa',
  type: 'interior',
  emoji: '🌿',
  care: {
    water: 'Cada 7-10 días',
    light: 'Luz indirecta brillante',
    difficulty: 'Fácil',
  },
};
```

### Invalid Test Data

```javascript
invalidMessages = {
  empty: [],
  notArray: 'not an array',
  missingRole: [{ content: 'test' }],
  missingContent: [{ role: 'user' }],
  invalidRole: [{ role: 'invalid', content: 'test' }],
  tooLong: Array(51).fill({ role: 'user', content: 'test' }),
  contentTooLong: [{ role: 'user', content: 'x'.repeat(50001) }],
};

invalidPlantData = {
  missingName: { type: 'interior' },
  missingType: { name: 'Test Plant' },
  invalidType: { name: 'Test', type: 'invalid' },
  xssAttempt: { name: '<script>alert("xss")</script>', type: 'interior' },
};
```

## Mocking Strategy

### Anthropic SDK Mock

The Anthropic SDK is mocked to avoid real API calls during testing:

```javascript
const mockCreate = jest.fn().mockResolvedValue({
  id: 'msg_test123',
  content: [{ type: 'text', text: 'Test response' }],
  model: 'claude-sonnet-4-20250514',
});
```

### LocalStorage Mock

Browser localStorage is mocked for Node.js testing:

```javascript
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
```

## Test Environment

- **Test Runner**: Jest 30.x
- **Environment**: Node.js
- **Timeout**: 30 seconds per test
- **Coverage**: Collected from `api/**/*.js`

## Environment Variables

Tests use these environment variables:

```bash
NODE_ENV=test
ANTHROPIC_API_KEY=test-api-key
FRONTEND_URL=http://localhost:3000
```

## Continuous Integration

To integrate with CI/CD:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Writing New Tests

### API Endpoint Test Template

```javascript
describe('API: /your-endpoint', () => {
  let req, res;

  beforeEach(() => {
    req = {
      method: 'POST',
      headers: { origin: 'http://localhost:3000' },
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };
  });

  test('should handle valid request', async () => {
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
```

### Integration Test Template

```javascript
describe('Feature: Your Feature', () => {
  beforeEach(() => {
    // Setup
  });

  test('should perform expected behavior', () => {
    // Arrange
    const input = 'test data';

    // Act
    const result = yourFunction(input);

    // Assert
    expect(result).toBe('expected output');
  });
});
```

## Best Practices

### ✅ Do

- Use descriptive test names
- Test both success and failure cases
- Mock external dependencies
- Clean up after each test
- Use unique test data to avoid interference
- Test security vulnerabilities (XSS, injection)
- Test error handling
- Test edge cases

### ❌ Don't

- Make real API calls in tests
- Share mutable state between tests
- Skip cleanup in afterEach
- Test implementation details
- Have tests depend on execution order
- Ignore test failures
- Skip security tests

## Troubleshooting

### Tests Failing Due to Rate Limiting

Each test uses a unique IP address to avoid rate limiting interference:

```javascript
testCounter++;
req.headers['x-forwarded-for'] = `192.168.1.${testCounter}`;
```

### Mock Not Working

Ensure mocks are declared before importing:

```javascript
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  }));
});

const { handler } = require('../api/chat.export');
```

### Coverage Not Collecting

Check `jest.config.js` collectCoverageFrom pattern:

```javascript
collectCoverageFrom: ['api/**/*.js', '!node_modules/**'];
```

## Test Metrics

- **Total Tests**: 35
- **Test Suites**: 2
- **Pass Rate**: 100%
- **Coverage**: See `npm run test:coverage`

## Future Enhancements

- [ ] Add E2E tests with Playwright/Cypress
- [ ] Add visual regression tests
- [ ] Add performance benchmarks
- [ ] Add load testing for rate limiter
- [ ] Add contract tests for Anthropic API
- [ ] Add mutation testing

---

**Last Updated**: 2026-03-16

For questions or issues, please check the main project README.md
