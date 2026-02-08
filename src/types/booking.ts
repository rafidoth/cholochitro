export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Booking {
    id: string;
    userId: string;
    showtimeId: string;
    status: BookingStatus;
    totalPrice: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface BookingSeat {
    id: string;
    bookingId: string;
    showtimeId: string;
    seatNumber: string;
    createdAt: Date;
}

export interface BookingResponse {
    id: string;
    userId: string;
    showtimeId: string;
    status: BookingStatus;
    totalPrice: number;
    seats: string[];
    createdAt: Date;
}

export interface BookingWithDetails extends BookingResponse {
    showtime: {
        id: string;
        showDate: Date;
        showTime: string;
        movie: {
            id: string;
            title: string;
            posterUrl: string | null;
        };
    };
}

// Seat layout: 10 rows (A-J) x 10 columns (1-10) = 100 seats
export const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const;
export const SEAT_COLUMNS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const TOTAL_SEATS = SEAT_ROWS.length * SEAT_COLUMNS.length;

export function generateAllSeats(): string[] {
    const seats: string[] = [];
    for (const row of SEAT_ROWS) {
        for (const col of SEAT_COLUMNS) {
            seats.push(`${row}${col}`);
        }
    }
    return seats;
}

export function isValidSeat(seat: string): boolean {
    const match = seat.match(/^([A-J])(\d+)$/);
    if (!match) return false;
    const col = parseInt(match[2], 10);
    return col >= 1 && col <= 10;
}
