/**
 * Idempotent bootstrap script: creates the first admin account from
 * ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD so the platform has a way to reach the
 * Admin Portal before any admin exists. Run via `npm run seed`. Safe to run
 * repeatedly - it no-ops if the account already exists.
 *
 * This intentionally bypasses AuthService.register (which always creates a
 * `student`) because seeding a privileged role must never be reachable
 * through a client-facing endpoint.
 */
import { connectDatabase, disconnectDatabase } from '@config/database';
import { logger } from '@config/logger';
import { env } from '@config/env';
import { ROLES } from '@common/constants/roles';
import { hashPassword } from '@common/utils/password';
import { generateAnonymousId } from '@common/utils/anonymousId';
import { userService } from '@modules/user/user.service';
import { adminIdentityService } from '@modules/admin/adminIdentity.service';

async function seedAdmin(): Promise<void> {
  if (!env.ADMIN_SEED_EMAIL || !env.ADMIN_SEED_PASSWORD) {
    logger.warn('ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD not set - skipping admin seed.');
    return;
  }

  const existing = await userService.getByEmail(env.ADMIN_SEED_EMAIL);
  if (existing) {
    logger.info('Admin seed skipped - account already exists', { email: env.ADMIN_SEED_EMAIL });
    return;
  }

  const passwordHash = await hashPassword(env.ADMIN_SEED_PASSWORD);
  const anonymousId = generateAnonymousId();
  const admin = await userService.createUser({
    name: env.ADMIN_SEED_NAME ?? 'Platform Admin',
    email: env.ADMIN_SEED_EMAIL,
    passwordHash,
    role: ROLES.ADMIN,
    anonymousId,
  });
  await userService.markEmailVerified(String(admin._id));
  await adminIdentityService.createMapping(String(admin._id), anonymousId);

  logger.info('Admin account seeded', { email: admin.email });
}

async function run(): Promise<void> {
  await connectDatabase();
  try {
    await seedAdmin();
  } finally {
    await disconnectDatabase();
  }
}

run().catch((error) => {
  logger.error('Seeding failed', { error });
  process.exit(1);
});
