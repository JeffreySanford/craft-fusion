// scripts/clear-kanban-collection.js
// Clears the kanbanboards collection in the local MongoDB instance

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/forgeboard';
const COLLECTION = 'kanbanboards';

async function clearCollection() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const result = await mongoose.connection.db.collection(COLLECTION).deleteMany({});
    console.log(`Cleared ${result.deletedCount} documents from ${COLLECTION}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error clearing collection:', err);
    process.exit(1);
  }
}

clearCollection();
