# Jardín Verde Development Skill

**Description**: Production-ready development assistant for the Jardín Verde project, applying expert-level best practices for JavaScript/Node.js, security, code quality, and Vercel deployment.

**Invocation**: `/jardin-verde-dev` or `/jv`

---

## Project Overview

This skill is specifically designed for the **Jardín Verde** project:

- **Frontend**: Vanilla JavaScript, HTML5, CSS3 (single-page app)
- **Backend**: Node.js serverless functions (Vercel)
- **API Integration**: Anthropic Claude API
- **Deployment**: Vercel
- **Storage**: LocalStorage (client-side)

---

## Core Responsibilities

### 1. Code Generation & Modification

When writing or modifying code, ALWAYS apply these production-ready standards:

#### JavaScript Best Practices (Frontend & Backend)

```javascript
// ✅ GOOD: Modern ES6+, clear naming, error handling
async function fetchPlantData(plantId) {
  if (!plantId?.trim()) {
    throw new Error('Plant ID is required');
  }

  try {
    const response = await fetch(`/api/plants/${encodeURIComponent(plantId)}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch plant data:', error);
    throw error;
  }
}

// ❌ BAD: No validation, poor error handling
async function fetchPlantData(plantId) {
  const response = await fetch('/api/plants/' + plantId);
  return await response.json();
}
```

#### Security Requirements

**CRITICAL** - Always enforce these security measures:

1. **Input Validation & Sanitization**

```javascript
// Sanitize user input before using in DOM
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Validate data structures
function validatePlantData(data) {
  const schema = {
    name: 'string',
    type: ['interior', 'exterior', 'semilla'],
    care: 'object',
  };
  // Implement validation logic
}
```

2. **XSS Prevention**

```javascript
// ✅ Use textContent for user data
element.textContent = userInput;

// ✅ Or sanitize before innerHTML
element.innerHTML = sanitizeHTML(userInput);

// ❌ NEVER directly insert user input
element.innerHTML = userInput; // DANGEROUS!
```

3. **API Security**

```javascript
// Rate limiting (already implemented)
// CORS validation (already implemented)
// API key protection (environment variables)
// Input validation for all endpoints

// ✅ Validate request bodies
if (!Array.isArray(messages) || messages.length === 0) {
  return res.status(400).json({
    error: 'messages must be a non-empty array',
  });
}

// ✅ Sanitize and limit data
const maxTokens = Math.min(parseInt(req.body.max_tokens) || 1000, MAX_TOKENS_CAP);
```

4. **Environment Variables**

```javascript
// ✅ ALWAYS use environment variables for secrets
const apiKey = process.env.ANTHROPIC_API_KEY;

