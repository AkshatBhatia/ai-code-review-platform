# AI-Native Code Review Platform - Data Models & API Contracts

## Database Schema Design

### Core Domain Models

#### 1. User Management
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  role user_role NOT NULL DEFAULT 'candidate',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE TYPE user_role AS ENUM ('admin', 'scenario_author', 'interviewer', 'candidate');

-- User sessions for NextAuth.js
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR(255),
  scope VARCHAR(255),
  id_token TEXT,
  session_state VARCHAR(255),
  UNIQUE(provider, provider_account_id)
);
```

#### 2. Scenario Management
```sql
-- Review scenarios
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  language VARCHAR(50) NOT NULL, -- 'typescript', 'python', 'java', etc.
  framework VARCHAR(100), -- 'react', 'django', 'spring', etc.
  target_level experience_level NOT NULL, -- L4, L5, L6
  focus_areas TEXT[], -- ['security', 'performance', 'correctness']
  estimated_duration INTEGER NOT NULL DEFAULT 45, -- minutes
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  author_id UUID NOT NULL REFERENCES users(id),
  repo_snapshot_url VARCHAR(1000), -- S3 URL or git reference
  base_commit_sha VARCHAR(40),
  head_commit_sha VARCHAR(40),
  status scenario_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE experience_level AS ENUM ('L3', 'L4', 'L5', 'L6', 'L7');
CREATE TYPE scenario_status AS ENUM ('draft', 'active', 'archived');

-- File changes in the scenario
CREATE TABLE scenario_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  file_path VARCHAR(1000) NOT NULL,
  change_type file_change_type NOT NULL,
  old_content TEXT, -- Original file content
  new_content TEXT, -- Modified file content
  line_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE file_change_type AS ENUM ('added', 'modified', 'deleted', 'renamed');
```

#### 3. Expected Findings
```sql
-- Expected findings that reviewers should identify
CREATE TABLE expected_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  file_path VARCHAR(1000) NOT NULL,
  line_start INTEGER NOT NULL,
  line_end INTEGER NOT NULL,
  category finding_category NOT NULL,
  severity finding_severity NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  rationale TEXT, -- Why this is important
  suggested_fix TEXT, -- Optional fix suggestion
  weight DECIMAL(3,2) DEFAULT 1.0, -- Importance weight for scoring
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE finding_category AS ENUM (
  'bug', 'performance', 'security', 'reliability', 
  'design', 'testing', 'documentation', 'style'
);

CREATE TYPE finding_severity AS ENUM ('blocker', 'major', 'minor', 'nice_to_have');
```

#### 4. Interview Sessions
```sql
-- Interview sessions
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id),
  candidate_id UUID NOT NULL REFERENCES users(id),
  interviewer_id UUID REFERENCES users(id), -- Assigned after session creation
  status session_status NOT NULL DEFAULT 'created',
  started_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER, -- Calculated field
  metadata JSONB DEFAULT '{}', -- Additional session data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE session_status AS ENUM (
  'created', 'in_progress', 'paused', 'submitted', 'evaluated', 'cancelled'
);

-- Real-time session state for resuming
CREATE TABLE session_state (
  session_id UUID PRIMARY KEY REFERENCES interview_sessions(id) ON DELETE CASCADE,
  current_file VARCHAR(1000),
  scroll_position INTEGER DEFAULT 0,
  viewed_files TEXT[] DEFAULT '{}',
  bookmarks JSONB DEFAULT '[]', -- Array of {file, line, note}
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  state_data JSONB DEFAULT '{}' -- Additional state information
);
```

#### 5. Review Comments
```sql
-- Candidate review comments
CREATE TABLE review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  file_path VARCHAR(1000) NOT NULL,
  line_start INTEGER NOT NULL,
  line_end INTEGER NOT NULL,
  content TEXT NOT NULL,
  category finding_category, -- Optional categorization
  severity finding_severity, -- Optional severity
  is_blocking BOOLEAN DEFAULT false,
  thread_id UUID, -- For comment threads/replies
  parent_comment_id UUID REFERENCES review_comments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review summary submitted by candidate
