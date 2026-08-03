const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.NODE_ENV = 'test';
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-do-not-use-in-production';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-do-not-use-in-production';
  global.__MONGOD__ = mongod;
};
