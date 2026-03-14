import { Link } from "react-router-dom";
import type { Issue } from "../types";
import Card from "./Card";

const statusColors: Record<string, string> = {
  OPEN: "var(--warning)",
  IN_PROGRESS: "var(--accent)",
  RESOLVED: "var(--success)",
  CONVERTED_TO_TASK: "var(--text-muted)",
};

interface IssueCardProps {
  issue: Issue;
}

export default function IssueCard({ issue }: IssueCardProps) {
  const createdByName = issue.createdBy?.name;
  const createdDate = issue.createdAt
    ? new Date(issue.createdAt).toLocaleDateString()
    : "";

  return (
    <Link
      to={`/issues/${issue.id}`}
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
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{issue.title}</div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            <span style={{ color: statusColors[issue.status] ?? "var(--text-muted)" }}>
              {issue.status.replace(/_/g, " ")}
            </span>
            {createdByName && (
              <> · {createdByName}</>
            )}
            {createdDate && (
              <> · {createdDate}</>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
