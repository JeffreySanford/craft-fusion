const { MongoMemoryServer } = require('mongodb-memory-server');

async function test() {
  console.log('Attempting to start MongoMemoryServer...');
  try {
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    console.log('SUCCESS! MongoMemoryServer started at:', uri);
    await mongoServer.stop();
    console.log('Stopped successfully.');
  } catch (err) {
    console.error('FAILED to start MongoMemoryServer:');
    console.error(err);
  }
}

test();
