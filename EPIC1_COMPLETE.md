# EPIC 1: Scenario Registry & Catalog - COMPLETE

## What We Built

### Backend (EPIC 0)
- ✅ Supabase database with scenarios table
- ✅ Netlify Functions API (`list-scenarios`, `create-scenario`)
- ✅ Environment setup and configuration

### Frontend (EPIC 1)
- ✅ TypeScript types for GitHub-backed scenarios (`scenarioTypes.ts`)
- ✅ API client utilities (`scenarioAPI.ts`)
- ✅ ScenarioManagement component with:
  - List view showing all scenarios
  - Difficulty and tag labels
  - Links to canonical PRs
  - "Start Interview" buttons (ready for EPIC 3)
- ✅ Create Scenario modal with:
  - PR URL parsing
  - Commit SHA input
  - Difficulty selection
  - Tag management
  - Error handling
- ✅ Integration with InterviewerDashboard

## Testing EPIC 1

### 1. Start the dev environment

```bash
# Terminal 1: Start Netlify functions
netlify dev
# Select: reviewstack.dev when prompted

# Functions available at http://localhost:8888/.netlify/functions/
# Frontend available at http://localhost:3000/
```

### 2. Access Interviewer Dashboard

1. Go to `http://localhost:3000`
2. Login with your GitHub token
3. Select "Interviewer" role
4. You should see the "Scenario Catalog" tab

### 3. Create a Scenario

Click "Create Scenario" button:

**Required fields:**
- **PR URL**: `https://github.com/your-org/your-repo/pull/123` (must be a closed PR)
- **Commit SHA**: Get from PR (e.g., `abc123def456`)
- **Title**: "SQL Injection Security Review"
- **Difficulty**: Select easy/medium/hard
- **Tags**: `security, backend, sql` (comma-separated)

Click "Create Scenario"

### 4. Verify

- Scenario appears in list
- Shows correct difficulty badge
- Tags displayed
- "View PR" link works
- Can see in Supabase dashboard

## Architecture

```
User Action (Create Scenario)
  ↓
ScenarioManagement.tsx
  ↓
scenarioAPI.ts (API client)
  ↓
Netlify Function: create-scenario.js
  ↓
Supabase (scenarios table)
  ↓
Response back to UI
```

## Next Steps (EPIC 2)

Scenario Validation:
- Validate PR is closed
- Check comment conventions ([BLOCKER], [MAJOR], etc.)
- Verify severity tags
- Ensure minimum issue coverage

## Files Created/Modified

**Created:**
- `supabase/schemas/001_initial_schema.sql`
- `netlify/functions/_shared/supabase.js`
- `netlify/functions/list-scenarios.js`
- `netlify/functions/create-scenario.js`
- `reviewstack/src/scenarioTypes.ts`
- `reviewstack/src/scenarioAPI.ts`
- `reviewstack/src/ScenarioManagement.tsx`

**Modified:**
- `reviewstack/src/InterviewerDashboard.tsx`
- `package.json` (added @supabase/supabase-js)
