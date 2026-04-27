import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    has_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    service_role_sample: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
  });
}
