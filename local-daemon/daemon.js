/**
 * Local Daemon Bridge with Supabase Realtime Relay
 * Personal OS (chemicvll) - Remote Process Controller
 * Ponytail style: zero unnecessary dependencies, uses native Node.js + @supabase/supabase-js
 */

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const { spawn, exec } = require('node:child_process');
const { createClient } = require('@supabase/supabase-js');

// 1. Load .env.local if present
function loadEnv() {
  const candidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(__dirname, '..', '.env.local'),
  ];
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim();
          if (!process.env[k]) {
            process.env[k] = v;
          }
        }
      }
      break;
    }
  }
}
loadEnv();

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://ixkfgtyjlscwkexenvru.supabase.co';

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_wj5VjKyvOUhmDCFNhvn7BA_-bZQ1Ge9';

const PORT = process.env.DAEMON_PORT || 9999;
const DAEMON_SECRET = process.env.LOCAL_DAEMON_SECRET || 'local-secret';

// In-memory process registry: projectId -> { child, pid, command, cwd, logs: [] }
const runningProcesses = new Map();

function log(msg) {
  const ts = new Date().toLocaleTimeString();
  console.log(`[Daemon ${ts}] ${msg}`);
}

// 2. Initialize Supabase Realtime Bridge
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const channel = supabase.channel('daemon:control');

function sendBroadcast(event, payload) {
  channel.send({
    type: 'broadcast',
    event,
    payload,
  }).catch(() => {
    // Silent fail on network blip
  });
}

// 3. Process Execution Helpers
function startProcess(projectId, command, cwd) {
  if (runningProcesses.has(projectId)) {
    const existing = runningProcesses.get(projectId);
    log(`Project ${projectId} is already running (PID: ${existing.pid})`);
    sendBroadcast('process_started', { projectId, pid: existing.pid });
    return existing.pid;
  }

  const isWin = process.platform === 'win32';
  const shell = isWin ? 'cmd.exe' : '/bin/sh';
  const shellFlag = isWin ? '/c' : '-c';
  const resolvedCwd = cwd || path.resolve(__dirname, '..');

  log(`Launching: "${command}" in ${resolvedCwd}`);

  try {
    const child = spawn(shell, [shellFlag, command], {
      cwd: resolvedCwd,
      env: { ...process.env },
      detached: !isWin,
    });

    if (!child.pid) {
      log(`Failed to spawn process for ${projectId}`);
      return null;
    }

    const logs = [];
    const broadcastLog = (chunk) => {
      const text = chunk.toString().trimEnd();
      for (const line of text.split('\n')) {
        const clean = line.replace(/[\r]/g, '');
        if (clean.trim()) {
          logs.push(clean);
          if (logs.length > 200) logs.shift();
          sendBroadcast('log', { projectId, line: clean });
        }
      }
    };

    child.stdout?.on('data', broadcastLog);
    child.stderr?.on('data', broadcastLog);

    child.on('close', (code) => {
      log(`Project ${projectId} exited (code ${code})`);
      runningProcesses.delete(projectId);
      sendBroadcast('process_exited', { projectId, code });
    });

    child.on('error', (err) => {
      log(`Project ${projectId} error: ${err.message}`);
      runningProcesses.delete(projectId);
      sendBroadcast('process_exited', { projectId, error: err.message });
    });

    runningProcesses.set(projectId, {
      child,
      pid: child.pid,
      command,
      cwd: resolvedCwd,
      logs,
    });

    log(`Process started successfully. PID: ${child.pid}`);
    sendBroadcast('process_started', { projectId, pid: child.pid });
    return child.pid;
  } catch (err) {
    log(`Error spawning ${projectId}: ${err.message}`);
    sendBroadcast('process_exited', { projectId, error: err.message });
    return null;
  }
}

function stopProcess(projectId) {
  const rec = runningProcesses.get(projectId);
  if (!rec) {
    sendBroadcast('process_stopped', { projectId });
    return;
  }

  const { pid } = rec;
  log(`Stopping project ${projectId} (PID: ${pid})...`);

  if (process.platform === 'win32') {
    exec(`taskkill /pid ${pid} /T /F`, () => {
      runningProcesses.delete(projectId);
      log(`Project ${projectId} stopped.`);
      sendBroadcast('process_stopped', { projectId });
    });
  } else {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      process.kill(pid, 'SIGKILL');
    }
    runningProcesses.delete(projectId);
    log(`Project ${projectId} stopped.`);
    sendBroadcast('process_stopped', { projectId });
  }
}

// 4. Register Supabase Realtime Handlers
channel
  .on('broadcast', { event: 'start_process' }, ({ payload }) => {
    if (!payload?.projectId || !payload?.command) return;
    log(`[Remote Command] Start request for "${payload.projectId}"`);
    startProcess(payload.projectId, payload.command, payload.cwd);
  })
  .on('broadcast', { event: 'stop_process' }, ({ payload }) => {
    if (!payload?.projectId) return;
    log(`[Remote Command] Stop request for "${payload.projectId}"`);
    stopProcess(payload.projectId);
  })
  .on('broadcast', { event: 'request_status' }, () => {
    emitHeartbeat();
  });

channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    log(`Connected to Supabase Realtime Relay! Listening for commands from Vercel/Web.`);
    emitHeartbeat();
  }
});

// 5. Periodic Heartbeat & Metrics Telemetry
function emitHeartbeat() {
  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const usedBytes = totalBytes - freeBytes;

  const runningList = Array.from(runningProcesses.entries()).map(([id, r]) => ({
    projectId: id,
    pid: r.pid,
    command: r.command,
  }));

  sendBroadcast('heartbeat', {
    machine: `Windows PC (${os.hostname()})`,
    platform: process.platform,
    totalGB: Number((totalBytes / 1024 ** 3).toFixed(1)),
    usedGB: Number((usedBytes / 1024 ** 3).toFixed(1)),
    freeGB: Number((freeBytes / 1024 ** 3).toFixed(1)),
    usedPercent: Math.round((usedBytes / totalBytes) * 100),
    running: runningList,
    timestamp: Date.now(),
  });
}

// Heartbeat every 3 seconds
setInterval(emitHeartbeat, 3000);

// 6. Fallback Local HTTP Server (for local-only pings)
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        machine: os.hostname(),
        runningCount: runningProcesses.size,
      })
    );
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, '127.0.0.1', () => {
  log(`Local HTTP fallback ready on http://127.0.0.1:${PORT}`);
  log(`Supabase Relay active: ${SUPABASE_URL}`);
  log(`Personal OS Daemon Bridge is ready.`);
});
