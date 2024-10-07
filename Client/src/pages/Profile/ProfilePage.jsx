import React, { useState } from "react";
import "./ProfilePage.css";

const ProfilePage = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const user = {
    name: "John Doe",
    role: "Money Mapper User",
    bio: "A passionate money manager and entrepreneur.",
    company: "FinanceHub Inc.",
    phone: "+1 234 567 890",
    email: "john.doe@example.com",
    address: "123 Finance St, Business City, USA",
    profileImage:
      "https://firebasestorage.googleapis.com/v0/b/theatre-reservation-syst-64103.appspot.com/o/images%2Fsanjana1.jpg?alt=media&token=4d0b73d4-a895-44d7-9b32-e2d184576284", // Dummy profile picture
    coverPhoto:
      "https://firebasestorage.googleapis.com/v0/b/theatre-reservation-syst-64103.appspot.com/o/images%2FTheatre_ReservationMovie.PNG?alt=media&token=f3d4e2c0-e5c3-4f11-89eb-7ba65a91f1f1", // Dummy cover photo
    accountDetails: {
      totalIncome: "$12,000",
      expenses: "$5,000",
      pendingTransactions: "$500",
    },
  };

  return (
    <div className={`profile-page ${isDarkMode ? "dark-mode" : ""}`}>
      <button className="toggle-dark-mode" onClick={toggleDarkMode}>
        {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      </button>

      <div className="cover-photo">
        <img src={user.coverPhoto} alt="Cover" />
      </div>

      <div className="profile-header">
        <img className="profile-image" src={user.profileImage} alt="Profile" />
        <div className="profile-name-role">
          <h1>{user.name}</h1>
          <p>{user.role}</p>
          <small>{user.bio}</small>
        </div>
      </div>

      <div className="profile-details">
        <div className="profile-section">
          <h2>Contact Information</h2>
          <p>
            <strong>Company:</strong> {user.company}
          </p>
          <p>
            <strong>Phone:</strong> {user.phone}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Address:</strong> {user.address}
          </p>
        </div>

        <div className="profile-section">
          <h2>Account Overview</h2>
          <div className="account-details">
            <div>
              <p>
                <strong>Total Income:</strong>
              </p>
              <h3>{user.accountDetails.totalIncome}</h3>
            </div>
            <div>
              <p>
                <strong>Expenses:</strong>
              </p>
              <h3>{user.accountDetails.expenses}</h3>
            </div>
            <div>
              <p>
                <strong>Pending Transactions:</strong>
              </p>
              <h3>{user.accountDetails.pendingTransactions}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