CREATE TABLE review_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  blocking_issues TEXT NOT NULL,
  follow_up_suggestions TEXT NOT NULL,
  risk_assessment TEXT NOT NULL,
  overall_recommendation summary_recommendation NOT NULL,
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
  additional_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE summary_recommendation AS ENUM (
  'approve', 'approve_with_changes', 'request_changes', 'reject'
);
```

#### 6. AI Interactions
```sql
-- AI assistant interactions and audit log
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  interaction_type ai_interaction_type NOT NULL,
  prompt_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  context_files TEXT[] DEFAULT '{}', -- Files included in context
  context_lines JSONB DEFAULT '[]', -- Specific line ranges
  model_used VARCHAR(100) NOT NULL, -- 'gpt-4', 'claude-3', etc.
  tokens_used INTEGER,
  response_time_ms INTEGER,
  cost_usd DECIMAL(10,6), -- Cost tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE ai_interaction_type AS ENUM (
  'question', 'code_analysis', 'risk_assessment', 'suggestion_request'
);
```

#### 7. Evaluation & Scoring
```sql
-- Evaluation results
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES users(id),
  overall_score DECIMAL(3,2) CHECK (overall_score >= 0 AND overall_score <= 5),
  issue_detection_score DECIMAL(3,2),
  risk_prioritization_score DECIMAL(3,2),
  signal_to_noise_score DECIMAL(3,2),
  communication_score DECIMAL(3,2),
  ai_judgment_score DECIMAL(3,2),
  notes TEXT,
  recommendation evaluation_recommendation NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE evaluation_recommendation AS ENUM (
  'strong_hire', 'hire', 'no_hire', 'strong_no_hire'
);

-- Matching between candidate comments and expected findings
CREATE TABLE finding_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  expected_finding_id UUID NOT NULL REFERENCES expected_findings(id),
  candidate_comment_id UUID REFERENCES review_comments(id),
  match_type match_type NOT NULL,
  match_quality DECIMAL(3,2) CHECK (match_quality >= 0 AND match_quality <= 1),
  evaluator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE match_type AS ENUM ('exact', 'partial', 'missed', 'extra');
```

## TypeScript Type Definitions

### Core Domain Types
```typescript
// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  SCENARIO_AUTHOR = 'scenario_author',
  INTERVIEWER = 'interviewer',
  CANDIDATE = 'candidate'
}

// Scenario types
export interface Scenario {
  id: string;
  title: string;
  description?: string;
  language: string;
  framework?: string;
  targetLevel: ExperienceLevel;
  focusAreas: string[];
  estimatedDuration: number;
  difficultyRating?: number;
  authorId: string;
  repoSnapshotUrl?: string;
  baseCommitSha?: string;
  headCommitSha?: string;
  status: ScenarioStatus;
  createdAt: Date;
  updatedAt: Date;
  files?: ScenarioFile[];
  expectedFindings?: ExpectedFinding[];
}

export enum ExperienceLevel {
  L3 = 'L3',
  L4 = 'L4',
  L5 = 'L5',
  L6 = 'L6',
  L7 = 'L7'
}

export interface ScenarioFile {
  id: string;
  scenarioId: string;
  filePath: string;
  changeType: FileChangeType;
  oldContent?: string;
  newContent?: string;
  lineCount?: number;
}

export enum FileChangeType {
  ADDED = 'added',
  MODIFIED = 'modified',
  DELETED = 'deleted',
  RENAMED = 'renamed'
}

// Expected findings
export interface ExpectedFinding {
  id: string;
  scenarioId: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  description: string;
  rationale?: string;
  suggestedFix?: string;
  weight: number;
}

export enum FindingCategory {
  BUG = 'bug',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  RELIABILITY = 'reliability',
  DESIGN = 'design',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  STYLE = 'style'
}

export enum FindingSeverity {
  BLOCKER = 'blocker',
  MAJOR = 'major',
  MINOR = 'minor',
  NICE_TO_HAVE = 'nice_to_have'
}

// Session types
export interface InterviewSession {
  id: string;
  scenarioId: string;
  candidateId: string;
  interviewerId?: string;
  status: SessionStatus;
  startedAt?: Date;
  submittedAt?: Date;
  durationMinutes?: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  comments?: ReviewComment[];
  summary?: ReviewSummary;
  aiInteractions?: AIInteraction[];
}

export enum SessionStatus {
  CREATED = 'created',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  SUBMITTED = 'submitted',
  EVALUATED = 'evaluated',
  CANCELLED = 'cancelled'
}

