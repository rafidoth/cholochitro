import { check, sleep, group } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { get, parseJson, isSuccess } from '../lib/_api.js';
import { getProfile, getThresholds } from '../config/_options.js';

/**
 * Read-Heavy Test
 * 
 * Purpose: Test read performance for movies, showtimes, and seat availability
 * Simulates users browsing the catalog without making bookings.
 * 
 * Run: k6 run k6/scripts/_read-heavy.js
 * With higher load: k6 run k6/scripts/_read-heavy.js -e PROFILE=stress
 */

const profile = getProfile('load');

// Custom metrics
const moviesListDuration = new Trend('movies_list_duration');
const showtimesListDuration = new Trend('showtimes_list_duration');
const seatsCheckDuration = new Trend('seats_check_duration');
const apiErrors = new Counter('api_errors');

export const options = {
  ...profile,
  thresholds: {
    ...getThresholds('standard'),
    'movies_list_duration': ['p(95)<300'],
    'showtimes_list_duration': ['p(95)<300'],
    'seats_check_duration': ['p(95)<500'],
    'checks': ['rate>0.98'],
  },
};

// Shared data from setup
let testData = {
  movieIds: [],
  showtimeIds: [],
};

export function setup() {
  console.log('Setting up read-heavy test...');
  
  // Fetch movies to get IDs for subsequent requests
  const moviesResponse = get('/movies?limit=10');
  if (isSuccess(moviesResponse)) {
    const data = parseJson(moviesResponse);
    if (data && data.movies) {
      testData.movieIds = data.movies.map(m => m.id);
      console.log(`Found ${testData.movieIds.length} movies`);
    }
  }

  // Fetch showtimes to get IDs
  const showtimesResponse = get('/showtimes?limit=10');
  if (isSuccess(showtimesResponse)) {
    const data = parseJson(showtimesResponse);
    if (data && data.showtimes) {
      testData.showtimeIds = data.showtimes.map(s => s.id);
      console.log(`Found ${testData.showtimeIds.length} showtimes`);
    }
  }

  if (testData.movieIds.length === 0 || testData.showtimeIds.length === 0) {
    console.warn('No movies or showtimes found. Run seed script first: pnpm k6:seed');
  }

  return testData;
}

export default function (data) {
  const movieIds = data.movieIds || [];
  const showtimeIds = data.showtimeIds || [];

  // Group 1: List movies with pagination
  group('Browse Movies', () => {
    const page = Math.floor(Math.random() * 3) + 1;
    const start = Date.now();
    
    const response = get(`/movies?page=${page}&limit=10`, {
      tags: { name: 'list_movies' },
    });
    
    moviesListDuration.add(Date.now() - start);

    const success = check(response, {
      'movies list returns 200': (r) => r.status === 200,
      'movies list has data': (r) => {
        const body = parseJson(r);
        return body && Array.isArray(body.movies);
      },
      'movies list has pagination': (r) => {
        const body = parseJson(r);
        return body && typeof body.total === 'number';
      },
    });

    if (!success) apiErrors.add(1);
  });

  sleep(0.3);

  // Group 2: Get single movie details
  if (movieIds.length > 0) {
    group('View Movie Details', () => {
      const movieId = movieIds[Math.floor(Math.random() * movieIds.length)];
      
      const response = get(`/movies/${movieId}`, {
        tags: { name: 'get_movie' },
      });

      const success = check(response, {
        'movie details returns 200': (r) => r.status === 200,
        'movie has required fields': (r) => {
          const body = parseJson(r);
          return body && body.id && body.title;
        },
      });

      if (!success) apiErrors.add(1);
    });

    sleep(0.2);

    // Group 3: Get movie showtimes
    group('View Movie Showtimes', () => {
      const movieId = movieIds[Math.floor(Math.random() * movieIds.length)];
      const start = Date.now();
      
      const response = get(`/movies/${movieId}/showtimes`, {
        tags: { name: 'movie_showtimes' },
      });
      
      showtimesListDuration.add(Date.now() - start);

      const success = check(response, {
        'movie showtimes returns 200': (r) => r.status === 200,
        'showtimes is array': (r) => {
          const body = parseJson(r);
          return body && Array.isArray(body.showtimes);
        },
      });

      if (!success) apiErrors.add(1);
    });
  }

  sleep(0.3);

  // Group 4: List all showtimes
  group('Browse Showtimes', () => {
    const start = Date.now();
    
    const response = get('/showtimes?limit=20', {
      tags: { name: 'list_showtimes' },
    });
    
    showtimesListDuration.add(Date.now() - start);

    const success = check(response, {
      'showtimes list returns 200': (r) => r.status === 200,
      'showtimes list has data': (r) => {
        const body = parseJson(r);
        return body && Array.isArray(body.showtimes);
      },
    });

    if (!success) apiErrors.add(1);
  });

  sleep(0.2);

  // Group 5: Check seat availability (critical for booking flow)
  if (showtimeIds.length > 0) {
    group('Check Seat Availability', () => {
      const showtimeId = showtimeIds[Math.floor(Math.random() * showtimeIds.length)];
      const start = Date.now();
      
      const response = get(`/showtimes/${showtimeId}/seats`, {
        tags: { name: 'seat_availability' },
      });
      
      seatsCheckDuration.add(Date.now() - start);

      const success = check(response, {
        'seats returns 200': (r) => r.status === 200,
        'has available seats': (r) => {
          const body = parseJson(r);
          return body && Array.isArray(body.availableSeats);
        },
        'has booked seats': (r) => {
          const body = parseJson(r);
          return body && Array.isArray(body.bookedSeats);
        },
        'has total seats count': (r) => {
          const body = parseJson(r);
          return body && body.totalSeats === 100;  // 10x10 grid
        },
      });

      if (!success) apiErrors.add(1);
    });
  }

  sleep(0.5);
}

export function teardown(data) {
  console.log('Read-heavy test completed.');
}
