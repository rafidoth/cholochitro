import type { MigrationBuilder, ColumnDefinitions } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    // Create booking_seats junction table
    // This stores which seats are booked for each booking
    pgm.createTable("booking_seats", {
        id: {
            type: "uuid",
            primaryKey: true,
            default: pgm.func("uuid_generate_v4()"),
        },
        booking_id: {
            type: "uuid",
            notNull: true,
            references: "bookings",
            onDelete: "CASCADE",
        },
        showtime_id: {
            type: "uuid",
            notNull: true,
            references: "showtimes",
            onDelete: "CASCADE",
        },
        seat_number: {
            type: "varchar(5)",
            notNull: true,
            // Seat format: A1-J10 (10 rows x 10 columns = 100 seats)
        },
        created_at: {
            type: "timestamptz",
            notNull: true,
            default: pgm.func("current_timestamp"),
        },
    });

    // Create unique constraint to prevent double booking of same seat for same showtime
    pgm.addConstraint("booking_seats", "unique_seat_per_showtime", {
        unique: ["showtime_id", "seat_number"],
    });

    // Create indexes
    pgm.createIndex("booking_seats", "booking_id");
    pgm.createIndex("booking_seats", "showtime_id");
    pgm.createIndex("booking_seats", ["showtime_id", "seat_number"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable("booking_seats");
}
