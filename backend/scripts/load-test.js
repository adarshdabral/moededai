/**
 * Manual load-testing script, starting with the read-heavy endpoints
 * flagged in docs/ROADMAP.md Phase 10 (course listing, doubt inbox) plus the
 * readiness probe as a baseline.
 *
 * Deliberately excludes the AI-generation and test-submission endpoints from
 * automated hammering: they are mutating (create tests/attempts on every
 * call), and against a real Gemini API key would also cost real money per
 * request. To load-test those specifically, generate a small pool of
 * pre-made test IDs first and extend `scenarios` below with POST entries
 * pointed at them, at a connection count and duration you control.
 *
 * NOT run automatically and NOT part of CI - it requires a live instance of
 * the API (and a real MONGO_URI/JWT setup) to point at. This script was
 * written but never executed against a running deployment in the sandbox
 * this backend was built in (no long-running server or Docker available
 * there - see docs/ROADMAP.md Phase 10 scope notes). Run it yourself once
 * you have an environment to point at:
 *
 *   npm run build && npm start &          # or docker compose up
 *   BASE_URL=http://localhost:5000 ACCESS_TOKEN=<a real student JWT> \
 *     node scripts/load-test.js
 */
const autocannon = require('autocannon');

const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
const accessToken = process.env.ACCESS_TOKEN;

if (!accessToken) {
  // eslint-disable-next-line no-console
  console.error('Set ACCESS_TOKEN to a valid student JWT before running this script.');
  process.exit(1);
}

const authHeaders = { authorization: `Bearer ${accessToken}` };

const scenarios = [
  {
    title: 'GET /api/v1/health (readiness probe - baseline)',
    url: `${baseUrl}/api/v1/health`,
  },
  {
    title: 'GET /api/v1/courses (published course list, public)',
    url: `${baseUrl}/api/v1/courses`,
  },
  {
    title: 'GET /api/v1/doubts/me (student, authenticated read)',
    url: `${baseUrl}/api/v1/doubts/me`,
    headers: authHeaders,
  },
];

async function run() {
  for (const scenario of scenarios) {
    // eslint-disable-next-line no-console
    console.log(`\n=== ${scenario.title} ===`);
    const result = await autocannon({
      url: scenario.url,
      headers: scenario.headers,
      connections: 20,
      duration: 10,
    });
    // eslint-disable-next-line no-console
    console.log(autocannon.printResult(result));
  }
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
