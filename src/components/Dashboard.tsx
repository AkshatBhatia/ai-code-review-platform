'use client'

import { useAuth } from '@/components/AuthProvider'
import { User } from '@/types'

interface DashboardProps {
  user: User
}

export default function Dashboard({ user }: DashboardProps) {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                AI Code Review Platform
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {user.avatar_url && (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={user.avatar_url}
                    alt={user.name}
                  />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {user.name}
                </span>
              </div>
              <button
                onClick={signOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Welcome to the AI-Native Code Review Platform! 👋
              </h2>
              
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        ✅ Authentication Working!
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>You're successfully logged in as: <strong>{user.email}</strong></p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      🎯 For Candidates
                    </h3>
                    <p className="text-blue-700 text-sm">
                      Review real PR diffs with AI assistance. Demonstrate your judgment, risk assessment, and communication skills.
                    </p>
                  </div>

                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">
                      📝 For Authors  
                    </h3>
                    <p className="text-purple-700 text-sm">
                      Create scenario libraries with expected findings. Define evaluation criteria and reusable assessments.
                    </p>
                  </div>

                  <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                    <h3 className="text-lg font-semibold text-orange-900 mb-2">
                      🔍 For Interviewers
                    </h3>
                    <p className="text-orange-700 text-sm">
                      Evaluate candidate reviews with structured rubrics. Compare findings and assess AI collaboration skills.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">🚧 Coming Next:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Scenario creation and management</li>
                    <li>• Interactive diff viewer with commenting</li>
                    <li>• AI assistant for code analysis</li>
                    <li>• Evaluation dashboard and scoring</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                System Status
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl">🟢</div>
                  <div className="text-sm font-medium text-gray-900">Authentication</div>
                  <div className="text-xs text-gray-500">Working</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl">🟢</div>
                  <div className="text-sm font-medium text-gray-900">Database</div>
                  <div className="text-xs text-gray-500">Connected</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl">🟡</div>
                  <div className="text-sm font-medium text-gray-900">AI Assistant</div>
                  <div className="text-xs text-gray-500">Coming Soon</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl">🟡</div>
                  <div className="text-sm font-medium text-gray-900">File Storage</div>
                  <div className="text-xs text-gray-500">Coming Soon</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}