'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

/**
 * Landing page and auth guard.
 * Redirects authenticated users to dashboard.
 * Displays product features and CTA for new visitors.
 */
export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/dashboard');
      }
    }
    checkAuth();
  }, [router, supabase.auth]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">PulseDocs</div>
          <div className="space-x-4">
            <Link
              href="/auth/signin"
              className="px-4 py-2 text-foreground hover:text-primary transition"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-primary mb-6">
            Where team knowledge and communication stay connected
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Combine lightweight communication with structured documentation. No more
            switching between tools. One workspace for your team&apos;s entire knowledge.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-opacity-90 transition"
          >
            Start for Free
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
            <h3 className="text-lg font-semibold text-primary mb-3">Communication</h3>
            <p className="text-muted-foreground">
              Team channels for lightweight discussion, pinned messages, and threaded
              conversations—all in one place.
            </p>
          </div>
          <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
            <h3 className="text-lg font-semibold text-primary mb-3">Documentation</h3>
            <p className="text-muted-foreground">
              Create and organize documents with rich formatting, folders, and
              collaboration tools. Keep knowledge structured.
            </p>
          </div>
          <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
            <h3 className="text-lg font-semibold text-primary mb-3">Search</h3>
            <p className="text-muted-foreground">
              Find anything instantly. Search across messages, documents, and channels
              with unified, smart results.
            </p>
          </div>
        </div>

        {/* What It Solves */}
        <div className="mt-20 bg-card rounded-lg p-8 border border-border">
          <h2 className="text-3xl font-bold text-primary mb-6">Why PulseDocs?</h2>
          <ul className="space-y-4 text-muted-foreground">
            <li className="flex gap-3">
              <span className="text-accent font-bold">✓</span>
              <span>Stop losing decisions in chat. Keep important knowledge accessible.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-bold">✓</span>
              <span>Onboard faster with organized, searchable workspace content.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-bold">✓</span>
              <span>
                Built for teams who need both communication and documentation in one
                tool.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-bold">✓</span>
              <span>
                Clean, modern interface built on professional SaaS standards.
              </span>
            </li>
          </ul>
        </div>

        {/* Teams We Support */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-primary mb-8">Built for Every Team</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-muted-foreground">
            <div className="p-4 bg-card rounded-lg border border-border">
              Engineering Teams
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">Student Groups</div>
            <div className="p-4 bg-card rounded-lg border border-border">Startups</div>
            <div className="p-4 bg-card rounded-lg border border-border">
              Research Groups
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-8 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>
            PulseDocs © 2026. Where team knowledge and communication stay connected.
          </p>
        </div>
      </footer>
    </div>
  );
}
