import { NextResponse } from 'next/server';
import { getProcessLogs } from '@/lib/dev-runner';
import { isRequestAuthenticated } from '@/lib/session-auth';
import { isValidProjectId } from '@/lib/dev-guard';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isRequestAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!isValidProjectId(projectId)) {
    return NextResponse.json({ logs: [] });
  }

  const logs = getProcessLogs(projectId);
  return NextResponse.json({ logs });
}
