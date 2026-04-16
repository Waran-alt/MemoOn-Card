/**
 * Node environment so `fs/promises` mocking matches the route module graph.
 * @vitest-environment node
 */
import path from 'path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');

const readFileMock = vi.hoisted(() => vi.fn());

vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return { ...actual, readFile: readFileMock };
});

import { GET } from './route';

let cwdSpy: ReturnType<typeof vi.spyOn> | undefined;

beforeEach(() => {
  readFileMock.mockReset();
  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(repoRoot);
  vi.unstubAllEnvs();
});

afterEach(() => {
  cwdSpy?.mockRestore();
  vi.unstubAllEnvs();
});

describe('GET /api/version', () => {
  it('prefers NEXT_PUBLIC_APP_VERSION and normalizes full git sha', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_VERSION', 'a'.repeat(40));
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { version: string };
    expect(body.version).toBe('aaaaaaa');
  });

  it('falls back to APP_RELEASE when NEXT_PUBLIC_APP_VERSION unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_VERSION', undefined as unknown as string);
    vi.stubEnv('APP_RELEASE', '1.4.2+abc1234567890');
    const res = await GET();
    const body = (await res.json()) as { version: string };
    expect(body.version).toBe('1.4.2+abc1234');
  });

  it('reads version.json when env labels are empty', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_VERSION', '');
    vi.stubEnv('APP_RELEASE', '');
    vi.stubEnv('GIT_SHA', '');
    readFileMock.mockResolvedValueOnce(JSON.stringify({ version: '0.9.0' }));
    const res = await GET();
    const body = (await res.json()) as { version: string };
    expect(body.version).toBe('0.9.0');
    expect(readFileMock).toHaveBeenCalled();
  });

  it('returns dev when file read fails', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_VERSION', '');
    vi.stubEnv('APP_RELEASE', '');
    vi.stubEnv('GIT_SHA', '');
    readFileMock.mockRejectedValueOnce(new Error('ENOENT'));
    const res = await GET();
    const body = (await res.json()) as { version: string };
    expect(body.version).toBe('dev');
  });
});
