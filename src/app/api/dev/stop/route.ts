import { NextResponse } from 'next/server';
import { isLocalEnvironment, stopDevProcess } from '@/lib/dev-runner';
import { isRequestAuthenticated } from '@/lib/session-auth';
import { isValidProjectId } from '@/lib/dev-guard';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isRequestAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isLocalEnvironment()) {
    return NextResponse.json(
      { error: 'Cannot terminate local processes in cloud environment' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { projectId } = body;

    if (!isValidProjectId(projectId)) {
      return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
    }

    const result = await stopDevProcess(projectId);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/dev/stop] Error:', err);
    return NextResponse.json({ error: 'Failed to stop process' }, { status: 500 });
  }
}
