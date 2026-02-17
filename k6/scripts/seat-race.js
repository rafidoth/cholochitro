import { check, sleep } from 'k6';
import { Counter, Gauge } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { get, post, authPost, authDelete, parseJson, isSuccess, isStatus } from '../lib/api.js';
import { getTestUserToken, getTestUserCredentials } from '../lib/auth.js';
import { RACE_TEST_SEATS } from '../config/options.js';

/**
 * Seat Race Condition Test
 * 
 * Purpose: Detect race conditions in seat booking
 * Multiple VUs simultaneously try to book the SAME seats on the SAME showtime.
 * 
 * Expected behavior:
 *   - Exactly 1 booking succeeds (201 Created)
 *   - All others fail with 409 Conflict (SEATS_TAKEN)
 * 
 * Race condition detected if:
 *   - More than 1 booking succeeds
 *   - Same seats appear in multiple bookings
 * 
 * Run: k6 run k6/scripts/_seat-race.js
 * With more VUs: k6 run k6/scripts/_seat-race.js --vus 20
 */

// Custom metrics
const bookingSuccess = new Counter('booking_success');
const bookingConflict = new Counter('booking_conflict');
const bookingOtherError = new Counter('booking_other_error');
const raceConditionDetected = new Gauge('race_condition_detected');
const successfulBookings = new Counter('successful_bookings_total');

// Test configuration - all VUs try to book these exact seats
const SEATS_TO_BOOK = RACE_TEST_SEATS;  // ['A1', 'A2', 'A3', 'A4', 'A5']

export const options = {
  // All VUs start at once and run exactly once
  vus: 10,
  iterations: 10,  // Total 10 iterations across all VUs (1 per VU)
  
  thresholds: {
    // We expect exactly 1 success out of all attempts
    'booking_success': ['count<=1'],
    // Most should get conflict
    'booking_conflict': ['count>=1'],
    // No race condition should be detected
    'race_condition_detected': ['value==0'],
    // At least some checks should pass
    'checks': ['rate>0.5'],
  },
};

// Shared state for tracking results
let testShowtimeId = null;
let testTokens = [];

export function setup() {
  console.log('='.repeat(60));
  console.log('SEAT RACE CONDITION TEST');
  console.log('='.repeat(60));
  console.log(`Seats to book: ${SEATS_TO_BOOK.join(', ')}`);
  console.log('');

  // Step 1: Get a showtime to test with
  console.log('Step 1: Finding a showtime for testing...');
  const showtimesResponse = get('/showtimes?limit=1');
  
  if (!isSuccess(showtimesResponse)) {
    throw new Error('Failed to fetch showtimes. Is the server running?');
  }

  const showtimesData = parseJson(showtimesResponse);
  if (!showtimesData || !showtimesData.showtimes || showtimesData.showtimes.length === 0) {
    throw new Error('No showtimes found. Run seed script: pnpm k6:seed');
  }

  testShowtimeId = showtimesData.showtimes[0].id;
  console.log(`Using showtime: ${testShowtimeId}`);

  // Step 2: Check current seat availability
  console.log('Step 2: Checking seat availability...');
  const seatsResponse = get(`/showtimes/${testShowtimeId}/seats`);
  
  if (isSuccess(seatsResponse)) {
    const seatsData = parseJson(seatsResponse);
    const targetSeatsBooked = SEATS_TO_BOOK.filter(s => 
      seatsData.bookedSeats && seatsData.bookedSeats.includes(s)
    );
    
    if (targetSeatsBooked.length > 0) {
      console.warn(`WARNING: Some target seats already booked: ${targetSeatsBooked.join(', ')}`);
      console.warn('Test may not accurately detect race conditions.');
      console.warn('Consider resetting the database or using different seats.');
    } else {
      console.log(`Target seats ${SEATS_TO_BOOK.join(', ')} are available.`);
    }
  }

  // Step 3: Login test users
  console.log('Step 3: Logging in test users...');
  const tokens = [];
  
  for (let i = 1; i <= 10; i++) {
    const creds = getTestUserCredentials(i);
    
    // Try login first
    let loginResponse = post('/auth/login', {
      email: creds.email,
      password: creds.password,
    });

    if (isSuccess(loginResponse)) {
      const data = parseJson(loginResponse);
      if (data && data.token) {
        tokens.push({ token: data.token, email: creds.email });
        continue;
      }
    }

    // If login fails, try to register
    if (isStatus(loginResponse, 401)) {
      const registerResponse = post('/auth/register', {
        name: creds.name,
        email: creds.email,
        password: creds.password,
      });

      if (isSuccess(registerResponse)) {
        const data = parseJson(registerResponse);
        if (data && data.token) {
          tokens.push({ token: data.token, email: creds.email });
          continue;
        }
      }
    }

    console.warn(`Failed to authenticate user ${i}`);
  }

  console.log(`Authenticated ${tokens.length} test users.`);
  
  if (tokens.length < 2) {
    throw new Error('Need at least 2 authenticated users for race test');
  }

  console.log('');
  console.log('Starting race condition test...');
  console.log(`${tokens.length} VUs will simultaneously try to book: ${SEATS_TO_BOOK.join(', ')}`);
  console.log('');

  return {
    showtimeId: testShowtimeId,
    tokens: tokens,
  };
}

