import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./AdminLogin.css";

const ADMIN_ROLES = new Set(["staff", "admin"]);

const AdminLogin = ({ url, onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      const response = await axios.post(`${url}/api/user/login`, { email, password });
      if (!response.data?.success) {
        toast.error(response.data?.message || "Login failed");
        return;
      }

      const token = response.data.token;
      const user = response.data.user || {};
      const normalizedRole = String(user.role || "").trim().toLowerCase();
      if (!token || !ADMIN_ROLES.has(normalizedRole)) {
        toast.error(
          normalizedRole
            ? `Role "${normalizedRole}" is not allowed to access admin panel`
            : "You are not allowed to access admin panel"
        );
        return;
      }

      onLoginSuccess(token, { ...user, role: normalizedRole });
      toast.success("Login successful");
    } catch {
      toast.error("Unable to login");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-shell">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <h2>Admin Login</h2>
        <p>Sign in with staff/admin account to continue.</p>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
