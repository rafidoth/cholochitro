import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    PORT: z.coerce.number().default(4001),
});

const parsedEnvs = envSchema.safeParse(process.env)
if (!parsedEnvs.success) {
    throw new Error("Environment Variable Load Failed")
}

export const envs = parsedEnvs.data
console.log(envs)





