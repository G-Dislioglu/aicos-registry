import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ status: 'ok', app: 'maya-core' }, { status: 200 });
}
