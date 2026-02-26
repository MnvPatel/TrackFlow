import express from 'express';
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route";
import adminRoutes from "./routes/admin.route";
import projectRoutes from "./routes/project.route";
import taskRoutes from "./routes/task.route";
import submissionRoutes from "./routes/submission.route";
import commentRoutes from "./routes/comment.route";

export const app = express();

app.use(express.json());
app.use(cookieParser());

//ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/submission", submissionRoutes);
app.use("/api/comment", commentRoutes);

//GLOBAL ERROR HANDLER 
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});