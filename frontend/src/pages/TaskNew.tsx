import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/axios";
import type { Project, Task } from "../types";
import Card from "../components/Card";
import Button from "../components/Button";

export default function TaskNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get("projectId") ?? "";
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(preselectedProjectId);
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [deadline, setDeadline] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<Project[]>("/api/projects/").then((res) => setProjects(res.data)).catch(() => setError("Failed to load projects"));
  }, []);

  useEffect(() => {
    if (preselectedProjectId && projects.length) setProjectId(preselectedProjectId);
  }, [preselectedProjectId, projects]);

  const project = projects.find((p) => p.id === projectId);
  const memberOptions = project?.members ?? [];

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data: task } = await api.post<Task>("/api/tasks/", {
        title,
        description: description || undefined,
        projectId,
        priority,
        deadline: deadline || undefined,
        assigneeIds,
      });
      navigate(`/tasks/${task.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  if (error && !projects.length) return <p style={{ color: "var(--danger)" }}>{error}</p>;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>New task</h1>
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
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Project *</label>
          <select
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setAssigneeIds([]);
            }}
            required
            style={{ width: "100%", padding: "10px 12px", marginBottom: 16, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-secondary)", color: "var(--text-primary)" }}
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
            style={{ width: "100%", padding: "10px 12px", marginBottom: 16, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-secondary)", color: "var(--text-primary)" }}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Deadline</label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", marginBottom: 16, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-secondary)", color: "var(--text-primary)" }}
          />
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Assignees</label>
          <div style={{ marginBottom: 24, maxHeight: 160, overflow: "auto", border: "1px solid var(--border)", borderRadius: 6, padding: 8 }}>
            {memberOptions.length === 0 ? (
              <p style={{ color: "var(--text-muted)", margin: 0 }}>Select a project to choose assignees.</p>
            ) : (
              memberOptions
                .filter((m) => m.user?.id)
                .map((m) => (
                  <label key={m.user!.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                    <input
                      type="checkbox"
                      checked={assigneeIds.includes(m.user!.id)}
                      onChange={() => toggleAssignee(m.user!.id)}
                    />
                    <span>{m.user!.name}</span>
                  </label>
                ))
            )}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create task"}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/tasks")}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
