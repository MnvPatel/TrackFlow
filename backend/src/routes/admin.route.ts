import { Router } from "express";
import { createEmployee } from "../controllers/admin.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/employees", auth(["ADMIN"]), createEmployee);

export default router;