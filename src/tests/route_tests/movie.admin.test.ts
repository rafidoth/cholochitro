import request from 'supertest'
import createApp from "@/app"
import { authHelper, TestUserContext } from '@/tests/helpers/authHelper'
import { movieRepository } from '@/data/movie.data'
import { logger } from '@/utils/logger'

const app = createApp()

describe("Admin Movie Routes", () => {
    let adminContext: TestUserContext;
    let userContext: TestUserContext;
    const createdMovieIds: string[] = [];

    beforeAll(async () => {
        adminContext = await authHelper.onBoardTestUser(app, "admin");
        userContext = await authHelper.onBoardTestUser(app, "user");
        logger.info({ adminId: adminContext.user.id, userId: userContext.user.id }, "Test users created");
    });

    afterAll(async () => {
        // Cleanup created movies
        for (const movieId of createdMovieIds) {
            await movieRepository.delete(movieId);
        }
        logger.info({ count: createdMovieIds.length }, "Test movies cleaned up");

        // Cleanup test users 
        // I seeded the admins to db in migrations so they don't need to be deleted after test ends
        // if (adminContext?.user?.id) {
        //     await authHelper.cleanupTestUser(adminContext.user.id);
        // }
        if (userContext?.user?.id) {
            await authHelper.cleanupTestUser(userContext.user.id);
        }
        logger.info("Test users cleaned up");
    });

    describe("POST /api/v1/admin/movies", () => {
        const validMovie = {
            title: "Test Movie",
            description: "A test movie description",
            durationMinutes: 120,
            genre: "Action",
            status: "coming_soon",
        };

        it("should return 201 on successful movie creation with all fields", async () => {
            const response = await request(app)
                .post('/api/v1/admin/movies')
                .set('Authorization', `Bearer ${adminContext.token}`)
                .send(validMovie)
                .expect('Content-Type', /json/)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.title).toBe(validMovie.title);
            expect(response.body.data.description).toBe(validMovie.description);
            expect(response.body.data.durationMinutes).toBe(validMovie.durationMinutes);
            expect(response.body.data.genre).toBe(validMovie.genre);
            expect(response.body.data.status).toBe(validMovie.status);

            createdMovieIds.push(response.body.data.id);
        });

        it("should return 201 with only required fields (title, durationMinutes)", async () => {
            const minimalMovie = {
                title: "Minimal Movie",
                durationMinutes: 90,
            };

            const response = await request(app)
                .post('/api/v1/admin/movies')
                .set('Authorization', `Bearer ${adminContext.token}`)
                .send(minimalMovie)
                .expect('Content-Type', /json/)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(minimalMovie.title);
            expect(response.body.data.durationMinutes).toBe(minimalMovie.durationMinutes);
            expect(response.body.data.status).toBe("coming_soon"); // default value

            createdMovieIds.push(response.body.data.id);
        });

        it("should return 201 with valid posterUrl", async () => {
            const movieWithPoster = {
                title: "Movie With Poster",
                durationMinutes: 100,
                posterUrl: "https://example.com/poster.jpg",
            };

            const response = await request(app)
                .post('/api/v1/admin/movies')
                .set('Authorization', `Bearer ${adminContext.token}`)
                .send(movieWithPoster)
                .expect('Content-Type', /json/)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.posterUrl).toBe(movieWithPoster.posterUrl);

            createdMovieIds.push(response.body.data.id);
        });

        it("should return 401 without authentication token", async () => {
            const response = await request(app)
                .post('/api/v1/admin/movies')
                .send(validMovie)
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('AUTH_REQUIRED');
        });

        it("should return 403 when non-admin user tries to create movie", async () => {
            const response = await request(app)
                .post('/api/v1/admin/movies')
                .set('Authorization', `Bearer ${userContext.token}`)
                .send(validMovie)
                .expect('Content-Type', /json/)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('ADMIN_REQUIRED');
        });

        it("should return 400 when title is missing", async () => {
            const response = await request(app)
                .post('/api/v1/admin/movies')
                .set('Authorization', `Bearer ${adminContext.token}`)
                .send({ durationMinutes: 120 })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it("should return 400 when durationMinutes is missing", async () => {
            const response = await request(app)
                .post('/api/v1/admin/movies')
                .set('Authorization', `Bearer ${adminContext.token}`)
                .send({ title: "Movie Without Duration" })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it("should return 400 when title is empty string", async () => {
            const response = await request(app)
                .post('/api/v1/admin/movies')
                .set('Authorization', `Bearer ${adminContext.token}`)
                .send({ title: "", durationMinutes: 120 })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it("should return 400 when durationMinutes is negative", async () => {
            const response = await request(app)
                .post('/api/v1/admin/movies')
                .set('Authorization', `Bearer ${adminContext.token}`)
                .send({ title: "Negative Duration Movie", durationMinutes: -10 })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it("should return 400 when durationMinutes is zero", async () => {
            const response = await request(app)
                .post('/api/v1/admin/movies')
                .set('Authorization', `Bearer ${adminContext.token}`)
                .send({ title: "Zero Duration Movie", durationMinutes: 0 })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it("should return 400 when status is invalid", async () => {
            const response = await request(app)
                .post('/api/v1/admin/movies')
                .set('Authorization', `Bearer ${adminContext.token}`)
                .send({ title: "Invalid Status Movie", durationMinutes: 120, status: "invalid_status" })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it("should return 400 when posterUrl is invalid URL", async () => {
            const response = await request(app)
                .post('/api/v1/admin/movies')
                .set('Authorization', `Bearer ${adminContext.token}`)
                .send({ title: "Invalid Poster Movie", durationMinutes: 120, posterUrl: "not-a-url" })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it("should return 400 for empty request body", async () => {
            const response = await request(app)
                .post('/api/v1/admin/movies')
                .set('Authorization', `Bearer ${adminContext.token}`)
                .send({})
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe("PUT /api/v1/admin/movies/:id", () => {
        let testMovieId: string;

        beforeAll(async () => {
            // Create a movie to update
            const response = await request(app)
                .post('/api/v1/admin/movies')
                .set('Authorization', `Bearer ${adminContext.token}`)
                .send({
                    title: "Movie To Update",
                    durationMinutes: 100,
                    description: "Original description",
                    genre: "Drama",
                    status: "coming_soon",
                })
                .expect(201);

            testMovieId = response.body.data.id;
            createdMovieIds.push(testMovieId);
        });

        it("should return 200 on successful title update", async () => {
            const response = await request(app)
                .put(`/api/v1/admin/movies/${testMovieId}`)
                .set('Authorization', `Bearer ${adminContext.token}`)
                .send({ title: "Updated Movie Title" })
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe("Updated Movie Title");
        });

        it("should return 200 on successful multiple fields update", async () => {
            const updates = {
                description: "Updated description",
                durationMinutes: 150,
                genre: "Comedy",
                status: "now_showing",
            };

            const response = await request(app)
                .put(`/api/v1/admin/movies/${testMovieId}`)
                .set('Authorization', `Bearer ${adminContext.token}`)
                .send(updates)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.description).toBe(updates.description);
            expect(response.body.data.durationMinutes).toBe(updates.durationMinutes);
            expect(response.body.data.genre).toBe(updates.genre);
            expect(response.body.data.status).toBe(updates.status);
        });

        it("should return 401 without authentication token", async () => {
            const response = await request(app)
                .put(`/api/v1/admin/movies/${testMovieId}`)
                .send({ title: "Unauthorized Update" })
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('AUTH_REQUIRED');
        });

        it("should return 403 when non-admin user tries to update movie", async () => {
            const response = await request(app)
                .put(`/api/v1/admin/movies/${testMovieId}`)
                .set('Authorization', `Bearer ${userContext.token}`)
                .send({ title: "Non-Admin Update" })
                .expect('Content-Type', /json/)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('ADMIN_REQUIRED');
        });

        it("should return 404 for non-existent movie id", async () => {
            const fakeId = "00000000-0000-0000-0000-000000000000";
            const response = await request(app)
                .put(`/api/v1/admin/movies/${fakeId}`)
                .set('Authorization', `Bearer ${adminContext.token}`)
                .send({ title: "Update Non-Existent" })
                .expect('Content-Type', /json/)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('MOVIE_NOT_FOUND');
        });

        it("should return 400 for invalid UUID format", async () => {
            const response = await request(app)
                .put('/api/v1/admin/movies/invalid-uuid')
                .set('Authorization', `Bearer ${adminContext.token}`)
                .send({ title: "Invalid UUID Update" })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it("should return 400 when title is empty string", async () => {
            const response = await request(app)
                .put(`/api/v1/admin/movies/${testMovieId}`)
                .set('Authorization', `Bearer ${adminContext.token}`)
                .send({ title: "" })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it("should return 400 when durationMinutes is negative", async () => {
            const response = await request(app)
                .put(`/api/v1/admin/movies/${testMovieId}`)
                .set('Authorization', `Bearer ${adminContext.token}`)
                .send({ durationMinutes: -5 })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it("should return 400 when status is invalid", async () => {
            const response = await request(app)
                .put(`/api/v1/admin/movies/${testMovieId}`)
                .set('Authorization', `Bearer ${adminContext.token}`)
                .send({ status: "invalid_status" })
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe("DELETE /api/v1/admin/movies/:id", () => {
        let movieToDeleteId: string;

        beforeEach(async () => {
            // Create a movie to delete for each test
            const response = await request(app)
                .post('/api/v1/admin/movies')
                .set('Authorization', `Bearer ${adminContext.token}`)
                .send({
                    title: "Movie To Delete",
                    durationMinutes: 90,
                })
                .expect(201);

            movieToDeleteId = response.body.data.id;
        });

        it("should return 200 on successful movie deletion", async () => {
            const response = await request(app)
                .delete(`/api/v1/admin/movies/${movieToDeleteId}`)
                .set('Authorization', `Bearer ${adminContext.token}`)
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify movie is deleted
            const deletedMovie = await movieRepository.findById(movieToDeleteId);
            expect(deletedMovie).toBeNull();
        });

        it("should return 401 without authentication token", async () => {
            const response = await request(app)
                .delete(`/api/v1/admin/movies/${movieToDeleteId}`)
                .expect('Content-Type', /json/)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('AUTH_REQUIRED');

            // Cleanup since delete failed
            createdMovieIds.push(movieToDeleteId);
        });

        it("should return 403 when non-admin user tries to delete movie", async () => {
            const response = await request(app)
                .delete(`/api/v1/admin/movies/${movieToDeleteId}`)
                .set('Authorization', `Bearer ${userContext.token}`)
                .expect('Content-Type', /json/)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('ADMIN_REQUIRED');

            createdMovieIds.push(movieToDeleteId);
        });

        it("should return 404 for non-existent movie id", async () => {
            const fakeId = "00000000-0000-0000-0000-000000000000";
            const response = await request(app)
                .delete(`/api/v1/admin/movies/${fakeId}`)
                .set('Authorization', `Bearer ${adminContext.token}`)
                .expect('Content-Type', /json/)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('MOVIE_NOT_FOUND');

            // Cleanup the movie we created in beforeEach
            createdMovieIds.push(movieToDeleteId);
        });

        it("should return 400 for invalid UUID format", async () => {
            const response = await request(app)
                .delete('/api/v1/admin/movies/invalid-uuid')
                .set('Authorization', `Bearer ${adminContext.token}`)
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error');

            createdMovieIds.push(movieToDeleteId);
        });
    });
});
