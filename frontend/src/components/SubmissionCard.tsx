import type { WorkSubmission } from "../types";
import Card from "./Card";
import Button from "./Button";

const statusColors: Record<string, string> = {
  PENDING: "var(--text-muted)",
  IN_PROGRESS: "var(--accent)",
  SUBMITTED: "var(--warning)",
  APPROVED: "var(--success)",
  REJECTED: "var(--danger)",
};

interface SubmissionCardProps {
  submission: WorkSubmission;
  canApproveReject?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  actionLoadingId?: string | null;
}

export default function SubmissionCard({
  submission,
  canApproveReject = false,
  onApprove,
  onReject,
  actionLoadingId = null,
}: SubmissionCardProps) {
  const submittedByName = submission.submittedBy?.name ?? "—";
  const createdDate = submission.createdAt
    ? new Date(submission.createdAt).toLocaleString()
    : "";
  const mediaCount = submission.media?.length ?? 0;
  const showActions =
    canApproveReject &&
    submission.status === "SUBMITTED" &&
    onApprove &&
    onReject;
  const loading = actionLoadingId === submission.id;

  return (
    <Card
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          Version {submission.versionNumber}
          {submission.description
            ? ` — ${submission.description.length > 80 ? submission.description.slice(0, 80) + "…" : submission.description}`
            : ""}
        </div>
        <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          {submission.percentReported}%
          {" · "}
          <span
            style={{
              color: statusColors[submission.status] ?? "var(--text-muted)",
            }}
          >
            {submission.status}
          </span>
          {" · "}
          by {submittedByName}
          {" · "}
          {createdDate}
          {mediaCount > 0 && (
            <>
              {" · "}
              <span style={{ color: "var(--text-muted)" }}>
                {mediaCount} attachment{mediaCount !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
        {submission.media && submission.media.length > 0 && (
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginTop: 4,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {submission.media.map((m, i) => (
              <a
                key={i}
                href={m.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent)" }}
              >
                {m.mediaType}
              </a>
            ))}
          </div>
        )}
      </div>
      {showActions && (
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <Button
            type="button"
            variant="ghost"
            style={{ padding: "6px 12px", fontSize: 13 }}
            onClick={() => onApprove(submission.id)}
            disabled={actionLoadingId !== null}
          >
            {loading ? "Approving…" : "Approve"}
          </Button>
          <Button
            type="button"
            variant="danger"
            style={{ padding: "6px 12px", fontSize: 13 }}
            onClick={() => onReject(submission.id)}
            disabled={actionLoadingId !== null}
          >
            {loading ? "Rejecting…" : "Reject"}
          </Button>
        </div>
      )}
    </Card>
  );
}
