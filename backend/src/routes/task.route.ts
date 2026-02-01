import { Router } from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTaskStatus,
} from "../controllers/task.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", auth(["ADMIN"]), createTask);
router.get("/", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), getTasks);
router.get("/:taskId", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), getTaskById);
router.patch("/:taskId/status", auth(["ADMIN"]), updateTaskStatus);

export default router;
