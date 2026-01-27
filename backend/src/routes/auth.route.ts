import { Router } from "express";
import { registerClient } from "../controllers/auth.controller";

const router = Router();

router.post("/client/register", registerClient);

export default router;
