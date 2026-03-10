export type Role = "ADMIN" | "EMPLOYEE" | "CLIENT";

export type ProjectStatus = "ACTIVE" | "ON_HOLD" | "COMPLETED";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "SUBMITTED" | "APPROVED" | "REJECTED";
export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CONVERTED_TO_TASK";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
}

export interface ProjectMember {
  id: string;
  userId: string;
  user: Pick<User, "id" | "name" | "email">;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  percentCompleted: number;
  clientId: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  client?: Pick<User, "id" | "name" | "email">;
  members?: ProjectMember[];
  tasks?: Task[];
  issues?: Issue[];
}

export interface TaskAssignment {
  id: string;
  userId: string;
  user: Pick<User, "id" | "name" | "email">;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  percentCompleted: number;
  deadline: string | null;
  projectId: string;
  createdAt: string;
  project?: Project;
  assignments?: TaskAssignment[];
  submissions?: WorkSubmission[];
}

export interface WorkSubmission {
  id: string;
  description: string;
  percentReported: number;
  versionNumber: number;
  status: TaskStatus;
  taskId: string;
  createdAt: string;
  submittedBy?: Pick<User, "id" | "name" | "email">;
  task?: { title: string };
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  authorId: string;
  author?: Pick<User, "id" | "name" | "email">;
  taskId: string | null;
  projectId: string | null;
  parentCommentId: string | null;
  replies?: Comment[];
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  createdAt: string;
  projectId: string;
  createdBy?: Pick<User, "id" | "name" | "email">;
  convertedTaskId?: string | null;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminAnalytics {
  projects: { total: number; active: number; completed: number };
  tasks: { total: number; pending: number; inProgress: number; submitted: number; approved: number };
  users: { employees: number; clients: number };
  issues: { open: number };
}

export interface EmployeeAnalytics {
  tasks: { assigned: number; pending: number; inProgress: number; submitted: number; approved: number };
  projects: { workingOn: number };
  submissions: { total: number };
}

export interface ClientAnalytics {
  projects: { total: number; active: number; completed: number };
  tasks: { total: number; approved: number; pending: number };
  issues: { open: number };
  submissions: { recent: Array<{ id: string; createdAt: string; task: { title: string }; submittedBy: { name: string } }> };
}
