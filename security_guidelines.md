# Content Security Policy for MumiasGIS

## Next.js CSP Configuration

Add to `next.config.ts` or a middleware:

```typescript
// next/config.ts or middleware
const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://unpkg.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' http://localhost:8000 https://api.openrouteservice.org;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'self';
`

// In middleware or via next-middleware package
```

## XSS Protection Strategies

### 1. Input Sanitization (Frontend)
- Validate all user inputs before rendering
- Use React's built-in XSS protection (automatic escaping)
- Never use `dangerouslySetInnerHTML` unless absolutely necessary
- If required, sanitize with DOMPurify

### 2. Backend Response Headers (Already Implemented)
- `X-Content-Type-Options: nosniff` — Prevents browser MIME sniffing
- `X-Frame-Options: DENY` — Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` — Legacy IE/XSS protection

### 3. Content Security Policy (CSP) Headers

Add to FastAPI `main.py` middleware or Vercel/Netlify headers:

```python
response.headers["Content-Security-Policy"] = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline' https://unpkg.com; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data: https:; "
    "connect-src 'self' http://localhost:8000 https://api.openrouteservice.org; "
    "font-src 'self'; "
    "object-src 'none'; "
    "base-uri 'self'; "
    "form-action 'self'; "
    "frame-ancestors 'self'"
)
```

### 3. XSS Vulnerabilities to Check

Review the frontend for potential XSS:

**✅ Safe:** React automatically escapes text content
**⚠️ Check:** `dangerouslySetInnerHTML` in `MapComponent.tsx`, `AIAssistant.tsx`, other components

Review all instances of `dangerouslySetInnerHTML` and ensure:
- Only trusted content is rendered
- Input is sanitized
- Consider using `npm install dompurify` and `DOMPurify.sanitize()`

### GitHub Actions Workflows

Create `.github/workflows/` directory with:

#### 1. CI Workflow — Lint, Typecheck, Test
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: cd MOBILE\ GIS && npm ci
        
      - name: Run TypeScript check
        run: cd MOBILE\ GIS && npx tsc --noEmit
        
      - name: Run ESLint
        run: cd MOBILE\ GIS && npm run lint
        
      - name: Run backend Python checks
        run: cd MOBILE\ GIS/.venv && python -m pylint backend/ || true
```

#### 2. Deploy Workflow — Vercel + Railway
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Vercel Deployment
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          
      - name: Railway Deployment (Backend)
        uses: railwayapp/railway-cli-action@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          working-directory: MOBILE\ GIS/backend
```

#### 3. Security Scan Workflow
```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  schedule:
    - cron: '0 4 * * *'  # Daily at 4 AM
  push:
    branches: [main]

jobs:
  detect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Scan dependencies (npm)
        run: cd MOBILE\ GIS && npm audit --production --audit-level=high
        
      - name: Scan Python dependencies
        run: cd MOBILE\ GIS/.venv && pip-audit || pip list --format=freeze > packages.txt
        
      - name: Check for secret leaks
        uses: gitleaks/gitleaks-action@v2
        with:
          file: ./github/secret_scan_report.json
```

### 📋 Quick Implementation Checklist

- [ ] Add CSP header to FastAPI `main.py` or Vercel dashboard
- [ ] Review all `dangerouslySetInnerHTML` usage in frontend
- [ ] Add GitHub Actions CI workflow (`.github/workflows/ci.yml`)
- [ ] Add GitHub Actions deploy workflow (`.github/workflows/deploy.yml`)
- [ ] Add GitHub Actions security scan (`.github/workflows/security.yml`)
- [ ] Set up secrets: VERCEL_TOKEN, RAILWAY_TOKEN, etc.
- [ ] Configure Vercel project with custom CSP headers

Would you like me to create the GitHub Actions workflow files and update the CSP configuration?