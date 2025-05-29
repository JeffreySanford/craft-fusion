// scripts/clear-inmemory-kanban.js
// Clears the kanbanboards collection in the in-memory MongoDB used by ForgeBoard

const mongoose = require('mongoose');

// Use the same URI as your in-memory MongoDB instance
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:54663/forgeboard';
const COLLECTION = 'kanbanboards';

async function clearCollection() {
  try {
    await mongoose.connect(MONGO_URI);
    const result = await mongoose.connection.db.collection(COLLECTION).deleteMany({});
    console.log(`Cleared ${result.deletedCount} documents from ${COLLECTION} (in-memory)`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error clearing collection:', err);
    process.exit(1);
  }
}

clearCollection();
