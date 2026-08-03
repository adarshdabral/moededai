// Safety net for test-run modes that don't use --runInBand (e.g. `test:watch`),
// where worker processes are forked and only inherit env vars set in
// globalSetup.js at fork time. Mirrors those same defaults per-worker.
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'test-access-secret-do-not-use-in-production';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-do-not-use-in-production';
