// db/mongoose.js
const mongoose = require("mongoose");
const dbConfig = require("../config/db.config");

mongoose
  .connect(dbConfig.mongodb.URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connectedy.");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

const LogSchema = new mongoose.Schema({
  message: String,
  level: String,
  timestamp: { type: Date, default: Date.now },
});

const Log = mongoose.model("Log", LogSchema);

module.exports = Log;
