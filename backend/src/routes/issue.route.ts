import express from "express";
import { auth } from "../middlewares/auth.middleware";
import { createIssue, getIssueById, getProjectIssues, convertIssueToTask } from "../controllers/issue.controller";

const router = express.Router();

router.post("/projects/:projectId/issues", auth(["CLIENT"]), createIssue);
router.get("/projects/:projectId/issues", auth(["ADMIN", "CLIENT"]), getProjectIssues);
router.get("/:issueId", auth(["ADMIN", "CLIENT"]), getIssueById);
router.patch("/:issueId/convert", auth(["ADMIN"]), convertIssueToTask);

export default router;
