import express from "express";
import { addTaskComment, getTaskComments } from "../controllers/comment.controller";
import { auth } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/tasks/:taskId/comments", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), addTaskComment);
router.get("/tasks/:taskId/comments", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), getTaskComments );

export default router;
