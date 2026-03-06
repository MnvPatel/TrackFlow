import express from "express";
import { getAdminAnalytics, getClientAnalytics, getEmployeeAnalytics } from "../controllers/analytics.controller";
import { auth } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/admin", auth(["ADMIN"]), getAdminAnalytics);
router.get("/employee", auth(["EMPLOYEE"]), getEmployeeAnalytics);
router.get("/client", auth(["CLIENT"]), getClientAnalytics);

export default router;