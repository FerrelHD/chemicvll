'use client';

import React, { useState, useEffect } from 'react';
import { useDevStore, DevProject } from '@/stores/useDevStore';
import { encryptVault, decryptVault } from '@/lib/crypto-vault';
import { checkPortHealth, PortHealth } from '@/lib/port-checker';
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
} from 'lucide-react';

export function DevMissionControl() {
  const {
    projects,
    activeLogProjectId,
    setActiveLogProjectId,
    startServer,
    stopServer,
    restartServer,
    saveProjectEnv,
    addProject,
  } = useDevStore();

  const [vaultProjectId, setVaultProjectId] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [rawEnv, setRawEnv] = useState('');
  const [vaultStatus, setVaultStatus] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

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
    setIsUnlocked(false);
  };

  const handleUnlockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim() || !vaultProject) return;

    if (!vaultProject.encryptedEnv) {
      setIsUnlocked(true);
      setVaultStatus('New vault ready. Please enter your .env variables.');
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
      setVaultStatus('Successfully decrypted with Web Crypto AES-GCM 256-bit.');
    } catch {
      setVaultStatus('Incorrect passphrase or corrupted payload.');
    }
  };

  const handleSaveVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim() || !vaultProjectId) return;

    const encrypted = await encryptVault(rawEnv, passphrase);
    saveProjectEnv(vaultProjectId, encrypted);
    setVaultStatus('Saved and securely encrypted on the client side!');
    setTimeout(() => {
      setVaultProjectId(null);
      setIsUnlocked(false);
    }, 1500);
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
            Personal Engine · Windows/Node v20+ · {runningServers} active listening sockets
          </p>
        </div>

        {/* Quick Pill Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-surface-container-low px-3.5 py-1.5 rounded-full border border-outline/20 text-xs text-on-surface font-medium">
            <Radio className="w-3.5 h-3.5 text-primary-container animate-pulse" />
            <span>Live Daemon</span>
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

      {/* Bento 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Ports */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Active Ports</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-on-surface tracking-tight font-sans">
                {runningServers}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                Bound
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1 font-mono">
              {projects.map((p) => `:${p.default_port}`).join(', ')}
            </p>
          </div>
        </div>

        {/* Card 2: Memory Load */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">RAM Load</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-on-surface tracking-tight font-sans">
                4.8 <span className="text-xs text-on-surface-variant font-normal">/ 16 GB</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                Optimal
              </span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-primary-container h-full rounded-full" style={{ width: '30%' }} />
            </div>
          </div>
        </div>

        {/* Card 3: Docker Daemons */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Container Services</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-on-surface tracking-tight font-sans">
                3 Up
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container-high text-on-surface-variant">
                0 Exited
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1 font-mono">
              postgres, redis, runner
            </p>
          </div>
        </div>

        {/* Card 4: Git Sync Status */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Git Branches</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface">
              <GitBranch className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-on-surface tracking-tight font-mono">
                main
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                Synced
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
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
                  className="bg-surface-container-lowest p-5 rounded-3xl border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col gap-3 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                          }`}
                        />
                        <h4 className="font-bold text-sm text-on-surface">{proj.name}</h4>
                        <span className="font-mono text-xs text-primary-container bg-primary-fixed/30 px-2 py-0.5 rounded-md font-semibold">
                          :{proj.default_port}
                        </span>
                        {portStatuses[proj.default_port] && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
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

                    {isRunning && (
                      <a
                        href={`http://localhost:${proj.default_port}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-on-surface-variant hover:text-primary-container p-1 transition"
                        title="Open in Browser"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-outline/20">
                    <div className="flex items-center gap-1.5">
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

                    <button
                      type="button"
                      onClick={() => handleOpenVault(proj)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container-high border border-outline/20 text-xs font-medium text-on-surface transition"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-primary-container" />
                      <span>.env Vault</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Streaming Console Terminal (6 Cols) */}
        <div className="lg:col-span-6 bg-[#18181b] rounded-3xl p-5 border border-zinc-800 shadow-xl flex flex-col justify-between min-h-[480px] font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
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

          {/* Terminal Output Body */}
          <div className="flex-1 py-4 overflow-y-auto space-y-1.5 text-zinc-300">
            {activeLogProject?.logs && activeLogProject.logs.length > 0 ? (
              activeLogProject.logs.map((log, idx) => (
                <div key={idx} className="flex gap-2 leading-relaxed">
                  <span className="text-zinc-500 select-none">&gt;</span>
                  <span>{log}</span>
                </div>
              ))
            ) : (
              <div className="text-zinc-500 py-8 text-center">
                Select a service and press Start to stream HTTP &amp; database logs.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Daemon: Localhost (127.0.0.1)</span>
            <span className="text-zinc-400">Ctrl+C to terminate port</span>
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
                  Client .env Vault: {vaultProject.name}
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
              Encrypted locally with <strong>Web Crypto AES-GCM 256-bit</strong>. Encryption key is never sent to the server.
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
                    Decryption Passphrase
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter master passphrase..."
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setVaultProjectId(null)}
                    className="px-4 py-2 rounded-full border border-outline/40 text-xs font-medium text-on-surface-variant"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-inverse-surface text-white text-xs font-semibold shadow-md hover:bg-black"
                  >
                    Unlock Vault
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveVault} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Environment Configuration (.env)
                  </label>
                  <textarea
                    rows={8}
                    value={rawEnv}
                    onChange={(e) => setRawEnv(e.target.value)}
                    placeholder="DATABASE_URL=postgres://...&#10;API_KEY=secret_xyz"
                    className="w-full bg-surface-container-low border border-outline/30 rounded-xl p-3 text-xs font-mono text-on-surface focus:outline-none focus:border-primary-container resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Confirm Passphrase for Encryption
                  </label>
                  <input
                    type="password"
                    required
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setVaultProjectId(null)}
                    className="px-4 py-2 rounded-full border border-outline/40 text-xs font-medium text-on-surface-variant"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-inverse-surface text-white text-xs font-semibold shadow-md hover:bg-black"
                  >
                    Encrypt &amp; Save
                  </button>
                </div>
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
