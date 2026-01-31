import { Router } from "express";
import {
  createProject,
  getProjects
} from "../controllers/project.contoller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", auth(["ADMIN"]), createProject);
router.get("/", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), getProjects);

export default router;
