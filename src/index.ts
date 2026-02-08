import { logger } from "@/utils/logger";
import { envs } from "@/config/env";
import createApp from "./app";

const main = async () => {
    try {
        const port = envs.PORT;
        const envType = envs.NODE_ENV;
        console.log(port, envType)
        const app = createApp();
        app.listen(port, () => {
            logger.info(
                {
                    PORT: port,
                    ENVIRONMENT: envType,
                },
                `Server is running.`,
            );
        });
    } catch (error) {
        logger.error({ error }, "Failed to start the server.");
        process.exit(1);
    }
};

void main();
