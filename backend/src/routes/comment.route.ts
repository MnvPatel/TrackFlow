import express from "express";
import { addProjectComment, addTaskComment, getProjectComments, getTaskComments, replyToComment } from "../controllers/comment.controller";
import { auth } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/tasks/:taskId/comments", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), addTaskComment);
router.get("/tasks/:taskId/comments", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), getTaskComments );
router.post("/projects/:projectId/comments", auth(["ADMIN", "EMPLOYEE"]), addProjectComment);
router.get("/projects/:projectId/comments", auth(["ADMIN", "EMPLOYEE"]), getProjectComments);
router.post("/:commentId/reply", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), replyToComment);

export default router;
