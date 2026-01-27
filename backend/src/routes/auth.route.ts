import { Router } from "express";
import { 
    registerClient, 
    verifyClientOTP,
    loginWithPassword 
} from "../controllers/auth.controller";

const router = Router();

router.post("/client/register", registerClient);
router.post("/client/verify-otp", verifyClientOTP);
router.post("/login", loginWithPassword);

export default router;
