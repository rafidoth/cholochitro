import type { MigrationBuilder, ColumnDefinitions } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    // Create movie status enum
    pgm.createType("movie_status", ["now_showing", "coming_soon", "ended"]);

    // Create movies table
    pgm.createTable("movies", {
        id: {
            type: "uuid",
            primaryKey: true,
            default: pgm.func("uuid_generate_v4()"),
        },
        title: {
            type: "varchar(255)",
            notNull: true,
        },
        description: {
            type: "text",
        },
        duration_minutes: {
            type: "integer",
            notNull: true,
        },
        genre: {
            type: "varchar(100)",
        },
        poster_url: {
            type: "varchar(500)",
        },
        status: {
            type: "movie_status",
            notNull: true,
            default: "'coming_soon'",
        },
        release_date: {
            type: "date",
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

    // Create index for status lookups
    pgm.createIndex("movies", "status");

    // Create trigger to auto-update updated_at
    pgm.createTrigger("movies", "update_movies_updated_at", {
        when: "BEFORE",
        operation: "UPDATE",
        level: "ROW",
        function: "update_updated_at_column",
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTrigger("movies", "update_movies_updated_at");
    pgm.dropTable("movies");
    pgm.dropType("movie_status");
}
