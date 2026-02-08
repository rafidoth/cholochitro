import { userService, UserServiceError } from "@/services/user.service";
import { logger } from "@/utils/logger";
import { Request, Response } from "express";

export const loginHandler = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await userService.login({ email, password });
        logger.info({ userId: result.user.id, email: result.user.email }, "User logged in successfully");
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: result,
        });
    } catch (error) {
        if (error instanceof UserServiceError) {
            logger.warn({ code: error.code, message: error.message }, "Login failed");
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }

        logger.error({ error }, "Unexpected error during login");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};

export const logoutHandler = async (_req: Request, res: Response) => {
    // TODO : implement token blacklisting
    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
};

export const getMeHandler = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Not authenticated",
                code: "NOT_AUTHENTICATED",
            });
            return;
        }

        const user = await userService.getById(req.user.userId);

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        if (error instanceof UserServiceError) {
            logger.warn({ code: error.code, message: error.message }, "Get user failed");
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }

        logger.error({ error }, "Unexpected error getting user");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
};
