import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project } from '@/types/database';

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
  setActiveLogProjectId: (id: string | null) => void;
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
      setActiveLogProjectId: (id) => set({ activeLogProjectId: id }),

      syncWithDaemon: async () => {
        if (typeof window === 'undefined') return;
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

        // Optimistically set to running
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  serverState: 'running',
                  logs: [
                    ...p.logs.slice(-98),
                    `[${timestamp}] Requesting start: "${p.start_command}"...`,
                  ],
                }
              : p
          ),
        }));

        if (typeof window !== 'undefined') {
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
              set((state) => ({
                projects: state.projects.map((p) =>
                  p.id === id
                    ? {
                        ...p,
                        serverState: 'stopped',
                        pid: null,
                        logs: [
                          ...p.logs.slice(-98),
                          `[${new Date().toLocaleTimeString()}] Start failed: ${data.error || 'Unknown error'}`,
                        ],
                      }
                    : p
                ),
              }));
            }
          } catch (err: any) {
            set((state) => ({
              projects: state.projects.map((p) =>
                p.id === id
                  ? {
                      ...p,
                      serverState: 'stopped',
                      logs: [
                        ...p.logs.slice(-98),
                        `[${new Date().toLocaleTimeString()}] Error: ${err.message}`,
                      ],
                    }
                  : p
              ),
            }));
          }
        }
      },

      stopServer: async (id) => {
        const project = get().projects.find((p) => p.id === id);
        if (!project) return;

        const timestamp = new Date().toLocaleTimeString();

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
        setTimeout(() => get().startServer(id), 800);
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
