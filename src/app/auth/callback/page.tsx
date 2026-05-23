'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code');
      
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
      
      router.push('/dashboard');
    }

    handleCallback();
  }, [searchParams, router, supabase.auth]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground">Processing sign-in...</div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
