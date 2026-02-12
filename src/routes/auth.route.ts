import { Router } from "express";
import { validateRequest } from "@/middlewares/http_request_validator";
import { registerSchema, loginSchema } from "@/types/auth.schema";
import { registerHandler } from "@/controllers/register.controller";
import { loginHandler, logoutHandler, getMeHandler } from "@/controllers/auth.controller";
import { authenticate } from "@/middlewares/auth.middleware";

export const authRouter: Router = Router();

// Public routes
authRouter.post(
    "/register",
    validateRequest({ body: registerSchema.shape.body }),
    registerHandler
);

authRouter.post(
    "/login",
    validateRequest({ body: loginSchema.shape.body }),
    loginHandler
);

// Protected routes
// TODO Not tested yet
authRouter.post("/logout", authenticate, logoutHandler);
authRouter.get("/me", authenticate, getMeHandler);
