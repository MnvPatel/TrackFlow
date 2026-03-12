import React from "react";
import { Link } from "react-router-dom";
import type { Task } from "../types";
import Card from "./Card";

const statusColors: Record<string, string> = {
  PENDING: "var(--text-muted)",
  IN_PROGRESS: "var(--accent)",
  SUBMITTED: "var(--warning)",
  APPROVED: "var(--success)",
  REJECTED: "var(--danger)",
};

interface TaskCardProps {
  task: Task;
  showProject?: boolean;
  showPercent?: boolean;
  showAssignees?: boolean;
}

export default function TaskCard({
  task,
  showProject = true,
  showPercent = true,
  showAssignees = true,
}: TaskCardProps) {
  const assigneeNames =
    task.assignments?.map((a) => a.user?.name).filter(Boolean).join(", ") || "—";

  return (
    <Link
      to={`/tasks/${task.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Card
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          cursor: "pointer",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{task.title}</div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {showProject && (
              <>
                {task.project?.title ?? "—"}
                {" · "}
              </>
            )}
            {task.priority}
            {" · "}
            <span style={{ color: statusColors[task.status] ?? "var(--text-muted)" }}>
              {task.status}
            </span>
            {showPercent && "percentCompleted" in task && task.percentCompleted != null && (
              <> · {task.percentCompleted}%</>
            )}
          </div>
          {showAssignees && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Assignees: {assigneeNames}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
