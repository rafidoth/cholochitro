import type { UserResponse } from "@/types/user";
import { userRepository } from "@/data/user.data";
import request from 'supertest'
import type { Express } from "express";

export interface TestUserContext {
    user: UserResponse;
    token: string;
}

export const authHelper = {
    async onBoardTestUser(app: Express, role: string): Promise<TestUserContext> {
        if (role !== "admin" && role !== "user") {
            throw Error("On Board user type not defined.")
        }

        const TestUser = {
            email: role === "admin" ? "admin3@cholochitro.com" : "testuser@cholochitro.com",
            password: role === "admin" ? "admin" : "123456789",
            displayName: role === "admin" ? "TEST ADMIN" : "TEST USER",
        }

        if (role === "user") {
            await request(app).post('/api/v1/auth/register')
                .send({
                    email: TestUser.email,
                    password: TestUser.password,
                    displayName: TestUser.displayName,
                })
                .expect('Content-Type', /json/)
                .expect(201);
        }


        const loginResponse = await request(app).post('/api/v1/auth/login')
            .send({
                email: TestUser.email,
                password: TestUser.password,
            })
            .expect('Content-Type', /json/)
            .expect(200);

        const token: string = loginResponse.body.data.token;
        const user: UserResponse = loginResponse.body.data.user;

        return {
            user: user,
            token: token,
        };
    },

    async cleanupTestUser(userId: string): Promise<boolean> {
        if (!userId) {
            return false;
        }
        return await userRepository.deleteById(userId);
    },
}
