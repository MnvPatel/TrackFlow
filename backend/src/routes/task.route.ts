import { Router } from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  getProjectTasks,
  updateTaskStatus,
  editTask,
  deleteTask
} from "../controllers/task.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", auth(["ADMIN"]), createTask);
router.get("/", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), getTasks);
router.get("/projects/:projectId/tasks", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), getProjectTasks);
router.get("/:taskId", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), getTaskById);
router.patch("/:taskId/status", auth(["ADMIN", "EMPLOYEE"]), updateTaskStatus);
router.patch("/:taskId", auth(["ADMIN"]), editTask);
router.delete("/:taskId", auth(["ADMIN"]), deleteTask);

export default router;
