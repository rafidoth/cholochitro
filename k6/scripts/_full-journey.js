import { check, sleep, group } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { get, post, authGet, authPost, authDelete, parseJson, isSuccess } from '../lib/_api.js';
import { getTestUserCredentials } from '../lib/_auth.js';
import { getProfile, getThresholds } from '../config/_options.js';

/**
 * Full User Journey Test
 * 
 * Purpose: End-to-end test simulating complete user flow
 * Login -> Browse Movies -> Select Showtime -> Check Seats -> Book -> Confirm
 * 
 * Run: k6 run k6/scripts/_full-journey.js
 * With profile: k6 run k6/scripts/_full-journey.js -e PROFILE=load
 */

const profile = getProfile('load');

// Custom metrics
const journeySuccess = new Counter('journey_success');
const journeyFailure = new Counter('journey_failure');
const bookingCreated = new Counter('booking_created');
const bookingConfirmed = new Counter('booking_confirmed');
const journeyDuration = new Trend('journey_duration');

export const options = {
  ...profile,
  thresholds: {
    ...getThresholds('relaxed'),
    'journey_success': ['count>0'],
    'journey_duration': ['p(95)<5000'],
    'checks': ['rate>0.8'],
  },
};

// Shared data
let availableShowtimes = [];

export function setup() {
  console.log('Setting up full journey test...');
  
  // Get available showtimes
  const response = get('/showtimes?limit=10');
  if (isSuccess(response)) {
    const data = parseJson(response);
    if (data && data.showtimes) {
      availableShowtimes = data.showtimes;
      console.log(`Found ${availableShowtimes.length} showtimes`);
    }
  }

  if (availableShowtimes.length === 0) {
    console.warn('No showtimes found. Run seed script: pnpm k6:seed');
  }

  return { showtimes: availableShowtimes };
}

export default function (data) {
  const vuId = __VU;
  const iteration = __ITER;
  const journeyStart = Date.now();
  
  let journeyComplete = false;
  let token = null;
  let selectedShowtime = null;
  let availableSeats = [];
  let bookingId = null;

  // Step 1: Login
  group('1. Authentication', () => {
    // Use unique user per VU
    const userIndex = ((vuId - 1) % 20) + 1;
    const creds = getTestUserCredentials(userIndex);

    const loginResponse = post('/auth/login', {
      email: creds.email,
      password: creds.password,
    }, {
      tags: { name: 'journey_login' },
    });

    if (isSuccess(loginResponse)) {
      const body = parseJson(loginResponse);
      token = body?.token;
    } else {
      // Try register if login fails
      const registerResponse = post('/auth/register', {
        name: creds.name,
        email: creds.email,
        password: creds.password,
      }, {
        tags: { name: 'journey_register' },
      });

      if (isSuccess(registerResponse)) {
        const body = parseJson(registerResponse);
        token = body?.token;
      }
    }

    check(token, {
      'authenticated': (t) => t !== null,
    });
  });

  if (!token) {
    journeyFailure.add(1);
    console.error(`VU ${vuId}: Failed to authenticate`);
    return;
  }

  sleep(0.3);

  // Step 2: Browse Movies
  group('2. Browse Movies', () => {
    const response = get('/movies?limit=5', {
      tags: { name: 'journey_movies' },
    });

    check(response, {
      'movies loaded': (r) => r.status === 200,
    });
  });

  sleep(0.3);

  // Step 3: Select a Showtime
  group('3. Select Showtime', () => {
    const showtimes = data.showtimes || [];
    
    if (showtimes.length > 0) {
      // Pick a random showtime
      selectedShowtime = showtimes[Math.floor(Math.random() * showtimes.length)];
      
      const response = get(`/showtimes/${selectedShowtime.id}`, {
        tags: { name: 'journey_showtime_detail' },
      });

      check(response, {
        'showtime details loaded': (r) => r.status === 200,
      });
    }
  });

  if (!selectedShowtime) {
    journeyFailure.add(1);
    console.error(`VU ${vuId}: No showtime available`);
    return;
  }

  sleep(0.3);

  // Step 4: Check Seat Availability
  group('4. Check Seats', () => {
    const response = get(`/showtimes/${selectedShowtime.id}/seats`, {
      tags: { name: 'journey_seats' },
    });

    if (isSuccess(response)) {
      const body = parseJson(response);
      availableSeats = body?.availableSeats || [];
    }

    check(response, {
      'seats loaded': (r) => r.status === 200,
      'seats available': () => availableSeats.length > 0,
    });
  });

  if (availableSeats.length === 0) {
    journeyFailure.add(1);
    console.log(`VU ${vuId}: No seats available for showtime ${selectedShowtime.id}`);
    return;
  }

  sleep(0.3);

  // Step 5: Create Booking
  group('5. Create Booking', () => {
    // Pick 1-3 random seats to avoid conflicts with other VUs
    const numSeats = Math.min(Math.floor(Math.random() * 3) + 1, availableSeats.length);
    const selectedSeats = [];
    
    // Pick random unique seats
    const shuffled = [...availableSeats].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numSeats; i++) {
      selectedSeats.push(shuffled[i]);
    }

    const response = authPost('/bookings', {
      showtimeId: selectedShowtime.id,
      seats: selectedSeats,
    }, token, {
      tags: { name: 'journey_booking' },
    });

    if (isSuccess(response)) {
      const body = parseJson(response);
      bookingId = body?.id;
      bookingCreated.add(1);
    }

    check(response, {
      'booking created or conflict': (r) => r.status === 201 || r.status === 409,
    });

    // 409 is acceptable - seats might have been taken by another VU
    if (response.status === 409) {
      console.log(`VU ${vuId}: Seats taken (expected in load test)`);
    }
  });

  if (!bookingId) {
    // Booking failed but might be due to seat conflict - not a journey failure
    journeyDuration.add(Date.now() - journeyStart);
    return;
  }

  sleep(0.3);

  // Step 6: View Booking
  group('6. View Booking', () => {
    const response = authGet(`/bookings/${bookingId}`, token, {
      tags: { name: 'journey_view_booking' },
    });

    check(response, {
      'booking details loaded': (r) => r.status === 200,
    });
  });

  sleep(0.3);

  // Step 7: Confirm Booking (simulate payment)
  group('7. Confirm Booking', () => {
    const response = authPost(`/bookings/${bookingId}/confirm`, {}, token, {
      tags: { name: 'journey_confirm' },
    });

    if (isSuccess(response)) {
      bookingConfirmed.add(1);
      journeyComplete = true;
    }

    check(response, {
      'booking confirmed': (r) => r.status === 200,
    });
  });

  // Record journey metrics
  const duration = Date.now() - journeyStart;
  journeyDuration.add(duration);

  if (journeyComplete) {
    journeySuccess.add(1);
    console.log(`VU ${vuId}: Journey complete in ${duration}ms - Booking ${bookingId} confirmed`);
  } else {
    journeyFailure.add(1);
    console.log(`VU ${vuId}: Journey incomplete`);
  }

  sleep(1);
}

export function teardown(data) {
  console.log('');
  console.log('Full journey test completed.');
  console.log('Check metrics for journey_success, booking_created, booking_confirmed');
}
