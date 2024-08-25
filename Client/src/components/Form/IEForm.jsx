import React, { useState } from "react";
import "./IEForm.css"; // Import the CSS file
import Toggle from "../IEToggle/Toggle";
import { useGlobalContext } from "../../context/globalContext";
import DatePicker from "react-datepicker";

function IEForm() {
  const [isExpense, setIsExpense] = useState(true); // State to manage expense or income
  const { addIncome, getIncomes, error, setError } = useGlobalContext();
  const [inputState, setInputState] = useState({
    title: "",
    amount: "",
    date: "",
    category: "",
    description: "",
  });

  const { title, amount, date, category, description } = inputState;

  const handleInput = (name) => (e) => {
    setInputState({ ...inputState, [name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addIncome(inputState);
    setInputState({
      title: "",
      amount: "",
      date: "",
      category: "",
      description: "",
    });
  };

  const toggleExpenseIncome = () => {
    setIsExpense(!isExpense); // Toggle between expense and income
  };

  return (
    <div className="form-container">
      {error && <p className="error">{error}</p>}
      <Toggle isExpense={isExpense} toggleExpenseIncome={toggleExpenseIncome} />
      <div className="input-control">
        <input
          type="text"
          value={title}
          name="title"
          placeholder="Title"
          onChange={handleInput("title")} // Update state on input change
        />
      </div>
      <div className="input-control">
        <input
          type="text"
          value={amount}
          name="amount"
          placeholder="Amount"
          onChange={handleInput("amount")}
        />
      </div>
      <div className="selects input-control">
        <select
          required
          value={category}
          name="category"
          id="category"
          onChange={handleInput("category")}
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
          onChange={handleInput("description")}
        ></textarea>
      </div>
      <div className="input-control">
        <DatePicker
          id="date"
          placeholderText="Enter a Date"
          selected={date}
          dateFormat="dd/MM/yyyy"
          onChange={(date) => {
            setInputState({ ...inputState, date: date });
          }}
        />
      </div>
      <div className="submit-btn">
        <button>Add {isExpense ? "Expense" : "Income"}</button>
        onChange={handleSubmit()}
      </div>
    </div>
  );
}

export default IEForm;
