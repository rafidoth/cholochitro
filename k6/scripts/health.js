import { check, sleep } from 'k6';
import { get, isSuccess } from '../lib/api.js';
import { getProfile, getThresholds } from '../config/options.js';

/**
 * Health Check Test
 * 
 * Purpose: Baseline test to verify backend and database connectivity
 * Use this to validate your setup before running other tests.
 * 
 * Run: k6 run k6/scripts/health.js
 * With profile: k6 run k6/scripts/health.js -e PROFILE=load
 */

const profile = getProfile('smoke');

export const options = {
    ...profile,
    thresholds: {
        ...getThresholds('strict'),
        'checks': ['rate>0.99'],  // 99% of checks must pass
    },
};

export default function() {
    // Test health endpoint
    const response = get('/health', {
        tags: { name: 'health_check' },
    });

    // Validate response
    check(response, {
        'status is 200': (r) => r.status === 200,
        'response time < 200ms': (r) => r.timings.duration < 200,
        'has status OK': (r) => {
            try {
                const body = r.json();
                return body.status === 'OK';
            } catch (e) {
                return false;
            }
        },
    });

    sleep(0.5);
}

// setup function runs once before all VUs start
export function setup() {
    console.log('Starting health check test...');
    console.log('Testing endpoint: /api/v1/health');

    // Verify backend is reachable
    const response = get('/health');
    if (!isSuccess(response)) {
        throw new Error(`Backend not reachable: ${response.status}`);
    }

    console.log('Backend is reachable. Starting load test...');
}

//teardown runs once after all VUs finish
export function teardown(data) {
    console.log('Health check test completed.');
}
