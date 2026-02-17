export const profiles = {
    // Quick smoke test - verify everything works
    smoke: {
        vus: 1,
        duration: '30s',
    },

    // Light load - development validation
    dev: {
        vus: 5,
        duration: '1m',
    },

    // Normal load test
    load: {
        stages: [
            { duration: '30s', target: 10 },  // Ramp up
            { duration: '1m', target: 10 },   // Stay at 10 VUs
            { duration: '30s', target: 0 },   // Ramp down
        ],
    },

    // Stress test - find breaking points
    stress: {
        stages: [
            { duration: '1m', target: 20 },   // Ramp up
            { duration: '2m', target: 50 },   // Push higher
            { duration: '2m', target: 100 },  // Peak load
            { duration: '1m', target: 0 },    // Ramp down
        ],
    },

    // Spike test - sudden load increase
    spike: {
        stages: [
            { duration: '10s', target: 5 },   // Normal load
            { duration: '10s', target: 50 },  // Spike!
            { duration: '30s', target: 50 },  // Stay at spike
            { duration: '10s', target: 5 },   // Back to normal
            { duration: '30s', target: 5 },   // Stay at normal
        ],
    },

    // Race condition test - concurrent access
    race: {
        vus: 10,
        iterations: 10,  // Each VU runs once simultaneously
    },
};

export const thresholds = {
    // Response time thresholds
    standard: {
        http_req_duration: ['p(95)<500', 'p(99)<1000'],
        http_req_failed: ['rate<0.01'],  // Less than 1% errors
    },

    // Strict thresholds for critical paths
    strict: {
        http_req_duration: ['p(95)<200', 'p(99)<500'],
        http_req_failed: ['rate<0.001'],  // Less than 0.1% errors
    },

    // Relaxed thresholds for stress tests
    relaxed: {
        http_req_duration: ['p(95)<2000', 'p(99)<5000'],
        http_req_failed: ['rate<0.05'],  // Less than 5% errors
    },
};

// Base URL configuration
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:4001';
export const API_BASE = `${BASE_URL}/api/v1`;

// Test data configuration
export const TEST_SHOWTIME_ID = __ENV.TEST_SHOWTIME_ID || null;  // Set by seed data
export const RACE_TEST_SEATS = ['A1', 'A2', 'A3', 'A4', 'A5'];

// Utility to get profile from environment
export function getProfile(defaultProfile = 'dev') {
    const profileName = __ENV.PROFILE || defaultProfile;
    return profiles[profileName] || profiles.dev;
}

// Utility to get thresholds from environment
export function getThresholds(defaultThreshold = 'standard') {
    const thresholdName = __ENV.THRESHOLD || defaultThreshold;
    return thresholds[thresholdName] || thresholds.standard;
}
