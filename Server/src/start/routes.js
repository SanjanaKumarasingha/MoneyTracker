// const RegisterRouter = require("../routes/register.routes");
// const AuthRouter = require("../routes/auth.routes");
const IncomeRouter = require("../routes/income.routes");
const ExpenseRouter = require("../routes/expense.routes");

module.exports = (app) => {
  //   app.use("/api/v1/register", RegisterRouter);
  //   app.use("/api/v1/auth", AuthRouter);
  app.use("/api/v1/income", IncomeRouter);
  app.use("/api/v1/expense", ExpenseRouter);
};
