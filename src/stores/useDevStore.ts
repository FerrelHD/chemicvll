import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project } from '@/types/database';
import { daemonRelay } from '@/lib/daemon-relay';

export interface DevProject extends Project {
  serverState: 'running' | 'stopped' | 'error';
  pid: number | null;
  logs: string[];
  encryptedEnv?: {
    encryptedPayload: string;
    iv: string;
    salt: string;
  };
}

export interface SystemMetrics {
  totalGB: number;
  usedGB: number;
  freeGB: number;
  usedPercent: number;
  platform: string;
  cpuCount: number;
}

interface DevState {
  projects: DevProject[];
  activeLogProjectId: string | null;
  systemMetrics: SystemMetrics | null;
  isLocal: boolean;
  isDaemonOnline: boolean;
  daemonMachine: string | null;
  setActiveLogProjectId: (id: string | null) => void;
  setDaemonOnline: (online: boolean, machine?: string) => void;
  setSystemMetrics: (metrics: SystemMetrics | null) => void;
  setProjectState: (id: string, serverState: 'running' | 'stopped' | 'error', pid?: number | null) => void;
  startServer: (id: string) => Promise<void>;
  stopServer: (id: string) => Promise<void>;
  restartServer: (id: string) => Promise<void>;
  syncWithDaemon: () => Promise<void>;
  fetchProjectLogs: (id: string) => Promise<void>;
  appendLog: (id: string, logLine: string) => void;
  saveProjectEnv: (
    id: string,
    encrypted: { encryptedPayload: string; iv: string; salt: string }
  ) => void;
  addProject: (project: Omit<DevProject, 'id' | 'serverState' | 'pid' | 'logs'>) => void;
}

const INITIAL_PROJECTS: DevProject[] = [
  {
    id: 'proj-nexus-os',
    name: 'Personal OS (chemicvll)',
    description: 'Personal Command Center, Career Pipeline & Dev Runner',
    status: 'active',
    color_code: '#FF6B00',
    repo_url: 'https://github.com/FerrelHD/chemicvll',
    prod_url: null,
    local_path: 'E:\\College Stuff\\Career\\chemicvll',
    start_command: 'npm run dev',
    default_port: 3000,
    target_date: null,
    serverState: 'stopped',
    pid: null,
    logs: [
      '[Daemon] System ready. Port 3000 mapped to Personal OS.',
    ],
  },
];

