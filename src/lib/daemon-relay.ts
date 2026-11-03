/**
 * Supabase Realtime Relay Client for Personal OS Dev Control
 * Connects frontend (Vercel or localhost) to laptop daemon via Supabase WebSockets.
 * Ponytail style: zero dependencies beyond existing Supabase client.
 */

import { createBrowserClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface DaemonTelemetry {
  machine: string;
  platform: string;
  totalGB: number;
  usedGB: number;
  freeGB: number;
  usedPercent: number;
  running: { projectId: string; pid: number; command: string }[];
  timestamp: number;
}

export interface DaemonRelayCallbacks {
  onHeartbeat?: (telemetry: DaemonTelemetry) => void;
  onLog?: (projectId: string, line: string) => void;
  onProcessStarted?: (projectId: string, pid: number) => void;
  onProcessStopped?: (projectId: string) => void;
  onProcessExited?: (projectId: string, code?: number, error?: string) => void;
  onDaemonStateChange?: (isOnline: boolean) => void;
}

class DaemonRelayManager {
  private channel: RealtimeChannel | null = null;
  private callbacks: DaemonRelayCallbacks = {};
  private lastHeartbeatTime = 0;
  private heartbeatCheckTimer: NodeJS.Timeout | null = null;
  private isOnline = false;

  public init(callbacks: DaemonRelayCallbacks) {
    this.callbacks = callbacks;

    if (typeof window === 'undefined') return;
    if (this.channel) return;

    const supabase = createBrowserClient();
    if (!supabase) return;

    this.channel = supabase.channel('daemon:control');

    this.channel
      .on('broadcast', { event: 'heartbeat' }, ({ payload }) => {
        this.lastHeartbeatTime = Date.now();
        if (!this.isOnline) {
          this.isOnline = true;
          this.callbacks.onDaemonStateChange?.(true);
        }
        this.callbacks.onHeartbeat?.(payload as DaemonTelemetry);
      })
      .on('broadcast', { event: 'log' }, ({ payload }) => {
        if (payload?.projectId && payload?.line) {
          this.callbacks.onLog?.(payload.projectId, payload.line);
        }
      })
      .on('broadcast', { event: 'process_started' }, ({ payload }) => {
        if (payload?.projectId && payload?.pid) {
          this.callbacks.onProcessStarted?.(payload.projectId, payload.pid);
        }
      })
      .on('broadcast', { event: 'process_stopped' }, ({ payload }) => {
        if (payload?.projectId) {
          this.callbacks.onProcessStopped?.(payload.projectId);
        }
      })
      .on('broadcast', { event: 'process_exited' }, ({ payload }) => {
        if (payload?.projectId) {
          this.callbacks.onProcessExited?.(payload.projectId, payload.code, payload.error);
        }
      });

    this.channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        this.requestStatus();
      }
    });

    // Check daemon staleness every 4 seconds
    this.heartbeatCheckTimer = setInterval(() => {
      const now = Date.now();
      if (this.isOnline && now - this.lastHeartbeatTime > 9000) {
        this.isOnline = false;
        this.callbacks.onDaemonStateChange?.(false);
      }
    }, 4000);
  }

  public requestStatus() {
    this.channel?.send({
      type: 'broadcast',
      event: 'request_status',
      payload: {},
    }).catch(() => {});
  }

  public startProcess(projectId: string, command: string, cwd?: string | null) {
    return this.channel?.send({
      type: 'broadcast',
      event: 'start_process',
      payload: { projectId, command, cwd: cwd || undefined },
    });
  }

  public stopProcess(projectId: string) {
    return this.channel?.send({
      type: 'broadcast',
      event: 'stop_process',
      payload: { projectId },
    });
  }

  public getIsOnline() {
    return this.isOnline;
  }

  public cleanup() {
    if (this.heartbeatCheckTimer) {
      clearInterval(this.heartbeatCheckTimer);
      this.heartbeatCheckTimer = null;
    }
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.isOnline = false;
  }
}

export const daemonRelay = new DaemonRelayManager();

