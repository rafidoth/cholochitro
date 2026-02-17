/**
 * K6 Load Test - Seed Data Script
 * 
 * This script seeds test data using the admin API endpoints.
 * It logs in as admin, creates test movies, showtimes, and test users.
 * 
 * Run this BEFORE executing k6 load tests:
 *   node k6/data/seed-data.js
 * Or:
 *   pnpm k6:seed
 * 
 * Prerequisites:
 *   - Backend must be running (pnpm docker)
 *   - Migrations must be applied (admin user exists)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4001';
const API_BASE = `${BASE_URL}/api/v1`;

// Admin credentials (from migration)
const ADMIN_EMAIL = 'admin1@cholochitro.com';
const ADMIN_PASSWORD = 'admin';

// Test data configuration
const NUM_TEST_USERS = 20;

async function request(method, endpoint, body = null, token = null) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json().catch(() => null);

    return { status: response.status, data };
}

async function login(email, password) {
    const { status, data } = await request('POST', '/auth/login', { email, password });
    if (status === 200 && data?.data?.token) {
        return data.data.token;
    }
    throw new Error(`Login failed for ${email}: ${status} - ${JSON.stringify(data)}`);
}

async function register(name, email, password) {
    const { status, data } = await request('POST', '/auth/register', {
        displayName: name,
        email,
        password
    });

    if (status === 201 && data?.success) {
        return { user: data.data };
    }

    // User might already exist
    if (status === 409) {
        console.log(`User ${email} already exists, skipping...`);
        return null;
    }

    throw new Error(`Registration failed for ${email}: ${status} - ${JSON.stringify(data)}`);
}

// Get today's date in YYYY-MM-DD format
function getDate(daysOffset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
}

// Get date-time in ISO format
function getDateTime(daysOffset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString();
}

// Test Movies Data
const testMovies = [
    {
        title: 'K6 Test Movie - Action',
        description: 'A high-octane action movie for load testing purposes.',
        durationMinutes: 120,
        genre: 'Action',
        posterUrl: 'https://via.placeholder.com/300x450?text=K6+Action',
        status: 'now_showing',
        releaseDate: getDateTime(-7),
    },
    {
        title: 'K6 Test Movie - Drama',
        description: 'An emotional drama for load testing purposes.',
        durationMinutes: 135,
        genre: 'Drama',
        posterUrl: 'https://via.placeholder.com/300x450?text=K6+Drama',
        status: 'now_showing',
        releaseDate: getDateTime(-14),
    },
    {
        title: 'K6 Test Movie - Comedy',
        description: 'A hilarious comedy for load testing purposes.',
        durationMinutes: 95,
        genre: 'Comedy',
        posterUrl: 'https://via.placeholder.com/300x450?text=K6+Comedy',
        status: 'now_showing',
        releaseDate: getDateTime(-3),
    },
    {
        title: 'K6 Test Movie - Sci-Fi',
        description: 'An upcoming sci-fi movie for load testing purposes.',
        durationMinutes: 110,
        genre: 'Sci-Fi',
        posterUrl: 'https://via.placeholder.com/300x450?text=K6+SciFi',
        status: 'coming_soon',
        releaseDate: getDateTime(30),
    },
];

// Showtime configurations (will be created for each movie)
const showtimeConfigs = [
    { dayOffset: 0, time: '10:00', price: 350 },
    { dayOffset: 0, time: '14:00', price: 400 },
    { dayOffset: 0, time: '18:00', price: 450 },
    { dayOffset: 0, time: '21:00', price: 400 },
    { dayOffset: 1, time: '10:00', price: 350 },
    { dayOffset: 1, time: '14:00', price: 400 },
    { dayOffset: 1, time: '18:00', price: 450 },
    { dayOffset: 2, time: '12:00', price: 380 },
    { dayOffset: 2, time: '16:00', price: 420 },
];

async function seedMovies(adminToken) {
    console.log('\n📽️  Creating test movies...');
    const createdMovies = [];
    for (const movie of testMovies) {
        const { status, data } = await request('POST', '/admin/movies', movie, adminToken);
        const payload = data.data
        if (status === 201) {
            console.log(`  ✅ Created: ${movie.title} (ID: ${payload.id})`);
            createdMovies.push(payload);
        } else if (status === 409 || (data?.message?.includes('exists'))) {
            console.log(`  ⏭️  Skipped (exists): ${movie.title}`);
            // Try to find existing movie
            const { payload: listData } = await request('GET', '/movies?limit=100');
            const existing = listData?.movies?.find(m => m.title === movie.title);
            if (existing) {
                createdMovies.push(existing);
            }
        } else {
            console.log(`  ❌ Failed: ${movie.title} - ${status} - ${JSON.stringify(data)}`);
        }
    }
    return createdMovies;
}

async function seedShowtimes(adminToken, movies) {
    console.log('\n🎬 Creating showtimes...');
    const createdShowtimes = [];

    // Only create showtimes for "now_showing" movies
    const nowShowingMovies = movies.filter(m => m.status === 'now_showing');

    for (const movie of nowShowingMovies) {
        console.log(`  For movie: ${movie.title}`);

        for (const config of showtimeConfigs) {
            const showtime = {
                movieId: movie.id,
                showDate: getDate(config.dayOffset),
                showTime: config.time,
                price: config.price,
            };

            const { status, data } = await request('POST', '/admin/showtimes', showtime, adminToken);

            if (status === 201) {
                console.log(`    ✅ ${showtime.showDate} ${showtime.showTime} - $${showtime.price}`);
                createdShowtimes.push(data);
            } else if (status === 409) {
                console.log(`    ⏭️  Skipped (exists): ${showtime.showDate} ${showtime.showTime}`);
            } else {
                console.log(`    ❌ Failed: ${showtime.showDate} ${showtime.showTime} - ${status}`);
            }
        }
    }

    return createdShowtimes;
}

async function seedTestUsers() {
    console.log(`\n=>>Creating ${NUM_TEST_USERS} test users...`);
    const createdUsers = [];

    for (let i = 1; i <= NUM_TEST_USERS; i++) {
        const name = `K6 Test User ${i}`;
        const email = `k6user${i}@test.com`;
        const password = 'testpass123';

        try {
            const result = await register(name, email, password);
            if (result) {
                console.log(`SUCCESS : Created: ${email}`);
                createdUsers.push({ email, password });
            } else {
                // User exists, still track it
                createdUsers.push({ email, password });
            }
        } catch (error) {
            console.log(`  FAIL :  ${email} - ${error.message}`);
        }
    }

    return createdUsers;
}

async function verifyData() {
    console.log('\n🔍 Verifying seeded data...');

    // Check movies
    const { status: moviesStatus, data: dataM } = await request('GET', '/movies?limit=100');
    const moviesData = dataM.data
    const k6Movies = moviesData?.movies?.filter(m => m.title.startsWith('K6 Test')) || [];
    console.log(`  Movies: ${k6Movies.length} K6 test movies found`);

    // Check showtimes
    const { status: showtimesStatus, data: dataS } = await request('GET', '/showtimes?limit=100');
    const showtimesData = dataS.data
    console.log(`  Showtimes: ${showtimesData?.showtimes?.length || 0} total showtimes`);

    // Check a showtime's seat availability
    if (showtimesData?.showtimes?.length > 0) {
        const firstShowtime = showtimesData.showtimes[0];
        const { data: seatsData } = await request('GET', `/showtimes/${firstShowtime.id}/seats`);
        console.log(`  Seats: ${seatsData?.availableSeats?.length || 0} available for first showtime`);
    }

    return {
        movies: k6Movies,
        showtimes: showtimesData?.showtimes || [],
    };
}

async function main() {
    console.log('='.repeat(60));
    console.log('K6 LOAD TEST - SEED DATA SCRIPT');
    console.log('='.repeat(60));
    console.log(`\nTarget: ${API_BASE}`);

    try {
        // Login as admin
        console.log('\n=>Logging in as admin...');
        const adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('=> Admin login successful');

        // Create test movies
        const movies = await seedMovies(adminToken);

        // Create showtimes for movies
        const showtimes = await seedShowtimes(adminToken, movies);

        // Create test users
        const users = await seedTestUsers();

        // Verify data
        const verification = await verifyData();
        const moviesOkay = verification.movies.length === movies.length
        const showtimesOkay = verification.showtimes.length === showtimes.length

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('SEED COMPLETE');
        console.log('='.repeat(60));
        console.log(`  Movies created/found: ${movies.length} & matched with verification : ${moviesOkay ? "YES" : "NO"}`);
        console.log(`  Showtimes created: ${showtimes.length} & matched with verification : ${showtimesOkay ? "YES" : "NO"}`);
        console.log(`  Test users: ${users.length}`);
        console.log('='.repeat(60));
        console.log('  pnpm k6:health    # Health check');
        console.log('  pnpm k6:race      # Race condition test');
        console.log('  pnpm k6:journey   # Full journey test');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Seed failed:', error.message);
        console.error('\nMake sure:');
        console.error('  1. Backend is running: pnpm docker');
        console.error('  2. Migrations are applied');
        console.error('  3. Admin user exists (from migration)');
        process.exit(1);
    }
}

main();
