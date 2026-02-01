import { Router } from "express";
import {
  createTask,
  getTasks,
  getTaskById,
} from "../controllers/task.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", auth(["ADMIN"]), createTask);
router.get("/", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), getTasks);
router.get("/:taskId", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), getTaskById);

export default router;
