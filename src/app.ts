import express from "express";
import type { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { logger } from "@/utils/logger";
import { registerRoutes } from "@/routes/index";

const createApp = (): Express => {
    const app: Express = express();

    // middlewares
    app.use(helmet());
    app.use(
        cors({
            origin: "*",
            credentials: true,
        }),
    );

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    registerRoutes(app);

    // 404 handler
    app.use((req, res) => {
        logger.warn({ url: req.originalUrl }, "Route not found");

        res.status(404).json({
            status: 404,
            message: "Sorry, we couldn't find that route!",
            path: req.originalUrl,
        });
    });

    // app.use(GetErrorHandler(logger));
    return app;
};

export default createApp;
