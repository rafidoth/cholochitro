import { envs } from "@/config/env";
import pino from "pino";
import type { Logger } from "pino";

const isDevelopment = envs.NODE_ENV === "development"
const prettyTransport = isDevelopment ? {
    target: "pino-pretty",
    options: {
        colorize: true,
        ignore: "pid,hostname",
    },
} : undefined;

export const logger: Logger = pino({
    transport: prettyTransport,
})
