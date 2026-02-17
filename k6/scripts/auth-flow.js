import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { post, isSuccess, isStatus, parseJson } from '../lib/api.js';
import { login, getTestUserCredentials } from '../lib/auth.js';
import { getProfile, getThresholds } from '../config/options.js';

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
            return body && body.data.token;
        },
        'login time < 500ms': () => loginTime < 500,
    });

    if (loginChecks) {
        loginSuccess.add(1);
    } else {
        loginFailure.add(1);
    }

    sleep(0.5);
}

export function setup() {
    console.log('Starting authentication flow test...');
    console.log('This test will attempt to login/register test users.');
    console.log('Make sure test users are seeded: pnpm k6:seed');
}

export function teardown() {
    console.log('Authentication flow test completed.');
}
