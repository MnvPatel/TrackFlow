import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/axios";
import type { Project, Issue } from "../types";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";

export default function Issues() {
  const { role } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Project[]>("/api/projects")
      .then((res) => {
        const list = res.data;
        setProjects(list);
        setSelectedProjectId(list[0]?.id ?? "");
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [role]);

  useEffect(() => {
    if (!selectedProjectId) {
      setIssues([]);
      return;
    }
    api.get<Issue[]>(`/api/issues/projects/${selectedProjectId}/issues`)
      .then((res) => setIssues(res.data))
      .catch(() => setIssues([]));
  }, [selectedProjectId]);

  if (loading) return <p>Loading…</p>;
  if (err) return <p style={{ color: "var(--danger)" }}>{err}</p>;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Issues</h1>
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <label>Project</label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
        >
          <option value="">Select project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
        {role === "CLIENT" && (
          <Link to={selectedProjectId ? `/issues/new?projectId=${selectedProjectId}` : "#"}>
            <button type="button" style={{ padding: "8px 16px", borderRadius: 6, background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer" }}>
              New issue
            </button>
          </Link>
        )}
      </div>
      {selectedProjectId && issues.length === 0 && (
        <Card>No issues for this project.</Card>
      )}
      {selectedProjectId && issues.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {issues.map((i) => (
            <Link key={i.id} to={`/issues/${i.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Card style={{ cursor: "pointer" }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{i.title}</div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>{i.status}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
