const Sequelize = require("sequelize");
const dbConfig = require("./db.config");

const sequelize = new Sequelize(
  dbConfig.mysql.DB,
  dbConfig.mysql.USER,
  dbConfig.mysql.PASSWORD,
  {
    host: dbConfig.mysql.HOST,
    dialect: dbConfig.mysql.dialect,
  }
);

// mysql is connected
sequelize
  .authenticate()
  .then(() => {
    console.log("MySQL Connected");
  })
  .catch((error) => {
    console.error("MySQL connection error::", error);
  });

module.exports = sequelize;
