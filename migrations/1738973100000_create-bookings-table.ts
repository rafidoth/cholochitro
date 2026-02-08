import type { MigrationBuilder, ColumnDefinitions } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    // Create booking status enum
    pgm.createType("booking_status", ["pending", "confirmed", "cancelled"]);

    // Create bookings table
    pgm.createTable("bookings", {
        id: {
            type: "uuid",
            primaryKey: true,
            default: pgm.func("uuid_generate_v4()"),
        },
        user_id: {
            type: "uuid",
            notNull: true,
            references: "users",
            onDelete: "CASCADE",
        },
        showtime_id: {
            type: "uuid",
            notNull: true,
            references: "showtimes",
            onDelete: "CASCADE",
        },
        status: {
            type: "booking_status",
            notNull: true,
            default: "'pending'",
        },
        total_price: {
            type: "decimal(10,2)",
            notNull: true,
        },
        created_at: {
            type: "timestamptz",
            notNull: true,
            default: pgm.func("current_timestamp"),
        },
        updated_at: {
            type: "timestamptz",
            notNull: true,
            default: pgm.func("current_timestamp"),
        },
    });

    // Create indexes
    pgm.createIndex("bookings", "user_id");
    pgm.createIndex("bookings", "showtime_id");
    pgm.createIndex("bookings", "status");

    // Create trigger to auto-update updated_at
    pgm.createTrigger("bookings", "update_bookings_updated_at", {
        when: "BEFORE",
        operation: "UPDATE",
        level: "ROW",
        function: "update_updated_at_column",
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTrigger("bookings", "update_bookings_updated_at");
    pgm.dropTable("bookings");
    pgm.dropType("booking_status");
}
