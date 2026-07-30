const mongoose = require('mongoose');

/**
 * Establishes a connection to MongoDB using Mongoose.
 * Exits the process on failure so the app never runs in a broken state.
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expense_tracker';

    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(uri, {});

    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB] Connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected');
    });
  } catch (error) {
    console.error(`[MongoDB] Failed to connect: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
