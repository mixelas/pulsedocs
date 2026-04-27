/**
 * Development-only page to seed test data.
 * Only accessible in development environment.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSeed() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/dev/seed', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer dev-secret-key',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Seeding failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🌱 Seed Test Data</h1>
            <p className="text-gray-600">
              Create test users and workspace for manual testing of PulseDocs.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              ⚠️ <strong>Development Only:</strong> This page only works in development mode and creates
              test accounts for testing DMs and other features.
            </p>
          </div>

          <button
            onClick={handleSeed}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            {loading ? 'Creating test users...' : '🚀 Create Test Users'}
          </button>

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold">Error:</p>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="text-green-800 font-semibold mb-4">✅ Test data created successfully!</p>

              <div className="bg-white rounded p-4 mb-4 border border-green-100">
                <p className="text-sm font-semibold text-gray-700 mb-3">Test Accounts:</p>
                {result.users.map(
                  (user: { email: string; displayName: string }, idx: number) => (
                    <div key={idx} className="mb-3 p-3 bg-gray-50 rounded">
                      <p className="font-mono text-sm text-gray-800">
                        <strong>Email:</strong> {user.email}
                      </p>
                      <p className="font-mono text-sm text-gray-800">
                        <strong>Password:</strong> {result.credentials.password}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{user.displayName}</p>
                    </div>
                  )
                )}
              </div>

              <div className="bg-white rounded p-4 border border-green-100 mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Workspace:</p>
                <p className="font-mono text-sm text-gray-800">{result.workspaceId}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-800 font-semibold mb-2">Next Steps:</p>
                <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
                  <li>Click below to go to the login page</li>
                  <li>Sign in with one of the test accounts above</li>
                  <li>Navigate to the workspace</li>
                  <li>Go to <strong>Messages</strong> in the sidebar to test DMs</li>
                  <li>Open another account in a different browser/window to test 1:1 conversations</li>
                </ol>
              </div>

              <Link
                href="/signin"
                className="block mt-6 text-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                → Go to Login
              </Link>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link href="/" className="text-blue-600 hover:text-blue-800 font-semibold">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
