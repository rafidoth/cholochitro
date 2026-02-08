import type { MigrationBuilder, ColumnDefinitions } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    // Create showtimes table
    pgm.createTable("showtimes", {
        id: {
            type: "uuid",
            primaryKey: true,
            default: pgm.func("uuid_generate_v4()"),
        },
        movie_id: {
            type: "uuid",
            notNull: true,
            references: "movies",
            onDelete: "CASCADE",
        },
        show_date: {
            type: "date",
            notNull: true,
        },
        show_time: {
            type: "time",
            notNull: true,
        },
        price: {
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
    pgm.createIndex("showtimes", "movie_id");
    pgm.createIndex("showtimes", "show_date");
    pgm.createIndex("showtimes", ["show_date", "show_time"]);

    // Create trigger to auto-update updated_at
    pgm.createTrigger("showtimes", "update_showtimes_updated_at", {
        when: "BEFORE",
        operation: "UPDATE",
        level: "ROW",
        function: "update_updated_at_column",
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTrigger("showtimes", "update_showtimes_updated_at");
    pgm.dropTable("showtimes");
}
