import { describe, it, expect } from 'vitest';
import {
  getFsrsOptimizerCheckCandidates,
  getFsrsOptimizerRunCandidates,
} from '@/constants/optimizer-spawn.constants';

describe('optimizer-spawn.constants', () => {
  it('run candidates include python3 and pipx with csv path as last arg', () => {
    const csv = '/tmp/test.csv';
    const c = getFsrsOptimizerRunCandidates(csv);
    expect(c.length).toBeGreaterThanOrEqual(2);
    expect(c.some((x) => x.file === 'python3' && x.args.includes(csv))).toBe(true);
    expect(c.some((x) => x.file === 'pipx')).toBe(true);
  });

  it('check candidates use import fsrs_optimizer or pipx help', () => {
    const c = getFsrsOptimizerCheckCandidates();
    expect(c.length).toBeGreaterThanOrEqual(2);
    expect(c.some((x) => x.args.join(' ').includes('import fsrs_optimizer'))).toBe(true);
  });
});
