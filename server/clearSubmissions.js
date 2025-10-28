const mongoose = require('mongoose');
const Assignment = require('./src/models/Assignment');
require('dotenv').config();

async function clearSubmissions() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/certifyhub');
    console.log('Connected to MongoDB');

    const result = await Assignment.updateMany({}, { $set: { submissions: [] } });
    console.log(`Cleared submissions from ${result.modifiedCount} assignments`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Error:', err);
  }
}

clearSubmissions();
