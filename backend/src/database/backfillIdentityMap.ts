/**
 * One-off, idempotent backfill: ensures every existing user has a
 * corresponding `anonymous_identity_map` entry. Needed because earlier
 * phases (0-6) created users before this mapping existed; new registrations
 * create it inline (see AuthService.register). Safe to run repeatedly - it
 * only inserts a mapping for users that don't already have one.
 *
 * Run via `npm run backfill:identity`.
 */
import { connectDatabase, disconnectDatabase } from '@config/database';
import { logger } from '@config/logger';
import { UserModel } from '@modules/user/user.model';
import { anonymousIdentityMapRepository } from '@modules/admin/anonymousIdentityMap.repository';

async function backfill(): Promise<void> {
  const users = await UserModel.find({}).lean().exec();
  let created = 0;

  for (const user of users) {
    const exists = await anonymousIdentityMapRepository.existsForUser(String(user._id));
    if (exists) continue;

    await anonymousIdentityMapRepository.create(String(user._id), user.anonymousId);
    created += 1;
  }

  logger.info('Identity map backfill complete', { totalUsers: users.length, created });
}

async function run(): Promise<void> {
  await connectDatabase();
  try {
    await backfill();
  } finally {
    await disconnectDatabase();
  }
}

run().catch((error) => {
  logger.error('Identity map backfill failed', { error });
  process.exit(1);
});
