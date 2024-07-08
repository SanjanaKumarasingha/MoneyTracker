import React, { useState } from "react";
import "./IEForm.css"; // Import the CSS file
import Toggle from "../IEToggle/Toggle";

function IEForm() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div>
      <Toggle isExpense={isExpense} toggleExpenseIncome={toggleExpenseIncome} />
      <div className="input-control">
        <input
          value={amount}
          type="text"
          name={"amount"}
          placeholder={"Amount"}
          onChange={(e) => setAmount(e.target.value)} // Update state on input change
        />
      </div>
      <div className="selects input-control">
        <select
          required
          value={category}
          name="category"
          id="category"
          onChange={(e) => setCategory(e.target.value)} // Update state on select change
        >
          <option value="" disabled>
            Select Option
          </option>
          <option value="salary">Salary</option>
          <option value="freelancing">Freelancing</option>
          <option value="investments">Investments</option>
          <option value="stocks">Stocks</option>
          <option value="bitcoin">Bitcoin</option>
          <option value="bank">Bank Transfer</option>
          <option value="youtube">Youtube</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="input-control">
        <textarea
          name="description"
          value={description}
          placeholder="Add A Reference"
          id="description"
          cols="30"
          rows="4"
          onChange={(e) => setDescription(e.target.value)} // Update state on textarea change
        ></textarea>
      </div>
      <div className="submit-btn">
        <button>Add {isExpense ? "Expense" : "Income"}</button>
      </div>
    </div>
  );
}

export default IEForm;
