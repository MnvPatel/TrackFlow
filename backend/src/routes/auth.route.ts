import { Router } from "express";
import { 
    registerClient, 
    verifyClientOTP,
    loginWithPassword,
    requestPasswordSetupOTP,
    verifyPasswordSetup,
    refreshAccessToken,
} from "../controllers/auth.controller";

const router = Router();

router.post("/client/register", registerClient);
router.post("/client/verify-otp", verifyClientOTP);
router.post("/login", loginWithPassword);
router.post("/password/setup/request", requestPasswordSetupOTP);
router.post("/password/setup/verify", verifyPasswordSetup);
router.post("/api/auth/refresh", refreshAccessToken);

export default router;
