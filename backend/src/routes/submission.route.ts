import express from "express";
import { approveSubmission, getSubmissions, rejectSubmission, submitWork } from "../controllers/submission.controller";
import { auth } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/tasks/:taskId/submit", auth(["EMPLOYEE"]), submitWork);
router.patch("/:submissionId/approve", auth(["ADMIN"]), approveSubmission);
router.patch("/:submissionId/reject", auth(["ADMIN"]), rejectSubmission);
router.get("/tasks/:taskId/submissions", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), getSubmissions);

export default router;