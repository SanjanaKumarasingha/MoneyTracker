import { link } from "react-router-dom";
import Users from "./users";

function Admin() {
  return (
    <>
      <h1>Admin</h1>
      <Users />

      <nav>
        <ul>
          <li>
            <link to="/admin/users">Users</link>
          </li>
          <li>
            <link to="/admin/transactions">Transactions</link>
          </li>
        </ul>
      </nav>
      <users />
    </>
  );
}

export default Admin;
