import { Router } from "express";
import { createEmployee } from "../controllers/admin.controller";
import { auth } from "../middleware/auth.middleware";

const router = Router();

router.post("/employees", auth(["ADMIN"]), createEmployee);

export default router;