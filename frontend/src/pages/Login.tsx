import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Button from "../components/Button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post<{ accessToken: string; role: string }>("/api/auth/login", { email, password });
      setAuth(data.accessToken, data.role as "ADMIN" | "EMPLOYEE" | "CLIENT");
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Card style={{ width: "100%", maxWidth: 400 }}>
        <h1 style={{ margin: "0 0 24px", fontSize: "1.5rem" }}>Sign in</h1>
        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                padding: 12,
                marginBottom: 16,
                background: "var(--danger-bg)",
                color: "var(--danger)",
                borderRadius: 6,
              }}
            >
              {error}
            </div>
          )}
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px 12px",
              marginBottom: 16,
              border: "1px solid var(--border)",
              borderRadius: 6,
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
            }}
          />
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px 12px",
              marginBottom: 24,
              border: "1px solid var(--border)",
              borderRadius: 6,
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
            }}
          />
          <Button type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p style={{ marginTop: 16, color: "var(--text-muted)", fontSize: 14 }}>
          Use admin/employee/client credentials from your backend seed.
        </p>
        <p style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 13 }}>
          Run the backend first: <code style={{ background: "var(--bg-tertiary)", padding: "2px 6px", borderRadius: 4 }}>cd backend && npm run dev</code>
        </p>
      </Card>
    </div>
  );
}
