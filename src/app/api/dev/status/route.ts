import { NextResponse } from 'next/server';
import {
  isLocalEnvironment,
  getSystemMetrics,
  getRunningProcesses,
} from '@/lib/dev-runner';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isLocal = isLocalEnvironment();
  const metrics = isLocal ? getSystemMetrics() : null;
  const running = isLocal ? getRunningProcesses() : [];

  return NextResponse.json({
    isLocal,
    metrics,
    running,
  });
}
