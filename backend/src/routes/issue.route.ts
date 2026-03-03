import express from "express";
import { auth } from "../middlewares/auth.middleware";
import { createIssue, getProjectIssues } from "../controllers/issue.controller";

const router = express.Router();

router.post("/projects/:projectId/create", auth(["CLIENT"]), createIssue);
router.get("/projects/:projectId/get", auth(["ADMIN", "CLIENT"]), getProjectIssues);

export default router;
