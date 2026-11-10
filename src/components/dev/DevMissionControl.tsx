'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDevStore, DevProject } from '@/stores/useDevStore';
import { encryptVault, decryptVault } from '@/lib/crypto-vault';
import { checkPortHealth, PortHealth } from '@/lib/port-checker';
import { daemonRelay } from '@/lib/daemon-relay';
import {
  Terminal,
  Play,
  Square,
  RotateCcw,
  Lock,
  Unlock,
  KeyRound,
  ExternalLink,
  Plus,
  X,
  Server,
  Cpu,
  Boxes,
  GitBranch,
  RefreshCw,
  Radio,
  FileCode,
  Copy,
  Trash2,
} from 'lucide-react';

export function DevMissionControl() {
  const {
    projects,
    activeLogProjectId,
    systemMetrics,
    isLocal,
    isDaemonOnline,
    daemonMachine,
    setActiveLogProjectId,
    setDaemonOnline,
    setSystemMetrics,
    setProjectState,
    appendLog,
    startServer,
    stopServer,
    restartServer,
    syncWithDaemon,
    fetchProjectLogs,
    saveProjectEnv,
    addProject,
    deleteProject,
  } = useDevStore();

  const [vaultProjectId, setVaultProjectId] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [rawEnv, setRawEnv] = useState('');
  const [vaultStatus, setVaultStatus] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importStr, setImportStr] = useState('');
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // New project modal
  const [isAddProjOpen, setIsAddProjOpen] = useState(false);
  const [projName, setProjName] = useState('');
  const [projCommand, setProjCommand] = useState('npm run dev');
  const [projPort, setProjPort] = useState(3000);
  const [projPath, setProjPath] = useState('');

  const activeLogProject = projects.find((p) => p.id === activeLogProjectId);
  const vaultProject = projects.find((p) => p.id === vaultProjectId);

  const runningServers = projects.filter((p) => p.serverState === 'running').length;

  const [portStatuses, setPortStatuses] = useState<Record<number, PortHealth>>({});
  const [isPinging, setIsPinging] = useState(false);

  // Initialize Supabase Realtime Relay for remote daemon control
  useEffect(() => {
    daemonRelay.init({
      onDaemonStateChange: (online) => {
        setDaemonOnline(online);
      },
      onHeartbeat: (telemetry) => {
        setDaemonOnline(true, telemetry.machine);
        setSystemMetrics({
          totalGB: telemetry.totalGB,
          usedGB: telemetry.usedGB,
          freeGB: telemetry.freeGB,
          usedPercent: telemetry.usedPercent,
          platform: telemetry.platform,
          cpuCount: 0,
        });

        if (Array.isArray(telemetry.running)) {
          telemetry.running.forEach((r) => {
            setProjectState(r.projectId, 'running', r.pid);
          });
        }
      },
      onLog: (projectId, line) => {
        appendLog(projectId, line);
      },
      onProcessStarted: (projectId, pid) => {
        setProjectState(projectId, 'running', pid);
        appendLog(projectId, `[Relay Live] Process started on laptop (PID: ${pid})`);
      },
      onProcessStopped: (projectId) => {
        setProjectState(projectId, 'stopped', null);
        appendLog(projectId, `[Relay Live] Process stopped.`);
      },
      onProcessExited: (projectId, code) => {
        setProjectState(projectId, 'stopped', null);
        appendLog(projectId, `[Relay Live] Process exited (code ${code ?? 0}).`);
      },
    });
  }, [setDaemonOnline, setSystemMetrics, setProjectState, appendLog]);

  // Periodic daemon & system sync
  useEffect(() => {
    syncWithDaemon();
    const interval = setInterval(syncWithDaemon, 4000);
    return () => clearInterval(interval);
  }, [syncWithDaemon]);

  // Periodic logs stream for active project
  useEffect(() => {
    if (activeLogProjectId) {
      fetchProjectLogs(activeLogProjectId);
      const interval = setInterval(() => {
        fetchProjectLogs(activeLogProjectId);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [activeLogProjectId, fetchProjectLogs]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal smoothly to bottom as new logs arrive
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeLogProject?.logs]);

  const pingAllPorts = async () => {
    setIsPinging(true);
    const results: Record<number, PortHealth> = {};
    for (const p of projects) {
      results[p.default_port] = await checkPortHealth(p.default_port, 1000);
    }
    setPortStatuses(results);
    setIsPinging(false);
  };

  useEffect(() => {
    pingAllPorts();
    const interval = setInterval(pingAllPorts, 30000);
    return () => clearInterval(interval);
  }, [projects]);

  const handleOpenVault = (project: DevProject) => {
    setVaultProjectId(project.id);
    setPassphrase('');
    setRawEnv('');
    setVaultStatus(null);
    setShowImport(false);
    setImportStr('');
    // If project has no encrypted vault yet, open directly into create mode!
    if (!project.encryptedEnv) {
      setIsUnlocked(true);
    } else {
      setIsUnlocked(false);
    }
  };

  const handleUnlockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim() || !vaultProject) return;

    if (!vaultProject.encryptedEnv) {
      setIsUnlocked(true);
      setVaultStatus('Brankas baru siap. Silakan masukkan variabel .env.');
      return;
    }

    try {
      const decrypted = await decryptVault(
        vaultProject.encryptedEnv.encryptedPayload,
        vaultProject.encryptedEnv.iv,
        vaultProject.encryptedEnv.salt,
        passphrase
      );
      setRawEnv(decrypted);
      setIsUnlocked(true);
      setVaultStatus('Berhasil didekripsi dengan Web Crypto AES-GCM 256-bit.');
    } catch {
      setVaultStatus('Kata sandi (passphrase) salah atau data rusak.');
    }
  };

  const handleSaveVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim() || !vaultProjectId) return;

    const encrypted = await encryptVault(rawEnv, passphrase);
    saveProjectEnv(vaultProjectId, encrypted);
    setVaultStatus('Tersimpan dan terenkripsi aman secara lokal di browser!');
    setTimeout(() => {
      setVaultProjectId(null);
      setIsUnlocked(false);
    }, 1500);
  };

  const handleExportVault = () => {
    if (!vaultProject?.encryptedEnv) return;
    navigator.clipboard.writeText(JSON.stringify(vaultProject.encryptedEnv));
    setVaultStatus('Kode brankas terenkripsi disalin! Aman ditempel ke perangkat lain.');
  };

  const handleImportVault = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(importStr.trim());
      if (parsed.encryptedPayload && parsed.iv && parsed.salt && vaultProjectId) {
        saveProjectEnv(vaultProjectId, parsed);
        setVaultStatus('Brankas berhasil diimpor! Silakan masukkan master passphrase untuk membuka.');
        setIsUnlocked(false);
        setShowImport(false);
        setImportStr('');
      } else {
        setVaultStatus('Format tidak valid. Pastikan JSON memiliki encryptedPayload, iv, dan salt.');
      }
    } catch {
      setVaultStatus('Gagal membaca data: format bukan JSON terenkripsi yang valid.');
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;
    addProject({
      name: projName,
      description: null,
      status: 'active',
      color_code: '#FF6B00',
      repo_url: null,
      prod_url: null,
      local_path: projPath || 'E:/College Stuff/Career/' + projName.toLowerCase(),
      default_port: Number(projPort),
      start_command: projCommand,
      target_date: null,
    });
    setProjName('');
    setProjPath('');
    setIsAddProjOpen(false);
  };

  return (
    <section className="space-y-6">
      
      {/* Welcome & Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-3xl border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
              Local Environment
            </h1>
            <span className="text-2xl md:text-3xl font-bold text-primary-container tracking-tight">
              Manager
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            {isDaemonOnline
              ? `Supabase Relay Online · Connected to ${daemonMachine || 'Windows PC'} · ${runningServers} active sockets`
              : isLocal
              ? `Local Runner · Windows Engine · ${runningServers} active listening sockets`
              : 'Supabase Relay Standby · Buka run-daemon.command (Mac) atau run-daemon.bat (Windows)'}
          </p>
        </div>

        {/* Quick Pill Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-surface-container-low px-3.5 py-1.5 rounded-full border border-outline/20 text-xs text-on-surface font-medium">
            <Radio
              className={`w-3.5 h-3.5 ${
                isDaemonOnline
                  ? 'text-emerald-500 animate-pulse'
                  : isLocal
                  ? 'text-emerald-500'
                  : 'text-amber-500'
              }`}
            />
            <span>
              {isDaemonOnline
                ? 'Laptop Relay Connected'
                : isLocal
                ? 'Local Engine Active'
                : 'Waiting for Laptop'}
            </span>
          </div>

          <button
            type="button"
            onClick={pingAllPorts}
            className="flex items-center gap-1.5 bg-surface-container-low hover:bg-surface-container-high px-3.5 py-1.5 rounded-full border border-outline/20 text-xs text-on-surface font-medium transition"
            title="Ping all ports now"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary-container ${isPinging ? 'animate-spin' : ''}`} />
            <span>Ping Ports</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddProjOpen(true)}
            className="flex items-center gap-1.5 bg-inverse-surface text-white px-4 py-2 rounded-full text-xs font-semibold shadow-md hover:bg-black transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Map New Port</span>
          </button>
        </div>
      </div>

      {/* Banner when in cloud mode and daemon not connected */}
      {!isDaemonOnline && !isLocal && !isBannerDismissed && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
            <div>
              <p className="font-semibold text-on-surface">Jembatan Laptop Belum Terkoneksi</p>
              <p className="text-[11px] text-on-surface-variant">
                Klik 2x file <strong>run-daemon.command</strong> (Mac) atau <strong>run-daemon.bat</strong> (Windows) di folder project laptop Anda agar tombol Start/Stop dan terminal dapat mengontrol laptop langsung dari Vercel.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsBannerDismissed(true)}
            className="w-7 h-7 rounded-full hover:bg-amber-500/20 flex items-center justify-center text-amber-800 transition flex-shrink-0"
            title="Tutup Notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bento 4 Metric Cards - Mobile 2x2 Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Active Ports */}
        <div className="bg-surface-container-lowest p-3.5 sm:p-5 rounded-2xl border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-on-surface-variant truncate">Active Ports</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-container-low shrink-0 flex items-center justify-center text-on-surface">
              <Server className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-4">
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-3xl font-bold text-on-surface tracking-tight font-sans">
                {runningServers}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-700 whitespace-nowrap shrink-0">
                Bound
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-on-surface-variant mt-1 font-mono truncate">
              {projects.map((p) => `:${p.default_port}`).join(', ')}
            </p>
          </div>
        </div>

        {/* Card 2: Memory Load */}
        <div className="bg-surface-container-lowest p-3.5 sm:p-5 rounded-2xl border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-on-surface-variant truncate">RAM Load</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-container-low shrink-0 flex items-center justify-center text-on-surface">
              <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-4">
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-3xl font-bold text-on-surface tracking-tight font-sans truncate">
                {systemMetrics ? systemMetrics.usedGB : '4.8'} <span className="text-[10px] sm:text-xs text-on-surface-variant font-normal">/ {systemMetrics ? systemMetrics.totalGB : '16'}GB</span>
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-700 whitespace-nowrap shrink-0">
                {systemMetrics ? `${systemMetrics.usedPercent}%` : 'Optimal'}
              </span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-2 sm:mt-2.5 overflow-hidden">
              <div
                className="bg-primary-container h-full rounded-full transition-all duration-500"
                style={{ width: `${systemMetrics ? systemMetrics.usedPercent : 30}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Docker Daemons */}
        <div className="bg-surface-container-lowest p-3.5 sm:p-5 rounded-2xl border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-on-surface-variant truncate">Containers</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-container-low shrink-0 flex items-center justify-center text-on-surface">
              <Boxes className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-4">
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-3xl font-bold text-on-surface tracking-tight font-sans">
                3 Up
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-surface-container-high text-on-surface-variant whitespace-nowrap shrink-0">
                0 Exited
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-on-surface-variant mt-1 font-mono truncate">
              postgres, redis, runner
            </p>
          </div>
        </div>

        {/* Card 4: Git Sync Status */}
        <div className="bg-surface-container-lowest p-3.5 sm:p-5 rounded-2xl border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold text-on-surface-variant truncate">Git Branches</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-container-low shrink-0 flex items-center justify-center text-on-surface">
              <GitBranch className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-4">
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-xl font-bold text-on-surface tracking-tight font-mono">
                main
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-700 whitespace-nowrap shrink-0">
                Synced
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-on-surface-variant mt-1 truncate">
              Atomic commits enforced
            </p>
          </div>
        </div>
      </div>

      {/* Main Workspace: Stack Cards & Terminal Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left: Project Stack Cards (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface">Service Stack</h3>
            <span className="text-xs text-on-surface-variant font-medium">
              {projects.length} Services Configured
            </span>
          </div>

          <div className="space-y-3">
            {projects.map((proj) => {
              const isRunning = proj.serverState === 'running';

              return (
                <div
                  key={proj.id}
                  className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col gap-3 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                          }`}
                        />
                        <h4 className="font-bold text-sm text-on-surface truncate">{proj.name}</h4>
                        <span className="font-mono text-xs text-primary-container bg-primary-fixed/30 px-2 py-0.5 rounded-md font-semibold whitespace-nowrap shrink-0">
                          :{proj.default_port}
                        </span>
                        {portStatuses[proj.default_port] && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap shrink-0 ${
                              portStatuses[proj.default_port] === 'healthy'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-zinc-100 text-zinc-500'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                portStatuses[proj.default_port] === 'healthy'
                                  ? 'bg-emerald-500 animate-pulse'
                                  : 'bg-zinc-400'
                              }`}
                            />
                            <span>{portStatuses[proj.default_port] === 'healthy' ? 'Active' : 'Standby'}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1 font-mono truncate max-w-sm">
                        {proj.start_command}
                      </p>
                    </div>

                    <a
                      href={`http://localhost:${proj.default_port}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-1.5 rounded-lg border transition flex items-center gap-1.5 text-xs font-medium shrink-0 ${
                        isRunning || portStatuses[proj.default_port] === 'healthy'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-sm'
                          : 'border-outline/40 hover:bg-surface-container-high text-on-surface-variant'
                      }`}
                      title={`Buka http://localhost:${proj.default_port} di browser`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-mono">:{proj.default_port}</span>
                    </a>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-outline/20 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isRunning ? (
                        <button
                          type="button"
                          onClick={() => stopServer(proj.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold transition"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startServer(proj.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Start</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => restartServer(proj.id)}
                        className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition"
                        title="Restart"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveLogProjectId(proj.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                          activeLogProjectId === proj.id
                            ? 'bg-inverse-surface text-white'
                            : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <Terminal className="w-3 h-3 inline mr-1" />
                        <span>Logs</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleOpenVault(proj)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container-high border border-outline/20 text-xs font-medium text-on-surface transition"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-primary-container" />
                        <span>.env Vault</span>
                      </button>

                      {projects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Hapus project "${proj.name}" dari Dev Control?`)) {
                              deleteProject(proj.id);
                            }
                          }}
                          className="p-1.5 rounded-full hover:bg-rose-50 text-on-surface-variant hover:text-rose-600 transition"
                          title="Hapus Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Streaming Console Terminal (6 Cols) */}
        <div className="lg:col-span-6 bg-[#18181b] rounded-3xl p-5 border border-zinc-800 shadow-xl flex flex-col h-[500px] max-h-[500px] overflow-hidden font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="text-zinc-400 text-xs pl-2 font-semibold">
                {activeLogProject ? `${activeLogProject.name} (Port ${activeLogProject.default_port})` : 'Terminal Console'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-zinc-400">Live Streaming</span>
            </div>
          </div>

          {/* Terminal Output Body - Bounded internal scroll */}
          <div className="flex-1 min-h-0 py-3 overflow-y-auto space-y-1.5 text-zinc-300 pr-1 select-text">
            {activeLogProject?.logs && activeLogProject.logs.length > 0 ? (
              activeLogProject.logs.map((log, idx) => (
                <div key={idx} className="flex gap-2 leading-relaxed break-all">
                  <span className="text-zinc-500 select-none flex-shrink-0">&gt;</span>
                  <span>{log}</span>
                </div>
              ))
            ) : (
              <div className="text-zinc-500 py-8 text-center">
                Pilih service dan tekan Start untuk mengalirkan log terminal.
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 flex-shrink-0">
            <span>Daemon: Supabase Relay (127.0.0.1)</span>
            <span className="text-zinc-400">Auto-scrolling</span>
          </div>
        </div>
      </div>

      {/* Modal .env Vault (Client-Side Encrypted) */}
      {vaultProjectId && vaultProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline/40 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline/20">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary-container" />
                <h3 className="font-bold text-sm text-on-surface">
                  {vaultProject.encryptedEnv && !isUnlocked
                    ? `Unlock .env Vault: ${vaultProject.name}`
                    : `Configure .env Vault: ${vaultProject.name}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVaultProjectId(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              {vaultProject.encryptedEnv && !isUnlocked
                ? 'Brankas terenkripsi aman secara lokal di browser dengan Web Crypto AES-GCM 256-bit. Masukkan passphrase Anda untuk membuka.'
                : 'Simpan konfigurasi .env dengan enkripsi lokal AES-GCM 256-bit. Kunci enkripsi tidak pernah dikirim ke server.'}
            </p>

            {vaultStatus && (
              <div className="p-3 rounded-2xl bg-surface-container-low text-xs text-on-surface font-medium border border-outline/30">
                {vaultStatus}
              </div>
            )}

            {!isUnlocked ? (
              <form onSubmit={handleUnlockVault} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Master Passphrase
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Masukkan master passphrase brankas..."
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container font-mono"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleExportVault}
                    className="text-xs text-primary-container hover:underline flex items-center gap-1.5"
                    title="Salin kode terenkripsi untuk dipindahkan ke perangkat lain"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Ekspor Brankas</span>
                  </button>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setVaultProjectId(null)}
                      className="px-4 py-2 rounded-full border border-outline/40 text-xs font-medium text-on-surface-variant"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-full bg-inverse-surface text-white text-xs font-semibold shadow-md hover:bg-black"
                    >
                      Buka Brankas
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveVault} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Variabel Konfigurasi (.env)
                  </label>
                  <textarea
                    rows={8}
                    value={rawEnv}
                    onChange={(e) => setRawEnv(e.target.value)}
                    placeholder="DATABASE_URL=postgres://...&#10;NEXT_PUBLIC_API_KEY=secret_xyz"
                    className="w-full bg-surface-container-low border border-outline/30 rounded-xl p-3 text-xs font-mono text-on-surface focus:outline-none focus:border-primary-container resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    {vaultProject.encryptedEnv
                      ? 'Konfirmasi Passphrase untuk Enkripsi Ulang'
                      : 'Tentukan Master Passphrase Baru'}
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Masukkan kata sandi brankas..."
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container font-mono"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  {!vaultProject.encryptedEnv && (
                    <button
                      type="button"
                      onClick={() => setShowImport(!showImport)}
                      className="text-xs text-primary-container hover:underline flex items-center gap-1"
                    >
                      <span>{showImport ? 'Tutup form impor' : 'Atau impor brankas dari PC'}</span>
                    </button>
                  )}
                  <div className="flex justify-end gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setVaultProjectId(null)}
                      className="px-4 py-2 rounded-full border border-outline/40 text-xs font-medium text-on-surface-variant"
                    >
                      Tutup
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-full bg-inverse-surface text-white text-xs font-semibold shadow-md hover:bg-black"
                    >
                      Enkripsi &amp; Simpan
                    </button>
                  </div>
                </div>

                {showImport && (
                  <div className="pt-3 border-t border-outline/20 space-y-2">
                    <p className="text-[11px] text-on-surface-variant">
                      Tempel kode brankas yang di-ekspor dari PC:
                    </p>
                    <textarea
                      rows={3}
                      value={importStr}
                      onChange={(e) => setImportStr(e.target.value)}
                      placeholder='{"encryptedPayload":"...","iv":"...","salt":"..."}'
                      className="w-full bg-surface-container-low border border-outline/30 rounded-xl p-2.5 text-[11px] font-mono text-on-surface focus:outline-none focus:border-primary-container"
                    />
                    <button
                      type="button"
                      onClick={handleImportVault}
                      className="px-4 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold"
                    >
                      Pasang Brankas
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Tambah Port / Project */}
      {isAddProjOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline/40 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline/20">
              <h3 className="font-bold text-sm text-on-surface">Map New Local Port</h3>
              <button
                type="button"
                onClick={() => setIsAddProjOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  Quick Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProjName('Website Kopi (Laravel)');
                      setProjPort(8000);
                      setProjCommand('php artisan serve');
                      setProjPath('E:\\College Stuff\\Career\\Website Kopi');
                    }}
                    className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline/20 text-left transition group"
                  >
                    <div className="text-xs font-semibold text-on-surface group-hover:text-primary-container">Laravel Backend</div>
                    <div className="text-[10px] text-on-surface-variant font-mono">:8000 &bull; artisan serve</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProjName('Website Kopi (Vite)');
                      setProjPort(5173);
                      setProjCommand('npm run dev');
                      setProjPath('E:\\College Stuff\\Career\\Website Kopi');
                    }}
                    className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline/20 text-left transition group"
                  >
                    <div className="text-xs font-semibold text-on-surface group-hover:text-primary-container">Vite Assets</div>
                    <div className="text-[10px] text-on-surface-variant font-mono">:5173 &bull; npm run dev</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProjName('Next.js App');
                      setProjPort(3001);
                      setProjCommand('npm run dev');
                    }}
                    className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline/20 text-left transition group"
                  >
                    <div className="text-xs font-semibold text-on-surface group-hover:text-primary-container">Next.js App</div>
                    <div className="text-[10px] text-on-surface-variant font-mono">:3001 &bull; npm run dev</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProjName('Python FastAPI');
                      setProjPort(8000);
                      setProjCommand('uvicorn main:app --reload');
                    }}
                    className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline/20 text-left transition group"
                  >
                    <div className="text-xs font-semibold text-on-surface group-hover:text-primary-container">FastAPI Backend</div>
                    <div className="text-[10px] text-on-surface-variant font-mono">:8000 &bull; uvicorn</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Go Gin API, AI Sandbox"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Port *</label>
                  <input
                    type="number"
                    required
                    value={projPort}
                    onChange={(e) => setProjPort(Number(e.target.value))}
                    className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Command</label>
                  <input
                    type="text"
                    required
                    value={projCommand}
                    onChange={(e) => setProjCommand(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Folder Path</label>
                <input
                  type="text"
                  placeholder="E:/College Stuff/Career/..."
                  value={projPath}
                  onChange={(e) => setProjPath(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-outline/20">
                <button
                  type="button"
                  onClick={() => setIsAddProjOpen(false)}
                  className="px-4 py-2 rounded-full border border-outline/40 text-xs font-medium text-on-surface-variant"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-inverse-surface text-white text-xs font-semibold shadow-md hover:bg-black"
                >
                  Register Port
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