export default function (data) {
  const vuId = __VU;
  const { showtimeId, tokens } = data;

  // Each VU uses its own token
  const tokenIndex = (vuId - 1) % tokens.length;
  const { token, email } = tokens[tokenIndex];

  console.log(`VU ${vuId} (${email}) attempting to book seats...`);

  // ALL VUs try to book the SAME seats - this is the race condition test
  const bookingResponse = authPost('/bookings', {
    showtimeId: showtimeId,
    seats: SEATS_TO_BOOK,
  }, token, {
    tags: { name: 'race_booking' },
  });

  const status = bookingResponse.status;
  const body = parseJson(bookingResponse);

  // Track results
  if (status === 201) {
    // SUCCESS - booking created
    bookingSuccess.add(1);
    successfulBookings.add(1);
    console.log(`VU ${vuId}: SUCCESS - Booking created! ID: ${body?.id}`);
    
    check(bookingResponse, {
      'booking created': () => true,
      'booking has id': () => body && body.id,
      'booking has correct seats': () => {
        if (body && body.seats) {
          return SEATS_TO_BOOK.every(s => body.seats.includes(s));
        }
        return false;
      },
    });

  } else if (status === 409) {
    // EXPECTED - seats already taken
    bookingConflict.add(1);
    console.log(`VU ${vuId}: CONFLICT (expected) - ${body?.message || 'Seats taken'}`);
    
    check(bookingResponse, {
      'conflict response': () => true,
      'has error message': () => body && body.message,
    });

  } else {
    // UNEXPECTED ERROR
    bookingOtherError.add(1);
    console.error(`VU ${vuId}: UNEXPECTED ERROR - Status: ${status}, Body: ${JSON.stringify(body)}`);
    
    check(bookingResponse, {
      'no unexpected errors': () => false,
    });
  }
}

export function teardown(data) {
  console.log('');
  console.log('='.repeat(60));
  console.log('RACE CONDITION TEST RESULTS');
  console.log('='.repeat(60));
  
  // The metrics are automatically reported, but we can add custom analysis
  // Note: We can't access counter values directly in teardown,
  // but k6 will report them in the summary
  
  console.log('');
  console.log('Check the metrics summary above:');
  console.log('  - booking_success: Should be exactly 1');
  console.log('  - booking_conflict: Should be (VUs - 1)');
  console.log('  - booking_other_error: Should be 0');
  console.log('');
  console.log('RACE CONDITION DETECTED if booking_success > 1');
  console.log('');
  
  // Cleanup: Cancel test bookings (optional)
  // This would require storing booking IDs from setup
  // For now, manual cleanup or DB reset is recommended
  
  console.log('To cleanup test data, run:');
  console.log('  docker exec -i cholochitro-db-1 psql -U postgres -d cholochitro -c "DELETE FROM booking_seats WHERE booking_id IN (SELECT id FROM bookings WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'k6user%\'));"');
  console.log('  docker exec -i cholochitro-db-1 psql -U postgres -d cholochitro -c "DELETE FROM bookings WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'k6user%\');"');
}

/**
 * Custom summary handler for clearer race condition reporting
 */
export function handleSummary(data) {
  const successCount = data.metrics.booking_success?.values?.count || 0;
  const conflictCount = data.metrics.booking_conflict?.values?.count || 0;
  const errorCount = data.metrics.booking_other_error?.values?.count || 0;

  let raceDetected = false;
  let summary = '\n' + '='.repeat(60) + '\n';
  summary += 'RACE CONDITION ANALYSIS\n';
  summary += '='.repeat(60) + '\n\n';

  summary += `Booking Attempts:\n`;
  summary += `  Successful:  ${successCount}\n`;
  summary += `  Conflicts:   ${conflictCount}\n`;
  summary += `  Errors:      ${errorCount}\n\n`;

  if (successCount > 1) {
    raceDetected = true;
    summary += '!!! RACE CONDITION DETECTED !!!\n';
    summary += `Multiple bookings (${successCount}) succeeded for the same seats!\n`;
    summary += 'This indicates a bug in your booking logic.\n\n';
    summary += 'Recommended fix:\n';
    summary += '  1. Use database-level locking (SELECT ... FOR UPDATE)\n';
    summary += '  2. Add unique constraint on (showtime_id, seat_number)\n';
    summary += '  3. Use serializable transaction isolation\n';
  } else if (successCount === 1) {
    summary += 'NO RACE CONDITION DETECTED\n';
    summary += 'Exactly 1 booking succeeded as expected.\n';
    summary += 'Your locking mechanism appears to be working correctly.\n';
  } else if (successCount === 0) {
    summary += 'WARNING: No bookings succeeded!\n';
    summary += 'This might indicate:\n';
    summary += '  - Seats were already booked before test\n';
    summary += '  - Authentication issues\n';
    summary += '  - Server errors\n';
  }

  summary += '\n' + '='.repeat(60) + '\n';

  console.log(summary);

  // Return standard k6 summary + our custom output
  return {
    'stdout': summary,
    'k6/results/seat-race-result.json': JSON.stringify(data, null, 2),
  };
}
