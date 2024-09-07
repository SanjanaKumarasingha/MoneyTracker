/* src/components/dashboard/RecentTransactions.js */

import React from "react";
import "./RecentTransactions.css";

const transactions = [
  {
    id: 1,
    date: "2023-09-01",
    description: "Grocery Shopping",
    amount: "-$120.00",
  },

  {
    id: 2,
    date: "2023-09-02",
    description: "Salary",
    amount: "+$2000.00",
  },

  {
    id: 3,
    date: "2023-09-03",
    description: "Gym Membership",
    amount: "-$50.00",
  },
];

const RecentTransactions = () => {
  return (
    <div className="recent-transactions">
      {" "}
      <h3>Recent Transactions</h3>{" "}
      <ul>
        {" "}
        {transactions.map((transaction) => (
          <li key={transaction.id}>
            {" "}
            <span> {transaction.date}</span>{" "}
            <span> {transaction.description}</span>{" "}
            <span> {transaction.amount}</span>{" "}
          </li>
        ))}
      </ul>{" "}
    </div>
  );
};

export default RecentTransactions;
