const mongoose = require("mongoose");

const connectDB = async () => {
  if (process.env.NODE_ENV === "test") return;
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set");
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
