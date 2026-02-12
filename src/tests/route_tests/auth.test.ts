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
        token: ""
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

    describe("POST /auth/login", () => {
        it("should return 200 for successful login", async () => {
            const response = await request(app).post('/api/v1/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect('Content-Type', /json/)
                .expect(200);

            const userResponse: UserResponse = response.body.data.user
            testUser.id = userResponse.id
            const token: string = response.body.data.token
            testUser.token = token

            expect(userResponse.email).toBe(testUser.email)
            expect(userResponse.displayName).toBe(testUser.name)
            expect(userResponse.role).toBe(testUser.role)
        })

        it("should return a valid JWT token on successful login", async () => {
            const response = await request(app).post('/api/v1/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200);

            expect(response.body.data).toHaveProperty('token')
            expect(typeof response.body.data.token).toBe('string')
            expect(response.body.data.token.length).toBeGreaterThan(0)
            // JWT tokens have 3 parts separated by dots
            expect(response.body.data.token.split('.').length).toBe(3)
        })

        it("should return 401 for non-existent email", async () => {
            const response = await request(app).post('/api/v1/auth/login')
                .send({
                    email: "nonexistent@example.com",
                    password: "somepassword",
                })
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body.success).toBe(false)
            expect(response.body.code).toBe('INVALID_CREDENTIALS')
        })

        it("should return 401 for wrong password", async () => {
            const response = await request(app).post('/api/v1/auth/login')
                .send({
                    email: testUser.email,
                    password: "wrong-password",
                })
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body.success).toBe(false)
            expect(response.body.code).toBe('INVALID_CREDENTIALS')
        })

        it("should return 400 for invalid email format", async () => {
            const response = await request(app).post('/api/v1/auth/login')
                .send({
                    email: "invalid-email",
                    password: "validpassword123",
                })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error')
        })

        it("should return 400 for missing email field", async () => {
            const response = await request(app).post('/api/v1/auth/login')
                .send({
                    password: "validpassword123",
                })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error')
        })

        it("should return 400 for missing password field", async () => {
            const response = await request(app).post('/api/v1/auth/login')
                .send({
                    email: "test@example.com",
                })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error')
        })

        it("should return 400 for empty request body", async () => {
            const response = await request(app).post('/api/v1/auth/login')
                .send({})
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error')
        })

        it("should return 400 for empty password string", async () => {
            const response = await request(app).post('/api/v1/auth/login')
                .send({
                    email: "test@example.com",
                    password: "",
                })
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
