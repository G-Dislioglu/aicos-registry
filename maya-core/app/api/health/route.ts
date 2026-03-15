import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lightweight health check for Render deploy
// No DB, no auth, no provider dependencies
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'maya-core'
  }, { status: 200 });
}
