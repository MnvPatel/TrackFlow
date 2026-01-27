import { Router } from "express";
import { 
    registerClient, 
    verifyClientOTP, 
} from "../controllers/auth.controller";

const router = Router();

router.post("/client/register", registerClient);
router.post("/client/verify-otp", verifyClientOTP);

export default router;
