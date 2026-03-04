import express from "express";
import { getNotifications, markNotificationAsRead, markAllAsRead } from "../controllers/notification.controller";
import { auth } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), getNotifications);
router.patch("/:id/read", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), markNotificationAsRead);
router.patch("/read-all", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), markAllAsRead);

export default router;