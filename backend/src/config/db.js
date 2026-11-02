import mongoose from 'mongoose';

// Simple connection helper – uses provided MONGO_URI or falls back to a local MongoDB instance.
// No external in‑memory server is required, keeping the backend free of extra dependencies.
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/veloop';
    const conn = await mongoose.connect(mongoURI);
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
