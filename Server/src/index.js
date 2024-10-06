const express = require("express");
const cors = require("cors");
const { db } = require("./db/db");
const { readdirSync } = require("fs");
const app = express();
const morgan = require("morgan");
const routes = readdirSync("./src/routes");

require("dotenv").config();

const PORT = process.env.PORT;

//middlewares
app.use(express.json());
app.use(cors());
console.log(routes);

//routes
readdirSync("./src/routes/").map((route) =>
  // app.use("/api/v1", require("./src/routes/" + route))
  console.log(route)
);
console.log("2222");

if (app.get("env") === "development") {
  app.use(morgan("tiny"));
  console.log("Morgan enabled");
} else if (app.get("env") === "production") {
  console.log("Production mode");
}

const server = () => {
  db();
  app.listen(PORT, () => {
    console.log("listening to port:", PORT);
  });
};

server();
