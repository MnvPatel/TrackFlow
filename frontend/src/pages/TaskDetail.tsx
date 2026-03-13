import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../lib/axios";
import type { Task, WorkSubmission, Comment } from "../types";
import Card from "../components/Card";
import Button from "../components/Button";
import CommentSection from "../components/CommentSection";
import { useAuth } from "../context/AuthContext";

const statusColors: Record<string, string> = {
  PENDING: "var(--text-muted)",
  IN_PROGRESS: "var(--accent)",
  SUBMITTED: "var(--warning)",
  APPROVED: "var(--success)",
  REJECTED: "var(--danger)",
};

type TabKey = "submissions" | "comments";

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
  const [subMediaFiles, setSubMediaFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [submissionActionId, setSubmissionActionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("submissions");

  const load = () => {
    if (!taskId) return Promise.resolve();
    return Promise.all([
      api.get<Task>(`/api/tasks/${taskId}`).then((res) => setTask(res.data)).catch((e) => setErr(e instanceof Error ? e.message : "Failed")),
      api.get<WorkSubmission[]>(`/api/submission/tasks/${taskId}/submissions`).then((res) => setSubmissions(res.data)).catch(() => {}),
      api.get<Comment[]>(`/api/comment/tasks/${taskId}/comments`).then((res) => setComments(res.data)).catch(() => {}),
    ]);
  };

  useEffect(() => {
    load();
  }, [taskId]);

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId) return;
    setLoading(true);
    setErr("");
    try {
      if (subMediaFiles.length > 0) {
        const form = new FormData();
        form.append("description", subDesc);
        form.append("percentReported", String(subPercent));
        subMediaFiles.forEach((file) => form.append("media", file));
        await api.post(`/api/submission/tasks/${taskId}/submit`, form);
      } else {
        await api.post(`/api/submission/tasks/${taskId}/submit`, {
          description: subDesc,
          percentReported: subPercent,
        });
      }
      setSubDesc("");
      setSubPercent(0);
      setSubMediaFiles([]);
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (subId: string) => {
    setSubmissionActionId(subId);
    setErr("");
    try {
      await api.patch(`/api/submission/${subId}/approve`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Approval failed");
    } finally {
      setSubmissionActionId(null);
    }
  };

  const handleReject = async (subId: string) => {
    setSubmissionActionId(subId);
    setErr("");
    try {
      await api.patch(`/api/submission/${subId}/reject`);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Rejection failed");
    } finally {
      setSubmissionActionId(null);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!taskId) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/api/tasks/${taskId}/status`, { status });
      api.get<Task>(`/api/tasks/${taskId}`).then((res) => setTask(res.data));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setUpdatingStatus(false);
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

  const formatDateTime = (value: string | null) =>
    value ? new Date(value).toLocaleString() : "—";

  const tabs: { key: TabKey; label: string }[] = [
    { key: "submissions", label: "Submissions" },
    { key: "comments", label: "Comments" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link to="/tasks" style={{ color: "var(--text-secondary)" }}>← Tasks</Link>
      </div>
      {/* Top layout: overview + actions */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "stretch" }}>
        <Card style={{ flex: 1 }}>
          <div style={{ marginBottom: 12 }}>
            <h1 style={{ margin: "0 0 8px" }}>{task.title}</h1>
            <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              {task.project?.title ? (
                <>
                  <Link to={`/projects/${task.projectId}`}>{task.project.title}</Link>
                  {" · "}
                </>
              ) : null}
              {task.priority} ·{" "}
              <span style={{ color: statusColors[task.status] }}>{task.status}</span>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--text-muted)" }}>
                Deadline
              </div>
              <div style={{ marginTop: 4 }}>{formatDateTime(task.deadline)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--text-muted)" }}>
                Created
              </div>
              <div style={{ marginTop: 4 }}>{formatDateTime(task.createdAt)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--text-muted)" }}>
                Progress
              </div>
              <div style={{ marginTop: 4 }}>{task.percentCompleted}%</div>
            </div>
          </div>
          {task.description && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--text-muted)", marginBottom: 4 }}>
                Description
              </div>
              <div style={{ color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{task.description}</div>
            </div>
          )}
        </Card>

        {/* Actions column */}
        <Card
          style={{
            width: 260,
            alignSelf: "stretch",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {role === "ADMIN" && (
            <>
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--text-muted)", marginBottom: 4 }}>
                  Update status
                </div>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updatingStatus}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/tasks/${task.id}/edit`)}
                style={{ width: "100%" }}
              >
                Edit task
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={loading}
                style={{ width: "100%" }}
              >
                Delete task
              </Button>
            </>
          )}
          {role === "EMPLOYEE" && task.status === "PENDING" && (
            <Button
              onClick={() => handleStatusChange("IN_PROGRESS")}
              disabled={updatingStatus}
              style={{ width: "100%" }}
            >
              {updatingStatus ? "Starting…" : "Start task"}
            </Button>
          )}
          {role !== "ADMIN" && !(role === "EMPLOYEE" && task.status === "PENDING") && (
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Status changes are managed by admins.
            </div>
          )}
        </Card>
      </div>

      {/* Assignees */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 12px" }}>Assignees</h3>
        <ul style={{ margin: 0, paddingLeft: 20, color: "var(--text-secondary)" }}>
          {task.assignments?.map((a) => (
            <li key={a.id}>{a.user?.name ?? a.userId}</li>
          ))}
          {(!task.assignments || task.assignments.length === 0) && <li>None</li>}
        </ul>
      </Card>

      {/* Submit work (employee) */}
      {canSubmit && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 12px" }}>Submit work</h3>
          {err && (
            <p style={{ color: "var(--danger)", marginBottom: 12, fontSize: 14 }}>{err}</p>
          )}
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
              value={subPercent ?? ""}
              onChange={(e) => setSubPercent(Number(e.target.value) || 0)}
              placeholder="Percent (0–100)"
              required
              style={{ width: "100%", padding: "10px 12px", marginBottom: 8, border: "1px solid var(--border)", borderRadius: 6 }}
            />
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 4, color: "var(--text-secondary)" }}>
                Media (images/videos, optional)
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => setSubMediaFiles(e.target.files ? Array.from(e.target.files) : [])}
                style={{ width: "100%", fontSize: 13 }}
              />
              {subMediaFiles.length > 0 && (
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                  {subMediaFiles.length} file(s) selected. They will be uploaded to Cloudinary on submit.
                </p>
              )}
            </div>
            <Button type="submit" disabled={loading}>{loading ? "Submitting…" : "Submit"}</Button>
          </form>
        </Card>
      )}

      {/* Tabs for submissions & comments */}
      <div style={{ marginBottom: 16, borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  border: "none",
                  borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
                  background: "transparent",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: 14,
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  fontWeight: active ? 600 : 500,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "submissions" && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 12px" }}>Submissions</h3>
          {err && (
            <p style={{ color: "var(--danger)", marginBottom: 12, fontSize: 14 }}>{err}</p>
          )}
          {submissions.length === 0 ? (
            <p style={{ color: "var(--text-muted)", margin: 0 }}>No submissions yet.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {submissions.map((s) => (
                <li key={s.id} style={{ marginBottom: 8 }}>
                  {s.description} — {s.percentReported}% · {s.status} · by {s.submittedBy?.name ?? "—"}
                  {s.media && s.media.length > 0 && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: "var(--text-muted)" }}>
                      · {s.media.length} attachment(s):{" "}
                      {s.media.map((m, i) => (
                        <a key={i} href={m.mediaUrl} target="_blank" rel="noopener noreferrer" style={{ marginRight: 8 }}>
                          {m.mediaType}
                        </a>
                      ))}
                    </span>
                  )}
                  {canApproveReject && s.status === "SUBMITTED" && (
                    <span style={{ marginLeft: 8 }}>
                      <Button
                        type="button"
                        variant="ghost"
                        style={{ padding: "2px 8px", fontSize: 12 }}
                        onClick={() => handleApprove(s.id)}
                        disabled={submissionActionId !== null}
                      >
                        {submissionActionId === s.id ? "Approving…" : "Approve"}
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        style={{ padding: "2px 8px", fontSize: 12, marginLeft: 4 }}
                        onClick={() => handleReject(s.id)}
                        disabled={submissionActionId !== null}
                      >
                        {submissionActionId === s.id ? "Rejecting…" : "Reject"}
                      </Button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {activeTab === "comments" && (
        <CommentSection
          comments={comments}
          canReply={true}
          canAddComment={true}
          placeholder="Add a comment..."
          addCommentLabel="Comment"
          onAddComment={async (text) => {
            if (!taskId) return;
            await api.post(`/api/comment/tasks/${taskId}/comments`, { text });
          }}
          onReply={async (parentId, text) => {
            await api.post(`/api/comment/${parentId}/reply`, { text });
          }}
          onRefresh={async () => {
            if (!taskId) return;
            const res = await api.get<Comment[]>(`/api/comment/tasks/${taskId}/comments`);
            setComments(res.data);
          }}
        />
      )}
    </div>
  );
}
