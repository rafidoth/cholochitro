import type { NextFunction, Request, Response } from "express";
import { userService, UserServiceError } from "@/services/user.service";
import type { JwtPayload } from "@/types/user";
import { logger } from "@/utils/logger";

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
                code: "AUTH_REQUIRED",
            });
            return;
        }

        const token = authHeader.substring(7);
        const payload = userService.verifyToken(token);
        req.user = payload;
        next();
    } catch (error) {
        if (error instanceof UserServiceError) {
            logger.warn({ code: error.code }, "Authentication failed");
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }

        logger.error({ error }, "Unexpected error during authentication");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: "Authentication required",
            code: "AUTH_REQUIRED",
        });
        return;
    }

    if (req.user.role !== "admin") {
        res.status(403).json({
            success: false,
            message: "Admin access required",
            code: "ADMIN_REQUIRED",
        });
        return;
    }

    next();
};

// Optional authentication - doesn't fail if no token, but sets user if valid token provided
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            const payload = userService.verifyToken(token);
            req.user = payload;
        }
        next();
    } catch {
        // Token invalid, but optional auth - continue without user
        next();
    }
};
