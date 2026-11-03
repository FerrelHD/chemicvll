/**
 * Local Runner Daemon for Personal OS (nexus-os / chemicvll)
 * Runs locally on the developer machine via Node.js or PM2.
 * Ponytail style: zero heavy frameworks, native child_process and http server.
 */

const http = require('node:http');
const { spawn } = require('node:child_process');

const PORT = process.env.DAEMON_PORT || 9999;
const DAEMON_SECRET = process.env.LOCAL_DAEMON_SECRET || 'local-secret';

// In-memory process registry: projectId -> { process, pid, command, logs: [] }
const runningProcesses = new Map();

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[Daemon ${ts}] ${msg}`);
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // Healthcheck endpoint
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        runningCount: runningProcesses.size,
        uptime: process.uptime(),
      })
    );
    return;
  }

  // Auth check for mutation commands
  const authHeader = req.headers['authorization'] || '';
  if (authHeader !== `Bearer ${DAEMON_SECRET}` && DAEMON_SECRET !== 'local-secret') {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized daemon token' }));
    return;
  }

  // Start process: POST /process/start
  if (req.method === 'POST' && url.pathname === '/process/start') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const { projectId, command, cwd, env } = JSON.parse(body);
        if (!projectId || !command) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing projectId or command' }));
          return;
        }

        if (runningProcesses.has(projectId)) {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Process already running' }));
          return;
        }

        const isWin = process.platform === 'win32';
        const shell = isWin ? 'cmd.exe' : '/bin/sh';
        const shellFlag = isWin ? '/c' : '-c';

        log(`Spawning project: ${projectId} -> "${command}" in ${cwd || process.cwd()}`);

        const child = spawn(shell, [shellFlag, command], {
          cwd: cwd || process.cwd(),
          env: { ...process.env, ...(env || {}) },
          detached: !isWin, // Detach on POSIX so children can be killed as a group
        });

        const logs = [];
        const append = (data) => {
          const str = data.toString().trimEnd();
          logs.push(str);
          if (logs.length > 100) logs.shift();
          log(`[${projectId}] ${str}`);
        };

        child.stdout?.on('data', append);
        child.stderr?.on('data', append);

        child.on('close', (code) => {
          log(`Project ${projectId} exited with code ${code}`);
          runningProcesses.delete(projectId);
        });

        runningProcesses.set(projectId, { child, pid: child.pid, logs });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'started', pid: child.pid }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Stop process: POST /process/stop
  if (req.method === 'POST' && url.pathname === '/process/stop') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const { projectId } = JSON.parse(body);
        const record = runningProcesses.get(projectId);
        if (!record) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Process not running' }));
          return;
        }

        log(`Terminating project: ${projectId} (PID: ${record.pid})`);
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', record.pid.toString(), '/T', '/F']);
        } else {
          process.kill(-record.child.pid, 'SIGTERM');
        }

        runningProcesses.delete(projectId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'stopped' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  log(`Local Daemon running on http://127.0.0.1:${PORT}`);
  log(`To start servers remotely, ensure daemon is running via PM2 or node.`);
});

