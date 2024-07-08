import React from "react";
import "./Toggle.css";

function Toggle() {
  const [isExpense, setIsExpense] = useState(true);

  const toggleExpenseIncome = () => {
    setIsExpense(!isExpense);
  };

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
