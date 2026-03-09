import { Router } from "express";
import { createEmployee, getUsers } from "../controllers/admin.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/users", auth(["ADMIN"]), getUsers);
router.post("/employees", auth(["ADMIN"]), createEmployee);

export default router;