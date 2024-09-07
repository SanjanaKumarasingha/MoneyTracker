import React from "react";
import { useGlobalContext } from "../context/globalContext";
import "./History.css"; // Import the CSS file

function History() {
  const { transactionHistory } = useGlobalContext(); // Access the transaction history

  const [...history] = transactionHistory(); // Spread the transactions into an array

  return (
    <div className="history-container">
      {" "}
      {/* Use className for styling */}
      <h2>Recent History</h2>
      {history.map((item) => {
        const { _id, title, amount, type } = item; // Destructure transaction details
        return (
          <div key={_id} className="history-item">
            <p className={type === "expense" ? "expense-item" : "income-item"}>
              {title}
            </p>

            <p className={type === "expense" ? "expense-item" : "income-item"}>
              {type === "expense"
                ? `-${amount <= 0 ? 0 : amount}` // Ensure amount is non-negative
                : `+${amount <= 0 ? 0 : amount}`}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default History;
