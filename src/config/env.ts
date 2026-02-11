import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    PORT: z.coerce.number().default(4001),
    DATABASE_URL: z.string().default('postgres://postgres:postgres@db:5432/cholochitro'),
    TEST_DATABASE_URL: z.string().default('postgres://postgres:postgres@db:5432/cholochitro'),
    JWT_SECRET: z.string().default('secret-key'),
    JWT_EXPIRES_IN: z.string().default('7d'),
});

const parsedEnvs = envSchema.safeParse(process.env)
if (!parsedEnvs.success) {
    throw new Error("Environment Variable Load Failed")
}

export const envs = parsedEnvs.data





