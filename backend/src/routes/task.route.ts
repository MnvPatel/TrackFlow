import { Router } from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTaskStatus,
  editTask
} from "../controllers/task.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", auth(["ADMIN"]), createTask);
router.get("/", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), getTasks);
router.get("/:taskId", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), getTaskById);
router.patch("/:taskId/status", auth(["ADMIN"]), updateTaskStatus);
router.patch("/:taskId", auth(["ADMIN"]), editTask);

export default router;
