import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/axios";
import type { Issue, Project, Task } from "../types";
import Card from "../components/Card";
import Button from "../components/Button";

export default function IssueConvertToTask() {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [deadline, setDeadline] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!issueId) return;
    api
      .get<Issue>(`/api/issues/${issueId}`)
      .then(async (res) => {
        const iss = res.data;
        setIssue(iss);
        try {
          const projRes = await api.get<Project>(`/api/projects/${iss.projectId}`);
          setProject(projRes.data);
        } catch {
          // ignore project load error, will just hide assignees
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load issue"));
  }, [issueId]);

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueId) return;
    setError("");
    setLoading(true);
    try {
      const { data } = await api.patch<{ task: Task }>(`/api/issues/${issueId}/convert`, {
        priority,
        deadline: deadline || undefined,
        assigneeIds,
      });
      navigate(`/tasks/${data.task.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setLoading(false);
    }
  };

  if (!issue) {
    return <p>Loading…</p>;
  }

  const memberOptions = project?.members ?? [];

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>Convert issue to task</h1>
      <p style={{ marginTop: 0, marginBottom: 24, color: "var(--text-secondary)", fontSize: 14 }}>
        We will create a new task from this issue. Adjust priority, deadline, and assignees below.
      </p>

      <Card style={{ maxWidth: 720, marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: "1.1rem" }}>{issue.title}</h2>
        <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--text-muted)" }}>
          Project ID: {issue.projectId}
        </p>
        <div
          style={{
            marginTop: 8,
            whiteSpace: "pre-wrap",
            color: "var(--text-secondary)",
            fontSize: 14,
          }}
        >
          {issue.description}
        </div>
      </Card>

      <Card style={{ maxWidth: 560 }}>
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
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
            style={{
              width: "100%",
              padding: "10px 12px",
              marginBottom: 16,
              border: "1px solid var(--border)",
              borderRadius: 6,
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
            }}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
            Deadline
          </label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
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
            Assignees
          </label>
          <div
            style={{
              marginBottom: 24,
              maxHeight: 160,
              overflow: "auto",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 8,
            }}
          >
            {memberOptions.length === 0 ? (
              <p style={{ color: "var(--text-muted)", margin: 0 }}>
                Project members are not available or could not be loaded.
              </p>
            ) : (
              memberOptions
                .filter((m) => m.user?.id)
                .map((m) => (
                  <label
                    key={m.user!.id}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}
                  >
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
            <Button type="submit" disabled={loading}>
              {loading ? "Converting…" : "Create task from issue"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/issues/${issue.id}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

