import express from "express";
import { addProjectComment, addTaskComment, getProjectComments, getTaskComments } from "../controllers/comment.controller";
import { auth } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/tasks/:taskId/comments", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), addTaskComment);
router.get("/tasks/:taskId/comments", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), getTaskComments );
router.post("/projects/:projectId/comments", auth(["ADMIN", "EMPLOYEE"]), addProjectComment);
router.get("/projects/:projectId/comments", auth(["ADMIN", "EMPLOYEE"]), getProjectComments);

export default router;
