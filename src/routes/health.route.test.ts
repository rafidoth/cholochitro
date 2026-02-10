import request from 'supertest'
import createApp from "@/app"
const app = createApp()


describe('health check', () => {
    describe('GET /api/v1/health', () => {
        it('should return success by checking db health', async () => {
            const response = await request(app)
                .get('/api/v1/health')
                .expect('Content-Type', /json/)
                .expect(200);
            expect(response.body.status).toBe("OK")
        });
    });
})

