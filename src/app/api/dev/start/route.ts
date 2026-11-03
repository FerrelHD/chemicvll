import { NextResponse } from 'next/server';
import { isLocalEnvironment, startDevProcess } from '@/lib/dev-runner';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isLocalEnvironment()) {
    return NextResponse.json(
      { error: 'Cannot spawn local processes in cloud environment' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { projectId, command, cwd } = body;

    if (!projectId || !command) {
      return NextResponse.json(
        { error: 'Missing projectId or command' },
        { status: 400 }
      );
    }

    const result = startDevProcess(projectId, command, cwd);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
