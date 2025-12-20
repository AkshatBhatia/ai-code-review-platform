// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export enum UserRole {
  ADMIN = 'admin',
  SCENARIO_AUTHOR = 'scenario_author', 
  INTERVIEWER = 'interviewer',
  CANDIDATE = 'candidate'
}

// Database response types
export interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

// Auth context types
export interface AuthContext {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
}