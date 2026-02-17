import { post, parseJson, isSuccess } from './api.js';

// Store tokens in a shared object (per VU)
const tokenCache = {};

/**
 * Login a user and return the token
 * @param {string} email
 * @param {string} password
 * @returns {string|null} JWT token or null if login failed
 */
export function login(email, password) {
    const response = post('/auth/login', { email, password }, {
        tags: { name: 'login' },
    });

    if (isSuccess(response)) {
        const data = parseJson(response);
        if (data && data.token) {
            tokenCache[email] = data.token;
            return data.token;
        }
    }

    console.error(`Login failed for ${email}: ${response.status} - ${response.body}`);
    return null;
}

/**
 * Register a new user
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {object|null} User data or null if registration failed
 */
export function register(name, email, password) {
    const response = post('/auth/register', { name, email, password }, {
        tags: { name: 'register' },
    });

    if (isSuccess(response)) {
        const data = parseJson(response);
        if (data && data.token) {
            tokenCache[email] = data.token;
            return data;
        }
    }

    // 409 means user already exists - try to login instead
    if (response.status === 409) {
        const token = login(email, password);
        if (token) {
            return { token, email };
        }
    }

    console.error(`Registration failed for ${email}: ${response.status} - ${response.body}`);
    return null;
}

/**
 * Get cached token for a user
 * @param {string} email
 * @returns {string|null}
 */
export function getCachedToken(email) {
    return tokenCache[email] || null;
}

/**
 * Get or create token for a test user
 * @param {number} userIndex - Index of test user (1-20)
 * @returns {string|null}
 */
export function getTestUserToken(userIndex) {
    const email = `k6user${userIndex}@test.com`;
    const password = 'testpass123';

    // Check cache first
    let token = getCachedToken(email);
    if (token) {
        return token;
    }

    // Try to login
    token = login(email, password);
    if (token) {
        return token;
    }

    // If login fails, user might not exist - try register
    const result = register(`K6 Test User ${userIndex}`, email, password);
    return result ? result.token : null;
}

/**
 * Generate test user credentials
 * @param {number} userIndex
 * @returns {object} { email, password, name }
 */
export function getTestUserCredentials(userIndex) {
    return {
        email: `k6user${userIndex}@test.com`,
        password: 'testpass123',
        name: `K6 Test User ${userIndex}`,
    };
}

/**
 * Login multiple test users and return their tokens
 * @param {number} count - Number of users to login
 * @returns {string[]} Array of tokens
 */
export function loginTestUsers(count) {
    const tokens = [];
    for (let i = 1; i <= count; i++) {
        const token = getTestUserToken(i);
        if (token) {
            tokens.push(token);
        }
    }
    return tokens;
}
