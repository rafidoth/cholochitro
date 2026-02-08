import { Router } from "express";
import { validateRequest } from "@/middlewares/http_request_validator";
import { registerSchema } from "@/validation/http_request/auth.schema";

export const authRouter: Router = Router();

authRouter.post(
    "/register",
    validateRequest({ body: registerSchema.shape.body }),
    (req, res) => {
        res.status(200).send({
            message: "User registration endpoint hit",
            body: req.body,
        });
    },
);
// authRouter.post('/login', validateRequest({ body: loginSchema.shape.body }), loginHandler);
// authRouter.post('/refresh', validateRequest({ body: refreshSchema.shape.body }), refreshHandler);
// authRouter.post('/revoke', validateRequest({ body: revokeSchema.shape.body }), revokeHandler);
