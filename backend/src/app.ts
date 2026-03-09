import express from 'express';
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route";
import adminRoutes from "./routes/admin.route";
import projectRoutes from "./routes/project.route";
import taskRoutes from "./routes/task.route";
import submissionRoutes from "./routes/submission.route";
import commentRoutes from "./routes/comment.route";
import issueRoutes from "./routes/issue.route";
import notificationRoutes from "./routes/notification.route";
import analyticsRoutes from "./routes/analytics.route";

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Request logging – confirms request reaches this server
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

//ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/submission", submissionRoutes);
app.use("/api/comment", commentRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);

// No route matched – log so we know the request at least hit this app
app.use((req, res, next) => {
  console.log("[NO ROUTE] Request reached Express but no route matched:", req.method, req.originalUrl);
  res.status(404).json({ message: "Not Found" });
});

//GLOBAL ERROR HANDLER 
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});