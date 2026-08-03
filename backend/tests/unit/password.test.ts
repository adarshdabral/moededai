import { comparePassword, hashPassword } from '@common/utils/password';

describe('password hashing', () => {
  it('hashes a password to a bcrypt hash distinct from the plaintext', async () => {
    const hash = await hashPassword('Sup3rSecret!');
    expect(hash).not.toBe('Sup3rSecret!');
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('comparePassword returns true for the correct password', async () => {
    const hash = await hashPassword('Sup3rSecret!');
    await expect(comparePassword('Sup3rSecret!', hash)).resolves.toBe(true);
  });

  it('comparePassword returns false for an incorrect password', async () => {
    const hash = await hashPassword('Sup3rSecret!');
    await expect(comparePassword('WrongPassword', hash)).resolves.toBe(false);
  });

  it('hashing the same password twice produces different hashes (unique salt)', async () => {
    const [hashA, hashB] = await Promise.all([
      hashPassword('Sup3rSecret!'),
      hashPassword('Sup3rSecret!'),
    ]);
    expect(hashA).not.toBe(hashB);
  });
});
