import { NextResponse } from 'next/server';
import {
  isLocalEnvironment,
  getSystemMetrics,
  getRunningProcesses,
} from '@/lib/dev-runner';
import { isRequestAuthenticated } from '@/lib/session-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isRequestAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isLocal = isLocalEnvironment();
  const metrics = isLocal ? getSystemMetrics() : null;
  const running = isLocal ? getRunningProcesses() : [];

  return NextResponse.json({
    isLocal,
    metrics,
    running,
  });
}
