const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true, // removes white spaces
      maxLength: 50,
    },
    amount: {
      type: Number,
      required: true,
      maxLength: 20,
    },
    type: {
      type: String,
      default: "expense",
    },
    date: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      maxLength: 512,
      trim: true,
    },
  },
  { timestamps: true }  // adds createdAt and updatedAt fields
);

module.exports = mongoose.model("Expense", ExpenseSchema);
