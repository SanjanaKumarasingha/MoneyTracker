import React from "react";
import "./RecentTransactions.css";

const RecentTransactions = () => {
  const transactions = [
    { id: 1, name: "Groceries", amount: "-$50.00", date: "2024-10-05" },
    { id: 2, name: "Salary", amount: "+$2000.00", date: "2024-10-01" },
    { id: 3, name: "Rent", amount: "-$800.00", date: "2024-09-28" },
  ];

  return (
    <div className="recent-transactions">
      <h2>Recent Transactions</h2>
      <ul>
        {transactions.map((transaction) => (
          <li
            key={transaction.id}
            className={
              transaction.amount.startsWith("-") ? "expense" : "income"
            }
          >
            <span>{transaction.name}</span>
            <span>{transaction.amount}</span>
            <span>{transaction.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentTransactions;
