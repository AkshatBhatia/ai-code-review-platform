# AI-Native Code Review Platform - Development Workflow & Testing Strategy

## Development Environment Setup

### Prerequisites & Tools
- **Node.js**: 20+ with npm/yarn
- **Docker**: Latest version with Docker Compose
- **PostgreSQL**: 16+ (via Docker)
- **Redis**: 7+ (via Docker)
- **Git**: Latest version
- **VS Code**: Recommended with extensions

### Required VS Code Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "ms-vscode.vscode-json",
    "ms-playwright.playwright",
    "vitest.explorer"
  ]
}
```

### Environment Configuration
```bash
# .env.local
DATABASE_URL="postgresql://postgres:password@localhost:5432/ai_code_review"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"  
GITHUB_CLIENT_SECRET="your-github-client-secret"

# AI Providers
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"

# File Storage
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_S3_BUCKET="ai-code-review-storage"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
POSTHOG_KEY="your-posthog-key"
```

## Project Structure

### Monorepo Organization
```
ai-code-review-platform/
├── apps/
│   ├── web/                 # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/         # App Router pages and layouts
│   │   │   ├── components/  # Reusable UI components
│   │   │   ├── lib/         # Utility functions and configurations
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   └── types/       # TypeScript type definitions
│   │   ├── public/          # Static assets
│   │   ├── prisma/          # Database schema and migrations
│   │   └── tests/           # Test files
│   └── api/                 # Express.js backend (if needed)
├── packages/
│   ├── ui/                  # Shared UI component library
│   ├── types/               # Shared TypeScript types
│   ├── database/            # Prisma schema and utilities
│   └── config/              # Shared configuration (ESLint, Tailwind)
├── tools/
│   ├── scripts/             # Build and deployment scripts
│   └── docker/              # Docker configurations
└── docs/                    # Documentation
```

### Feature-Based Organization (within apps/web/src)
```
src/
├── app/                     # Next.js App Router
│   ├── (auth)/             # Auth-protected routes
│   │   ├── scenarios/      # Scenario management
│   │   ├── sessions/       # Interview sessions
│   │   └── evaluations/    # Evaluation interface
│   ├── api/                # API route handlers
│   └── globals.css         # Global styles
├── components/             # Feature components
│   ├── scenario/           # Scenario-related components
│   ├── interview/          # Interview flow components
│   ├── evaluation/         # Evaluation components
│   ├── ui/                 # Generic UI components
│   └── layout/             # Layout components
├── lib/                    # Utilities and configurations
│   ├── auth.ts             # NextAuth configuration
│   ├── db.ts               # Database connection
│   ├── ai.ts               # AI service integration
│   └── utils.ts            # General utilities
└── hooks/                  # Custom React hooks
    ├── useSession.ts       # Session management
    ├── useAI.ts            # AI assistant integration
    └── useRealtime.ts      # WebSocket handling
```

## Git Workflow & Branching Strategy

### Branch Structure
- **main**: Production-ready code (protected)
- **develop**: Integration branch for features
- **feature/***: Individual feature branches
- **hotfix/***: Critical production fixes
- **release/***: Release preparation branches

### Branch Naming Convention
```bash
# Feature branches
feature/scenario-creation-ui
feature/ai-assistant-integration
feature/evaluation-scoring-system

# Bug fixes
fix/comment-threading-issue
fix/session-state-persistence

# Hotfixes
hotfix/security-vulnerability
hotfix/critical-performance-issue
```

### Commit Message Format
```bash
# Type: Brief description (50 chars max)
# 
# Detailed explanation if needed (72 chars per line)
#
# Examples:
feat: add inline commenting system for code reviews
fix: resolve session timeout during long interviews
docs: update API documentation for evaluation endpoints
test: add integration tests for AI assistant
refactor: extract comment validation logic to utils
```

### Pull Request Process
1. **Branch Creation**: Create feature branch from `develop`
2. **Development**: Implement feature with tests
3. **Self-Review**: Review your own code before PR
4. **PR Creation**: Use PR template with checklist
5. **Code Review**: At least one approval required
6. **CI/CD Checks**: All automated checks must pass
7. **Merge**: Squash and merge to maintain clean history

### PR Template
```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] Accessibility testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added to complex code sections
- [ ] Documentation updated
- [ ] Database migrations added (if applicable)

## Screenshots
Include screenshots for UI changes.
```

## Testing Strategy

### Testing Pyramid Structure
```
    /\     E2E Tests (10%)
   /  \    - Critical user flows
  /    \   - Cross-browser testing
 /______\  - Performance testing
/        \ 
\        / Integration Tests (20%)
 \______/  - API endpoints
  \    /   - Database operations
   \  /    - External service mocks
    \/     
   ____    Unit Tests (70%)
  |____|   - Pure functions
  |____|   - Component logic
  |____|   - Business logic
```

### Unit Testing Setup
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})

// src/tests/setup.ts
import '@testing-library/jest-dom'
import { beforeAll, afterAll, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

beforeAll(() => {
  // Setup test database, mock services
})

afterEach(() => {
  cleanup()
})

afterAll(() => {
  // Cleanup test resources
})
```

