# Claude Development Notes

This file contains important information for Claude's future development sessions on this ReviewStack project.

## GitHub Authentication Token

**For Local Development (`localhost:3000`):**
- Token stored in: `.github-token` (see file below)
- Use this token when testing ReviewStack locally
- Token has access to all repositories under AkshatBhatia account

## Quick Setup Commands

To start local development:
```bash
cd /Users/akshat.bhatia/review-stack-interview/reviewstack-standalone
cd reviewstack && yarn codegen
cd ../reviewstack.dev && yarn start
# Visit http://localhost:3000
# Use token from .github-token file
```

## Authentication Methods

1. **Local Development**: Manual PAT entry (uses DefaultLoginDialog)
2. **Production (Netlify)**: OAuth flow (uses DirectGitHubLoginDialog)

## Project Structure

- `reviewstack/` - Main ReviewStack library
- `reviewstack.dev/` - Development server and login dialogs  
- `shared/` - Shared utilities
- `textmate/` - Syntax highlighting
- `netlify/functions/` - OAuth token exchange function

## Environment Variables (Netlify)

- `REACT_APP_GITHUB_CLIENT_ID` - GitHub OAuth App client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth App client secret
- `SECRETS_SCAN_OMIT_KEYS` - To allow Auth0/GitHub credentials in build

## Important Files

- `LazyLoginDialog.tsx` - Chooses between OAuth vs manual login
- `DirectGitHubLoginDialog.tsx` - GitHub OAuth flow
- `GitHubOAuthCallback.tsx` - Handles OAuth callback
- `netlify/functions/github-oauth.js` - Server-side token exchange

## URLs

- **Production**: https://ai-code-review-interview.netlify.app
- **Local Dev**: http://localhost:3000
- **GitHub OAuth App**: Configured for both domains

## Token Storage

ReviewStack expects tokens in localStorage with these exact keys:
- `github.token` (with dot, not underscore)
- `github.hostname` (usually "github.com")

## Next Steps for Claude

1. Read token from `.github-token` file
2. Use for local ReviewStack testing
3. Remember this setup for future development sessions
