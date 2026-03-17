# AIcultor - Project Guide for Claude

## Project Overview

AIcultor is an AI-powered plant collection manager that helps users create personalized care plans for their plants using Claude AI.

**Tech Stack:**

- **Frontend**: Vanilla JavaScript, HTML5, CSS3 (Single Page Application)
- **Backend**: Node.js 18+, Vercel Serverless Functions
- **API**: Anthropic Claude API (@anthropic-ai/sdk v0.39.0+)
- **Testing**: Jest 30.x (35 tests, 94.73% coverage)
- **Deployment**: Vercel
- **Module System**: ES Modules (`"type": "module"`)

## Project Structure

```
aicultor/
├── frontend/
│   └── index.html          # Main SPA (all frontend code in one file)
├── api/
│   ├── chat.js             # Main API endpoint (ES modules)
│   └── chat.export.js      # CommonJS wrapper for Jest testing
├── tests/
│   ├── __tests__/
│   │   ├── api/chat.test.js                    # API tests (15 tests)
│   │   └── integration/plant-management.test.js # Frontend tests (20 tests)
│   ├── fixtures/           # Test data
│   ├── mocks/              # Anthropic API mocks
│   └── setup.js            # Jest setup
├── .github/
│   ├── workflows/
│   │   ├── ci.yml          # CI pipeline (lint, test, build)
│   │   ├── deploy.yml      # Vercel deployment
│   │   ├── pr-checks.yml   # PR validation
│   │   ├── security.yml    # Security scans (8 jobs)
│   │   └── codeql.yml      # CodeQL analysis
│   ├── dependabot.yml      # Monthly dependency updates
│   └── SECURITY.md         # Security policy
├── jest.config.cjs         # Jest config (CommonJS)
├── eslint.config.js        # ESLint 10 flat config
├── vercel.json             # Vercel configuration
└── package.json            # Dependencies & scripts
```

## Key Files & Purposes

### Frontend (`frontend/index.html`)

- **Lines 1-1000**: CSS styles (CSS variables, responsive design)
- **Lines 1000-1700**: JavaScript (wizard flow, API calls, plant management)
- **Storage**: LocalStorage key `aicultor-v2` (JSON array of plants)
- **Image System**: LoremFlickr for plant photos with emoji fallbacks

### API Endpoint (`api/chat.js`)

- **Rate Limiting**: 60 requests per 15 minutes per IP (in-memory)
- **CORS**: Validates against `FRONTEND_URL` env variable
- **Input Validation**: Validates messages array structure
- **Response**: Streams Claude API responses

### Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...    # Required for API
FRONTEND_URL=https://...        # Required for CORS (optional in dev)
```

## Development Workflow

### Common Commands

```bash
npm run dev              # Start Vercel dev server
npm test                 # Run all tests (Jest)
npm run lint             # Lint JS files (ESLint 10)
npm run format           # Format with Prettier
npm run security:audit   # Run npm audit
```

### Making Changes

1. **Frontend Changes**: Edit `frontend/index.html`
   - CSS: Modify CSS variables for theming
   - JS: Update wizard functions or API calls
   - Always test in browser with `npm run dev`

2. **API Changes**: Edit `api/chat.js`
   - Keep `chat.export.js` in sync for tests
   - Test with `npm test -- chat.test.js`

3. **Testing**:
   - API tests: `tests/__tests__/api/chat.test.js`
   - Frontend tests: `tests/__tests__/integration/plant-management.test.js`
   - Use unique IPs in tests to avoid rate limiting

### Git Workflow

- **Commit format**: Conventional commits (`feat:`, `fix:`, `chore:`, etc.)
- **Co-author**: Always include `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- **Branch**: `main` (direct push, no feature branches typically)

## Code Patterns

### Security Best Practices

- ✅ **No eval()**: Use safe alternatives
- ✅ **XSS Prevention**: Use `textContent` not `innerHTML` for user input
- ✅ **Input Validation**: Validate all API inputs
- ✅ **CORS**: Strict origin validation
- ✅ **Rate Limiting**: Implemented per IP
- ✅ **No Hardcoded Secrets**: Use environment variables

### Frontend Patterns

```javascript
// AI API Call
await callAI({
  system: 'system prompt',
  messages: [{ role: 'user', content: 'message' }],
  max_tokens: 800,
});

// LocalStorage
const plants = JSON.parse(localStorage.getItem('aicultor-v2') || '[]');
localStorage.setItem('aicultor-v2', JSON.stringify(plants));
```

### Testing Patterns

```javascript
// Unique IP per test (avoid rate limiting)
req.headers['x-forwarded-for'] = `192.168.1.${testCounter++}`;

// Mock Anthropic API
jest.mock('@anthropic-ai/sdk');
```

## CI/CD Pipeline

### On Push/PR

1. **CI**: Lint → Test → Build check
2. **Security**: Dependency scan, CodeQL, secrets scan
3. **Deploy**: Auto-deploy to Vercel (main branch only)

### Status Checks

All must pass before merge:

- ESLint (no errors)
- Jest (35/35 tests)
- Security scans
- Build verification

## Recent Major Changes

### 2026-03-17

- Migrated ESLint 8 → 10 (flat config)
- Updated CodeQL v3 → v4
- Replaced emojis with LoremFlickr plant images
- Reduced Dependabot: weekly → monthly
- Fixed missing label warnings

### Breaking Changes

- LocalStorage key changed: `jardin-verde-v2` → `aicultor-v2`
- ESLint now requires `@eslint/js` package
- Jest config: `.js` → `.cjs` for CommonJS

## Common Issues & Solutions

### Issue: ESLint errors

- Ensure `@eslint/js@^10.0.0` is installed
- Check `eslint.config.js` uses ES modules syntax

### Issue: Tests failing

- Check unique IPs in tests (rate limiting)
- Verify `chat.export.js` matches `chat.js`

### Issue: Images not loading

- LoremFlickr URL format: `https://loremflickr.com/300/200/{search,terms}`
- Fallback to emoji if image fails

### Issue: Vercel deployment fails

- Check `outputDirectory: "frontend"` in `vercel.json`
- Verify environment variables set in Vercel dashboard

## Optimization Tips for Token Usage

1. **Read this file first** - Most context is here
2. **Use targeted tools**:
   - `Grep` for finding code patterns
   - `Glob` for finding files
   - `Read` with offset/limit for large files
3. **Batch operations**: Make parallel tool calls when possible
4. **Avoid re-reading**: Reference this file instead of re-exploring
5. **Use plan mode**: For complex changes, use `EnterPlanMode`

## Dependencies

### Production

- `@anthropic-ai/sdk`: ^0.79.0

### Development

- `@eslint/js`: ^10.0.0
- `eslint`: ^10.0.0
- `eslint-plugin-security`: ^4.0.0
- `jest`: ^30.3.0
- `prettier`: ^3.2.5

## Contact & Links

- **GitHub**: Deeius/aicultor
- **Main Branch**: `main`
- **Node Version**: >=18
- **License**: MIT

---

**Last Updated**: 2026-03-17
**Project Version**: 1.0.0
