import React, { useState } from "react";
import { api } from "../lib/axios";
import Card from "../components/Card";
import Button from "../components/Button";

export default function Employees() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.post("/api/admin/employees", { name, email });
      setSuccess("Employee created. They will receive an OTP to set their password.");
      setName("");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Create employee</h1>
      <Card style={{ maxWidth: 400 }}>
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: 12, marginBottom: 16, background: "var(--danger-bg)", color: "var(--danger)", borderRadius: 6 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: 12, marginBottom: 16, background: "var(--success-bg)", color: "var(--success)", borderRadius: 6 }}>
              {success}
            </div>
          )}
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: "100%", padding: "10px 12px", marginBottom: 16, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-secondary)", color: "var(--text-primary)" }}
          />
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "10px 12px", marginBottom: 24, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-secondary)", color: "var(--text-primary)" }}
          />
          <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create employee"}</Button>
        </form>
      </Card>
    </div>
  );
}
