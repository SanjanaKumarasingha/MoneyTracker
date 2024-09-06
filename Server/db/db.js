const mongoose = require("mongoose");

const db = async () => {
  try {
    mongoose.set("strictQuery", false); // to avoid deprecation warning for findAndModify
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Db Connected");
  } catch (error) {
    console.log("DB Connection Error", error);
  }
};

module.exports = { db };
