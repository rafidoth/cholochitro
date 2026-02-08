import type { MigrationBuilder, ColumnDefinitions } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    // Enable UUID extension
    pgm.createExtension("uuid-ossp", { ifNotExists: true });

    // Create users table
    pgm.createTable("users", {
        id: {
            type: "uuid",
            primaryKey: true,
            default: pgm.func("uuid_generate_v4()"),
        },
        email: {
            type: "varchar(255)",
            notNull: true,
            unique: true,
        },
        password_hash: {
            type: "varchar(255)",
            notNull: true,
        },
        display_name: {
            type: "varchar(100)",
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

    // Create index for email lookups
    pgm.createIndex("users", "email");

    // Create function to auto-update updated_at
    pgm.createFunction(
        "update_updated_at_column",
        [],
        {
            returns: "trigger",
            language: "plpgsql",
            replace: true,
        },
        `
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        `
    );

    // Create trigger to auto-update updated_at
    pgm.createTrigger("users", "update_users_updated_at", {
        when: "BEFORE",
        operation: "UPDATE",
        level: "ROW",
        function: "update_updated_at_column",
    });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTrigger("users", "update_users_updated_at");
    pgm.dropFunction("update_updated_at_column", []);
    pgm.dropTable("users");
    pgm.dropExtension("uuid-ossp");
}
