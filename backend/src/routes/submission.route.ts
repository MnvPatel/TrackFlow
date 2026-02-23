import express from "express";
import { approveSubmission, rejectSubmission, submitWork } from "../controllers/submission.controller";
import { auth } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/tasks/:taskId/submit", auth(["EMPLOYEE"]), submitWork);
router.patch("/submissions/:submissionId/approve", auth(["ADMIN"]), approveSubmission);
router.patch("/submissions/:submissionId/reject", auth(["ADMIN"]), rejectSubmission);

export default router;