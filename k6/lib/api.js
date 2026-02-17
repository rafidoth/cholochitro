import http from 'k6/http';
import { API_BASE } from '../config/options.js';


const defaultHeaders = {
    'Content-Type': 'application/json',
};

/**
 * Make a GET request
 * @param {string} endpoint - API endpoint (e.g., '/health')
 * @param {object} params - Additional parameters (headers, tags, etc.)
 * @returns {http.Response}
 */
export function get(endpoint, params = {}) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
        headers: { ...defaultHeaders, ...params.headers },
        tags: params.tags || {},
    };
    return http.get(url, options);
}

/**
 * Make a POST request
 * @param {string} endpoint - API endpoint
 * @param {object} body - Request body (will be JSON stringified)
 * @param {object} params - Additional parameters
 * @returns {http.Response}
 */
export function post(endpoint, body = {}, params = {}) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
        headers: { ...defaultHeaders, ...params.headers },
        tags: params.tags || {},
    };
    return http.post(url, JSON.stringify(body), options);
}

/**
 * Make an authenticated GET request
 * @param {string} endpoint - API endpoint
 * @param {string} token - JWT token
 * @param {object} params - Additional parameters
 * @returns {http.Response}
 */
export function authGet(endpoint, token, params = {}) {
    return get(endpoint, {
        ...params,
        headers: {
            ...params.headers,
            Authorization: `Bearer ${token}`,
        },
    });
}

/**
 * Make an authenticated POST request
 * @param {string} endpoint - API endpoint
 * @param {object} body - Request body
 * @param {string} token - JWT token
 * @param {object} params - Additional parameters
 * @returns {http.Response}
 */
export function authPost(endpoint, body, token, params = {}) {
    return post(endpoint, body, {
        ...params,
        headers: {
            ...params.headers,
            Authorization: `Bearer ${token}`,
        },
    });
}

/**
 * Make an authenticated DELETE request
 * @param {string} endpoint - API endpoint
 * @param {string} token - JWT token
 * @param {object} params - Additional parameters
 * @returns {http.Response}
 */
export function authDelete(endpoint, token, params = {}) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
        headers: {
            ...defaultHeaders,
            ...params.headers,
            Authorization: `Bearer ${token}`,
        },
        tags: params.tags || {},
    };
    return http.del(url, null, options);
}

/**
 * Make an authenticated PUT request
 * @param {string} endpoint - API endpoint
 * @param {object} body - Request body
 * @param {string} token - JWT token
 * @param {object} params - Additional parameters
 * @returns {http.Response}
 */
export function authPut(endpoint, body, token, params = {}) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
        headers: {
            ...defaultHeaders,
            ...params.headers,
            Authorization: `Bearer ${token}`,
        },
        tags: params.tags || {},
    };
    return http.put(url, JSON.stringify(body), options);
}

/**
 * Parse JSON response safely
 * @param {http.Response} response
 * @returns {object|null}
 */
export function parseJson(response) {
    try {
        return response.json();
    } catch (e) {
        console.error(`Failed to parse JSON: ${e.message}`);
        return null;
    }
}

/**
 * Check if response is successful (2xx status)
 * @param {http.Response} response
 * @returns {boolean}
 */
export function isSuccess(response) {
    return response.status >= 200 && response.status < 300;
}

/**
 * Check if response is a specific status
 * @param {http.Response} response
 * @param {number} status
 * @returns {boolean}
 */
export function isStatus(response, status) {
    return response.status === status;
}
