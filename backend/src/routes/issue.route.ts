import express from "express";
import { auth } from "../middlewares/auth.middleware";
import { createIssue, getIssueById, getProjectIssues } from "../controllers/issue.controller";

const router = express.Router();

router.post("/projects/:projectId/issues", auth(["CLIENT"]), createIssue);
router.get("/projects/:projectId/issues", auth(["ADMIN", "CLIENT"]), getProjectIssues);
router.get("/:issueId", auth(["ADMIN", "CLIENT"]), getIssueById);

export default router;
