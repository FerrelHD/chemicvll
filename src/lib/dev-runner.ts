/**
 * Local Process Runner & System Metrics Engine for Personal OS.
 * Ponytail style: zero external dependencies, 100% native Node.js APIs (os, child_process).
 */

import { spawn, ChildProcess } from 'node:child_process';
import os from 'node:os';

export interface ProcessRecord {
  projectId: string;
  child: ChildProcess;
  pid: number;
  command: string;
  cwd: string;
  startTime: number;
  logs: string[];
}

declare global {
  // eslint-disable-next-line no-var
  var __localDevProcesses: Map<string, ProcessRecord> | undefined;
}

const processes: Map<string, ProcessRecord> =
  globalThis.__localDevProcesses || (globalThis.__localDevProcesses = new Map());

export function isLocalEnvironment(): boolean {
  return process.env.VERCEL !== '1';
}

export function getSystemMetrics() {
  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const usedBytes = totalBytes - freeBytes;

  const totalGB = Number((totalBytes / 1024 ** 3).toFixed(1));
  const usedGB = Number((usedBytes / 1024 ** 3).toFixed(1));
  const freeGB = Number((freeBytes / 1024 ** 3).toFixed(1));
  const usedPercent = Math.round((usedBytes / totalBytes) * 100);

  return {
    totalGB,
    usedGB,
    freeGB,
    usedPercent,
    platform: process.platform,
    cpuCount: os.cpus().length,
  };
}

export function getRunningProcesses() {
  const list: {
    projectId: string;
    pid: number;
    command: string;
    uptimeSeconds: number;
    logsCount: number;
  }[] = [];

  for (const [id, rec] of processes.entries()) {
    list.push({
      projectId: id,
      pid: rec.pid,
      command: rec.command,
      uptimeSeconds: Math.floor((Date.now() - rec.startTime) / 1000),
      logsCount: rec.logs.length,
    });
  }

  return list;
}

export function getProcessLogs(projectId: string): string[] {
  return processes.get(projectId)?.logs || [];
}

export function startDevProcess(
  projectId: string,
  command: string,
  cwd?: string
): { success: boolean; pid?: number; error?: string } {
  if (!isLocalEnvironment()) {
    return {
      success: false,
      error: 'Process execution is only available when running locally on your machine.',
    };
  }

  if (processes.has(projectId)) {
    const existing = processes.get(projectId)!;
    return { success: true, pid: existing.pid };
  }

  const isWin = process.platform === 'win32';
  const shell = isWin ? 'cmd.exe' : '/bin/sh';
  const shellFlag = isWin ? '/c' : '-c';

  try {
    const child = spawn(shell, [shellFlag, command], {
      cwd: cwd || process.cwd(),
      env: { ...process.env },
      detached: !isWin,
    });

    if (!child.pid) {
      return { success: false, error: 'Failed to spawn process' };
    }

    const timestamp = new Date().toLocaleTimeString();
    const logs: string[] = [
      `[${timestamp}] Started process: "${command}" (PID: ${child.pid})`,
    ];

    const appendLog = (chunk: Buffer | string) => {
      const text = chunk.toString().trimEnd();
      for (const line of text.split('\n')) {
        const clean = line.replace(/[\r]/g, '');
        if (clean.trim()) {
          logs.push(clean);
          if (logs.length > 200) logs.shift();
        }
      }
    };

    child.stdout?.on('data', appendLog);
    child.stderr?.on('data', appendLog);

    child.on('close', (code) => {
      logs.push(`[${new Date().toLocaleTimeString()}] Process exited (code ${code})`);
      processes.delete(projectId);
    });

    child.on('error', (err) => {
      logs.push(`[${new Date().toLocaleTimeString()}] Process error: ${err.message}`);
      processes.delete(projectId);
    });

    processes.set(projectId, {
      projectId,
      child,
      pid: child.pid,
      command,
      cwd: cwd || process.cwd(),
      startTime: Date.now(),
      logs,
    });

    return { success: true, pid: child.pid };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function stopDevProcess(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isLocalEnvironment()) {
    return {
      success: false,
      error: 'Process execution is only available when running locally on your machine.',
    };
  }

  const rec = processes.get(projectId);
  if (!rec) {
    return { success: true };
  }

  const { pid } = rec;
  const isWin = process.platform === 'win32';

  try {
    if (isWin) {
      const { exec } = await import('node:child_process');
      await new Promise<void>((resolve) => {
        exec(`taskkill /pid ${pid} /T /F`, () => {
          resolve();
        });
      });
    } else {
      try {
        process.kill(-pid, 'SIGTERM');
      } catch {
        process.kill(pid, 'SIGKILL');
      }
    }

    rec.logs.push(`[${new Date().toLocaleTimeString()}] Process stopped (SIGTERM/taskkill).`);
    processes.delete(projectId);
    return { success: true };
  } catch (err: any) {
    processes.delete(projectId);
    return { success: false, error: err.message };
  }
}
