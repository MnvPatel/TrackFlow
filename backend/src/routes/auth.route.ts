import { Router } from "express";
import {
  registerClient,
  verifyClientOTP,
  loginWithPassword,
  requestPasswordSetupOTP,
  verifyPasswordSetup,
  refreshAccessToken,
  logout,
} from "../controllers/auth.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/client/register", registerClient);
router.post("/client/verify-otp", verifyClientOTP);
router.post("/login", loginWithPassword);
router.post("/password/setup/request", requestPasswordSetupOTP);
router.post("/password/setup/verify", verifyPasswordSetup);
router.post("/refresh", refreshAccessToken);
router.post("/logout", auth(["ADMIN", "EMPLOYEE", "CLIENT"]), logout);

export default router;
