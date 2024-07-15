// const express = require("express");

// const app = express();

// require("dotenv").config();

// const PORT = process.env.PORT;

// //middlewares
// app.use(express.json())

// const server = () => {
//   console.log("You are listning to port:", PORT);
// };

// server();

// app.js
const express = require("express");
const bodyParser = require("body-parser");
const { sequelize, User, Transaction } = require("./db/Sequelize");
const Log = require("./db/mongoose");

const app = express();
app.use(bodyParser.json());

// User routes
app.post("/users", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Transaction routes
app.post("/transactions", async (req, res) => {
  try {
    const transaction = await Transaction.create(req.body);
    res.status(201).json(transaction);

    // Log the transaction in MongoDB
    const log = new Log({
      message: `Transaction created: ${transaction.id}`,
      level: "info",
    });
    await log.save();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.findAll();
    res.json(transactions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Logs route
app.get("/logs", async (req, res) => {
  try {
    const logs = await Log.find();
    res.json(logs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
