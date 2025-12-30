-- Interview Platform Schema
-- Run this in Supabase SQL Editor

-- Scenarios table
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo TEXT NOT NULL,
  canonical_pr_number INTEGER NOT NULL,
  commit_sha TEXT NOT NULL,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[] DEFAULT '{}',
  validation_status TEXT NOT NULL DEFAULT 'draft' CHECK (validation_status IN ('draft', 'validated', 'active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by TEXT,
  company_id TEXT,
  UNIQUE(repo, canonical_pr_number)
);

-- Create index for faster queries
CREATE INDEX idx_scenarios_validation_status ON scenarios(validation_status);
CREATE INDEX idx_scenarios_company_id ON scenarios(company_id);
CREATE INDEX idx_scenarios_difficulty ON scenarios(difficulty);

-- Interview sessions table (for EPIC 3)
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT,
  candidate_pr_number INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'evaluated')),
  time_limit_minutes INTEGER,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  submitted_at TIMESTAMP WITH TIME ZONE,
  interviewer_notes TEXT,
  score JSONB,
  created_by TEXT NOT NULL
);

CREATE INDEX idx_sessions_scenario_id ON interview_sessions(scenario_id);
CREATE INDEX idx_sessions_status ON interview_sessions(status);
CREATE INDEX idx_sessions_created_by ON interview_sessions(created_by);

-- Enable Row Level Security (RLS)
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (we'll add auth later)
CREATE POLICY "Allow all for scenarios" ON scenarios FOR ALL USING (true);
CREATE POLICY "Allow all for sessions" ON interview_sessions FOR ALL USING (true);
