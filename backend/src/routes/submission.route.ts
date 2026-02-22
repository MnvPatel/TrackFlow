import express from "express";
import { submitWork } from "../controllers/submission.controller";
import { auth } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/tasks/:taskId/submit", auth(["EMPLOYEE"]), submitWork);

export default router;