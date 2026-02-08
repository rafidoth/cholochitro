import { z } from "zod";

export const registerSchema = z.object({
    body: z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters long"),
        displayName: z
            .string()
            .min(2, "Display name must be at least 2 characters long"),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
    }),
});

export type CreateUserRequest = z.infer<typeof registerSchema.shape.body>;
export type LoginRequest = z.infer<typeof loginSchema.shape.body>;
