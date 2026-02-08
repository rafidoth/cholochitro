import { userService, UserServiceError } from "@/services/user.service";
import { logger } from "@/utils/logger";
import { Request, Response } from "express";

export const registerHandler = async (req: Request, res: Response) => {
    try {
        const { email, password, displayName } = req.body;

        const user = await userService.register({
            email,
            password,
            displayName,
        });

        logger.info({ userId: user.id, email: user.email }, "User registered successfully");

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user,
        });
    } catch (error) {
        if (error instanceof UserServiceError) {
            logger.warn({ code: error.code, message: error.message }, "Registration failed");
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
                code: error.code,
            });
            return;
        }

        logger.error({ error }, "Unexpected error during registration");
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
}
