// src/context/AuthContext.js
import React, { useState, createContext } from "react";

// Create the context with default values
export const AuthContext = createContext({
  user: null,
  updateUserProfile: () => {},
  logout: () => {},
});

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: "Test User",
    email: "test@example.com",
    phone: "+91 9876543210",
    upiId: "testuser@upi",
    profilePic: null,
    currency: "INR",
    language: "English",
    darkMode: false,
    notifications: {
      groupAdd: true,
      friendAdd: true,
      expenseAdd: false,
      expenseEdit: false,
      expenseComment: false,
      expenseDue: true,
      paymentReceived: true,
      monthlySummary: true,
      newsUpdates: true,
    },
  });

  const updateUserProfile = (userData) => {
    console.log("Updating user profile:", userData);
    setUser(userData);
  };

  const logout = () => {
    console.log("Logging out user");
    // In a real app, this would clear auth token, redirect, etc.
  };

  return (
    <AuthContext.Provider value={{ user, updateUserProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