// Comments and reviews
export interface ReviewComment {
  id: string;
  sessionId: string;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  content: string;
  category?: FindingCategory;
  severity?: FindingSeverity;
  isBlocking: boolean;
  threadId?: string;
  parentCommentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewSummary {
  id: string;
  sessionId: string;
  blockingIssues: string;
  followUpSuggestions: string;
  riskAssessment: string;
  overallRecommendation: SummaryRecommendation;
  confidenceLevel: number; // 1-5
  additionalNotes?: string;
  createdAt: Date;
}

export enum SummaryRecommendation {
  APPROVE = 'approve',
  APPROVE_WITH_CHANGES = 'approve_with_changes',
  REQUEST_CHANGES = 'request_changes',
  REJECT = 'reject'
}

// AI interactions
export interface AIInteraction {
  id: string;
  sessionId: string;
  interactionType: AIInteractionType;
  promptText: string;
  responseText: string;
  contextFiles: string[];
  contextLines: Array<{file: string; startLine: number; endLine: number}>;
  modelUsed: string;
  tokensUsed?: number;
  responseTimeMs?: number;
  costUsd?: number;
  createdAt: Date;
}

export enum AIInteractionType {
  QUESTION = 'question',
  CODE_ANALYSIS = 'code_analysis',
  RISK_ASSESSMENT = 'risk_assessment',
  SUGGESTION_REQUEST = 'suggestion_request'
}
```

## API Contract Specifications

### REST API Endpoints

#### Authentication & Users
```typescript
// POST /api/auth/callback/:provider
interface AuthCallbackResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// GET /api/users/me
interface CurrentUserResponse {
  user: User;
  permissions: string[];
}
```

#### Scenarios Management
```typescript
// GET /api/scenarios
interface ListScenariosRequest {
  page?: number;
  limit?: number;
  language?: string;
  targetLevel?: ExperienceLevel;
  authorId?: string;
  status?: ScenarioStatus;
}

interface ListScenariosResponse {
  scenarios: Scenario[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// POST /api/scenarios
interface CreateScenarioRequest {
  title: string;
  description?: string;
  language: string;
  framework?: string;
  targetLevel: ExperienceLevel;
  focusAreas: string[];
  estimatedDuration: number;
  difficultyRating?: number;
  repoSnapshotUrl?: string;
  files: Array<{
    filePath: string;
    changeType: FileChangeType;
    oldContent?: string;
    newContent?: string;
  }>;
  expectedFindings: Array<Omit<ExpectedFinding, 'id' | 'scenarioId'>>;
}

// GET /api/scenarios/:id
interface GetScenarioResponse {
  scenario: Scenario;
  files: ScenarioFile[];
  expectedFindings: ExpectedFinding[];
}
```

#### Interview Sessions
```typescript
// POST /api/sessions
interface CreateSessionRequest {
  scenarioId: string;
  candidateId?: string; // Optional for self-service
}

interface CreateSessionResponse {
  session: InterviewSession;
  scenario: Scenario;
}

// PUT /api/sessions/:id/start
interface StartSessionResponse {
  session: InterviewSession;
  files: ScenarioFile[];
}

// POST /api/sessions/:id/comments
interface AddCommentRequest {
  filePath: string;
  lineStart: number;
  lineEnd: number;
  content: string;
  category?: FindingCategory;
  severity?: FindingSeverity;
  isBlocking?: boolean;
}

// PUT /api/sessions/:id/submit
interface SubmitSessionRequest {
  summary: Omit<ReviewSummary, 'id' | 'sessionId' | 'createdAt'>;
}
```

#### AI Assistant
```typescript
// POST /api/ai/query
interface AIQueryRequest {
  sessionId: string;
  prompt: string;
  contextFiles?: string[];
  contextLines?: Array<{file: string; startLine: number; endLine: number}>;
  interactionType: AIInteractionType;
}

interface AIQueryResponse {
  response: string;
  tokensUsed: number;
  costUsd: number;
  sources: Array<{file: string; lines: number[]}>;
  interactionId: string;
}
```

#### Evaluation
```typescript
// POST /api/evaluations
interface CreateEvaluationRequest {
  sessionId: string;
  overallScore: number;
  issueDetectionScore: number;
  riskPrioritizationScore: number;
  signalToNoiseScore: number;
  communicationScore: number;
  aiJudgmentScore: number;
  notes?: string;
  recommendation: EvaluationRecommendation;
  findingMatches: Array<{
    expectedFindingId: string;
    candidateCommentId?: string;
    matchType: MatchType;
    matchQuality: number;
    evaluatorNotes?: string;
  }>;
}

// GET /api/evaluations/:sessionId
interface GetEvaluationResponse {
  evaluation: Evaluation;
  session: InterviewSession;
  findingMatches: FindingMatch[];
}
```

### WebSocket Event Types
```typescript
// Real-time session updates
interface SessionUpdateEvent {
  type: 'session_update';
  sessionId: string;
  data: {
    status?: SessionStatus;
    lastActivity?: Date;
    participantCount?: number;
  };
}

interface CommentAddedEvent {
  type: 'comment_added';
  sessionId: string;
  data: ReviewComment;
}

interface AIResponseEvent {
  type: 'ai_response';
  sessionId: string;
  data: {
    interactionId: string;
    response: string;
    isComplete: boolean;
  };
}
```

This comprehensive data model provides the foundation for building a robust, scalable code review platform with full audit capabilities and flexible evaluation workflows.