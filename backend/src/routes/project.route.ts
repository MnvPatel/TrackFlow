import { Router } from "express";
import {
  createProject,
  getProjects,
  updateProjectStatus
} from "../controllers/project.contoller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", auth(["ADMIN"]), createProject);
router.get("/", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), getProjects);
router.patch("/:projectId/status", auth(["ADMIN"]), updateProjectStatus);

export default router;
