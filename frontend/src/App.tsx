import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectNew from "./pages/ProjectNew";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectEdit from "./pages/ProjectEdit";
import Tasks from "./pages/Tasks";
import TaskNew from "./pages/TaskNew";
import TaskDetail from "./pages/TaskDetail";
import Employees from "./pages/Employees";
import Submissions from "./pages/Submissions";
import Issues from "./pages/Issues";
import IssueNew from "./pages/IssueNew";
import IssueDetail from "./pages/IssueDetail";
import Notifications from "./pages/Notifications";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/new" element={<ProjectNew />} />
        <Route path="projects/:projectId" element={<ProjectDetail />} />
        <Route path="projects/:projectId/edit" element={<ProjectEdit />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="tasks/new" element={<TaskNew />} />
        <Route path="tasks/:taskId" element={<TaskDetail />} />
        <Route path="employees" element={<Employees />} />
        <Route path="submissions" element={<Submissions />} />
        <Route path="issues" element={<Issues />} />
        <Route path="issues/new" element={<IssueNew />} />
        <Route path="issues/:issueId" element={<IssueDetail />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
