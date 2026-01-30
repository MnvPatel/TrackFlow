import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const auth =
  (roles: string[]) => (req: any, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.sendStatus(401);

    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      if (!roles.includes(decoded.role)) return res.sendStatus(403);
      req.user = decoded;
      next();
    } catch {
      res.sendStatus(401);
    }
  };