// ❌ NEVER hardcode credentials
const apiKey = 'sk-ant-...'; // DANGEROUS!
```

5. **Content Security**

```javascript
// Validate URLs before fetching
function isValidURL(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Validate image sources
function validateImageSource(url) {
  const allowedDomains = ['source.unsplash.com', 'images.unsplash.com'];
  try {
    const domain = new URL(url).hostname;
    return allowedDomains.some(allowed => domain.includes(allowed));
  } catch {
    return false;
  }
}
```

#### Error Handling Patterns

```javascript
// ✅ Comprehensive error handling
async function apiCall(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(endpoint, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }

    console.error('API call failed:', {
      endpoint,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
}

// ✅ User-friendly error messages
function handleError(error, context = '') {
  const userMessage = {
    AbortError: 'La solicitud tardó demasiado. Inténtalo de nuevo.',
    NetworkError: 'Error de conexión. Verifica tu internet.',
    TypeError: 'Error al procesar los datos. Inténtalo de nuevo.',
    default: 'Algo salió mal. Por favor, inténtalo de nuevo.',
  };

  const message = userMessage[error.name] || userMessage.default;

  // Log for debugging (development only)
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, error);
  }

  return message;
}
```

#### Performance Optimization

```javascript
// ✅ Debouncing for search inputs
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const searchPlants = debounce(async query => {
  // Expensive search operation
}, 300);

// ✅ Lazy loading images
function lazyLoadImages() {
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
}

// ✅ Memoization for expensive calculations
const memoize = fn => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};
```

#### Code Organization

```javascript
// ✅ Modular structure
const PlantManager = {
  // State management
  state: {
    plants: [],
    filter: 'all',
    loading: false,
  },

  // Initialization
  init() {
    this.loadFromStorage();
    this.bindEvents();
    this.render();
  },

  // Data operations
  loadFromStorage() {
    try {
      const data = localStorage.getItem('jardin-verde-v2');
      this.state.plants = data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load plants:', error);
      this.state.plants = [];
    }
  },

  saveToStorage() {
    try {
      localStorage.setItem('jardin-verde-v2', JSON.stringify(this.state.plants));
    } catch (error) {
      console.error('Failed to save plants:', error);
      // Handle quota exceeded
      if (error.name === 'QuotaExceededError') {
        alert('Almacenamiento lleno. Elimina algunas plantas.');
      }
    }
  },

  // CRUD operations
  async addPlant(plantData) {
    const validated = this.validatePlant(plantData);
    this.state.plants.unshift({
      id: this.generateId(),
      ...validated,
      createdAt: new Date().toISOString(),
    });
    this.saveToStorage();
    this.render();
  },

  // Validation
  validatePlant(data) {
    const required = ['name', 'type'];
    for (const field of required) {
      if (!data[field]?.trim()) {
        throw new Error(`${field} is required`);
      }
    }

    const validTypes = ['interior', 'exterior', 'semilla'];
    if (!validTypes.includes(data.type)) {
      throw new Error('Invalid plant type');
    }

    return {
      name: data.name.trim(),
      type: data.type,
      scientific: data.scientific?.trim() || '',
      emoji: data.emoji || '🌿',
      care: data.care || {},
    };
  },

  // Helper methods
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
};
```

### 2. CSS Best Practices

```css
/* ✅ Modern CSS with custom properties */
:root {
  /* Color system */
  --color-primary: #4a9e52;
  --color-secondary: #c9a84c;
  --color-background: #0e1a12;
  --color-surface: #162019;
  --color-text: #d4e8d0;
  --color-error: #e74c3c;

  /* Spacing system */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* Typography */
  --font-sans: 'DM Sans', -apple-system, sans-serif;
  --font-serif: 'Playfair Display', Georgia, serif;

  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.4);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms ease;
}

/* ✅ Responsive design with mobile-first */
.container {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 var(--space-md);
}

@media (min-width: 768px) {
  .container {
    padding: 0 var(--space-lg);
  }
}

/* ✅ Accessibility */
.button {
  /* Minimum touch target size */
  min-height: 44px;
  min-width: 44px;

  /* Focus visible */
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* Disabled state */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* ✅ Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ✅ Dark mode preparation */
@media (prefers-color-scheme: light) {
  :root {
    --color-background: #f5f5f5;
    --color-surface: #ffffff;
    --color-text: #1a1a1a;
  }
}
```

### 3. Backend API Best Practices

```javascript
// ✅ Vercel serverless function template
export default async function handler(req, res) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CORS handling
  const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:3000', 'http://localhost:3001'];

  const origin = req.headers.origin || '';
  const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Method validation
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      allowed: ['POST'],
    });
  }

  // Rate limiting
  const ip = getClientIP(req);
  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: 900, // seconds
    });
  }

  // Input validation
  try {
    validateRequestBody(req.body);
  } catch (error) {
    return res.status(400).json({
      error: 'Invalid request',
      details: error.message,
    });
  }

  // Business logic with error handling
  try {
    const result = await processRequest(req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Request processing failed:', {
      error: error.message,
      timestamp: new Date().toISOString(),
      ip,
    });

    // Don't leak internal errors
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}

// Helper: Get client IP
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    'unknown'
  );
}