### Unit Test Examples
```typescript
// src/components/scenario/ScenarioCard.test.tsx
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { ScenarioCard } from './ScenarioCard'

const mockScenario = {
  id: '1',
  title: 'React Performance Review',
  language: 'typescript',
  targetLevel: 'L4',
  estimatedDuration: 45
}

describe('ScenarioCard', () => {
  it('renders scenario information correctly', () => {
    render(<ScenarioCard scenario={mockScenario} />)
    
    expect(screen.getByText('React Performance Review')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('L4')).toBeInTheDocument()
    expect(screen.getByText('45 min')).toBeInTheDocument()
  })

  it('calls onSelect when clicked', async () => {
    const onSelect = vi.fn()
    render(<ScenarioCard scenario={mockScenario} onSelect={onSelect} />)
    
    await userEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith(mockScenario.id)
  })
})

// src/lib/ai.test.ts
import { vi } from 'vitest'
import { AIService } from './ai'

vi.mock('openai', () => ({
  OpenAI: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }))
}))

describe('AIService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates code analysis response', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: 'This code has potential memory leaks...'
        }
      }],
      usage: { total_tokens: 150 }
    }

    const aiService = new AIService()
    const result = await aiService.analyzeCode(
      'const data = [];',
      { filePath: 'test.js', language: 'javascript' }
    )

    expect(result.response).toContain('memory leaks')
    expect(result.tokensUsed).toBe(150)
  })
})
```

### Integration Testing Setup
```typescript
// tests/integration/api.test.ts
import request from 'supertest'
import { app } from '../../src/app'
import { setupTestDb, cleanupTestDb } from '../helpers/database'

describe('API Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDb()
  })

  afterAll(async () => {
    await cleanupTestDb()
  })

  describe('POST /api/scenarios', () => {
    it('creates a new scenario', async () => {
      const scenarioData = {
        title: 'Test Scenario',
        language: 'typescript',
        targetLevel: 'L4',
        expectedFindings: []
      }

      const response = await request(app)
        .post('/api/scenarios')
        .send(scenarioData)
        .expect(201)

      expect(response.body.scenario.title).toBe('Test Scenario')
      expect(response.body.scenario.id).toBeDefined()
    })

    it('validates required fields', async () => {
      const response = await request(app)
        .post('/api/scenarios')
        .send({})
        .expect(400)

      expect(response.body.errors).toContain('title is required')
    })
  })
})
```

### E2E Testing with Playwright
```typescript
// tests/e2e/interview-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Interview Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test user and scenario
    await page.goto('/login')
    await page.fill('[name=email]', 'test@example.com')
    await page.click('[data-testid=login-button]')
  })

  test('candidate can complete full interview flow', async ({ page }) => {
    // Start interview
    await page.goto('/scenarios')
    await page.click('[data-testid=scenario-1]')
    await page.click('[data-testid=start-interview]')

    // Add comments
    await page.click('[data-testid=line-42]')
    await page.fill('[data-testid=comment-input]', 'Potential null pointer exception')
    await page.click('[data-testid=save-comment]')

    // Use AI assistant
    await page.click('[data-testid=ai-assistant]')
    await page.fill('[data-testid=ai-prompt]', 'What security issues do you see?')
    await page.click('[data-testid=ask-ai]')
    
    await expect(page.locator('[data-testid=ai-response]')).toBeVisible()

    // Submit review
    await page.click('[data-testid=submit-review]')
    await page.fill('[name=blockingIssues]', 'Security vulnerabilities found')
    await page.selectOption('[name=recommendation]', 'request_changes')
    await page.click('[data-testid=final-submit]')

    await expect(page.locator('[data-testid=success-message]')).toBeVisible()
  })

  test('interviewer can evaluate submission', async ({ page }) => {
    // Navigate to evaluation
    await page.goto('/evaluations/session-123')

    // Compare findings
    await expect(page.locator('[data-testid=candidate-comments]')).toBeVisible()
    await expect(page.locator('[data-testid=expected-findings]')).toBeVisible()

    // Score dimensions  
    await page.selectOption('[name=issueDetectionScore]', '4')
    await page.selectOption('[name=communicationScore]', '5')
    await page.fill('[name=notes]', 'Strong technical analysis')
    
    await page.click('[data-testid=submit-evaluation]')
    await expect(page.locator('[data-testid=evaluation-saved]')).toBeVisible()
  })
})
```

## Continuous Integration Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:unit
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
        REDIS_URL: redis://localhost:6379
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Run E2E tests
      run: npm run test:e2e
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
    
    - name: Upload test results
      uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: test-results
        path: test-results/

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Run security audit
      run: npm audit --audit-level high

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: [test, build]
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to staging
      run: echo "Deploy to staging environment"
      # Actual deployment steps would go here

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: [test, build]
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to production
      run: echo "Deploy to production environment"
      # Actual deployment steps would go here
```

## Code Quality Standards

### ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    // Code quality
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    
    // TypeScript
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // Import organization
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external', 
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always'
      }
    ]
  }
}
```

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Pre-commit Hooks (Husky)
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

## Performance & Monitoring

### Bundle Analysis
```bash
# Analyze bundle size
npm run analyze

# Monitor bundle size changes
npm run build:analyze
```

### Lighthouse CI Integration
```yaml
# lighthouse-ci.yml
ci:
  collect:
    startServerCommand: 'npm start'
    url: ['http://localhost:3000']
  assert:
    assertions:
      performance: 0.9
      accessibility: 0.9
      best-practices: 0.9
      seo: 0.9
  upload:
    target: 'temporary-public-storage'
```

This comprehensive development workflow ensures high code quality, reliable deployments, and efficient team collaboration throughout the 8-week MVP development cycle.