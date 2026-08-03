/**
 * Starts a standalone in-memory MongoDB for local development (no Docker/
 * real MongoDB required). Prints the URI to use as MONGO_URI, then stays
 * running until killed. Not used by the test suite (which starts its own
 * instance per Jest run) or in production - dev convenience only.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

async function run() {
  const mongod = await MongoMemoryServer.create({ instance: { port: 27117 } });
  console.log('Dev MongoDB running at:', mongod.getUri());
  process.on('SIGINT', async () => {
    await mongod.stop();
    process.exit(0);
  });
}

run();