// Helper: Validate request body
function validateRequestBody(body) {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be an object');
  }

  if (!Array.isArray(body.messages)) {
    throw new Error('messages must be an array');
  }

  if (body.messages.length === 0) {
    throw new Error('messages array cannot be empty');
  }

  if (body.messages.length > 50) {
    throw new Error('Too many messages (max 50)');
  }

  // Validate message structure
  for (const msg of body.messages) {
    if (!msg.role || !msg.content) {
      throw new Error('Invalid message structure');
    }

    if (!['user', 'assistant'].includes(msg.role)) {
      throw new Error(`Invalid role: ${msg.role}`);
    }

    if (typeof msg.content !== 'string') {
      throw new Error('Message content must be a string');
    }

    if (msg.content.length > 50000) {
      throw new Error('Message content too long (max 50000 chars)');
    }
  }

  // Validate max_tokens
  if (body.max_tokens !== undefined) {
    const tokens = parseInt(body.max_tokens);
    if (isNaN(tokens) || tokens < 1 || tokens > 4096) {
      throw new Error('max_tokens must be between 1 and 4096');
    }
  }
}
```

### 4. Testing & Validation

```javascript
// ✅ Unit test template
describe('PlantManager', () => {
  beforeEach(() => {
    localStorage.clear();
    PlantManager.state.plants = [];
  });

  test('should add valid plant', () => {
    const plant = {
      name: 'Monstera',
      type: 'interior',
      scientific: 'Monstera deliciosa',
    };

    PlantManager.addPlant(plant);

    expect(PlantManager.state.plants).toHaveLength(1);
    expect(PlantManager.state.plants[0].name).toBe('Monstera');
  });

  test('should reject invalid plant type', () => {
    const plant = {
      name: 'Test',
      type: 'invalid',
    };

    expect(() => PlantManager.addPlant(plant)).toThrow('Invalid plant type');
  });

  test('should sanitize input', () => {
    const plant = {
      name: '<script>alert("xss")</script>',
      type: 'interior',
    };

    PlantManager.addPlant(plant);
    const saved = PlantManager.state.plants[0];

    expect(saved.name).not.toContain('<script>');
  });
});

// ✅ Integration test for API
describe('API /chat endpoint', () => {
  test('should reject requests without messages', async () => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('messages');
  });

  test('should enforce rate limiting', async () => {
    const requests = Array(70)
      .fill(null)
      .map(() =>
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] }),
        })
      );

    const responses = await Promise.all(requests);
    const tooMany = responses.filter(r => r.status === 429);

    expect(tooMany.length).toBeGreaterThan(0);
  });
});
```

### 5. Linting & Formatting Configuration

**ESLint Configuration** (`.eslintrc.json`):

```json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": ["eslint:recommended"],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "no-console": ["warn", { "allow": ["error", "warn"] }],
    "no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"],
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-param-reassign": "error",
    "prefer-const": "error",
    "no-var": "error",
    "prefer-arrow-callback": "error",
    "prefer-template": "error",
    "no-throw-literal": "error",
    "require-await": "error"
  }
}
```

**Prettier Configuration** (`.prettierrc.json`):

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

**StyleLint Configuration** (`.stylelintrc.json`):

```json
{
  "extends": "stylelint-config-standard",
  "rules": {
    "color-hex-length": "long",
    "color-named": "never",
    "declaration-block-no-redundant-longhand-properties": true,
    "font-family-name-quotes": "always-where-recommended",
    "function-url-quotes": "always",
    "selector-class-pattern": "^[a-z][a-zA-Z0-9-]*$",
    "selector-pseudo-class-no-unknown": [true, { "ignorePseudoClasses": ["global"] }]
  }
}
```

### 6. Git Workflow & Deployment

**Git Commit Message Convention**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `style`: Formatting changes
- `perf`: Performance improvements
- `test`: Adding tests
- `docs`: Documentation
- `chore`: Maintenance

Example:

```
feat(plants): add export to CSV functionality

- Implement CSV generation for plant collection
- Add download button in collection view
- Include all plant metadata in export

