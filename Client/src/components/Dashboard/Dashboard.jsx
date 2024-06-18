import "./Dashboard.css";

function Dashboard() {
  const dollar = "Rs";
  const totalIncome = 1000;
  const totalExpenses = 26;
  const totalBalance = totalIncome - totalExpenses;

  return (
    <div>
      <h1>All Transactions</h1>{" "}
      <div className="amount-con">
        <div className="income">
          <h2>Total Income</h2>
          <p>
            {dollar} {totalIncome}
          </p>
        </div>
        <div className="expense">
          <h2>Total Expense</h2>
          <p>
            {dollar} {totalExpenses}
          </p>
        </div>
        <div className="balance">
          <h2>Total Balance</h2>
          <p>
            {dollar} {totalBalance}
          </p>
        </div>
      </div>
      <div className="summary">spending summary</div>
    </div>
  );
}

export default Dashboard;
