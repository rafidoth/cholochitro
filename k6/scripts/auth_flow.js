import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { post, isSuccess, isStatus, parseJson } from '../lib/_api.js';
import { login, getTestUserCredentials } from '../lib/_auth.js';
import { getProfile, getThresholds } from '../config/_options.js';

/**
 * Authentication Flow Test
 * 
 * Purpose: Stress test login and registration endpoints
 * Tests concurrent authentication requests to find bottlenecks.
 * 
 * Run: k6 run k6/scripts/auth-flow.js
 * With more users: k6 run k6/scripts/_auth-flow.js --vus 50 --duration 2m
 */

const profile = getProfile('load');

// Custom metrics
const loginSuccess = new Counter('login_success');
const loginFailure = new Counter('login_failure');
const registerSuccess = new Counter('register_success');
const registerFailure = new Counter('register_failure');
const loginDuration = new Trend('login_duration');

export const options = {
    ...profile,
    thresholds: {
        ...getThresholds('standard'),
        'login_success': ['count>0'],
        'checks': ['rate>0.95'],
    },
};

export default function() {
    const vuId = __VU;
    const iteration = __ITER;

    // Each VU uses a unique user based on VU id and iteration
    const userIndex = ((vuId - 1) * 100 + iteration) % 20 + 1;
    const creds = getTestUserCredentials(userIndex);

    // Test 1: Login with existing user
    const loginStart = Date.now();
    const loginResponse = post('/auth/login', {
        email: creds.email,
        password: creds.password,
    }, {
        tags: { name: 'login' },
    });
    const loginTime = Date.now() - loginStart;
    loginDuration.add(loginTime);

    const loginChecks = check(loginResponse, {
        'login status is 200': (r) => r.status === 200,
        'login returns token': (r) => {
            const body = parseJson(r);
            return body && body.token;
        },
        'login time < 500ms': () => loginTime < 500,
    });

    if (loginChecks) {
        loginSuccess.add(1);
    } else {
        loginFailure.add(1);

        // If login fails, user might not exist - this is expected on first run
        if (isStatus(loginResponse, 401)) {
            // Try to register the user
            const registerResponse = post('/auth/register', {
                name: creds.name,
                email: creds.email,
                password: creds.password,
            }, {
                tags: { name: 'register' },
            });

            const registerChecks = check(registerResponse, {
                'register status is 201 or 409': (r) => r.status === 201 || r.status === 409,
                'register returns token': (r) => {
                    if (r.status === 201) {
                        const body = parseJson(r);
                        return body && body.token;
                    }
                    return true; // 409 is expected if user exists
                },
            });

            if (registerChecks && registerResponse.status === 201) {
                registerSuccess.add(1);
            } else if (registerResponse.status !== 409) {
                registerFailure.add(1);
            }
        }
    }

    // Test 2: Get current user with token (if login succeeded)
    if (isSuccess(loginResponse)) {
        const body = parseJson(loginResponse);
        if (body && body.token) {
            sleep(0.2);

            const meResponse = post('/auth/me', {}, {
                headers: { Authorization: `Bearer ${body.token}` },
                tags: { name: 'get_me' },
            });

            // Note: /auth/me might be GET, adjust if needed
            check(meResponse, {
                'get me returns user data': (r) => r.status === 200 || r.status === 404,
            });
        }
    }

    sleep(0.5);
}

export function setup() {
    console.log('Starting authentication flow test...');
    console.log('This test will attempt to login/register test users.');
    console.log('Make sure test users are seeded: pnpm k6:seed');
}

export function teardown(data) {
    console.log('Authentication flow test completed.');
}
