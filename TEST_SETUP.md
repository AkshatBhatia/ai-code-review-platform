# Test Setup for ReviewStack

## Running Tests

This project includes comprehensive unit tests for all major functionality.

### Local Development

Run all tests locally:
```bash
# From project root
yarn run test:all

# Or run each package separately
cd shared && npm test
cd reviewstack && npm test -- --watchAll=false
```

### Netlify Deployment

Tests automatically run during Netlify deployments as part of the build process:

1. **Shared package tests** (138 tests) - Utility functions and shared components
2. **ReviewStack package tests** (83 tests) - Core application functionality including:
   - Authentication concepts (token management, OAuth flows, Auth0 integration)
   - Comment system concepts (optimistic rendering, submission logic, PR restrictions)  
   - Submit button state management (enable/disable logic, review events, state coordination)

### Test Coverage Areas

#### Authentication System
- ✅ Token storage and cleanup with correct localStorage keys
- ✅ GitHub OAuth URL construction and callback parameter parsing
- ✅ Auth0 integration with custom claims and identity fallbacks
- ✅ Environment variable handling and validation

#### Comment System  
- ✅ Optimistic comment rendering and ID management
- ✅ Comment validation and submission logic
- ✅ PR state restrictions (preventing inline comments on merged PRs)
- ✅ Submit button state management based on pending reviews
- ✅ Auto-scroll trigger conditions and position calculations

#### State Management
- ✅ Pending review ID filtering (real vs optimistic)
- ✅ Review event transitions and validation requirements
- ✅ Cross-component state coordination
- ✅ Form submission state and error handling

### Deployment Behavior

If any tests fail during Netlify deployment, the build will be aborted and the deployment will not proceed. This ensures that:

1. **No regressions** are deployed to production
2. **Quality is maintained** across all deployments  
3. **Functionality is verified** before users see changes

### Test Files Location

- `shared/__tests__/` - Shared utility tests
- `reviewstack/src/__tests__/` - Core application concept tests
- `reviewstack/src/github/*.test.ts` - GitHub integration tests

Total: **31 test suites, 221 tests**