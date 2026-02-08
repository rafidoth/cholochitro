import { userRepository } from "@/data/user.data";
import { CreateUserRequest, LoginRequest } from "@/types/auth.schema";
import type { UserResponse, JwtPayload } from "@/types/user";
import { envs } from "@/config/env";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

export class UserServiceError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 400
    ) {
        super(message);
        this.name = "UserServiceError";
    }
}

async function hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString("hex");
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(`${salt}:${derivedKey.toString("hex")}`);
        });
    });
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const [salt, key] = hash.split(":");
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(derivedKey.toString("hex") === key);
        });
    });
}

function generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, envs.JWT_SECRET, {
        expiresIn: envs.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
}

export const userService = {
    async register(cu_request: CreateUserRequest): Promise<UserResponse> {
        // Check if user already exists
        const existingUser = await userRepository.findByEmail(cu_request.email);
        if (existingUser) {
            throw new UserServiceError(
                "User with this email already exists",
                "EMAIL_EXISTS",
                409
            );
        }

        // Hash password
        const passwordHash = await hashPassword(cu_request.password);

        // Create user
        const user = await userRepository.create(
            cu_request.email,
            passwordHash,
            cu_request.displayName
        );

        return {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            createdAt: user.createdAt,
        };
    },

    async login(loginRequest: LoginRequest): Promise<{ user: UserResponse; token: string }> {
        const user = await userRepository.findByEmail(loginRequest.email);
        if (!user) {
            throw new UserServiceError(
                "Invalid email or password",
                "INVALID_CREDENTIALS",
                401
            );
        }

        const isValidPassword = await verifyPassword(loginRequest.password, user.passwordHash);
        if (!isValidPassword) {
            throw new UserServiceError(
                "Invalid email or password",
                "INVALID_CREDENTIALS",
                401
            );
        }

        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                createdAt: user.createdAt,
            },
            token,
        };
    },

    async getById(id: string): Promise<UserResponse> {
        const user = await userRepository.findById(id);
        if (!user) {
            throw new UserServiceError(
                "User not found",
                "USER_NOT_FOUND",
                404
            );
        }

        return {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            createdAt: user.createdAt,
        };
    },

    verifyToken(token: string): JwtPayload {
        try {
            return jwt.verify(token, envs.JWT_SECRET) as JwtPayload;
        } catch {
            throw new UserServiceError(
                "Invalid or expired token",
                "INVALID_TOKEN",
                401
            );
        }
    },
};
