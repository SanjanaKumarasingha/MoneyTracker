const express = require("express");

const app = express();

require("dotenv").config();

const PORT = process.env.PORT;

//middlewares
app.use(express.json())

const server = () => {
  console.log("You are listning to port:", PORT);
};

server();
