import type { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';
import crypto from "node:crypto";
export const shorthands: ColumnDefinitions | undefined = undefined;

export async function hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString("hex");
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(`${salt}:${derivedKey.toString("hex")}`);
        });
    });
}

// Admin users to seed
const adminUsers = [
    {
        email: 'admin1@cholochitro.com',
        password: "admin",
        display_name: 'Admin One',
    },
    {
        email: 'admin2@cholochitro.com',
        password: "admin",
        display_name: 'Admin Two',
    },
    {
        email: 'admin3@cholochitro.com',
        password: "admin",
        display_name: 'Admin Three',
    },
    {
        email: 'admin4@cholochitro.com',
        password: "admin",
        display_name: 'Admin Four',
    },
];

export async function up(pgm: MigrationBuilder): Promise<void> {
    for (const admin of adminUsers) {
        const hash = await hashPassword(admin.password)
        pgm.sql(`
            INSERT INTO users (email, password_hash, display_name, role)
            VALUES ('${admin.email}', '${hash}', '${admin.display_name}', 'admin')
            ON CONFLICT (email) DO NOTHING;
        `);
    }
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    const emails = adminUsers.map((admin) => `'${admin.email}'`).join(', ');
    pgm.sql(`DELETE FROM users WHERE email IN (${emails});`);
}
