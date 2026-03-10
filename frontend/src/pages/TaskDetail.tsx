import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../lib/axios";
import type { Task, WorkSubmission, Comment } from "../types";
import Card from "../components/Card";
import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";

const statusColors: Record<string, string> = {
  PENDING: "var(--text-muted)",
  IN_PROGRESS: "var(--accent)",
  SUBMITTED: "var(--warning)",
  APPROVED: "var(--success)",
  REJECTED: "var(--danger)",
};

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const { role } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<WorkSubmission[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [err, setErr] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [subPercent, setSubPercent] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (!taskId) return;
    api.get<Task>(`/api/tasks/${taskId}`).then((res) => setTask(res.data)).catch((e) => setErr(e instanceof Error ? e.message : "Failed"));
    api.get<WorkSubmission[]>(`/api/submission/tasks/${taskId}/submissions`).then((res) => setSubmissions(res.data)).catch(() => {});
    api.get<Comment[]>(`/api/comment/tasks/${taskId}/comments`).then((res) => setComments(res.data)).catch(() => {});
  };

  useEffect(() => {
    load();
  }, [taskId]);

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId) return;
    setLoading(true);
    try {
      await api.post(`/api/submission/tasks/${taskId}/submit`, { description: subDesc, percentReported: subPercent });
      setSubDesc("");
      setSubPercent(0);
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (subId: string) => {
    try {
      await api.patch(`/api/submission/${subId}/approve`);
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleReject = async (subId: string) => {
    try {
      await api.patch(`/api/submission/${subId}/reject`);
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || !commentText.trim()) return;
    try {
      await api.post(`/api/comment/tasks/${taskId}/comments`, { text: commentText.trim() });
      setCommentText("");
      api.get<Comment[]>(`/api/comment/tasks/${taskId}/comments`).then((res) => setComments(res.data));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!taskId) return;
    try {
      await api.patch(`/api/tasks/${taskId}/status`, { status });
      api.get<Task>(`/api/tasks/${taskId}`).then((res) => setTask(res.data));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleDelete = async () => {
    if (!taskId || !window.confirm("Delete this task?")) return;
    setLoading(true);
    try {
      await api.delete(`/api/tasks/${taskId}`);
      navigate("/tasks");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  if (err && !task) return <p style={{ color: "var(--danger)" }}>{err}</p>;
  if (!task) return <p>Loading…</p>;

  const canSubmit = role === "EMPLOYEE" && task.status !== "APPROVED" && task.status !== "REJECTED";
  const canApproveReject = role === "ADMIN";

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link to="/tasks" style={{ color: "var(--text-secondary)" }}>← Tasks</Link>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: "0 0 8px" }}>{task.title}</h1>
          <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            {task.project?.title && <Link to={`/projects/${task.projectId}`}>{task.project.title}</Link>}
            {" · "}{task.priority} · <span style={{ color: statusColors[task.status] }}>{task.status}</span>
          </div>
        </div>
        {role === "ADMIN" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            >
              <option value="PENDING">PENDING</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
            <Button variant="danger" onClick={handleDelete} disabled={loading}>Delete</Button>
          </div>
        )}
      </div>
      {task.description && (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{task.description}</div>
        </Card>
      )}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 12px" }}>Assignees</h3>
        <ul style={{ margin: 0, paddingLeft: 20, color: "var(--text-secondary)" }}>
          {task.assignments?.map((a) => (
            <li key={a.id}>{a.user?.name ?? a.userId}</li>
          ))}
          {(!task.assignments || task.assignments.length === 0) && <li>None</li>}
        </ul>
      </Card>
      {canSubmit && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 12px" }}>Submit work</h3>
          <form onSubmit={handleSubmitWork}>
            <input
              placeholder="Description"
              value={subDesc}
              onChange={(e) => setSubDesc(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 12px", marginBottom: 8, border: "1px solid var(--border)", borderRadius: 6 }}
            />
            <input
              type="number"
              min={0}
              max={100}
              value={subPercent || ""}
              onChange={(e) => setSubPercent(Number(e.target.value))}
              placeholder="Percent"
              style={{ width: "100%", padding: "10px 12px", marginBottom: 12, border: "1px solid var(--border)", borderRadius: 6 }}
            />
            <Button type="submit" disabled={loading}>{loading ? "Submitting…" : "Submit"}</Button>
          </form>
        </Card>
      )}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 12px" }}>Submissions</h3>
        {submissions.length === 0 ? (
          <p style={{ color: "var(--text-muted)", margin: 0 }}>No submissions yet.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {submissions.map((s) => (
              <li key={s.id} style={{ marginBottom: 8 }}>
                {s.description} — {s.percentReported}% · {s.status} · by {s.submittedBy?.name ?? "—"}
                {canApproveReject && s.status === "SUBMITTED" && (
                  <span style={{ marginLeft: 8 }}>
                    <Button variant="ghost" style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => handleApprove(s.id)}>Approve</Button>
                    <Button variant="danger" style={{ padding: "2px 8px", fontSize: 12, marginLeft: 4 }} onClick={() => handleReject(s.id)}>Reject</Button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <h3 style={{ margin: "0 0 12px" }}>Comments</h3>
        <form onSubmit={handleAddComment} style={{ marginBottom: 16 }}>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment"
            rows={2}
            style={{ width: "100%", padding: "10px 12px", marginBottom: 8, border: "1px solid var(--border)", borderRadius: 6 }}
          />
          <Button type="submit">Post</Button>
        </form>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {comments.map((c) => (
            <li key={c.id} style={{ marginBottom: 8 }}>
              <strong>{c.author?.name ?? "—"}</strong>: {c.text}
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(c.createdAt).toLocaleString()}</div>
            </li>
          ))}
          {comments.length === 0 && <li style={{ color: "var(--text-muted)" }}>No comments yet.</li>}
        </ul>
      </Card>
    </div>
  );
}
