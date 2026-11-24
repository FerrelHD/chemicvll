import { NextResponse } from 'next/server';
import { isLocalEnvironment, startDevProcess } from '@/lib/dev-runner';
import { isRequestAuthenticated } from '@/lib/session-auth';
import { isValidProjectId, validateDevCommand } from '@/lib/dev-guard';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isRequestAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isLocalEnvironment()) {
    return NextResponse.json(
      { error: 'Cannot spawn local processes in cloud environment' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { projectId, command, cwd } = body;

    if (!isValidProjectId(projectId)) {
      return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
    }

    const cmdCheck = validateDevCommand(command);
    if (!cmdCheck.ok) {
      return NextResponse.json({ error: cmdCheck.error }, { status: 400 });
    }

    const cleanCwd = typeof cwd === 'string' ? cwd.trim() : undefined;
    const result = startDevProcess(projectId, cmdCheck.command, cleanCwd);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to start process' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/dev/start] Error:', err);
    return NextResponse.json({ error: 'Failed to start process' }, { status: 500 });
  }
}
