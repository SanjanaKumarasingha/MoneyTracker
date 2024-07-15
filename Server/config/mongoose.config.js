const mongoose = require("mongoose");
const dbConfig = require("./db.config");

const connectDB = async () => {
  try {
    await mongoose.connect(dbConfig.mongodb.URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