Closes #42
```

**Vercel Deployment Checklist**:

1. ✅ Environment variables set
2. ✅ Build command configured
3. ✅ Output directory specified
4. ✅ Node version specified in `package.json`
5. ✅ Serverless function regions optimized
6. ✅ Analytics enabled
7. ✅ Custom domain configured (if needed)
8. ✅ Preview deployments enabled

---

## Code Review Checklist

Before considering any code complete, verify:

### Security ✅

- [ ] No hardcoded secrets or API keys
- [ ] Input validation on all user data
- [ ] XSS prevention (sanitization)
- [ ] CSRF protection where needed
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] Security headers set
- [ ] No SQL injection vectors (if using DB)
- [ ] Dependencies audited (`npm audit`)

### Performance ✅

- [ ] Images optimized and lazy-loaded
- [ ] Debouncing/throttling on frequent events
- [ ] Minimal bundle size
- [ ] No unnecessary re-renders
- [ ] Caching strategies implemented
- [ ] API calls minimized

### Accessibility ✅

- [ ] Semantic HTML used
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast sufficient (WCAG AA)
- [ ] Alt text for images
- [ ] Form labels properly associated

### Code Quality ✅

- [ ] DRY principle followed
- [ ] Functions are single-purpose
- [ ] Magic numbers/strings extracted to constants
- [ ] Error handling comprehensive
- [ ] Code commented where complex
- [ ] No dead code
- [ ] Consistent naming conventions
- [ ] ESLint/Prettier compliant

### Testing ✅

- [ ] Edge cases handled
- [ ] Error scenarios tested
- [ ] User flows validated
- [ ] Cross-browser tested
- [ ] Mobile responsive
- [ ] LocalStorage quota handling

### Documentation ✅

- [ ] README updated
- [ ] API endpoints documented
- [ ] Environment variables listed
- [ ] Setup instructions clear
- [ ] Inline comments for complex logic

---

## Quick Reference Commands

### Development

```bash
# Install dependencies
npm install

# Run locally with Vercel CLI
vercel dev

# Lint code
npm run lint

# Format code
npm run format

# Type check (if TypeScript added)
npm run type-check

# Audit dependencies
npm audit
npm audit fix
```

### Deployment

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs [deployment-url]

# List deployments
vercel list

# Set environment variable
vercel env add VARIABLE_NAME production
```

### Git

```bash
# Create feature branch
git checkout -b feat/feature-name

# Commit with convention
git commit -m "feat(scope): description"

# Push and create PR
git push -u origin feat/feature-name
```

---

## Response Templates

When implementing features, structure responses like this:

### 1. Analysis Phase

```
I'll implement [feature] for the Jardín Verde project.

**Approach:**
- [Step 1]
- [Step 2]
- [Step 3]

**Files to modify:**
- `path/to/file1.js` - [reason]
- `path/to/file2.css` - [reason]

**Security considerations:**
- [Item 1]
- [Item 2]
```

### 2. Implementation Phase

```
Implementing [feature]...

[Use Read tool to understand existing code]
[Use Edit/Write tools to make changes]
[Apply all best practices from this skill]
```

### 3. Validation Phase

```
✅ Code written following:
- Security best practices (input validation, XSS prevention)
- Error handling patterns
- Performance optimization
- Accessibility standards
- ESLint/Prettier compliance

**Testing recommendations:**
1. [Test case 1]
2. [Test case 2]
3. [Test case 3]

**Next steps:**
- Run `npm run lint` to verify code quality
- Test locally with `vercel dev`
- Deploy preview with `vercel`
```

---

## File Templates

### New API Endpoint Template

```javascript
/**
 * API Endpoint: [Description]
 * Method: POST
 * Path: /api/[endpoint-name]
 *
 * Request Body:
 * {
 *   field1: string,
 *   field2: number
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   data: object
 * }
 */

const ALLOWED_ORIGINS = process.env.FRONTEND_URL?.split(',') || [];
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 60;

// In-memory rate limiting
const rateLimiter = new Map();

function checkRateLimit(identifier) {
  const now = Date.now();
  const record = rateLimiter.get(identifier) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };

  if (now > record.resetAt) {
    rateLimiter.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  rateLimiter.set(identifier, record);
  return true;
}

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || '';
  const isAllowed =
    ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
}

function getClientIdentifier(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['x-real-ip'] || 'unknown'
  );
}

function validateRequest(body) {
  // Implement validation logic
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  // Add specific validations

  return true;
}

export default async function handler(req, res) {
  // Set security headers
  setSecurityHeaders(res);
  setCorsHeaders(req, res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validate method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientId = getClientIdentifier(req);
  if (!checkRateLimit(clientId)) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: 900,
    });
  }

  // Validate request
  try {
    validateRequest(req.body);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  // Process request
  try {
    // Implementation here
    const result = { success: true, data: {} };
    return res.status(200).json(result);
  } catch (error) {
    console.error('Request failed:', {
      error: error.message,
      timestamp: new Date().toISOString(),
      clientId,
    });

    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### New Frontend Component Template

```javascript
/**
 * Component: [ComponentName]
 * Description: [What this component does]
 * Dependencies: [List any dependencies]
 */

