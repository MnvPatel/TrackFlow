import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../lib/axios";
import type { Project, Comment } from "../types";
import Card from "../components/Card";
import Button from "../components/Button";
import CommentSection from "../components/CommentSection";
import { useAuth } from "../context/AuthContext";

const statusColors: Record<string, string> = {
  ACTIVE: "var(--success)",
  ON_HOLD: "var(--warning)",
  COMPLETED: "var(--text-muted)",
};

type TabKey = "tasks" | "issues" | "submissions" | "comments";

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { role } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [err, setErr] = useState("");
  const [deleting, setDeleting] = useState(false);
   const [updatingStatus, setUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("tasks");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (!projectId || projectId === "undefined") {
      if (projectId === "undefined") navigate("/projects", { replace: true });
      return;
    }
    api.get<Project>(`/api/projects/${projectId}`)
      .then((res) => setProject(res.data))
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed"));
  }, [projectId, navigate]);

  useEffect(() => {
    if (!project || activeTab !== "comments") return;
    setLoadingComments(true);
    api
      .get<Comment[]>(`/api/comment/projects/${project.id}/comments`)
      .then((res) => setComments(res.data))
      .catch(() => setComments([]))
      .finally(() => setLoadingComments(false));
  }, [project, activeTab]);

  const handleStatusChange = async (status: Project["status"]) => {
    if (!project || !projectId || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      await api.patch(`/api/projects/${projectId}/status`, { status });
      setProject((prev) => (prev ? { ...prev, status } : prev));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId || !window.confirm("Delete this project? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.delete(`/api/projects/${projectId}`);
      navigate("/projects");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (err && !project) return <p style={{ color: "var(--danger)" }}>{err}</p>;
  if (!project) return <p>Loading…</p>;

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString() : "—";

  const tabs: { key: TabKey; label: string }[] = [
    { key: "tasks", label: "Tasks" },
    { key: "issues", label: "Issues" },
    { key: "comments", label: "Comments" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
        <Link to="/projects" style={{ color: "var(--text-secondary)" }}>← Projects</Link>
      </div>

      {/* Top layout: overview + actions */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "stretch" }}>
        <Card style={{ flex: 1 }}>
          <div style={{ marginBottom: 12 }}>
            <h1 style={{ margin: "0 0 8px" }}>{project.title}</h1>
            <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              Client: {project.client?.name ?? "—"}
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
                Status
              </div>
              <div style={{ marginTop: 4, fontWeight: 600, color: statusColors[project.status] ?? "var(--text-primary)" }}>
                {project.status}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--text-muted)" }}>
                Start date
              </div>
              <div style={{ marginTop: 4 }}>{formatDate(project.startDate)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--text-muted)" }}>
                End date
              </div>
              <div style={{ marginTop: 4 }}>{formatDate(project.endDate)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--text-muted)" }}>
                Created
              </div>
              <div style={{ marginTop: 4 }}>{formatDate(project.createdAt)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--text-muted)" }}>
                Progress
              </div>
              <div style={{ marginTop: 4 }}>{project.percentCompleted}%</div>
            </div>
          </div>
          {project.description && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--text-muted)", marginBottom: 4 }}>
                Description
              </div>
              <div style={{ color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{project.description}</div>
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
                  value={project.status}
                  onChange={(e) => handleStatusChange(e.target.value as Project["status"])}
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
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ON_HOLD">ON_HOLD</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
              <Link to={`/projects/${projectId}/edit`}>
                <Button variant="secondary" style={{ width: "100%" }}>
                  Edit project
                </Button>
              </Link>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleting}
                style={{ width: "100%" }}
              >
                {deleting ? "Deleting…" : "Delete project"}
              </Button>
            </>
          )}
          {role !== "ADMIN" && (
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Contact an admin to update project details.
            </div>
          )}
        </Card>
      </div>

      {/* Tabs */}
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

      {/* Tab content */}
      {activeTab === "tasks" && (
        <Card>
          <h2 style={{ margin: "0 0 16px", fontSize: "1.1rem" }}>Tasks</h2>
          {project.tasks && project.tasks.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {project.tasks.map((t) => (
                <li key={t.id} style={{ marginBottom: 8 }}>
                  <Link to={`/tasks/${t.id}`}>{t.title}</Link>
                  <span style={{ marginLeft: 8, color: "var(--text-muted)", fontSize: 14 }}>
                    {t.status} · {t.priority}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "var(--text-muted)", margin: 0 }}>No tasks yet.</p>
          )}
          {role === "ADMIN" && (
            <div style={{ marginTop: 16 }}>
              <Link to={`/tasks/new?projectId=${project.id}`}>
                <Button>Add task</Button>
              </Link>
            </div>
          )}
        </Card>
      )}

      {activeTab === "issues" && (
        <Card>
          <h2 style={{ margin: "0 0 16px", fontSize: "1.1rem" }}>Issues</h2>
          {project.issues && project.issues.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {project.issues.map((i) => (
                <li key={i.id} style={{ marginBottom: 8 }}>
                  <Link to={`/issues/${i.id}`}>{i.title}</Link>
                  <span style={{ marginLeft: 8, color: "var(--text-muted)", fontSize: 14 }}>
                    {i.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "var(--text-muted)", margin: 0 }}>No issues for this project.</p>
          )}
          {role === "CLIENT" && (
            <div style={{ marginTop: 16 }}>
              <Link to={`/issues/new?projectId=${project.id}`}>
                <Button>New issue</Button>
              </Link>
            </div>
          )}
        </Card>
      )}

      {activeTab === "comments" && (
        <CommentSection
          comments={comments}
          loading={loadingComments}
          canReply={role !== "CLIENT"}
          canAddComment={role !== "CLIENT"}
          placeholder="Add a comment..."
          addCommentLabel="Comment"
          title="Project comments"
          subtitle="Private thread between admin and employees. Clients cannot see these comments."
          onAddComment={async (text) => {
            if (!project) return;
            await api.post(`/api/comment/projects/${project.id}/comments`, { text });
          }}
          onReply={async (parentId, text) => {
            await api.post(`/api/comment/${parentId}/reply`, { text });
          }}
          onRefresh={async () => {
            if (!project) return;
            const res = await api.get<Comment[]>(
              `/api/comment/projects/${project.id}/comments`
            );
            setComments(res.data);
          }}
        />
      )}
    </div>
  );
}
