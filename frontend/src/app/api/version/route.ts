import { NextResponse } from 'next/server';

/**
 * Returns the app version from runtime env so the Hostinger panel's
 * NEXT_PUBLIC_APP_VERSION (or GIT_SHA) is used even when the build was cached.
 */
export async function GET() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? process.env.GIT_SHA ?? 'dev';
  return NextResponse.json({ version });
}
