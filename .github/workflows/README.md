# GitHub Actions Workflows

This directory contains the CI/CD workflows for AIcultor.

## Workflows

### 1. CI (`ci.yml`)

**Triggers:** Push and PR to `main` or `develop`

**Jobs:**

- **Quality Checks** - Runs on Node 18.x and 20.x
  - Linting (ESLint)
  - Code formatting check (Prettier)
  - Unit tests (Jest)
  - Test coverage report
  - Optional: Upload to Codecov

- **Security Audit**
  - npm security audit
  - Check for outdated dependencies

- **Build Check**
  - Verify build process
  - Check frontend files

- **Status Check**
  - Ensures all checks passed
  - Gates deployment

### 2. Deploy (`deploy.yml`)

**Triggers:** Push to `main` or manual dispatch

**Jobs:**

- Run tests before deploy
- Deploy to Vercel production
- Report deployment status

**Required Secrets:**

- `VERCEL_TOKEN` - Your Vercel token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

### 3. PR Checks (`pr-checks.yml`)

**Triggers:** Pull request events

**Jobs:**

- Run all quality checks
- Check for breaking changes
- Validate PR size
- Provide review summary

## Setting Up Secrets

### Vercel Secrets

1. Get your Vercel token:

   ```bash
   npx vercel login
   npx vercel link
   cat .vercel/project.json
   ```

2. Add secrets to GitHub:
   - Go to Settings → Secrets and variables → Actions
   - Add `VERCEL_TOKEN`
   - Add `VERCEL_ORG_ID`
   - Add `VERCEL_PROJECT_ID`

### Optional: Codecov

For coverage reports:

1. Sign up at https://codecov.io
2. Add repository
3. Get token and add as `CODECOV_TOKEN` secret

## Status Badges

Add to README.md:

```markdown
[![CI](https://github.com/Deeius/aicultor/workflows/CI/badge.svg)](https://github.com/Deeius/aicultor/actions)
[![Tests](https://github.com/Deeius/aicultor/workflows/Tests/badge.svg)](https://github.com/Deeius/aicultor/actions)
[![Deploy](https://github.com/Deeius/aicultor/workflows/Deploy%20to%20Vercel/badge.svg)](https://github.com/Deeius/aicultor/actions)
```

## Branch Protection

Recommended settings for `main` branch:

1. Go to Settings → Branches → Branch protection rules
2. Add rule for `main`:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
     - Select: `Quality Checks`, `Security Audit`, `Build Check`
   - ✅ Require branches to be up to date before merging
   - ✅ Require linear history
   - ✅ Do not allow bypassing the above settings

## Local Testing

Test workflows locally with [act](https://github.com/nektos/act):

```bash
# Install act
brew install act

# Run CI workflow
act -j quality-checks

# Run all workflows
act push
```

## Workflow Diagram

```
Push to main
    ↓
CI Workflow
├─ Quality Checks (Node 18 & 20)
│  ├─ Lint
│  ├─ Format check
│  ├─ Tests
│  └─ Coverage
├─ Security Audit
│  ├─ npm audit
│  └─ Check outdated
└─ Build Check
   └─ Verify build
    ↓
All checks pass? ✅
    ↓
Deploy to Vercel
    ↓
Production Live 🚀
```

## Troubleshooting

### CI Fails on Tests

```bash
npm test
```

### CI Fails on Linting

```bash
npm run lint
npx eslint --fix api/**/*.js
```

### CI Fails on Formatting

```bash
npm run format
```

### Deploy Fails

Check Vercel secrets are correctly set in GitHub Settings.
