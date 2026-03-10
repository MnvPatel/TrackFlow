import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/axios";
import type { User, Project } from "../types";
import Card from "../components/Card";
import Button from "../components/Button";

export default function ProjectNew() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<User[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<User[]>("/api/admin/users?role=CLIENT"),
      api.get<User[]>("/api/admin/users?role=EMPLOYEE"),
    ])
      .then(([cRes, eRes]) => {
        const c = cRes.data;
        const e = eRes.data;
        setClients(c);
        setEmployees(e);
        if (c[0]) setClientId(c[0].id);
      })
      .catch(() => setError("Failed to load users"));
  }, []);

  const toggleMember = (id: string) => {
    setTeamMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post<{ project: Project }>("/api/projects", {
        title,
        description: description || undefined,
        clientId,
        teamMemberIds,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      const projectId = data.project?.id;
      if (projectId) navigate(`/projects/${projectId}`);
      else navigate("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  if (error && !title) return <p style={{ color: "var(--danger)" }}>{error}</p>;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>New project</h1>
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
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Client *</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            style={{ width: "100%", padding: "10px 12px", marginBottom: 16, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-secondary)", color: "var(--text-primary)" }}
          >
            <option value="">Select client</option>
            {clients.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Team members</label>
          <div style={{ marginBottom: 16, maxHeight: 160, overflow: "auto", border: "1px solid var(--border)", borderRadius: 6, padding: 8 }}>
            {employees.map((u) => (
              <label key={u.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                <input
                  type="checkbox"
                  checked={teamMemberIds.includes(u.id)}
                  onChange={() => toggleMember(u.id)}
                />
                <span>{u.name} ({u.email})</span>
              </label>
            ))}
          </div>
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
            <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create project"}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/projects")}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
