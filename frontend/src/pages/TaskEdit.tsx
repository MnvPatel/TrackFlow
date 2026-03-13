import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/axios";
import type { Project, Task } from "../types";
import Card from "../components/Card";
import Button from "../components/Button";

export default function TaskEdit() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [deadline, setDeadline] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    api
      .get<Task>(`/api/tasks/${taskId}`)
      .then(async (res) => {
        const t = res.data;
        setTask(t);
        setTitle(t.title);
        setDescription(t.description ?? "");
        setPriority(t.priority);
        setDeadline(t.deadline ? t.deadline.slice(0, 16) : "");
        setAssigneeIds((t.assignments ?? []).map((a) => a.userId));
        if (t.projectId) {
          const projRes = await api.get<Project>(`/api/projects/${t.projectId}`);
          setProject(projRes.data);
        }
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load task")
      );
  }, [taskId]);

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId) return;
    setError("");
    setLoading(true);
    try {
      await api.patch(`/api/tasks/${taskId}`, {
        title,
        description: description || undefined,
        priority,
        deadline: deadline || undefined,
        assigneeIds,
      });
      navigate(`/tasks/${taskId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  if (error && !task) return <p style={{ color: "var(--danger)" }}>{error}</p>;
  if (!task) return <p>Loading…</p>;

  const memberOptions = project?.members ?? [];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Edit task</h1>
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
            Title *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
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
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")
            }
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
            Assignees (project team only)
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
                Project team members are not available.
              </p>
            ) : (
              memberOptions
                .filter((m) => m.user?.id)
                .map((m) => (
                  <label
                    key={m.user!.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "4px 0",
                    }}
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
              {loading ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/tasks/${taskId}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

