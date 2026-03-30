import { describe, it, expect } from 'vitest';
import { runSpawn } from '@/utils/run-spawn';

describe('runSpawn', () => {
  it('captures stdout from a short node -e script', async () => {
    const { stdout, stderr } = await runSpawn(process.execPath, ['-e', "console.log('ok')"], {
      env: process.env,
      timeoutMs: 5000,
      maxBufferBytes: 64 * 1024,
    });
    expect(stderr).toBe('');
    expect(stdout.trim()).toBe('ok');
  });

  it('rejects when process exceeds timeout', async () => {
    await expect(
      runSpawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], {
        env: process.env,
        timeoutMs: 150,
        maxBufferBytes: 64 * 1024,
      })
    ).rejects.toThrow(/timed out/i);
  });

  it('rejects when output exceeds maxBufferBytes', async () => {
    await expect(
      runSpawn(
        process.execPath,
        ['-e', "console.log('x'.repeat(50000))"],
        {
          env: process.env,
          timeoutMs: 5000,
          maxBufferBytes: 2000,
        }
      )
    ).rejects.toThrow(/maxBuffer exceeded/i);
  });
});
