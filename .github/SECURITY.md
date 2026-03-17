# Security Policy

## 🔒 Security Overview

AIcultor takes security seriously. This document outlines our security practices and how to report vulnerabilities.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Security Measures Implemented

### 1. Code Security

- ✅ **XSS Prevention** - All user input sanitized before DOM insertion
- ✅ **Injection Prevention** - No eval(), proper input validation
- ✅ **CORS Protection** - Strict origin validation
- ✅ **Rate Limiting** - 60 requests per 15 minutes per IP
- ✅ **Security Headers** - X-Frame-Options, X-Content-Type-Options, etc.

### 2. API Security

- ✅ **Environment Variables** - No hardcoded secrets
- ✅ **Input Validation** - All API endpoints validate input
- ✅ **Error Handling** - No sensitive data in error messages
- ✅ **HTTPS Only** - All traffic encrypted

### 3. Dependencies

- ✅ **Automated Scanning** - Daily security scans with Trivy, Snyk
- ✅ **Dependency Updates** - Dependabot for automated updates
- ✅ **npm Audit** - Runs on every build

### 4. Testing

- ✅ **Security Tests** - XSS, injection, rate limiting tests
- ✅ **CodeQL Analysis** - GitHub's code scanning
- ✅ **Secret Scanning** - TruffleHog for exposed secrets
- ✅ **Coverage** - 94.73% test coverage

## Automated Security Scans

We run comprehensive security scans:

### Daily (Scheduled)

- Dependency vulnerability scanning (Trivy)
- Secret scanning (TruffleHog)
- CodeQL analysis

### On Every Push/PR

- npm audit
- ESLint security rules
- XSS/Injection tests
- CORS validation
- Rate limiting tests

## Reporting a Vulnerability

### Please DO NOT create a public GitHub issue for security vulnerabilities.

Instead, please report security vulnerabilities by:

1. **Email**: [Your security email - add your email]
2. **GitHub Security Advisory**: Use the "Security" tab → "Report a vulnerability"

### What to Include

Please include as much information as possible:

- Type of vulnerability
- Step-by-step reproduction steps
- Affected versions
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 1-7 days
  - High: 7-30 days
  - Medium: 30-90 days
  - Low: Next release cycle

## Security Best Practices for Contributors

### Code Guidelines

1. **Never commit secrets**

   ```bash
   # ❌ Bad
   const apiKey = 'sk-ant-123456'

   # ✅ Good
   const apiKey = process.env.ANTHROPIC_API_KEY
   ```

2. **Always sanitize user input**

   ```javascript
   // ❌ Bad
   element.innerHTML = userInput;

   // ✅ Good
   element.textContent = userInput;
   ```

3. **Validate all inputs**

   ```javascript
   // ✅ Always validate
   if (!data || typeof data !== 'string') {
     throw new Error('Invalid input');
   }
   ```

4. **Use security headers**
   ```javascript
   res.setHeader('X-Frame-Options', 'DENY');
   res.setHeader('X-Content-Type-Options', 'nosniff');
   ```

### Before Submitting PR

Run security checks locally:

```bash
# Run all tests
npm test

# Run linting with security rules
npm run lint

# Check for secrets
git secrets --scan

# Audit dependencies
npm audit
```

## Security Configuration

### Environment Variables

Required environment variables (never commit these):

```bash
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=https://your-domain.com
```

### Vercel Configuration

Security settings in `vercel.json`:

- Output directory restrictions
- API route protection
- CORS configuration

## Known Security Considerations

### LocalStorage

- User plant data stored in browser LocalStorage
- No sensitive data stored
- Users responsible for their own data
- Key: `aicultor-v2`

### Rate Limiting

- In-memory rate limiter (resets on serverless cold start)
- 60 requests per 15 minutes per IP
- Consider Redis for production scaling

### CORS

- Configurable via `FRONTEND_URL` env variable
- Defaults to allow all origins in development
- Strict in production

## Security Updates

We regularly update:

- Dependencies (Dependabot weekly)
- Security patches (as needed)
- Node.js version (LTS releases)

## Security Badges

![Security Scan](https://github.com/Deeius/aicultor/workflows/Security%20Tests/badge.svg)
![CodeQL](https://github.com/Deeius/aicultor/workflows/CodeQL/badge.svg)

## Contact

For security concerns, contact:

- Email: [Add your security email]
- GitHub: [@Deeius](https://github.com/Deeius)

---

**Last Updated**: 2026-03-16

Thank you for helping keep AIcultor secure! 🔒
