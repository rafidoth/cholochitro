import type { MigrationBuilder, ColumnDefinitions } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    // Create user role enum
    pgm.createType("user_role", ["user", "admin"]);

    // Add role column to users table
    pgm.addColumn("users", {
        role: {
            type: "user_role",
            notNull: true,
            default: "user",
        },
    });

    // Create index for role lookups
    pgm.createIndex("users", "role");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropIndex("users", "role");
    pgm.dropColumn("users", "role");
    pgm.dropType("user_role");
}
