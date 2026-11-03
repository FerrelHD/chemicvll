import { NextResponse } from 'next/server';
import { isLocalEnvironment, stopDevProcess } from '@/lib/dev-runner';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isLocalEnvironment()) {
    return NextResponse.json(
      { error: 'Cannot terminate local processes in cloud environment' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId' },
        { status: 400 }
      );
    }

    const result = await stopDevProcess(projectId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
