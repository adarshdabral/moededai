import { generateAnonymousId } from '@common/utils/anonymousId';

describe('generateAnonymousId', () => {
  it('produces an anon_-prefixed identifier', () => {
    expect(generateAnonymousId()).toMatch(/^anon_[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{12}$/);
  });

  it('produces unique values across many calls', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateAnonymousId()));
    expect(ids.size).toBe(1000);
  });
});
