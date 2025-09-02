import { NextFunction, Request, Response } from "express";
import { JWT_SECRET } from "@repo/backend-common/config";
import jwt from "jsonwebtoken";

interface CustomRequest extends Request {
    userId?: string;
}

export function middleware(req: CustomRequest, res: Response, next: NextFunction): void {
    try {
        let token = req.headers["authorization"] as string | undefined;

        if (!token) {
            res.status(403).json({ message: "Unauthorized: No token provided" });
            return; // stop execution
        }

        // Remove "Bearer " prefix if present
        if (token.startsWith("Bearer ")) {
            token = token.slice(7, token.length);
        }

        const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

        req.userId = decoded.userId as string;
        next();
    } catch (err) {
        console.error(err);
        res.status(403).json({ message: "Unauthorized: Invalid token" });
        return; // stop execution
    }
}