const ComponentName = {
  // Component state
  state: {
    // Define state properties
  },

  // DOM references
  elements: {},

  // Initialize component
  init(containerSelector) {
    this.elements.container = document.querySelector(containerSelector);

    if (!this.elements.container) {
      console.error(`Container ${containerSelector} not found`);
      return;
    }

    this.bindEvents();
    this.render();
  },

  // Bind event listeners
  bindEvents() {
    // Example: this.elements.button.addEventListener('click', this.handleClick.bind(this));
  },

  // Render component
  render() {
    if (!this.elements.container) return;

    const html = this.template();
    this.elements.container.innerHTML = html;

    // Cache DOM references after render
    this.cacheElements();
  },

  // Cache DOM element references
  cacheElements() {
    // Example: this.elements.button = this.elements.container.querySelector('.button');
  },

  // Component template
  template() {
    return `
      <div class="component">
        <!-- Component HTML -->
      </div>
    `;
  },

  // Event handlers
  handleClick(event) {
    event.preventDefault();
    // Handle click
  },

  // Public methods
  update(data) {
    // Update component with new data
    Object.assign(this.state, data);
    this.render();
  },

  destroy() {
    // Cleanup
    if (this.elements.container) {
      this.elements.container.innerHTML = '';
    }
    this.elements = {};
  },
};

// Export or make available globally
// export default ComponentName;
```

---

## Common Patterns for This Project

### LocalStorage Management

```javascript
const StorageManager = {
  key: 'jardin-verde-v2',

  get() {
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to read from storage:', error);
      return null;
    }
  },

  set(data) {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to write to storage:', error);

      if (error.name === 'QuotaExceededError') {
        alert('Almacenamiento lleno. Por favor, elimina algunas plantas.');
      }

      return false;
    }
  },

  clear() {
    try {
      localStorage.removeItem(this.key);
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  },

  getSize() {
    const data = localStorage.getItem(this.key);
    return data ? new Blob([data]).size : 0;
  },
};
```

### AI API Call Pattern

```javascript
async function callAnthropicAPI({ messages, system, maxTokens = 1000 }) {
  const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        messages,
        system,
        max_tokens: maxTokens,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.content?.map(block => block.text || '').join('') || '';
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado. Inténtalo de nuevo.');
    }

    console.error('AI API call failed:', error);
    throw error;
  }
}
```

### JSON Parsing Safety

````javascript
function safeJSONParse(text, fallback = null) {
  try {
    // Remove markdown code blocks if present
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON parse failed:', error);
    return fallback;
  }
}
````

---

## Skill Activation

When this skill is invoked with `/jardin-verde-dev` or `/jv`:

1. **Acknowledge** the request and identify what needs to be done
2. **Analyze** existing code if modifying features
3. **Apply** all best practices from this skill automatically
4. **Implement** with security, performance, and accessibility in mind
5. **Validate** the implementation against the checklist
6. **Document** what was done and next steps

---

## Priority Order

When conflicts arise, prioritize in this order:

1. **Security** - Never compromise on security
2. **Data Integrity** - Protect user data
3. **Accessibility** - Ensure usability for all
4. **Performance** - Optimize for speed
5. **Code Quality** - Maintain clean code
6. **Features** - Add functionality last

---

**Remember**: This is a production application. Every line of code should be production-ready, secure, performant, and maintainable. Never cut corners on security, validation, or error handling.
