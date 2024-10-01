import { useState, useEffect } from "react";
import axios from "../api/axios";

function users() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await axios.get("/users");
      setUsers(response.data);
    };
    fetchUsers();
  }, []);

  return (
    <>
      <artical>
        <h2>Users</h2>
        <p>
          {users?.map((user) => (
            <div key={user?.id}>
              <h3>{user?.name}</h3>
              <p>{user?.email}</p>
            </div>
          ))}
        </p>
      </artical>
    </>
  );
}

export default users;
