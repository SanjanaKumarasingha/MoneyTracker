import React, { useState } from "react"; // Add useState import
import "./Toggle.css";

function Toggle({ isExpense, toggleExpenseIncome }) {
  // Receive props
  return (
    <div>
      <div className="i-e-toggle" onClick={toggleExpenseIncome}>
        <div className={`expense ${isExpense ? "active" : ""}`}>Expense</div>
        <div className={`income ${!isExpense ? "active" : ""}`}>Income</div>
        <div
          className="slider"
          style={{
            transform: isExpense ? "translateX(0)" : "translateX(100px)",
          }}
        ></div>
      </div>
    </div>
  );
}

export default Toggle;
