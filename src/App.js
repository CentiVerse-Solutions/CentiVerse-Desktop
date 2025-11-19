// In src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import LandingPage from "./pages/LandingPage/LandingPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import Friends from "./pages/Friends/Friends";
import Activity from "./pages/Activity/Activity";
import Account from "./pages/Account/Account";
import AuthProvider from "./context/AuthContext";
import GroupDetails from "./pages/GroupDetails/GroupDetails";
import MainLayout from "./components/layout/MainLayout/MainLayout";

// Mock authentication status - in a real app, this would come from your auth context
const isAuthenticated = true; // Set to true for testing

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing page route outside the main layout */}
          <Route path="/" element={<LandingPage />} />

          {/* All protected pages inside the main layout */}
          <Route path="/" element={<MainLayout />}>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/friends"
              element={
                <ProtectedRoute>
                  <Friends />
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity"
              element={
                <ProtectedRoute>
                  <Activity />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:groupId"
              element={
                <ProtectedRoute>
                  <GroupDetails />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
