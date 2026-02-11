import request from 'supertest'
import createApp from "@/app"
import { User, UserResponse } from '@/types/user'
import { userRepository } from '@/data/user.data'
import { logger } from '@/utils/logger'
const app = createApp()



describe("auth routes", () => {
    const testUser = {
        id: "",
        name: "S Rafiul Hasan",
        email: "srafiulhasan@gmail.com",
        password: "super-secret-pass",
        role: 'user',
    }

    afterAll(async () => {
        if (testUser.id) {
            await userRepository.deleteById(testUser.id)
            logger.info({ userId: testUser.id }, "Test user cleaned up")
        }
    })

    describe("POST /auth/register", () => {
        it("should return newly created user details", async () => {
            const response = await request(app).post('/api/v1/auth/register')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                    displayName: testUser.name,
                })
                .expect('Content-Type', /json/)
                .expect(201);

            logger.info({ response: response.body }, "respnse received from the request.")
            const userResponse: UserResponse = response.body.data
            testUser.id = userResponse.id

            expect(userResponse.email).toBe(testUser.email)
            expect(userResponse.displayName).toBe(testUser.name)
            expect(userResponse.role).toBe(testUser.role)
        })

        it("should find newly created user in database", async () => {
            const newUser: User | null = await userRepository.findByEmail(testUser.email)
            expect(newUser).toBeTruthy()
            expect(newUser!.id).toBe(testUser.id)
            expect(newUser!.email).toBe(testUser.email)
        })

        it("should return 400 for duplicate email registration", async () => {
            const response = await request(app).post('/api/v1/auth/register')
                .send({
                    email: testUser.email,
                    password: "another-password",
                    displayName: "Another User",
                })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error')
        })

        it("should return 400 for invalid email format", async () => {
            const response = await request(app).post('/api/v1/auth/register')
                .send({
                    email: "invalid-email",
                    password: "validpassword123",
                    displayName: "Test User",
                })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error')
        })

        it("should return 400 for password shorter than 6 characters", async () => {
            const response = await request(app).post('/api/v1/auth/register')
                .send({
                    email: "newuser@example.com",
                    password: "12345",
                    displayName: "Test User",
                })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error')
        })

        it("should return 400 for display name shorter than 2 characters", async () => {
            const response = await request(app).post('/api/v1/auth/register')
                .send({
                    email: "newuser@example.com",
                    password: "validpassword123",
                    displayName: "A",
                })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error')
        })

        it("should return 400 for missing email field", async () => {
            const response = await request(app).post('/api/v1/auth/register')
                .send({
                    password: "validpassword123",
                    displayName: "Test User",
                })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error')
        })

        it("should return 400 for missing password field", async () => {
            const response = await request(app).post('/api/v1/auth/register')
                .send({
                    email: "newuser@example.com",
                    displayName: "Test User",
                })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error')
        })

        it("should return 400 for missing displayName field", async () => {
            const response = await request(app).post('/api/v1/auth/register')
                .send({
                    email: "newuser@example.com",
                    password: "validpassword123",
                })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error')
        })

        it("should return 400 for empty request body", async () => {
            const response = await request(app).post('/api/v1/auth/register')
                .send({})
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error')
        })
    })

    describe("cleanup", () => {
        it("should delete the test user from database", async () => {
            expect(testUser.id).toBeTruthy()
            const deleted = await userRepository.deleteById(testUser.id)
            expect(deleted).toBe(true)

            const deletedUser = await userRepository.findById(testUser.id)
            expect(deletedUser).toBeNull()

            // Clear the id so afterAll doesn't try to delete again
            testUser.id = ""
        })
    })
})
