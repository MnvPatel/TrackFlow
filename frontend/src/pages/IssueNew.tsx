import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/axios";
import Card from "../components/Card";
import Button from "../components/Button";

export default function IssueNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setError("Project is required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post(`/api/issues/projects/${projectId}/issues`, { title, description });
      navigate(`/projects/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create issue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>New issue</h1>
      <Card style={{ maxWidth: 560 }}>
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: 12, marginBottom: 16, background: "var(--danger-bg)", color: "var(--danger)", borderRadius: 6 }}>
              {error}
            </div>
          )}
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: "100%", padding: "10px 12px", marginBottom: 16, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-secondary)", color: "var(--text-primary)" }}
          />
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            style={{ width: "100%", padding: "10px 12px", marginBottom: 24, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-secondary)", color: "var(--text-primary)" }}
          />
          <div style={{ display: "flex", gap: 12 }}>
            <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create issue"}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