export const useDevStore = create<DevState>()(
  persist(
    (set, get) => ({
      projects: INITIAL_PROJECTS,
      activeLogProjectId: null,
      systemMetrics: null,
      isLocal: true,
      isDaemonOnline: false,
      daemonMachine: null,

      setActiveLogProjectId: (id) => set({ activeLogProjectId: id }),
      setDaemonOnline: (online, machine) =>
        set((state) => ({
          isDaemonOnline: online,
          daemonMachine: machine || state.daemonMachine,
        })),
      setSystemMetrics: (metrics) => set({ systemMetrics: metrics }),
      setProjectState: (id, serverState, pid) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  serverState,
                  pid: pid !== undefined ? pid : p.pid,
                }
              : p
          ),
        })),

      syncWithDaemon: async () => {
        if (typeof window === 'undefined') return;

        // If Supabase Realtime Daemon is already connected, don't poll local
        if (daemonRelay.getIsOnline()) {
          set({ isDaemonOnline: true });
          daemonRelay.requestStatus();
          return;
        }

        try {
          const res = await fetch('/api/dev/status');
          if (!res.ok) return;
          const data = await res.json();
          set({
            isLocal: Boolean(data.isLocal),
            systemMetrics: data.metrics || null,
          });

          // Sync running processes
          if (Array.isArray(data.running)) {
            const runningMap = new Map<string, number>(
              data.running.map((r: { projectId: string; pid: number }) => [r.projectId, r.pid])
            );

            set((state) => ({
              projects: state.projects.map((p) => {
                const runningPid = runningMap.get(p.id);
                if (runningPid) {
                  return { ...p, serverState: 'running', pid: runningPid };
                } else if (p.serverState === 'running' && data.isLocal) {
                  return { ...p, serverState: 'stopped', pid: null };
                }
                return p;
              }),
            }));
          }
        } catch {
          // Graceful offline fallback
        }
      },

      fetchProjectLogs: async (id: string) => {
        if (typeof window === 'undefined') return;
        try {
          const res = await fetch(`/api/dev/logs?projectId=${encodeURIComponent(id)}`);
          if (!res.ok) return;
          const data = await res.json();
          if (Array.isArray(data.logs) && data.logs.length > 0) {
            set((state) => ({
              projects: state.projects.map((p) =>
                p.id === id ? { ...p, logs: data.logs } : p
              ),
            }));
          }
        } catch {
          // Ignore
        }
      },

      startServer: async (id) => {
        const project = get().projects.find((p) => p.id === id);
        if (!project) return;

        const timestamp = new Date().toLocaleTimeString();

        // 1. If Supabase Realtime Relay is online, use it!
        if (daemonRelay.getIsOnline()) {
          get().appendLog(
            id,
            `[${timestamp}] Mengirim perintah start ke laptop via Supabase Realtime Relay...`
          );
          daemonRelay.startProcess(project.id, project.start_command, project.local_path || undefined);
          return;
        }

        // 2. Fallback: If on local machine /api/dev/start
        if (typeof window !== 'undefined') {
          get().appendLog(id, `[${timestamp}] Requesting start: "${project.start_command}"...`);
          try {
            const res = await fetch('/api/dev/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId: project.id,
                command: project.start_command,
                cwd: project.local_path,
              }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
              set((state) => ({
                projects: state.projects.map((p) =>
                  p.id === id
                    ? {
                        ...p,
                        serverState: 'running',
                        pid: data.pid,
                        logs: [
                          ...p.logs.slice(-98),
                          `[${new Date().toLocaleTimeString()}] Live process running (PID: ${data.pid})`,
                          `[${new Date().toLocaleTimeString()}] Listening on port :${p.default_port}`,
                        ],
                      }
                    : p
                ),
              }));
              get().fetchProjectLogs(id);
            } else {
              get().appendLog(
                id,
                `[${new Date().toLocaleTimeString()}] Start failed: ${data.error || 'Daemon offline'}. Jalankan run-daemon.bat di laptop Anda.`
              );
            }
          } catch (err: any) {
            get().appendLog(
              id,
              `[${new Date().toLocaleTimeString()}] Error: ${err.message}. Jalankan run-daemon.bat di laptop Anda.`
            );
          }
        }
      },

      stopServer: async (id) => {
        const project = get().projects.find((p) => p.id === id);
        if (!project) return;

        const timestamp = new Date().toLocaleTimeString();

        // 1. If Supabase Realtime Relay is online:
        if (daemonRelay.getIsOnline()) {
          get().appendLog(
            id,
            `[${timestamp}] Mengirim perintah stop ke laptop via Supabase Realtime Relay...`
          );
          daemonRelay.stopProcess(project.id);
          return;
        }

        // 2. Fallback local API
        if (typeof window !== 'undefined') {
          try {
            await fetch('/api/dev/stop', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId: project.id,
              }),
            });
          } catch {
            // Ignore
          }
        }

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  serverState: 'stopped',
                  pid: null,
                  logs: [
                    ...p.logs.slice(-98),
                    `[${timestamp}] Process terminated.`,
                  ],
                }
              : p
          ),
        }));
      },

      restartServer: async (id) => {
        await get().stopServer(id);
        setTimeout(() => get().startServer(id), 1000);
      },

      appendLog: (id, logLine) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, logs: [...p.logs.slice(-99), logLine] } : p
          ),
        })),

      saveProjectEnv: (id, encrypted) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, encryptedEnv: encrypted } : p
          ),
        })),

      addProject: (newProj) =>
        set((state) => ({
          projects: [
            {
              ...newProj,
              id: `proj-${Date.now()}`,
              serverState: 'stopped',
              pid: null,
              logs: ['[Daemon] Project registered.'],
            },
            ...state.projects,
          ],
        })),
    }),
    {
      name: 'chemicvll-dev-storage',
    }
  )
);
