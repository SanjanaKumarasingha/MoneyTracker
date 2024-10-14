const express = require("express");
const router = express.Router();

const {
  addIncome,
  getIncomes,
  deleteIncome,
} = require("../controllers/income");

router.post("/add-income", addIncome);
router.get("/get-incomes", getIncomes);
router.delete("/delete-income/:id", deleteIncome);

module.exports = router;
