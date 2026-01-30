import { Router } from "express";
import {
  createProject
} from "../controllers/project.contoller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", auth(["ADMIN"]), createProject);

export default router;
