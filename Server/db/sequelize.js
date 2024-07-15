// db/sequelize.js
const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize("moneytracker", "root", "123456", {
  host: "localhost",
  dialect: "mysql",
});

// mysql is connected
sequelize
  .authenticate()
  .then(() => {
    console.log("MySQL Connection has been established successfully.");
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });

const User = sequelize.define("User", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const Transaction = sequelize.define("Transaction", {
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: "id",
    },
  },
});

sequelize.sync();

module.exports = { sequelize, User, Transaction };
