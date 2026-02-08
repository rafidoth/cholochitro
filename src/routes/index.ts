
import { Router } from "express";
import { authRouter } from "@/routes/auth.route";

export const registerRoutes = (app: Router) => {
    const v1_router = Router()
    v1_router.get("/health", (_req, res) => {
        res.status(200).json({ status: "ok" });
    });
    v1_router.use("/auth", authRouter)

    app.use("/api/v1", v1_router);
};
