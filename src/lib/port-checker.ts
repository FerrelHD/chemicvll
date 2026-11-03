/**
 * Native port health-checker with AbortController timeout safeguard.
 * Minimalist Ponytail design: zero dependencies, native fetch.
 */

export type PortHealth = 'healthy' | 'down';

export async function checkPortHealth(
  port: number,
  timeoutMs = 1200
): Promise<PortHealth> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // In browser or Node runtime, pinging localhost
    await fetch(`http://127.0.0.1:${port}`, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return 'healthy';
  } catch {
    clearTimeout(timeoutId);
    return 'down';
  }
}
