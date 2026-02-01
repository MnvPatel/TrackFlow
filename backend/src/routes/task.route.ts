import { Router } from "express";
import {
  createTask,
} from "../controllers/task.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", auth(["ADMIN"]), createTask);

export default router;
