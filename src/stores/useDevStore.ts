import { create } from 'zustand';
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

interface DevState {
  projects: DevProject[];
  activeLogProjectId: string | null;
  setActiveLogProjectId: (id: string | null) => void;
  startServer: (id: string) => void;
  stopServer: (id: string) => void;
  restartServer: (id: string) => void;
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
    color_code: '#10B981',
    repo_url: 'https://github.com/FerrelHD/chemicvll',
    prod_url: null,
    local_path: 'E:\\College Stuff\\Career\\chemicvll',
    start_command: 'npm run dev',
    default_port: 3000,
    target_date: '2026-11-30',
    serverState: 'stopped',
    pid: null,
    logs: [
      '[Daemon] System ready. Waiting for start signal...',
      '[Daemon] Port 3000 is open.',
    ],
  },
  {
    id: 'proj-portfolio',
    name: 'Personal Portfolio & Blog',
    description: 'Aesthetic minimal developer portfolio website',
    status: 'active',
    color_code: '#3B82F6',
    repo_url: 'https://github.com/FerrelHD/portfolio',
    prod_url: 'https://ferrel.dev',
    local_path: 'E:\\Projects\\portfolio',
    start_command: 'npm run dev',
    default_port: 3001,
    target_date: null,
    serverState: 'stopped',
    pid: null,
    logs: ['[Daemon] Project registered.'],
  },
];

export const useDevStore = create<DevState>((set, get) => ({
  projects: INITIAL_PROJECTS,
  activeLogProjectId: null,
  setActiveLogProjectId: (id) => set({ activeLogProjectId: id }),
  startServer: (id) => {
    const timestamp = new Date().toLocaleTimeString();
    const pid = Math.floor(1000 + Math.random() * 9000);
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? {
              ...p,
              serverState: 'running',
              pid,
              logs: [
                ...p.logs.slice(-98),
                `[${timestamp}] Spawning process: ${p.start_command} (PID: ${pid})`,
                `[${timestamp}] Ready on http://localhost:${p.default_port}`,
              ],
            }
          : p
      ),
    }));
  },
  stopServer: (id) => {
    const timestamp = new Date().toLocaleTimeString();
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? {
              ...p,
              serverState: 'stopped',
              pid: null,
              logs: [
                ...p.logs.slice(-98),
                `[${timestamp}] Process terminated (SIGINT/SIGTERM sent).`,
              ],
            }
          : p
      ),
    }));
  },
  restartServer: (id) => {
    get().stopServer(id);
    setTimeout(() => get().startServer(id), 500);
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
}));

