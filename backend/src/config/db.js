import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: process.env.MONGO_DB_NAME || "han_store",
    });

    // eslint-disable-next-line no-console
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("MongoDB connection error:", error);
    throw error;
  }
};


