'use client';

import React, { useState } from 'react';
import { useDevStore, DevProject } from '@/stores/useDevStore';
import { encryptVault, decryptVault } from '@/lib/crypto-vault';
import {
  Play,
  Square,
  RotateCcw,
  Terminal,
  Lock,
  Unlock,
  KeyRound,
  ExternalLink,
  Plus,
  X,
  FileCode,
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
      // First time vault setup for this project
      setIsUnlocked(true);
      setVaultStatus('Vault baru siap digunakan. Silakan ketik variabel .env Anda.');
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
    } catch (err) {
      setVaultStatus('Passphrase salah atau payload rusak.');
    }
  };

  const handleSaveVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim() || !vaultProjectId) return;

    const encrypted = await encryptVault(rawEnv, passphrase);
    saveProjectEnv(vaultProjectId, encrypted);
    setVaultStatus('Tersimpan dan terenkripsi secara aman di sisi klien!');
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
      color_code: '#10B981',
      repo_url: null,
      prod_url: null,
      local_path: projPath || null,
      start_command: projCommand,
      default_port: projPort,
      target_date: null,
    });
    setProjName('');
    setIsAddProjOpen(false);
  };

  return (
    <section className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-appleText-primary">
            Dev Mission Control
          </h2>
          <p className="text-xs text-appleText-secondary mt-0.5">
            Kendali server lokal tanpa buka VS Code, terminal logs realtime, dan enkripsi client-side .env vault.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddProjOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-black transition shadow-sm active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p) => {
          const isRunning = p.serverState === 'running';

          return (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-appleBorder p-4 shadow-apple hover:shadow-appleHover transition space-y-3"
            >
              {/* Card Header & Status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                      }`}
                    ></span>
                    <h3 className="text-sm font-semibold text-appleText-primary">{p.name}</h3>
                  </div>
                  {p.description && (
                    <p className="text-xs text-appleText-secondary mt-0.5">{p.description}</p>
                  )}
                </div>

                <span
                  className={`font-mono text-[11px] font-bold uppercase tracking-wider ${
                    isRunning ? 'text-emerald-700' : 'text-appleText-muted'
                  }`}
                >
                  {isRunning ? `Running (PID: ${p.pid})` : 'Stopped'}
                </span>
              </div>

              {/* Meta Info */}
              <div className="pt-2 border-t border-zinc-100 text-xs text-appleText-secondary space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-appleText-muted">Command:</span>
                  <span className="text-appleText-primary">{p.start_command}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-appleText-muted">Port:</span>
                  <span className="text-appleText-primary">:{p.default_port}</span>
                </div>
                {p.local_path && (
                  <div className="flex justify-between truncate">
                    <span className="text-appleText-muted">Path:</span>
                    <span className="text-appleText-primary truncate max-w-[200px]" title={p.local_path}>
                      {p.local_path}
                    </span>
                  </div>
                )}
              </div>

              {/* Server Runner Actions */}
              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {!isRunning ? (
                    <button
                      type="button"
                      onClick={() => startServer(p.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition shadow-sm active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Start Server</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => stopServer(p.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition shadow-sm active:scale-95"
                      >
                        <Square className="w-3.5 h-3.5 fill-white" />
                        <span>Stop</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => restartServer(p.id)}
                        className="p-1.5 rounded-lg border border-appleBorder hover:bg-subtle text-appleText-secondary transition"
                        title="Restart"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveLogProjectId(p.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-appleBorder hover:bg-subtle text-appleText-secondary text-[11px] font-mono transition"
                  >
                    <Terminal className="w-3 h-3" />
                    <span>Logs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenVault(p)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-appleBorder hover:bg-subtle text-appleText-secondary text-[11px] font-mono transition"
                  >
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>.env</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal Log Drawer (Slide-Over Panel) */}
      {activeLogProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
          <div className="bg-[#121316] text-zinc-200 border-l border-zinc-800 w-full max-w-xl h-full flex flex-col p-5 space-y-3 font-mono shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">Live Logs: {activeLogProject.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveLogProjectId(null)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 bg-black/60 rounded-lg p-3 text-xs overflow-y-auto space-y-1 font-mono text-zinc-300">
              {activeLogProject.logs.map((line, idx) => (
                <div key={idx} className="leading-relaxed break-all">
                  <span className="text-zinc-600 mr-2">{idx + 1}</span>
                  {line}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
              <span>Menampilkan {activeLogProject.logs.length} baris log terakhir</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(activeLogProject.logs.join('\n'));
                }}
                className="text-emerald-400 hover:underline"
              >
                Salin Semua Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* .env Vault Modal */}
      {vaultProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-appleBorder shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-appleText-primary">
                  .env Vault: {vaultProject.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVaultProjectId(null)}
                className="p-1 rounded text-appleText-muted hover:text-appleText-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-appleText-secondary leading-relaxed">
              Konfigurasi dienkripsi menggunakan <strong>Web Crypto API (AES-GCM 256-bit)</strong> di browser dengan Master Passphrase Anda. Tidak pernah dikirim dalam teks biasa ke server.
            </p>

            {vaultStatus && (
              <div className="p-2.5 rounded bg-zinc-100 text-xs text-appleText-primary font-mono">
                {vaultStatus}
              </div>
            )}

            {!isUnlocked ? (
              <form onSubmit={handleUnlockVault} className="space-y-3 text-xs">
                <div>
                  <label className="block text-appleText-secondary font-medium mb-1">
                    Masukkan Master Passphrase
                  </label>
                  <input
                    type="password"
                    required
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Passphrase enkripsi..."
                    className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary font-mono focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-zinc-900 text-white font-medium hover:bg-black transition text-xs"
                >
                  Buka Vault (Decrypt)
                </button>
              </form>
            ) : (
              <form onSubmit={handleSaveVault} className="space-y-3 text-xs">
                <div>
                  <label className="block text-appleText-secondary font-medium mb-1">
                    Konfigurasi Environment (.env)
                  </label>
                  <textarea
                    rows={6}
                    value={rawEnv}
                    onChange={(e) => setRawEnv(e.target.value)}
                    placeholder="DATABASE_URL=postgres://...&#10;API_KEY=sk_..."
                    className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary font-mono text-xs focus:outline-none"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-appleText-secondary font-medium mb-1">
                    Master Passphrase (untuk Enkripsi Ulang)
                  </label>
                  <input
                    type="password"
                    required
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Passphrase..."
                    className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary font-mono focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-zinc-900 text-white font-medium hover:bg-black transition text-xs"
                >
                  Simpan & Enkripsi Ulang (.env)
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {isAddProjOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-appleBorder shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-appleText-primary">Tambah Project Baru</h3>
              <button
                type="button"
                onClick={() => setIsAddProjOpen(false)}
                className="p-1 rounded text-appleText-muted hover:text-appleText-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="block text-appleText-secondary font-medium mb-1">
                  Nama Project *
                </label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  placeholder="Misal: API Backend Service"
                  className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-appleText-secondary font-medium mb-1">
                    Start Command
                  </label>
                  <input
                    type="text"
                    value={projCommand}
                    onChange={(e) => setProjCommand(e.target.value)}
                    placeholder="npm run dev"
                    className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-appleText-secondary font-medium mb-1">
                    Port Default
                  </label>
                  <input
                    type="number"
                    value={projPort}
                    onChange={(e) => setProjPort(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-appleText-secondary font-medium mb-1">
                  Direktori Lokal (Local Path)
                </label>
                <input
                  type="text"
                  value={projPath}
                  onChange={(e) => setProjPath(e.target.value)}
                  placeholder="C:\Projects\my-app"
                  className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary font-mono focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddProjOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-appleText-secondary hover:bg-subtle"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white font-medium hover:bg-black transition"
                >
                  Simpan Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}

