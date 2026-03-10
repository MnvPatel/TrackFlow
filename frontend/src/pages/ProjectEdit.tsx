import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/axios";
import type { Project } from "../types";
import Card from "../components/Card";
import Button from "../components/Button";

export default function ProjectEdit() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    api.get<Project>(`/api/projects/${projectId}`)
      .then((res) => {
        const p = res.data;
        setProject(p);
        setTitle(p.title);
        setDescription(p.description ?? "");
        setStatus(p.status);
        setStartDate(p.startDate ? p.startDate.slice(0, 10) : "");
        setEndDate(p.endDate ? p.endDate.slice(0, 10) : "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setError("");
    setLoading(true);
    try {
      await api.patch(`/api/projects/${projectId}`, {
        title,
        description: description || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      navigate(`/projects/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  if (error && !project) return <p style={{ color: "var(--danger)" }}>{error}</p>;
  if (!project) return <p>Loading…</p>;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Edit project</h1>
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
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ width: "100%", padding: "10px 12px", marginBottom: 16, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-secondary)", color: "var(--text-primary)" }}
          />
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", marginBottom: 16, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-secondary)", color: "var(--text-primary)" }}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="ON_HOLD">ON_HOLD</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", marginBottom: 16, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-secondary)", color: "var(--text-primary)" }}
          />
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>End date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", marginBottom: 24, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-secondary)", color: "var(--text-primary)" }}
          />
          <div style={{ display: "flex", gap: 12 }}>
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate(`/projects/${projectId}`)}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
