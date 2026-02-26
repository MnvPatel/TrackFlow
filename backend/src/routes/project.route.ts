import { Router } from "express";
import {
  createProject,
  getProjects,
  updateProjectStatus,
  getProjectById,
  editProject,
  deleteProject
} from "../controllers/project.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", auth(["ADMIN"]), createProject);
router.get("/", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), getProjects);
router.get("/:projectId", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), getProjectById);
router.patch("/:projectId/status", auth(["ADMIN"]), updateProjectStatus);
router.patch("/:projectId", auth(["ADMIN"]), editProject);
router.delete("/:projectId", auth(["ADMIN"]), deleteProject);

export default router;
