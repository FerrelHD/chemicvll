import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isRequestAuthenticated } from '@/lib/session-auth';
import {
  isUsableDaemonSecret,
  isValidProjectId,
  signRelayPayload,
  validateDevCommand,
} from '@/lib/dev-guard';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isRequestAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const secret = process.env.LOCAL_DAEMON_SECRET?.trim();
  if (!isUsableDaemonSecret(secret)) {
    return NextResponse.json(
      { error: 'LOCAL_DAEMON_SECRET is not configured on server' },
      { status: 503 }
    );
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase relay is not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const action = body?.action === 'stop' ? 'stop_process' : body?.action === 'start' ? 'start_process' : null;
    if (!action) {
      return NextResponse.json({ error: 'Invalid relay action' }, { status: 400 });
    }

    if (!isValidProjectId(body?.projectId)) {
      return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
    }
    const projectId = body.projectId.trim();

    let command = '';
    if (action === 'start_process') {
      const cmdCheck = validateDevCommand(body?.command);
      if (!cmdCheck.ok) {
        return NextResponse.json({ error: cmdCheck.error }, { status: 400 });
      }
      command = cmdCheck.command;
    }

    const cwd = typeof body?.cwd === 'string' ? body.cwd.trim() : '';
    const ts = Date.now();
    const sig = signRelayPayload(action, projectId, command, cwd, ts, secret);

    const channel = supabase.channel('daemon:control');
    try {
      await channel.httpSend(action, {
        projectId,
        ...(command ? { command } : {}),
        ...(cwd ? { cwd } : {}),
        ts,
        sig,
      });
    } finally {
      await supabase.removeChannel(channel);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[/api/dev/relay] Error:', err);
    return NextResponse.json({ error: 'Failed to dispatch relay command' }, { status: 500 });
  }
}
