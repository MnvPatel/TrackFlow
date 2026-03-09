import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const auth =
  (roles: string[]) => (req: any, res: Response, next: NextFunction) => {

    console.log("Authorization Header:", req.headers.authorization);

    const token = req.headers.authorization?.split(" ")[1];
    
    console.log("Extracted Token:", token);

    if (!token) return res.sendStatus(401);

    try {
      const accessSecret =
        process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
      if (!accessSecret)
        return res.status(500).json({ message: "Server: JWT secret not configured" });

      const decoded: any = jwt.verify(token, accessSecret);

      console.log("Decoded Token:", decoded);

      if (!roles.includes(decoded.role)) return res.sendStatus(403);

      req.user = decoded;
      next();

    } catch (err) {
      console.log("JWT Error:", err);
      res.sendStatus(401);
    }
};