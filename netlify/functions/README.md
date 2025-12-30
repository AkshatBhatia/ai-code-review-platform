# Netlify Functions API

## Setup

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Create `.env` file from `.env.example`
3. Set Supabase credentials in `.env`

## Local Testing

```bash
# Start functions locally
netlify dev

# Functions available at:
# http://localhost:8888/.netlify/functions/list-scenarios
# http://localhost:8888/.netlify/functions/create-scenario
```

## Endpoints

### GET /list-scenarios
Query params: `difficulty`, `status`, `tags`, `company_id`

### POST /create-scenario
Body: `{ repo, canonical_pr_number, commit_sha, title, difficulty, tags, created_by }`
