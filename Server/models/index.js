const Sequelize = require("sequelize");
const sequelize = require("../config/sequelize.config");

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Models
db.user = require("./user.model")(sequelize, Sequelize);
db.transaction = require("./transaction.model")(sequelize, Sequelize);
db.category = require("./category.model")(sequelize, Sequelize);

module.exports = db;
