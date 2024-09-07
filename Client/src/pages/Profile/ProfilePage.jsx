// src/pages/ProfilePage.js
import React from "react";
import "./ProfilePage.css";

const ProfilePage = () => {
  // In a real app, user data would likely come from a server or context
  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    bio: "A passionate money manager and entrepreneur.",
  };

  return (
    <div className="profile-page">
      <h1>Profile</h1>
      <div className="profile-info">
        <p>
          <strong>Name:</strong> {user.name}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Bio:</strong> {user.bio}
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;
