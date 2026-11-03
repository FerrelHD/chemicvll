import { NextResponse } from 'next/server';
import { getProcessLogs } from '@/lib/dev-runner';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ logs: [] });
  }

  const logs = getProcessLogs(projectId);
  return NextResponse.json({ logs });
}
