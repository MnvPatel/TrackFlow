import express from "express";
import { addTaskComment } from "../controllers/comment.controller";
import { auth } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/tasks/:taskId/comments", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), addTaskComment);

export default router;
