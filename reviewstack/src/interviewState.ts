/**
 * Interview Platform State Management
 * 
 * This file manages state specific to the interview platform,
 * including user roles, interview sessions, and scenarios.
 */

import { atom, selector } from 'recoil';
import { gitHubUsername, gitHubTokenPersistence } from './github/gitHubCredentials';

// User Roles
export type UserRole = 'interviewer' | 'candidate';

export interface InterviewUser {
  id: string;
  github_username: string;
  role: UserRole;
  email: string;
  name: string;
  company_id?: string;
  created_at: Date;
}

// Interview Session Types
export interface InterviewSession {
  id: string;
  scenario_id: string;
  interviewer_id: string;
  candidate_email: string;
  candidate_name: string;
  
  // Session Config
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  scheduled_at: Date;
  duration_minutes: number;
  secure_link: string;
  
  // Session Data
  started_at?: Date;
  ended_at?: Date;
  recording_url?: string;
}

// Scenario Types
export interface InterviewScenario {
  id: string;
  title: string;
  description: string;
  
  // Classification
  difficulty: 'Junior' | 'Mid' | 'Senior' | 'Staff';
  focus_areas: ('Security' | 'Performance' | 'Architecture' | 'Testing')[];
  estimated_time: number; // minutes
  
  // Code Content (stored in our DB, not GitHub refs)
  files: ScenarioFile[];
  intentional_issues: IntentionalIssue[];
  
  // Evaluation
  evaluation_criteria: EvaluationCriteria[];
  
  // Metadata
  created_by: string;
  created_at: Date;
  usage_count: number;
  company_id?: string; // null for public scenarios
}

export interface ScenarioFile {
  path: string;
  content: string;
  language: string;
}

export interface IntentionalIssue {
  id: string;
  file_path: string;
  line_number: number;
  issue_type: 'security' | 'performance' | 'bug' | 'style' | 'architecture';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface EvaluationCriteria {
  name: string;
  description: string;
  max_score: number;
  weight: number;
}

// User Role Persistence
const USER_ROLE_PROPERTY = 'interview.user.role';

/**
 * Stores the user's role for the interview platform
 * This is separate from GitHub authentication
 */
export const interviewUserRole = atom<UserRole | null>({
  key: 'interviewUserRole',
  default: (localStorage.getItem(USER_ROLE_PROPERTY) as UserRole) || null,
  effects: [
    // Persist role to localStorage
    ({onSet}) => {
      onSet((role) => {
        if (role != null) {
          localStorage.setItem(USER_ROLE_PROPERTY, role);
        } else {
          localStorage.removeItem(USER_ROLE_PROPERTY);
        }
      });
    },
  ],
});

/**
 * Determines if user is authenticated for interviews
 * Requires both GitHub token AND interview role
 */
export const isInterviewUserAuthenticated = selector<boolean>({
  key: 'isInterviewUserAuthenticated',
  get: ({get}) => {
    const token = get(gitHubTokenPersistence);
    const role = get(interviewUserRole);
    return token != null && role != null;
  },
});

/**
 * Current authenticated interview user data
 */
export const currentInterviewUser = selector<InterviewUser | null>({
  key: 'currentInterviewUser', 
  get: ({get}) => {
    const isAuthenticated = get(isInterviewUserAuthenticated);
    if (!isAuthenticated) {
      return null;
    }

    const githubUsername = get(gitHubUsername);
    const role = get(interviewUserRole);
    
    if (!githubUsername || !role) {
      return null;
    }

    // For MVP, we'll create a mock user object
    // In production, this would fetch from a user database
    return {
      id: `user_${githubUsername}`,
      github_username: githubUsername,
      role: role,
      email: `${githubUsername}@example.com`, // Mock email
      name: githubUsername,
      created_at: new Date(),
    };
  },
});

/**
 * Mock interview scenarios for MVP
 * In production, this would be fetched from a database
 */
export const interviewScenarios = atom<InterviewScenario[]>({
  key: 'interviewScenarios',
  default: [
    {
      id: 'scenario_1',
      title: 'React Component Security Review',
      description: 'Review a React component for XSS vulnerabilities and insecure data handling',
      difficulty: 'Mid',
      focus_areas: ['Security'],
      estimated_time: 30,
      files: [
        {
          path: 'UserProfile.tsx',
          content: `import React, { useState, useEffect } from 'react';

interface UserProfileProps {
  userId: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  const [userData, setUserData] = useState<any>(null);
  const [bio, setBio] = useState<string>('');

  useEffect(() => {
    // Fetch user data from API
    fetch(\`/api/users/\${userId}\`)
      .then(response => response.json())
      .then(data => setUserData(data));
  }, [userId]);

  const updateBio = () => {
    // Update user bio
    fetch(\`/api/users/\${userId}/bio\`, {
      method: 'POST',
      body: JSON.stringify({ bio }),
      headers: { 'Content-Type': 'application/json' }
    });
  };

  if (!userData) return <div>Loading...</div>;

  return (
    <div>
      <h1>{userData.name}</h1>
      <div dangerouslySetInnerHTML={{__html: userData.bio}} />
      <textarea 
        value={bio} 
        onChange={(e) => setBio(e.target.value)}
        placeholder="Update your bio..."
      />
      <button onClick={updateBio}>Save Bio</button>
    </div>
  );
};

export default UserProfile;`,
          language: 'typescript'
        }
      ],
      intentional_issues: [
        {
          id: 'issue_1',
          file_path: 'UserProfile.tsx',
          line_number: 28,
          issue_type: 'security',
          description: 'XSS vulnerability: dangerouslySetInnerHTML without sanitization',
          severity: 'high'
        },
        {
          id: 'issue_2', 
          file_path: 'UserProfile.tsx',
          line_number: 19,
          issue_type: 'security',
          description: 'Missing CSRF protection and authentication headers',
          severity: 'medium'
        }
      ],
      evaluation_criteria: [
        {
          name: 'Security Issue Identification',
          description: 'Ability to identify XSS and CSRF vulnerabilities',
          max_score: 5,
          weight: 0.4
        },
        {
          name: 'Solution Quality',
          description: 'Proposed fixes are comprehensive and secure',
          max_score: 5,
          weight: 0.4
        },
        {
          name: 'Communication',
          description: 'Clear explanation of issues and solutions',
          max_score: 5,
          weight: 0.2
        }
      ],
      created_by: 'admin',
      created_at: new Date('2024-01-01'),
      usage_count: 0,
    }
  ],
});

/**
 * Current active interview sessions
 */
export const activeInterviewSessions = atom<InterviewSession[]>({
  key: 'activeInterviewSessions',
  default: [],
});

/**
 * Interview session that user is currently participating in
 */
export const currentInterviewSession = atom<InterviewSession | null>({
  key: 'currentInterviewSession',
  default: null,
});